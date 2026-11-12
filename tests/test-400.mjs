import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
const names=['config','subjects','schools','events','careers'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)))]));
const form={name:'4.0測試',age:29,experienceYears:0,gender:'男',education:'bachelor',qualification:'pgde',subject:data.subjects[0].id,family:'single',birthMonth:3,employmentType:'perm'};
const make=()=>{const e=createEngine(data);const school=e.rollSchools(20261111,{type:'aided'})[0];assert.equal(e.start({mode:'story',seed:20261111,form,school}).ok,true);return e;};
const advance=e=>{while(e.state.phase!=='play'){if(e.state.phase==='event')e.choose(0);else e.ack();}};
test('4.0：開局建立學生群體、獨立同事網絡、KPI 及三年發展周期',()=>{
 const s=make().state;assert.equal(s.students.cohort.length,48);assert.equal(s.staff.people.length,12);assert.ok(s.school.kpiWeights);assert.equal(s.school.strategyCycle.cycle,1);assert.ok(s.students.cohort.every(x=>Number.isFinite(x.ability)&&Number.isFinite(x.stress)&&Array.isArray(x.history)));
});
test('4.0：教學策略能改變教學負荷、調適及後續學生學習軌跡',()=>{
 const e=make(),s=e.state;const before=s.students.cohort.map(x=>x.progress);assert.equal(e.setTeachingDecision('cram').ok,true);assert.equal(s.teaching.workload,88);e.settle();advance(e);assert.ok(s.students.cohort.some((x,i)=>x.progress!==before[i]));assert.ok(s.students.cohort.some(x=>x.stress>0));
});
test('4.0：因材施教與密集操練具有不同參數及長期壓力取捨',()=>{
 const a=make(),b=make();a.setTeachingDecision('cram');b.setTeachingDecision('differentiated');assert.ok(a.state.teaching.examPractice>b.state.teaching.examPractice);assert.ok(a.state.teaching.adaptation<b.state.teaching.adaptation);assert.ok(a.state.teaching.workload>b.state.teaching.workload);
});
test('4.0：學生風險個案需處理並留下校本紀錄',()=>{
 const e=make(),s=e.state;s.students.incidents.push({id:'test-risk',studentId:s.students.cohort[0].id,type:'high-risk-absence',turn:0,status:'monitoring',factors:['壓力偏高']});assert.equal(e.resolveStudentIncident('test-risk','refer').ok,true);assert.equal(s.students.incidents[0].status,'referred');assert.equal(s.administration.auditTrail.length,1);
});
test('5.0 Alpha 1：普通教師不能修改 Banding；校長權限可修改並更新 KPI 權重',()=>{
 const e=make(),s=e.state,original=s.school.band;
 assert.equal(e.setSchoolBand(3).ok,false);
 assert.equal(s.school.band,original);
 s.career.rank=7;
 assert.equal(e.setSchoolBand(3).ok,true);
 assert.equal(s.school.band,3);
 assert.ok(s.school.kpiWeights.support>s.school.kpiWeights.academic);
});
test('4.0：因果事件會排程並在到期月份處理',()=>{
 const e=make(),s=e.state;s.causal.scheduled.push({type:'test-delayed',dueTurn:1,text:'延遲跟進測試',effect:'pressure',done:false});e.settle();advance(e);e.settle();advance(e);assert.ok(s.causal.resolved.some(x=>x.type==='test-delayed'));
});
test('4.0：4.0 生態狀態可存檔並載入遷移',async()=>{
 const e=make(),s=e.state;const storage={v:null,setItem(k,v){this.v=v},getItem(){return this.v}};const {saveGame,loadGame}=await import('../js/save-system.js');{assert.equal(saveGame(s,storage).ok,true);const parsed=loadGame(storage);assert.equal(parsed.ok,true);const next=createEngine(data);assert.equal(next.load(parsed.state).ok,true);assert.equal(next.state.students.cohort.length,48);}
});

test('4.0.1：新聞政策頁可從遊戲引擎讀取並制定校本行動',()=>{
 const e=make();const feed=e.newsBriefing();assert.equal(feed.length,10);
 assert.ok(feed.every(x=>x.url.startsWith('https://')&&x.actions.length>=2));
 const r=e.respondToNews('hk-2026-wellbeing-campaign','4rs_campaign');
 assert.equal(r.ok,true);assert.equal(e.state.news.actions.length,1);assert.equal(e.state.news.pending.length,1);
 assert.equal(e.respondToNews('hk-2026-wellbeing-campaign','4rs_campaign').ok,false);
});

test('4.0.1：新聞政策分頁可實際渲染及操作',async()=>{
 const {createUI}=await import('../js/ui.js');
 const e=make(),root={innerHTML:'',addEventListener(){}},storage={getItem(){return null},setItem(){}};
 const u=createUI(root,e,storage);u.ui.screen='game';u.act('tab',{tab:'news'});
 assert.match(root.innerHTML,/香港中學新聞與政策動態/);
 assert.match(root.innerHTML,/匯流升級計劃/);
 u.act('newsAction',{news:'hk-2026-wellbeing-campaign',choice:'4rs_campaign'});
 assert.match(root.innerHTML,/已採取行動/);
 assert.equal(e.state.news.actions.length,1);
});
