import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
import {MPS_2026,SALARY_GRADES,payPointForState} from '../js/salary-system.js';
const names=['config','subjects','schools','events','careers'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)))]));
const make=(seed=1,employmentType='perm')=>{const e=createEngine(data);e.start({mode:'random',seed});e.state.career.employmentType=employmentType;if(employmentType==='contract'){e.state.career.contractStartTurn=0;e.state.career.contractMonths=[12,24,36][seed%3];e.state.career.contractEndTurn=e.state.career.contractMonths;}return e};
const advance=e=>{let guard=0;while(e.state.phase!=='play'&&guard++<8){if(e.state.phase==='event')e.choose(0);else if(e.state.phase==='ending')return false;else e.ack()}return e.state.phase==='play'};
test('3.4.1 官方 MPS：GM／SGM／PGM／校長薪點範圍及 2026-04-01 薪金',()=>{
  assert.deepEqual(SALARY_GRADES.map(x=>[x.id,x.min,x.max]),[['GM',15,33],['SGM',34,39],['PGM',38,41],['P2',40,44],['P1',45,49]]);
  assert.equal(MPS_2026[15],35780);assert.equal(MPS_2026[33],83140);assert.equal(MPS_2026[34],83975);assert.equal(MPS_2026[49],150070);
});
test('Contract 合約年期只會是 12／24／36 個月，合約教師不能申請或接受職級晉升',()=>{
  for(let seed=1;seed<=30;seed++){const e=make(seed,'contract');assert.ok([12,24,36].includes(e.state.career.contractMonths));assert.equal(e.state.career.contractEndTurn,e.state.career.contractMonths);e.state.character.careerMonths=240;e.state.career.credentials=['中層領導培訓','校長資格培訓'];e.state.character.attributes=Object.fromEntries(Object.keys(e.state.character.attributes).map(k=>[k,100]));e.state.character.status.managementTrust=100;assert.equal(e.promotionEligibility().ok,false);e.state.career.promotionOffer={rank:3,turn:0};assert.equal(e.decidePromotion(true).ok,false);}
});
test('溝通點數獨立於 AP，進修點數及課程 AP 分開扣除',()=>{
  const e=make(9),s=e.state;const ap=e.unusedAP(),cp=s.career.communicationPoints;assert.equal(e.interactNPC('npc_principal').ok,true);assert.equal(e.unusedAP(),ap);assert.equal(s.career.communicationPoints,cp-1);
  s.character.status.wealth=50000;e.setAlloc('professional',10);assert.equal(e.enrollCourse('classroom-research').ok,true);assert.equal(s.ap.spent,2);assert.equal(s.ap.allocation.professional,8);assert.equal(s.career.professionalDevelopmentPoints,0);
});
test('專業工作投入至少 8 AP 可取得 1 PD，課程完成資格生效',()=>{
  const e=make(10),s=e.state;s.character.status.wealth=100000;s.character.qualification='untrained';s.career.salaryPoint=20;e.setAlloc('professional',8);assert.equal(e.settle().ok,true);assert.equal(s.career.professionalDevelopmentPoints,3);while(s.phase!=='play'){if(s.phase==='event')e.choose(0);else e.ack()}
  assert.equal(e.enrollCourse('pgde-equivalent').ok,true);for(let i=0;i<24;i++){e.setAlloc('rest',100);e.settle();while(s.phase!=='play'&&s.phase!=='ending'){if(s.phase==='event')e.choose(0);else e.ack()}}assert.ok(s.career.completedCourses.includes('pgde-equivalent'));assert.equal(s.career.salaryBarCleared,true);assert.ok(payPointForState(s).point>=20);
});
test('健康值歸零立即 Game Over，之後不能結算或進行退休活動',()=>{
  const e=make(11),s=e.state;s.character.status.health=.1;s.character.status.stress=100;s.character.status.energy=0;e.setAlloc('teaching',100);const r=e.settle();assert.equal(r.ok,true);assert.equal(s.phase,'ending');assert.equal(s.ending.gameOver,true);assert.equal(e.settle().ok,false);assert.equal(e.retirementAction('family').ok,false);
});
test('3.3.1 舊存檔遷移保留原有進度並補齊 3.4.1 欄位',()=>{
  const e=make(12),old=structuredClone(e.state);old.meta.gameVersion='3.3.1';old.career.completedCourses=['classroom-research','pgde-equivalent'];delete old.career.communicationPoints;delete old.career.professionalDevelopmentPoints;delete old.career.contractMonths;delete old.school.health;const next=createEngine(data);assert.equal(next.load(old).ok,true);assert.equal(next.state.meta.migratedFrom,'3.3.1');assert.equal(next.state.meta.gameVersion,'4.0.0');assert.equal(next.state.career.communicationPoints,4);assert.equal(next.state.career.professionalDevelopmentPoints,2);assert.equal(next.state.character.name,old.character.name);assert.equal(next.state.date.turn,old.date.turn);assert.ok(next.state.career.trainingRecords.some(x=>x.courseId==='classroom-research'&&x.endorsed));assert.equal(next.state.career.cpd.electiveHours,36,'舊完成選修課程時數須遷移保留');assert.equal(next.state.career.cpd.cycleHours,36,'PGDE 資格訓練不計入 CPD');
});
test('長期低表現經正式累積評核後才被解僱，Game Over 不可繼續',()=>{
  const e=make(13),s=e.state;s.character.attributes=Object.fromEntries(Object.keys(s.character.attributes).map(k=>[k,0]));s.character.status.managementTrust=0;s.character.status.satisfaction=0;s.career.performanceWarnings=0;
  for(let m=0;m<60&&s.phase!=='ending';m++){e.setAlloc('rest',100);e.settle();while(s.phase!=='play'&&s.phase!=='ending'){if(s.phase==='event')e.choose(0);else e.ack()}}
  assert.equal(s.phase,'ending');assert.equal(s.ending.cause,'dismissal');assert.equal(s.career.performanceStage,'解僱');assert.equal(e.settle().ok,false);
});
test('失業或離開教師職系期間不會累積教師年資',()=>{
  const e=make(21),s=e.state,initial=s.character.careerMonths;const finish=()=>{while(s.phase!=='play'&&s.phase!=='ending'){if(s.phase==='event')e.choose(0);else e.ack()}};s.career.unemployed=true;e.settle();finish();assert.equal(s.character.careerMonths,initial);s.career.unemployed=false;s.career.externalRole={id:'ngo',name:'教育及青少年服務機構'};e.settle();finish();assert.equal(s.character.careerMonths,initial);s.career.externalRole=null;e.settle();finish();assert.equal(s.character.careerMonths,initial+1);
});
test('學校殺校有預警、公布期限及六個月轉校窗口',()=>{
  const e=make(22),s=e.state;s.character.attributes=Object.fromEntries(Object.keys(s.character.attributes).map(k=>[k,85]));s.character.status.managementTrust=80;s.school.studentPopulation=300;s.school.health={studentPopulation:300,enrolmentTrend:-2,status:'closure-risk',warningMonths:4};s.school.culture.academic=20;s.management.schoolReputation=20;s.management.parentTrust=20;
  for(let i=0;i<12&&s.phase!=='ending';i++){for(const[k,v]of Object.entries({teaching:25,administration:15,professional:10,extracurricular:8,family:12,rest:30}))e.setAlloc(k,v);e.settle();while(s.phase!=='play'&&s.phase!=='ending'){if(s.phase==='event')e.choose(0);else e.ack()}}
  assert.ok(s.school.closureTurn,'應公布結束辦學日期');assert.equal(s.school.health.status,'closure-announced');assert.equal(s.school.closureTurn,s.date.turn+6);
  for(let i=0;i<6&&s.phase!=='ending';i++){for(const[k,v]of Object.entries({teaching:25,administration:15,professional:10,extracurricular:8,family:12,rest:30}))e.setAlloc(k,v);e.settle();while(s.phase!=='play'&&s.phase!=='ending'){if(s.phase==='event')e.choose(0);else e.ack()}}
  assert.equal(s.phase,'ending');assert.equal(s.ending.cause,'school-closure');
});
test('Contract 續約評估紀錄包含表現、管理層、學校財政及競爭因素',()=>{
  const e=make(23,'contract'),s=e.state;s.date.turn=11;s.character.careerMonths=60;s.career.contractStartTurn=0;s.career.contractMonths=12;s.career.contractEndTurn=12;s.character.attributes=Object.fromEntries(Object.keys(s.character.attributes).map(k=>[k,95]));s.character.status.managementTrust=95;s.school.financialCondition=90;s.school.reputation=90;s.school.studentPopulation=900;
  e.setAlloc('teaching',25);e.setAlloc('administration',15);e.setAlloc('professional',10);e.setAlloc('extracurricular',8);e.setAlloc('family',12);e.setAlloc('rest',30);e.settle();
  const ev=s.career.contractHistory[0];assert.ok(ev);assert.equal(typeof ev.performanceScore,'number');assert.equal(typeof ev.managementSupport,'number');assert.equal(typeof ev.schoolFinancial,'number');assert.equal(typeof ev.competitionPenalty,'number');assert.equal(typeof ev.renewalScore,'number');
});
test('常額邀請接受後移除合約到期日並解鎖正式職系',()=>{
  const e=make(24,'contract'),s=e.state;s.career.permOffer={turn:0,score:80};assert.equal(e.decidePerm(true).ok,true);assert.equal(s.career.employmentType,'contract','接受邀請後仍以現有合約身份工作至新學年');assert.equal(s.career.pendingSchoolYearChanges[0].type,'perm');e.settle();assert.equal(s.career.employmentType,'perm','新學年九月才轉常額');assert.equal(s.career.contractEndTurn,null);assert.equal(s.career.contractMonths,null);assert.equal(e.promotionEligibility().ok,false,'未達年資及空缺前仍不能升職');
});
test('非學年起始的 Contract 會在合約實際到期月評估，而非延遲至學年結束',()=>{
  const e=make(25,'contract'),s=e.state;s.date.turn=13;s.career.contractStartTurn=13;s.career.contractMonths=12;s.career.contractEndTurn=25;s.career.contractHistory=[];s.character.attributes=Object.fromEntries(Object.keys(s.character.attributes).map(k=>[k,90]));s.character.status.managementTrust=90;s.school.financialCondition=90;
  for(let i=0;i<12&&s.career.contractHistory.length===0;i++){for(const[k,v]of Object.entries({teaching:25,administration:15,professional:10,extracurricular:8,family:12,rest:30}))e.setAlloc(k,v);e.settle();while(s.phase!=='play'&&s.phase!=='ending'){if(s.phase==='event')e.choose(0);else e.ack()}}
  assert.equal(s.date.turn,25);assert.equal(s.career.contractHistory.length,1);assert.equal(s.career.contractHistory[0].turn,25);
});
test('轉校申請消耗 5 專業 AP，同一遊戲月不能重複刷申請',()=>{
  const e=make(26),s=e.state;s.character.attributes=Object.fromEntries(Object.keys(s.character.attributes).map(k=>[k,100]));s.character.status.managementTrust=100;const opts=e.getTransferOptions();assert.ok(opts.length>1);e.transferSchool(opts[0]);assert.equal(s.ap.spent,5);const second=e.transferSchool(opts[1]);assert.equal(second.ok,false);assert.match(second.error,/每月只可提交一次/);
});
