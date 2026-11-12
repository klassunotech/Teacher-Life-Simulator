import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
import {createUI} from '../js/ui.js';
import {structuralGate} from '../js/career-system.js';
import {initialPayPoint,qualificationProfile,payPointForState} from '../js/salary-system.js';
const names=['config','subjects','schools','events','careers'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)))]));
const school=()=>{const e=createEngine(data);return e.rollSchools(77,{type:'aided'})[0]};
const form=q=>({name:'資格測試',age:28,experienceYears:0,gender:'男',education:'bachelor',qualification:q,subject:data.subjects[0].id,family:'single',birthMonth:3,employmentType:'perm'});
const start=q=>{const e=createEngine(data);assert.equal(e.start({mode:'story',seed:77,form:form(q),school:school()}).ok,true);return e;};
const advance=e=>{while(e.state.phase!=='play'){if(e.state.phase==='event')e.choose(0);else e.ack();}};

test('3.4.1：BEd／PGDE 受訓與未受訓 GM 起薪及薪酬關限分開',()=>{
  const trained={career:{rank:0,salaryBarCleared:false},character:{qualification:'pgde',careerMonths:0}};
  const bed={career:{rank:0,salaryBarCleared:false},character:{qualification:'bed',careerMonths:0}};
  const untrained={career:{rank:0,salaryBarCleared:false},character:{qualification:'untrained',careerMonths:0}};
  assert.equal(initialPayPoint(trained),17);assert.equal(initialPayPoint(bed),17);assert.equal(initialPayPoint(untrained),15);
  trained.character.careerMonths=72;bed.character.careerMonths=72;untrained.character.careerMonths=72;
  assert.equal(initialPayPoint(trained),23);assert.equal(initialPayPoint(bed),23);assert.equal(initialPayPoint(untrained),20);
  assert.equal(qualificationProfile(untrained).salaryBar,20);
  assert.equal(payPointForState({career:{rank:0,salaryPoint:22},character:{qualification:'untrained',careerMonths:84}}).point,20);
});

test('3.4.1：年度增薪按合資格服務年期，受訓與未受訓薪點上限不同',()=>{
  const trained=start('pgde'),untrained=start('untrained');
  for(const e of [trained,untrained]){e.state.character.attributes.teaching=95;e.state.character.attributes.administration=95;e.state.character.attributes.leadership=95;e.state.character.attributes.professional=95;e.state.character.status.managementTrust=95;}
  for(let i=0;i<12;i++){trained.settle();advance(trained);untrained.settle();advance(untrained);}
  assert.equal(trained.state.career.salaryPoint,18);
  assert.equal(untrained.state.career.salaryPoint,16);
});

test('3.4.1：課程完成才登記 CPD 核心／選修時數，三年周期有獨立記錄',()=>{
  const e=start('pgde'),s=e.state;s.character.status.wealth=100000;s.character.attributes.leadership=80;s.career.professionalDevelopmentPoints=10;
  assert.equal(e.enrollCourse('new-teacher-core').ok,true);
  for(let i=0;i<2;i++){e.settle();advance(e);}
  assert.ok(s.career.trainingRecords.some(x=>x.track==='core'&&x.hours===30));
  assert.equal(s.career.cpd.coreHours,30);
  assert.equal(s.career.cpd.coreCategoryHours.professionalRolesValuesConduct,15);
  assert.equal(s.career.cpd.coreCategoryHours.educationIssues,15);
  s.career.professionalDevelopmentPoints=10;
  assert.equal(e.enrollCourse('classroom-research').ok,true);
  for(let i=0;i<3;i++){e.settle();advance(e);}
  s.career.professionalDevelopmentPoints=10;
  assert.equal(e.enrollCourse('assessment-literacy').ok,true);
  for(let i=0;i<2;i++){e.settle();advance(e);}
  assert.equal(s.career.trainingRecords.filter(x=>x.track==='elective').reduce((a,x)=>a+x.hours,0),60);
  assert.equal(s.career.cpd.electiveHours,60);
  assert.equal(s.career.njtTraining.status,'completed','首三年新入職教師 30 核心 + 60 選修達標');
  assert.equal(s.career.trainingRecords.filter(x=>['promotionCore','elective'].includes(x.track)&&!x.endorsed).length,2);
  assert.equal(s.career.trainingRecords.find(x=>x.track==='core').endorsed,true,'新入職核心課程不屬於晉升核心認可');
});

test('3.4.1：CP 與 AP 不足會回報明確原因，深入支援建立延遲後果',()=>{
  const e=start('pgde'),s=e.state;
  s.career.communicationPoints=0;
  const noCP=e.interactNPC('npc_principal','help');assert.equal(noCP.ok,false);assert.match(noCP.error,/溝通點數不足/);
  s.career.communicationPoints=3;
  const help=e.interactNPC('npc_principal','help');assert.equal(help.ok,true);assert.match(help.followup,/兩個月後/);assert.equal(s.consequences.length,1);
  s.career.professionalDevelopmentPoints=10;s.character.status.wealth=100000;
  assert.equal(e.availableAP('professional'),100);
  s.ap.spent=99; // 只剩 1 AP 可用
  assert.match(e.enrollCourse('new-teacher-core').error,/AP 不足/);
});

test('3.4.1：財務預算逐項拆分，淨現金流與月結計算一致',()=>{
  const e=start('pgde'),f=e.financeInfo();
  assert.equal(f.salary.monthlySalary,39490);
  assert.equal(f.monthlyIncome,f.salary.monthlySalary+f.partnerIncome);
  assert.equal(f.totalExpense,f.living+f.interest+f.tuition);
  assert.equal(f.projectedNet,f.monthlyIncome-f.totalExpense-f.contribution);
  assert.ok(Number.isFinite(f.projectedNet));
  e.setAlloc('rest',100);assert.equal(e.settle().ok,true);
  const h=e.state.history.at(-1);
  assert.equal(h.expense,h.financeBreakdown.living+h.financeBreakdown.interest+h.financeBreakdown.tuition);
  assert.equal(h.contribution>0,true);
});

test('3.4.1：人物頁顯示 CP 不足及預期跟進；職涯頁顯示五類進修與時數要求',()=>{
  const e=start('pgde'),storage={getItem:()=>null,setItem:()=>{}},root={innerHTML:'',addEventListener(){}};
  const ui=createUI(root,e,storage,{seed:77});ui.act('new');ui.act('random');ui.act('tab',{tab:'people'});e.state.career.communicationPoints=0;ui.render();
  assert.match(root.innerHTML,/溝通點數不足/);assert.match(root.innerHTML,/預期結果/);
  ui.act('tab',{tab:'career'});ui.render();
  for(const c of ['教學及課程發展','學生支援','教師領導','學校行政','專業資格','150 小時','100 小時'])assert.ok(root.innerHTML.includes(c),c);
});

test('3.4.1：完成認可 PGDE 訓練可獲兩個薪點資格增額，資格訓練不冒充 CPD',()=>{
  const e=start('untrained'),s=e.state;s.character.status.wealth=100000;s.career.professionalDevelopmentPoints=10;
  const before=s.career.salaryPoint;
  assert.equal(e.enrollCourse('pgde-equivalent').ok,true);
  for(let i=0;i<24;i++){e.settle();advance(e);}
  assert.equal(s.career.salaryBarCleared,true);
  assert.ok(s.career.salaryPoint>=before+2,'完成訓練後應獲兩薪點資格增額');
  assert.ok(s.career.trainingRecords.some(x=>x.track==='qualification'&&x.hours===0));
  assert.equal(s.career.cpd.cycleHours,0,'初始教師資格課程不計作在職 CPD／晉升選修時數');
});

test('3.4.1：未受訓 GM 不可直接申請 SGM，完成教師訓練後才解除限制',()=>{
  const e=start('untrained'),s=e.state;s.character.careerMonths=120;s.career.path='management';s.career.credentials=['中層領導培訓'];s.career.vacancies={3:6};s.character.attributes=Object.fromEntries(Object.keys(s.character.attributes).map(k=>[k,100]));s.character.status.managementTrust=100;s.character.status.stress=0;
  assert.match(e.promotionEligibility().reason,/未受訓教師須先取得認可教師訓練資格/);
  s.career.salaryBarCleared=true;s.career.trainingRecords=[{turn:0,hours:30,track:'promotionCore',verified:true,endorsed:true},{turn:0,hours:60,track:'elective',verified:true,endorsed:true}];
  assert.notEqual(e.promotionEligibility().reason,'未受訓教師須先取得認可教師訓練資格');
});

test('3.4.1：NJT 核心時數不可代替資助學校晉升核心時數',()=>{
  const e=start('pgde'),s=e.state;s.career.path='management';s.career.credentials=['中層領導培訓'];s.career.trainingRecords=[{courseId:'new-teacher-core',turn:0,hours:30,track:'core',verified:true,endorsed:true},{courseId:'classroom-research',turn:0,hours:60,track:'elective',verified:true,endorsed:true}];
  assert.match(structuralGate(s,data.config,3),/認可核心培訓需 30 小時/);
});

test('3.4.1：晉升培訓時數未獲 SMC／IMC 認可前不能計入晉升資格',()=>{
  const e=start('pgde'),s=e.state;s.career.path='management';s.character.careerMonths=120;s.character.attributes.leadership=90;s.career.credentials=['中層領導培訓'];s.career.vacancies={3:6};
  s.career.trainingRecords=[{courseId:'promotion-core',turn:0,hours:30,track:'promotionCore',verified:true,endorsed:false},{courseId:'classroom-research',turn:0,hours:60,track:'elective',verified:true,endorsed:false}];
  assert.match(structuralGate(s,data.config,3),/核心培訓需 30 小時/);
  assert.equal(e.endorseTraining('promotion-core').ok,true);assert.equal(e.endorseTraining('classroom-research').ok,true);
  assert.equal(structuralGate(s,data.config,3),null,'完成並獲校方認可後可通過時數門檻');
});

test('3.4.1：新入職公帑資助學校教師三年未完成 30+60 小時會標示逾期及跟進',()=>{
  const e=start('pgde'),s=e.state;s.date.turn=35;s.date.month=8;e.settle();advance(e);
  assert.equal(s.career.njtTraining.status,'overdue');assert.equal(s.career.njtTraining.warningIssued,true);
  assert.ok(s.career.careerChangeNotices.some(x=>x.text.includes('已逾三年期限')));
  assert.equal(s.career.cpd.lastCycle.coreRequirementMet,false);assert.equal(s.career.cpd.lastCycle.softTargetMet,false);
  assert.ok(s.career.careerChangeNotices.some(x=>x.text.includes('上一個三年 CPD 周期核心時數未達標')));
});

test('3.4.1：完成認可 PGDE 訓練後獲兩個薪點增額並解除未受訓薪酬關限',()=>{
  const e=start('untrained'),s=e.state;s.character.status.wealth=100000;s.career.professionalDevelopmentPoints=10;
  const before=s.career.salaryPoint;assert.equal(e.enrollCourse('pgde-equivalent').ok,true);
  for(let i=0;i<24;i++){e.settle();advance(e);}
  assert.equal(s.career.salaryBarCleared,true);assert.ok(s.career.salaryPoint>=before+2);
  assert.ok(s.career.salaryHistory.some(x=>x.type==='qualification-increment'));
  assert.equal(s.career.cpd.cycleHours,0);
});

test('3.4.1：非九月到期的合約會安排新學年生效，期間保留過渡聘用狀態',()=>{
  const e=start('pgde'),s=e.state;s.career.employmentType='contract';s.date.turn=13;s.date.month=2;s.career.contractStartTurn=2;s.career.contractMonths=12;s.career.contractEndTurn=14;s.character.attributes=Object.fromEntries(Object.keys(s.character.attributes).map(k=>[k,90]));s.character.status.managementTrust=90;s.school.financialCondition=90;
  e.settle();advance(e);
  assert.equal(s.date.turn,14);
  assert.equal(s.career.employmentType,'contract');
  assert.equal(s.career.contractEndTurn,null);
  assert.equal(s.career.contractBridgeUntilSchoolYear,true);
  assert.ok(s.career.pendingSchoolYearChanges.some(x=>x.type==='contractRenewal'&&x.effectiveTurn===20));
});

test('3.4.1：非九月接受 Perm 邀請，身份只在下一個九月轉換',()=>{
  const e=start('untrained'),s=e.state;s.career.employmentType='contract';s.date.turn=5;s.date.month=2;s.career.permOffer={turn:5,score:85};
  const r=e.decidePerm(true);assert.equal(r.ok,true);assert.equal(r.effectiveTurn,12);assert.equal(s.career.employmentType,'contract');
  s.date.turn=12;s.date.month=9;e.settle();
  assert.equal(s.career.employmentType,'perm');
});


test('3.4.1：財務頁顯示完整每月開支及淨現金流',()=>{
  const e=start('pgde'),storage={getItem:()=>null,setItem:()=>{}},root={innerHTML:'',addEventListener(){}};const ui=createUI(root,e,storage,{seed:77});ui.act('new');ui.act('random');ui.act('tab',{tab:'finance'});ui.render();
  for(const label of ['每月收支預算','教師底薪','家庭／伴侶收入','生活開支','負債利息','職涯／其他固定開支','退休儲備供款','預計每月淨現金流'])assert.ok(root.innerHTML.includes(label),label);
});

test('3.4.1：校方認可會消耗行政 AP，AP 不足會明確回報',()=>{
  const e=start('pgde'),s=e.state;s.career.trainingRecords=[{courseId:'promotion-core',turn:0,hours:30,track:'promotionCore',verified:true,endorsed:false}];s.ap.spent=100;
  const r=e.endorseTraining('promotion-core');assert.equal(r.ok,false);assert.match(r.error,/AP 不足/);
});
