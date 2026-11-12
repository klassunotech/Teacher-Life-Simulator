// UI 隨機行動 fuzz（假 DOM）：4 種模式×9 局×3 難度，隨機觸發各種行動，檢查例外、AP 記帳、NaN／undefined、存檔驗證。
import fs from 'fs';
import {createEngine} from '../js/game-engine.js';
import {createUI} from '../js/ui.js';
import {validateState} from '../js/save-system.js';
const names=['config','subjects','schools','events','careers'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)))]));
const mem=()=>{const m={};return{getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]}}};
let seedRng=12345;const R=()=>{seedRng=(seedRng*1664525+1013904223)>>>0;return seedRng/4294967296};
const ri=n=>Math.floor(R()*n);
const tabs=['overview','actions','people','career','finance','log'];
let problems=[],acts=0;
for(const mode of ['story','challenge','free','random']){
 for(let run=0;run<9;run++){
  const root={innerHTML:'',addEventListener(){}},st=mem(),e=createEngine(data,{save:s=>{const r=validateState(s);if(r)problems.push(`validate:${r}`);}});
  const u=createUI(root,e,st,{seed:100+run*7+mode.length});
  try{
   u.ui.form.name='測試';u.ui.form.difficulty=['easy','balanced','hard'][run%3];u.act('new');
   if(mode==='random')u.act('random');
   else{ if(mode==='free'){u.ui.form.initialRank=ri(9);u.ui.form.startingWealth=100000;u.ui.form.speed=4;u.ui.form.startMonth=1+ri(12)}
     u.act(mode);u.act('toschool');
     const types=['all','government','aided','dss','private'],rels=['all',...Object.keys(data.schools.religions)];
     u.ui.schoolFilter={type:types[ri(5)],religion:rels[ri(8)]};u.ui.schools=e.rollSchools(u.ui.seed,u.ui.schoolFilter);u.render();
     if(!u.ui.schools.length){u.ui.schoolFilter={type:'all',religion:'all'};u.ui.schools=e.rollSchools(u.ui.seed)}
     u.act('pick',{i:String(ri(u.ui.schools.length))});}
   if(!e.state){problems.push(mode+' no state after start');continue}
   for(let m=0;m<300;m++){
     if(e.state.phase==='ending'){ // retirement hub
       for(const k of ['family','volunteer','travel','mentor','parttime'])u.act('retirement',{kind:k});u.render();break}
     let g=0;while(e.state.phase!=='play'&&g++<6){u.render();if(e.state.phase==='event')u.act('choose',{i:String(ri(e.state.events.pending?data.events.find(x=>x.id===e.state.events.pending).choices.length:1))});else if(e.state.phase==='yearEnd'&&e.retirementEligible()&&m>200){u.act('retire');if(e.state.phase==='ending')break}else u.act('ack');acts++}
     if(e.state.phase!=='play')continue;
     // random actions
     const n=1+ri(6);
     for(let j=0;j<n;j++){
       const c=ri(16);
       const keys=Object.keys(data.config.actions);
       if(c<6)u.act('ap',{k:keys[ri(keys.length)],d:String([-10,-5,-1,1,5,10][ri(6)])});
       else if(c===6)u.act('npc',{id:e.state.npc.people[ri(e.state.npc.people.length)].id});
       else if(c===7)u.act('npcHelp',{id:e.state.npc.people[ri(e.state.npc.people.length)].id});
       else if(c===8)u.act('course',{id:data.careers.courses[ri(5)].id});
       else if(c===9)u.act('applyPromotion');
       else if(c===10){u.act('manager',{kind:['delegate','mentor','project','budget'][ri(4)]});u.act('initiative',{kind:['staff','wellbeing','parent','digital','finance','crisis'][ri(6)]})}
       else if(c===11){u.act('startInvestigation',{topic:['procurement','student','workload'][ri(3)]});u.act('investigate',{id:e.state.npc.people[ri(e.state.npc.people.length)].id})}
       else if(c===12){u.act('findSchools');u.act(e.state.career.externalRole?'returnSchool':'transfer',{i:String(ri(6))})}
       else if(c===13&&R()<0.1){u.act('leaveTeaching',{kind:['education','ngo','edtech','startup'][ri(4)]})}
       else if(c===14){u.act('promotion',{yes:'1'});u.act('acting',{yes:'1'});u.act('crisis',{kind:['transparent','support','contain'][ri(3)]});u.act('recruit',{id:'cand_a'});u.act('appraise',{id:'staff_a',kind:'support'})}
       else {u.act('sickLeave');u.act('seekCare');u.act('careerProject',{kind:['openLesson','deptPlan','classGrowth','crossCurriculum','research','prototype','policyForum','lifePlan'][ri(8)]});u.act('path',{path:['teaching','management','student','curriculum','study','innovation','leadership','balanced'][ri(8)]});u.act('setLifestyle',{level:['frugal','standard','comfort'][ri(3)]});u.act('spendWealth',{kind:['trip','hobby','checkup'][ri(3)]});u.act('fund',{amount:String([5000,10000,50000][ri(3)])})}
       acts++;
     }
     for(const t of tabs){u.act('tab',{tab:t})}
     // sanity of AP accounting
     const s=e.state,sum=Object.values(s.ap.allocation).reduce((a,b)=>a+b,0);
     if(sum+s.ap.spent>100)problems.push(`${mode}#${run} m${m}: AP overflow ${sum}+${s.ap.spent}`);
     for(const [k,v] of Object.entries(s.ap.allocation)) if(v<0||!Number.isInteger(v))problems.push(`${mode}#${run} m${m}: bad alloc ${k}=${v}`);
     const spentSum=Object.values(s.ap.spentBy||{}).reduce((a,b)=>a+b,0);if(spentSum!==s.ap.spent)problems.push(`${mode}#${run} m${m}: spentBy ${spentSum}!=spent ${s.ap.spent}`);
     if(root.innerHTML.includes('NaN')||root.innerHTML.includes('undefined'))problems.push(`${mode}#${run} m${m}: NaN/undefined in HTML: `+(root.innerHTML.match(/.{30}(NaN|undefined).{30}/)||[''])[0].slice(0,90));
     const r=u.act('settle'); // confirm undefined in node
   }
   const err=validateState(e.state);if(err)problems.push(mode+' final invalid '+err);
   if(e.state.consequences.length>20)problems.push(mode+' consequences '+e.state.consequences.length);
  }catch(x){problems.push(`${mode}#${run} EXCEPTION ${x.stack.split('\n').slice(0,3).join(' | ')}`)}
 }
}
console.log('actions performed ~',acts,'problems',problems.length);
const uniq=[...new Set(problems)];console.log(uniq.slice(0,25).join('\n'));
