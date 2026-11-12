import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
import {createUI} from '../js/ui.js';
const names=['config','subjects','schools','events','careers'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)))]));
const school=()=>{const e=createEngine(data);return e.rollSchools(77,{type:'aided'})[0]};
const form=(q='untrained')=>({name:'進修測試',age:28,experienceYears:0,gender:'男',education:'bachelor',qualification:q,subject:data.subjects[0].id,family:'single',birthMonth:3,employmentType:'perm'});
const start=()=>{const e=createEngine(data);assert.equal(e.start({mode:'story',seed:77,form:form(),school:school()}).ok,true);return e;};
const advance=e=>{while(e.state.phase!=='play'){if(e.state.phase==='event')e.choose(0);else e.ack();}};

test('3.4.2：未受訓學士可直接選擇 PGDE，不需要 PD 或日常 AP',()=>{
 const e=start(),s=e.state;s.character.status.wealth=30000;s.career.professionalDevelopmentPoints=0;s.ap.spent=100;
 const r=e.enrollCourse('pgde-equivalent');assert.equal(r.ok,true);assert.equal(s.career.activeCourses[0].pdCost,0);assert.equal(s.career.activeCourses[0].apCost,0);assert.equal(s.character.status.wealth,6500);assert.equal(s.career.pgdeStudy.status,'studying');
});

test('3.4.2：PGDE 兼讀制第二年學費不足會暫停，可繳費後恢復',()=>{
 const e=start(),s=e.state;s.character.status.wealth=50000;assert.equal(e.enrollCourse('pgde-equivalent').ok,true);
 for(let i=0;i<12;i++){e.settle();advance(e);}s.character.status.wealth=0;e.settle();advance(e);const a=s.career.activeCourses.find(x=>x.id==='pgde-equivalent');assert.ok(a);assert.equal(a.paymentDue,true);assert.equal(a.remaining,12);
 s.character.status.wealth=30000;assert.equal(e.payCourseInstallment('pgde-equivalent').ok,true);assert.equal(a.paymentDue,false);assert.equal(a.secondYearPaid,true);
 for(let i=0;i<12;i++){e.settle();advance(e);}assert.equal(s.character.qualification,'pgde');assert.equal(s.career.pgdeStudy.status,'completed');assert.ok(s.career.salaryBarCleared);assert.equal(s.career.cpd.cycleHours,0);assert.equal(data.careers.courses.find(x=>x.id==='pgde-equivalent').creditsMin,30);
});

test('3.4.2：校本 CPD 活動計入 150 小時，但不計入 NJT 指定選修',()=>{
 const e=start(),s=e.state;assert.equal(e.recordSchoolCPD('coPlanning').ok,true);assert.equal(s.career.cpd.cycleHours,6);assert.equal(s.career.cpd.generalHours,6);assert.equal(s.career.njtTraining.electiveHours||0,0);assert.equal(s.career.trainingRecords.at(-1).countsTowardNJT,false);
 assert.equal(e.recordSchoolCPD('coPlanning').ok,false,'同一活動每月不可重複刷時數');
});

test('3.4.2：新入職教師首三年低於 150 小時會收到進度關注信，與核心正式警告分開',()=>{
 const e=start(),s=e.state;s.date.turn=35;s.date.month=8;s.career.cpd.cycleHours=90;s.career.trainingRecords=[{turn:0,track:'core',hours:30,verified:true,countsTowardNJT:true,coreBreakdown:{professionalRolesValuesConduct:15,educationIssues:15}},{turn:0,track:'elective',hours:60,verified:true,countsTowardNJT:true}];
 e.settle();advance(e);assert.equal(s.career.njtTraining.softTargetNoticeIssued,true);assert.equal(s.career.njtTraining.warningIssued,false);assert.ok(s.career.careerChangeNotices.some(x=>x.type==='edb-soft-target'));
});

test('3.4.2：首三年核心培訓不足會進入正式教育局跟進程序',()=>{
 const e=start(),s=e.state;s.date.turn=35;s.date.month=8;s.career.cpd.cycleHours=150;e.settle();advance(e);assert.equal(s.career.njtTraining.warningIssued,true);assert.ok(s.career.careerChangeNotices.some(x=>x.type==='edb-formal-warning'));
});

test('3.4.2：職涯頁顯示 PGDE、150 小時進度及校本 CPD 活動',()=>{
 const e=start(),storage={getItem:()=>null,setItem:()=>{}},root={innerHTML:'',addEventListener(){}};const ui=createUI(root,e,storage,{seed:77});ui.act('new');ui.act('random');ui.act('tab',{tab:'career'});ui.render();for(const t of ['重新修讀 PGDE','150 小時','共同備課','同儕觀課','校本進修資助'])assert.ok(root.innerHTML.includes(t),t);
});

test('3.4.2：校本 PGDE 資助申請設六個月冷卻，避免反覆抽取結果',()=>{
 const e=start(),s=e.state;s.character.status.wealth=20000;s.management.budget=50000;s.character.status.managementTrust=100;s.school.financialCondition=100;
 const r=e.enrollCourse('pgde-equivalent',true);assert.equal(r.ok,true);assert.equal(r.schoolContribution,12000);assert.equal(s.management.budget,38000);
 const e2=start(),s2=e2.state;s2.character.status.wealth=20000;s2.management.budget=50000;s2.character.status.managementTrust=0;s2.school.financialCondition=0;
 s2.career.pgdeSponsorLastAttemptTurn=s2.date.turn;assert.match(e2.enrollCourse('pgde-equivalent',true).error,/六個月/);
});

test('3.4.2：舊存檔培訓紀錄會補回 NJT 標記及核心範疇，既有 PGDE 不重收第二年費',()=>{
 const e=start(),old=structuredClone(e.state);old.meta.gameVersion='3.4.1';old.career.trainingRecords=[{turn:0,courseId:'new-teacher-core',hours:30,track:'core',verified:true}];old.career.activeCourses=[{id:'pgde-equivalent',remaining:5,enrolledTurn:4}];old.career.completedCourses=[];old.career.pgdeStudy=null;
 const next=createEngine(data);assert.equal(next.load(old).ok,true);const rec=next.state.career.trainingRecords[0],pgde=next.state.career.activeCourses[0];
 assert.equal(next.state.meta.gameVersion,'4.0.0');assert.equal(rec.countsTowardNJT,true);assert.equal(rec.coreBreakdown.professionalRolesValuesConduct,15);assert.equal(pgde.secondYearPaid,true);assert.equal(pgde.secondYearFee,0);assert.equal(next.state.career.pgdeStudy.legacySave,true);
});

test('3.4.2：新入職教師第 12 個月會按進度發出提醒，但不會直接正式警告',()=>{
 const e=start(),s=e.state;s.date.turn=11;s.date.month=8;s.career.cpd.cycleHours=0;e.settle();advance(e);
 assert.ok(s.career.njtTraining.progressChecks.includes(12));assert.ok(s.career.careerChangeNotices.some(x=>x.type==='edb-progress'));assert.equal(s.career.njtTraining.warningIssued,false);
});


test('3.4.2：財務頁會顯示 PGDE 第二年學費月度預留額及待繳一次性學費',()=>{
 const e=start(),s=e.state;s.character.status.wealth=100000;assert.equal(e.enrollCourse('pgde-equivalent').ok,true);const f=e.financeInfo();assert.equal(f.pgdeStudyReserve,2063);assert.equal(f.pgdeTuitionDue,0);assert.equal(f.projectedNetAfterStudyReserve,f.projectedNet-f.pgdeStudyReserve);s.career.activeCourses.find(x=>x.id==='pgde-equivalent').paymentDue=true;const due=e.financeInfo();assert.equal(due.pgdeStudyReserve,0);assert.equal(due.pgdeTuitionDue,24750);
});
