// 3.0.1 修正回歸測試：延遲後果、事件池、AP 沿用、±1、選校、升職/NPC 檢查
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
import {createUI} from '../js/ui.js';
import {saveGame,loadGame} from '../js/save-system.js';
import {competePromotion} from '../js/career-system.js';
const names=['config','subjects','schools','events','careers'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)))]));
const mem=()=>{const m={};return{getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]}}};
const mk=(seed,o={})=>{const e=createEngine(data,{});e.start({mode:'random',seed,...o});return e};
const adv=e=>{let g=0;while(e.state.phase!=='play'&&g++<6){if(e.state.phase==='event')e.choose(0);else if(e.state.phase==='ending')return;else e.ack()}};
const TYPES=['government','aided','dss','private'],RELS=Object.keys(data.schools.religions);
const validCombos=[];for(const t of TYPES)for(const r of(t==='government'?['none']:RELS))validCombos.push(t+'/'+r);

test('延遲後果只生效一次，且完成後移出存檔',()=>{
  const run=withMarker=>{const e=mk(11);adv(e);e.state.character.attributes.administration=50;if(withMarker)e.queueConsequence({id:'m',fx:{administration:1},afterMonths:1});
    for(let i=0;i<8;i++){adv(e);e.setAlloc('rest',40);e.settle()}adv(e);return e};
  const a=run(true),b=run(false);
  {const diff=a.state.character.attributes.administration-b.state.character.attributes.administration;assert.ok(diff>0.85&&diff<1.01,'diff '+diff);}// 後果只加一次（+1，之後被荒廢機制按比例輕微侵蝕）；若重複生效差距會接近 8
  assert.ok(a.state.consequences.every(x=>!x.resolved));
});
test('高壓力選項的跟進後果不會令壓力／家庭關係無限惡化',()=>{
  const e=mk(3);for(let m=0;m<120;m++){adv(e);if(e.state.phase==='ending')break;if(e.state.phase==='event')e.choose(0);
    e.setAlloc('teaching',35);e.setAlloc('administration',10);e.setAlloc('family',15);e.setAlloc('rest',35);e.setAlloc('personal',5);e.settle()}
  assert.ok(e.state.character.status.stress<60,'stress '+e.state.character.status.stress);
  assert.ok(e.state.character.status.familyRelation>30,'family '+e.state.character.status.familyRelation);
  assert.ok(e.state.consequences.length<8,'consequences '+e.state.consequences.length);
});
test('事件池：scheduled 與 random／conditional 都會出現',()=>{
  const seen=new Set(),types=new Set();const e=mk(7);
  for(let m=0;m<120;m++){adv(e);e.setAlloc('rest',30);e.setAlloc('teaching',50);e.settle();const p=e.state.events.pending;if(p){seen.add(p);types.add(data.events.find(x=>x.id===p).type)}}
  assert.ok(seen.size>=25,'distinct '+seen.size);assert.ok(types.has('scheduled')&&types.has('random'));
});
test('每月結算必有事件（保底）',()=>{const e=mk(9);for(let m=0;m<24;m++){adv(e);e.setAlloc('rest',30);e.settle();assert.ok(e.state.events.pending,'month '+m)}});
test('校外職涯期間不觸發學校年曆事件',()=>{
  const e=mk(5);adv(e);e.setAlloc('personal',20);assert.equal(e.leaveTeaching('edtech').ok,true);
  for(let m=0;m<24;m++){adv(e);e.setAlloc('rest',30);e.settle();const p=e.state.events.pending;if(p)assert.notEqual(data.events.find(x=>x.id===p).type,'scheduled')}
});
test('AP 分配每月沿用上月，不需重新分配',()=>{
  const e=mk(21);adv(e);e.setAlloc('teaching',40);e.setAlloc('rest',30);e.setAlloc('family',10);e.settle();adv(e);
  const al=e.state.ap.allocation;assert.deepEqual([al.teaching,al.rest,al.family],[40,30,10]);assert.equal(e.unusedAP(),20);
  e.settle();adv(e);assert.deepEqual([e.state.ap.allocation.teaching,e.state.ap.allocation.rest],[40,30]);
});
test('即時行動用掉的 AP 亦計入下月沿用分配',()=>{
  const e=mk(20);adv(e);e.state.character.status.wealth=50000;e.setAlloc('professional',10);e.setAlloc('rest',30);
  assert.equal(e.enrollCourse('classroom-research').ok,true);assert.equal(e.state.ap.allocation.professional,8);assert.equal(e.state.ap.spent,2);e.settle();adv(e);
  assert.equal(e.state.ap.allocation.professional,10);assert.equal(e.state.ap.spent,0);assert.equal(e.unusedAP(),60);
});
test('病假月份不會污染下月沿用分配',()=>{
  const e=mk(26);adv(e);e.setAlloc('teaching',50);e.setAlloc('rest',20);e.settle();adv(e);
  e.state.character.status.health=40;assert.equal(e.takeSickLeave().ok,true);assert.equal(e.state.ap.allocation.rest,60);e.settle();adv(e);
  assert.equal(e.state.ap.allocation.teaching,50);assert.equal(e.state.ap.allocation.rest,20);
});
test('沿用分配可存檔／載入，舊存檔缺欄位及已完成後果可補齊',()=>{
  const st=mem(),e=createEngine(data,{save:s=>saveGame(s,st)});e.start({mode:'random',seed:12});adv(e);e.setAlloc('teaching',45);e.setAlloc('rest',25);e.settle();adv(e);
  const r=loadGame(st);assert.ok(r.ok,r.error);const e2=createEngine(data);e2.load(r.state);assert.equal(e2.state.ap.allocation.teaching,45);
  const old=JSON.parse(JSON.stringify(e.state));delete old.ap.spentBy;delete old.ap.carry;old.consequences=[{id:'x',dueTurn:0,fx:{stress:2},resolved:true}];
  const e3=createEngine(data);e3.load(old);assert.deepEqual(e3.state.ap.spentBy,{});assert.equal(e3.state.consequences.length,0);
});
test('行動頁提供 ±1 AP 按鈕，並可逐點調整',()=>{
  const root={innerHTML:'',addEventListener(){}},e=createEngine(data),u=createUI(root,e,mem(),{seed:5});u.act('new');u.act('random');u.act('tab',{tab:'actions'});
  assert.ok(root.innerHTML.includes('data-d="-1"')&&root.innerHTML.includes('data-d="1"'));
  u.act('ap',{k:'teaching',d:'1'});u.act('ap',{k:'teaching',d:'1'});u.act('ap',{k:'teaching',d:'-1'});assert.equal(e.state.ap.allocation.teaching,1);
});
test('選校：篩選後點擊的學校必須就是畫面上的那一間',()=>{
  for(const type of ['private','aided','dss','government']){
    const root={innerHTML:'',addEventListener(){}},e=createEngine(data),u=createUI(root,e,mem(),{seed:5});u.ui.form.name='測試';
    u.act('new');u.act('story');u.act('toschool');u.ui.schoolFilter={type,religion:'all'};u.ui.schools=e.rollSchools(u.ui.seed,u.ui.schoolFilter);u.render();
    const cards=[...root.innerHTML.matchAll(/<h3>([^<]+)<\/h3>[\s\S]*?data-act="pick" data-i="(\d+)"/g)].map(m=>[m[1],+m[2]]);
    assert.ok(cards.length>=2);const [name,i]=cards[1];u.act('pick',{i:String(i)});
    assert.equal(e.state.school.name,name);assert.equal(e.state.school.type,type);
  }
});
test('選校：篩選條件精準，官立不設宗教，抽選涵蓋全部有效組合',()=>{
  const e=createEngine(data);
  for(const t of TYPES)for(const r of RELS){const l=e.rollSchools(77,{type:t,religion:r});
    if(t==='government'&&r!=='none')assert.equal(l.length,0,t+'/'+r);
    else{assert.equal(l.length,16);for(const x of l){assert.equal(x.type,t);assert.equal(x.religion,r);if(t==='government')assert.equal(x.religion,'none')}}}
  const byType=e.rollSchools(3,{type:'dss',religion:'all'});assert.ok(byType.every(x=>x.type==='dss')&&new Set(byType.map(x=>x.religion)).size>1);
  const byRel=e.rollSchools(3,{type:'all',religion:'catholic'});assert.ok(byRel.every(x=>x.religion==='catholic'&&x.type!=='government'));
  const seen=new Set();for(let s=1;s<=300;s++){const l=e.rollSchools(s);assert.equal(l.length,16);assert.equal(new Set(l.map(x=>x.religion)).size,7);assert.equal(new Set(l.map(x=>x.type)).size,4);assert.equal(new Set(l.map(x=>x.id)).size,16);
    for(const x of l){seen.add(x.type+'/'+x.religion);if(x.type==='government')assert.equal(x.religion,'none')}}
  assert.deepEqual(validCombos.filter(c=>!seen.has(c)),[]);
});
test('校外職涯不能申請／接受校內升職；過期邀請失效',()=>{
  const e=mk(5);adv(e);const s=e.state;s.character.careerMonths=200;Object.assign(s.character.attributes,{teaching:90,administration:90,leadership:90,professional:90,communication:90,resilience:90});s.character.status.managementTrust=90;s.character.status.satisfaction=80;
  s.career.promotionOffer={rank:s.career.rank+1,score:80,turn:0,invited:true};e.setAlloc('personal',20);assert.equal(e.leaveTeaching('education').ok,true);
  assert.equal(e.applyPromotion().ok,false);const before=s.career.rank;assert.equal(e.decidePromotion(true).ok,false);assert.equal(s.career.rank,before);
  const e2=mk(6);adv(e2);e2.state.career.promotionOffer={rank:5,score:80,turn:0,invited:true};assert.equal(e2.decidePromotion(true).ok,false);assert.equal(e2.state.career.rank,0);
});
test('已離職人物不能交流／訪談；調查預設主題 id 正確',()=>{
  const e=mk(5);adv(e);assert.equal(e.startInvestigation().ok,true);assert.equal(e.state.investigation.active.id,'procurement');
  const n=e.state.npc.people[0];n.active=false;e.setAlloc('extracurricular',10);assert.equal(e.investigate(n.id).ok,false);assert.equal(e.interactNPC(n.id).ok,false);
});
test('人物交流有實際回報；升職對手不再因你的交流而變強',()=>{
  const e=mk(5);adv(e);e.setAlloc('extracurricular',20);const s=e.state,mt=s.character.status.managementTrust,rel=s.character.attributes.relationship;
  assert.equal(e.interactNPC('npc_principal','help').ok,true);assert.ok(s.character.status.managementTrust>mt);
  assert.equal(e.interactNPC('npc_clerk','help').ok,true);assert.ok(s.character.attributes.relationship>rel);
  const mkState=trust=>{const x=mk(8);adv(x);const st=x.state;st.character.careerMonths=200;Object.assign(st.character.attributes,{teaching:90,administration:90,leadership:90,professional:90,communication:90,resilience:90});st.character.status.managementTrust=90;st.character.status.satisfaction=80;st.npc.people.forEach(n=>{n.rank=1;n.trust=trust});return st};
  const r=t=>{const st=mkState(t);const rng={i:0,next(){return 0.5},int(a,b){return a},pick(a){return a[0]}};return competePromotion(st,rng).rivalScore};
  assert.equal(r(10),r(95));
});
test('即時行動的 AP 不會令「行政不足」懲罰誤觸發',()=>{
  const run=useAction=>{const e=mk(22);adv(e);const s=e.state;s.career.rank=4;s.management.budget=50000;e.setAlloc('administration',12);e.setAlloc('teaching',40);e.setAlloc('rest',30);e.setAlloc('family',10);
    if(useAction)assert.equal(e.managerAction('mentor').ok,true);// 剩餘預留 4 AP（<10），但連同已用 8 AP 共 12 AP
    e.settle();return s.history[s.history.length-1].deltas.managementTrust??0};
  assert.ok(run(true)>-1,'unexpected penalty '+run(true));// 舊版會扣 1.5
});
test('多 seed 長期模擬：數值保持有限且在範圍內',()=>{
  for(const seed of [2,13,29,44]){const e=mk(seed);for(let m=0;m<200;m++){adv(e);if(e.state.phase==='ending')break;if(e.state.phase==='event')e.choose(m%3);
    e.setAlloc('teaching',30);e.setAlloc('administration',15);e.setAlloc('family',10);e.setAlloc('rest',25);e.setAlloc('professional',10);e.settle();
    const c=e.state.character;for(const v of [...Object.values(c.attributes),...Object.entries(c.status).filter(([k])=>k!=='wealth').map(x=>x[1])]){assert.ok(Number.isFinite(v)&&v>=0&&v<=100,seed+':'+m+':'+v)}assert.ok(Number.isFinite(c.status.wealth))}
    assert.ok(e.state.consequences.length<15)}
});
test('人物交流使用獨立溝通點數，不消耗 AP',()=>{
  const e=mk(5);adv(e);const s=e.state;assert.equal(e.unusedAP(),100);const before=s.career.communicationPoints;
  assert.equal(e.interactNPC('npc_principal','help').ok,true);assert.equal(s.ap.spent,0);assert.equal(e.unusedAP(),100);assert.equal(s.career.communicationPoints,before-2);
  assert.equal(e.interactNPC('npc_clerk').ok,true);assert.equal(s.ap.spent,0);assert.equal(s.career.communicationPoints,before-3);
  assert.equal(e.interactNPC('npc_clerk','help').ok,false);assert.match(e.interactNPC('npc_clerk','help').error,/溝通點數不足/);
});
test('進修／管理行動同樣可由未分配 AP 補上',()=>{
  const e=mk(20);adv(e);e.state.character.status.wealth=50000;assert.equal(e.availableAP('professional'),100);assert.equal(e.enrollCourse('classroom-research').ok,true);assert.equal(e.unusedAP(),98);
  e.state.career.rank=4;assert.equal(e.managerAction('delegate').ok,true);assert.equal(e.unusedAP(),93);
});

test('3.2.0：同一管理行動每月只可執行一次，且冷卻會存檔',()=>{
  const e=mk(81),s=e.state;s.career.rank=4;e.setAlloc('administration',30);
  assert.equal(e.managerAction('mentor').ok,true);
  const leadership=s.character.attributes.leadership,spent=s.ap.spent;
  const again=e.managerAction('mentor');assert.equal(again.ok,false);assert.match(again.error,/每月只可執行一次/);
  assert.equal(s.character.attributes.leadership,leadership);assert.equal(s.ap.spent,spent);
  const snapshot=structuredClone(s),e2=createEngine(data);assert.equal(e2.load(snapshot).ok,true);
  assert.equal(e2.managerAction('mentor').ok,false);
});

test('3.2.0：同一調查主題每月只可展開一次，完成／放棄後仍受限制',()=>{
  const e=mk(82),s=e.state;
  assert.equal(e.startInvestigation('procurement').ok,true);
  assert.equal(e.abandonInvestigation().ok,true);
  const blocked=e.startInvestigation('procurement');assert.equal(blocked.ok,false);assert.match(blocked.error,/每月只可展開一次/);
  assert.equal(e.startInvestigation('student').ok,true);
  const snapshot=structuredClone(s),e2=createEngine(data);assert.equal(e2.load(snapshot).ok,true);
  assert.equal(e2.abandonInvestigation().ok,true);
  assert.equal(e2.startInvestigation('student').ok,false);
});

test('3.2.0：延遲後果按實際成功／失敗分支判斷',()=>{
  let sawSuccess=false,sawFailure=false;
  for(let seed=1;seed<=100&&!(sawSuccess&&sawFailure);seed++){
    const e=mk(seed),s=e.state;s.events.pending='e_exam';s.phase='event';s.history.push({turn:s.date.turn,event:null});
    const r=e.choose(1);assert.equal(r.ok,true);
    const actual=s.events.result.fx?.stress||0;
    if(actual>3){sawFailure=true;assert.equal(s.consequences.length,1,'實際失敗效果含高壓力，應建立延遲後果');}
    else{sawSuccess=true;assert.equal(s.consequences.length,0,'實際成功效果壓力不高，不應建立延遲後果');}
  }
  assert.ok(sawSuccess&&sawFailure,`未覆蓋兩分支 success=${sawSuccess} failure=${sawFailure}`);
});
