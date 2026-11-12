// 平衡模擬（真實引擎）。用法：node tools/balance-sim.mjs <gradient|strategies|paths|finance|all> [seeds]
// 輸出：tools/out/<section>.json ；報告由 tools/make-report.mjs 產生 BALANCE_REPORT.md
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
import {loadData,adv,mean,pct,snapshot,collapsed,freeStart,runFree,runPlan} from './sim-lib.mjs';
const data=loadData(),DIFFS=['easy','balanced','hard'];
const SEEDS=Number(process.argv[3])||100;
const section=process.argv[2]||'all';
const out=(name,obj)=>{fs.writeFileSync(new URL(`./out/${name}.json`,import.meta.url),JSON.stringify(obj,null,1));console.log('wrote',name)};
const r1=x=>Math.round(x*10)/10;
const seedOf=(i,salt=1)=>(i+1)*7919+salt*104729;

// ---------- 1 教學 AP 梯度 ----------
const tplA=T=>{const o={teaching:T,administration:10,family:10,professional:5};const left=100-T-25;if(left<0){const cut=-left;o.administration=Math.max(0,10-Math.ceil(cut/2));o.family=Math.max(0,10-Math.floor(cut/2));if(T>85)o.professional=0}o.rest=Math.max(0,100-T-o.administration-o.family-o.professional);return o};
const tplB=T=>({teaching:T,administration:5,family:5,rest:Math.max(0,100-T-10)});
function gradient(){
  const res={};
  for(const diff of DIFFS)for(const [tn,tpl] of [['A標準(行政10/家庭10/專業5/其餘休息)',tplA],['B留休息(行政5/家庭5/其餘休息)',tplB]]){
    for(const T of [20,30,40,50,60,70,80]){
      const rows=[],scores=[],adminBacklog=[];
      for(let i=0;i<SEEDS;i++){const r=runPlan(data,{seed:seedOf(i),months:12,plan:tpl(T),difficulty:diff,eventPick:i%3});rows.push(r.final);scores.push(r.e.state.assessment?.score??0);adminBacklog.push((tpl(T).administration<10?12:0))}
      const f=k=>r1(mean(rows.map(r=>r[k])));
      (res[diff]??={})[tn]??={};
      res[diff][tn][T]={stress:f('stress'),energy:f('energy'),health:f('health'),teaching:f('teaching'),administration:f('administration'),student:f('student'),mgmtTrust:f('mgmt'),review:r1(mean(scores)),adminBacklogMonths:r1(mean(adminBacklog)),collapse:r1(100*rows.filter(collapsed).length/rows.length),burnout:r1(100*rows.filter(r=>r.stress>=85).length/rows.length)};
    }
  }
  out('gradient',res);
}
// ---------- 2 策略 ----------
export const STRATEGIES={
 '教學導向':{teaching:50,administration:8,professional:7,family:10,rest:25},
 '行政導向':{teaching:25,administration:35,professional:8,family:10,rest:22},
 '學生導向':{teaching:25,studentSupport:20,extracurricular:10,administration:5,family:10,rest:25,professional:5},
 '進修導向':{teaching:25,professional:30,administration:5,family:10,rest:25,personal:5},
 '工作狂':{teaching:45,administration:20,professional:15,extracurricular:10,rest:5,family:5},
 '休息導向':{teaching:25,administration:10,family:15,rest:45,personal:5},
 '家庭導向':{teaching:30,administration:8,family:35,rest:22,personal:5},
 '副業及個人':{teaching:30,administration:8,family:10,rest:22,personal:20,professional:10},
 '平衡':{teaching:35,administration:10,family:15,rest:30,professional:5,personal:5}
};
function strategies(){
  const res={};
  for(const diff of DIFFS)for(const [name,plan] of Object.entries(STRATEGIES)){
    const rows=[],ill=[],ranks=[];
    for(let i=0;i<SEEDS;i++){const r=runFree(data,freeStart(data,seedOf(i,2),{family:['single','married','kids','elder'][i%4],subject:['chi','eng','math','sci','hist','cit','ict','pe'][i%8],difficulty:diff}),{months:36,plan,eventPick:i%3});rows.push(r.final);ranks.push(r.e.state.career.rank);ill.push(r.e.state.health.illness?1:0)}
    const f=k=>r1(mean(rows.map(r=>r[k])));
    (res[diff]??={})[name]={stress:f('stress'),energy:f('energy'),health:f('health'),wealth:Math.round(mean(rows.map(r=>r.wealth))),teaching:f('teaching'),administration:f('administration'),professional:f('professional'),student:f('student'),family:f('family'),satisfaction:f('satisfaction'),rank:r1(mean(ranks)),collapse:r1(100*rows.filter(collapsed).length/rows.length)};
  }
  out('strategies',res);
}
// ---------- 3 八條路線（10 年；balanced 另跑 20 年） ----------
export const PATH_PLANS={
 teaching:{teaching:45,administration:8,professional:10,family:10,rest:22,personal:5},
 management:{teaching:25,administration:30,professional:8,family:10,rest:22,extracurricular:5},
 student:{teaching:25,studentSupport:20,extracurricular:10,administration:5,family:10,rest:25,professional:5},
 curriculum:{teaching:25,administration:15,professional:20,family:10,rest:25,extracurricular:5},
 study:{teaching:25,professional:30,administration:5,family:10,rest:25,personal:5},
 innovation:{teaching:25,professional:20,administration:10,personal:10,family:10,rest:25},
 leadership:{teaching:22,administration:25,professional:15,family:10,rest:23,extracurricular:5},
 balanced:{teaching:30,administration:10,family:20,rest:30,personal:5,professional:5}
};
const COURSES={teaching:['classroom-research'],management:['middle-leadership','principal-prep'],student:['student-counselling','middle-leadership'],curriculum:['curriculum-assessment','middle-leadership'],study:['classroom-research','curriculum-assessment','middle-leadership'],innovation:['edtech-design','middle-leadership'],leadership:['middle-leadership','principal-prep'],balanced:['life-finance']};
export const pathPolicy=path=>(e,m)=>{
  try{
    if(m===0)e.setCareerPath(path);
    const st=e.state;if(st.phase!=='play')return;
    if(m%3===2){const g=e.promotionEligibility();if(g.ok&&!st.career.promotionOffer)e.applyPromotion()}
    if(st.career.promotionOffer)e.decidePromotion(true);
    if(st.career.actingOffer)e.decideActing(true);
    if(st.character.status.health<40&&st.character.status.wealth>3000)e.seekMedicalCare();
    // 進修：條件符合且負擔得起，從休息 AP 撥 5 點
    if(m%2===0&&st.career.activeCourses.length===0){for(const id of COURSES[path]){const c=e.availableCourses().find(x=>x.id===id);if(c&&!c.completed&&c.eligible){const rest=st.ap.allocation.rest||0;e.setAlloc('rest',Math.max(0,rest-5));if(e.enrollCourse(id).ok)break;e.setAlloc('rest',rest)}}}
    // 路線專案：每年一次
    if(m%12===6){const P=data.config.balance.paths[path].project;const rest=st.ap.allocation.rest||0;e.setAlloc('rest',Math.max(0,rest-P.ap));if(!e.careerProject(P.id).ok)e.setAlloc('rest',rest)}
  }catch(err){}
};
function paths(){
  const res={};
  for(const diff of DIFFS)for(const path of Object.keys(PATH_PLANS)){
    const months=diff==='balanced'?240:120;
    const rows=[],ranks=[],completes=[];
    for(let i=0;i<SEEDS;i++){
      const r=runFree(data,freeStart(data,seedOf(i,3),{family:['single','married','kids','elder'][i%4],subject:['chi','eng','math','sci','hist','cit','ict','pe'][i%8],difficulty:diff}),{months,plan:PATH_PLANS[path],eventPick:i%3,policy:pathPolicy(path)});
      const s=r.e.state,c=s.character,rank=s.career.rank;rows.push({...r.final,fund:s.finance.fund});ranks.push(rank);
      const done={teaching:rank>=3,management:rank>=7,student:rank>=3,curriculum:rank>=3,study:rank>=3&&s.career.credentials.length>=4,innovation:rank>=3&&(s.career.specialProjects||[]).some(x=>x.won),leadership:rank>=7,balanced:c.status.health>=60&&c.status.satisfaction>=60&&c.status.familyRelation>=55}[path];
      completes.push(done?1:0);
    }
    const f=k=>r1(mean(rows.map(r=>r[k])));const dist={};for(const x of ranks)dist[x]=(dist[x]||0)+1;
    (res[diff]??={})[path]={months,rankAvg:r1(mean(ranks)),rankDist:dist,reachSGM:r1(100*ranks.filter(x=>x>=3).length/SEEDS),reachPGM:r1(100*ranks.filter(x=>x>=5).length/SEEDS),reachPrincipal:r1(100*ranks.filter(x=>x>=7).length/SEEDS),reachPrincipalI:r1(100*ranks.filter(x=>x>=8).length/SEEDS),completion:r1(100*mean(completes)),stress:f('stress'),energy:f('energy'),health:f('health'),wealth:Math.round(mean(rows.map(r=>r.wealth))),teaching:f('teaching'),administration:f('administration'),professional:f('professional'),leadership:f('leadership'),student:f('student'),family:f('family'),satisfaction:f('satisfaction'),collapse:r1(100*rows.filter(collapsed).length/rows.length)};
  }
  out('paths',res);
}
// ---------- 4 財務及退休 ----------
function finance(){
  const res={},n=Math.min(SEEDS,100);
  for(const diff of ['balanced','hard'])for(const family of ['single','married','kids','elder'])for(const lifestyle of ['frugal','standard','comfort']){
    const w=[],f=[],ret=[],neg=[],age=[];let endings={};
    for(let i=0;i<n;i++){
      const o=freeStart(data,seedOf(i,4),{family,age:28,difficulty:diff});
      const pol=(e,m)=>{if(m===0){e.setLifestyle(lifestyle);e.setCareerPath('teaching')}try{if(m%6===5)e.applyPromotion();if(e.state.career.promotionOffer)e.decidePromotion(true);if(e.state.character.status.health<40)e.seekMedicalCare()}catch{}};
      const r=runFree(data,o,{months:240,plan:PATH_PLANS.balanced,policy:pol,eventPick:i%3});
      w.push(r.e.state.character.status.wealth);f.push(r.e.state.finance.fund);
      // 退休：直接進入退休（遊戲內需年滿 60 歲或 35 年；此處以內部狀態設定年資以量度退休財務）
      const e=r.e;e.state.character.age=60;e.state.character.careerMonths=Math.max(e.state.character.careerMonths,420);
      const rr=e.retire();if(!rr.ok){ret.push(null);continue}
      for(let y=0;y<25;y++){const a=e.retirementAction(['family','volunteer','mentor'][y%3]);if(!a.ok)break}
      ret.push(e.state.character.status.wealth);endings[e.state.ending.title.split(' · ')[0]]=(endings[e.state.ending.title.split(' · ')[0]]||0)+1;neg.push(e.state.character.status.wealth<0?1:0);
    }
    const q=(a,p)=>Math.round(pct(a,p)/1000);
    ((res[diff]??={})[family]??={})[lifestyle]={wealth20y:{p10:q(w,.1),p50:q(w,.5),p90:q(w,.9)},fund20y:q(f,.5),retireWealthEnd:{p10:q(ret.filter(x=>x!==null),.1),p50:q(ret.filter(x=>x!==null),.5),p90:q(ret.filter(x=>x!==null),.9)},retireNegativePct:r1(100*mean(neg)),endings};
  }
  out('finance',res);
}
const run={gradient,strategies,paths,finance};
if(section==='all')for(const k of Object.keys(run)){console.time(k);run[k]();console.timeEnd(k)}else{console.time(section);run[section]();console.timeEnd(section)}
