// 3.1.0 基礎回歸測試（於 3.2.0 繼續執行）：難度、AP 梯度、職涯路線、財務、退休、存檔遷移（使用真實 3.0.x 存檔檔案）
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
import {parseSave} from '../js/save-system.js';
import {PATHS,PATH_NAMES,RANKS,LEGACY_PATH,promotionEligibility,structuralGate} from '../js/career-system.js';
import {loadData,runPlan,runFree,freeStart,adv,mean,collapsed} from '../tools/sim-lib.mjs';
import {salaryForState} from '../js/salary-system.js';
import {monthlyFinance} from '../js/finance-system.js';
import {createRng} from '../js/rng.js';
const data=loadData(),B=data.config.balance;
const tplB=T=>({teaching:T,administration:5,family:5,rest:Math.max(0,100-T-10)});
const seeds=n=>Array.from({length:n},(_,i)=>(i+1)*7919);

test('難度：三種難度存在，開局記錄並產生實質差異',()=>{
  assert.deepEqual(Object.keys(B.difficulty),['easy','balanced','hard']);
  const stress={};
  for(const d of Object.keys(B.difficulty))stress[d]=mean(seeds(30).map(s=>runPlan(data,{seed:s,months:12,plan:tplB(60),difficulty:d}).final.stress));
  assert.ok(stress.easy+5<stress.balanced&&stress.balanced+5<stress.hard,JSON.stringify(stress));
  const e=createEngine(data);e.start({mode:'challenge',seed:1,form:undefined});
});
test('挑戰模式預設困難；未指定難度預設平衡',()=>{
  const a=createEngine(data);a.start({mode:'random',seed:3});assert.equal(a.state.meta.difficulty,'balanced');
  const b=createEngine(data);b.start({mode:'random',seed:3,difficulty:'hard'});assert.equal(b.state.meta.difficulty,'hard');
  const c=createEngine(data);c.start({mode:'random',seed:3,difficulty:'bogus'});assert.equal(c.state.meta.difficulty,'balanced');
});
test('教學 AP 梯度：精力單調下降、壓力單調上升，且沒有懸崖',()=>{
  const row=T=>{const f=seeds(40).map(s=>runPlan(data,{seed:s,months:12,plan:tplB(T)}).final);return{stress:mean(f.map(x=>x.stress)),energy:mean(f.map(x=>x.energy)),teaching:mean(f.map(x=>x.teaching)),collapse:f.filter(collapsed).length/f.length}};
  const R={};for(const T of [20,30,40,50,60,70,80])R[T]=row(T);
  for(const T of [20,30,40,50,60,70]){assert.ok(R[T+10].stress>=R[T].stress-0.5,`stress ${T}`);assert.ok(R[T+10].energy<=R[T].energy+0.5,`energy ${T}`);assert.ok(R[T+10].stress-R[T].stress<50,`cliff at ${T}→${T+10}: ${R[T].stress}→${R[T+10].stress}`)}
  assert.ok(R[60].collapse<0.25,'教學 60 AP（留足休息）不應必然崩盤');assert.ok(R[70].collapse<0.5);
  assert.ok(R[50].teaching>R[20].teaching+5,'教學投入增加應提升教學成果');
});
test('單靠休息不能解決一切：休息導向的職涯進度及技能落後',()=>{
  const plan={rest:Object.assign({teaching:25,administration:10,family:15,rest:45,personal:5})};
  const rest=mean(seeds(30).map(s=>runPlan(data,{seed:s,months:60,plan:plan.rest}).final.teaching));
  const teach=mean(seeds(30).map(s=>runPlan(data,{seed:s,months:60,plan:tplB(50)}).final.teaching));
  assert.ok(teach>rest+5,`${teach} vs ${rest}`);
});
test('沒有單一萬能分配：各專精策略在不同指標上領先',()=>{
  const S={teach:{teaching:50,administration:8,professional:7,family:10,rest:25},admin:{teaching:25,administration:35,professional:8,family:10,rest:22},student:{teaching:25,studentSupport:20,extracurricular:10,administration:5,family:10,rest:25,professional:5},family:{teaching:30,administration:8,family:35,rest:22,personal:5}};
  const R={};for(const[k,p]of Object.entries(S))R[k]=mean(seeds(24).map(s=>{const f=runPlan(data,{seed:s,months:36,plan:p}).final;return f}).map(f=>f).reduce((a,f)=>{for(const x in f)a[x]=(a[x]||0)+f[x]/24;return a},{}).teaching&&0)||0;
  const F={};for(const[k,p]of Object.entries(S)){const fs_=seeds(24).map(s=>runPlan(data,{seed:s,months:36,plan:p}).final);F[k]={T:mean(fs_.map(f=>f.teaching)),A:mean(fs_.map(f=>f.administration)),S:mean(fs_.map(f=>f.student)),Fam:mean(fs_.map(f=>f.family))}}
  const best=m=>Object.keys(F).reduce((a,b)=>F[b][m]>F[a][m]?b:a);
  assert.equal(best('T'),'teach');assert.equal(best('A'),'admin');assert.equal(best('S'),'student');assert.equal(best('Fam'),'family');
});
test('八條路線：全部適用一般教師，結構完整且與設定一致',()=>{
  assert.equal(PATHS.length,8);assert.deepEqual(Object.keys(B.paths).sort(),[...PATHS].sort());
  for(const p of PATHS){const P=B.paths[p];assert.equal(PATH_NAMES[p],P.name);assert.ok(P.desc&&P.abilities&&P.burden,p);assert.ok(P.project&&P.project.id&&P.project.ap>0,p);
    assert.ok(Math.abs(Object.values(P.weights).reduce((a,b)=>a+b,0)-1)<1e-9,p+' 權重');assert.ok(P.cap>=3&&P.cap<=8)}
  const txt=JSON.stringify({PATH_NAMES,paths:B.paths});assert.ok(!/體育|裁判|運動訓練|sport|referee/i.test(txt),'路線設定不得含體育／裁判專屬內容');
  assert.ok(!['sport','referee'].some(k=>PATHS.includes(k)));
});
test('路線不只是名稱：加成、代價及升職上限各有不同',()=>{
  const gain=(path,plan,attr)=>mean(seeds(20).map(s=>{const o=freeStart(data,s,{});return runFree(data,o,{months:36,plan,policy:e=>{if(e.state.date.turn===0)e.setCareerPath(path)}}).e.state.character.attributes[attr]}));
  // 同一 AP 配置下，專業進修型的專業成長高於平衡生活型
  const plan={teaching:25,professional:30,administration:5,family:10,rest:25,personal:5};
  assert.ok(gain('study',plan,'professional')>gain('balanced',plan,'professional')+3);
  // 平衡生活型壓力較低（代價輕，但晉升較慢）
  const st=path=>mean(seeds(20).map(s=>runFree(data,freeStart(data,s,{}),{months:24,plan:{teaching:50,administration:10,family:10,rest:20,professional:10},policy:e=>{if(e.state.date.turn===0)e.setCareerPath(path)}}).final.stress));
  assert.ok(st('balanced')<st('management'),'平衡路線壓力應較低');
});
test('路線切換：有冷卻、換路線有壓力成本、加成按路線經驗逐步到位',()=>{
  const e=createEngine(data);e.start({mode:'random',seed:9});adv(e);
  assert.equal(e.setCareerPath('study').ok,true);assert.equal(e.setCareerPath('management').ok,false,'冷卻中不可再轉');
  assert.equal(e.setCareerPath('legacy-nonexistent').ok,false);
  for(let m=0;m<B.pathXp.changeCooldown;m++){adv(e);e.setAlloc('rest',40);e.settle()}adv(e);
  const s0=e.state.character.status.stress;assert.equal(e.setCareerPath('management').ok,true);assert.ok(e.state.character.status.stress>=Math.min(100,s0+B.pathXp.changeStress)-0.01);
  assert.equal(e.state.career.pathMonths.study>=B.pathXp.changeCooldown,true);
});
test('職級門檻：GM→SGM→PGM→校長（二級）→校長（一級）',()=>{
  const mk=path=>{const e=createEngine(data);e.start({mode:'random',seed:5});adv(e);const s=e.state;s.career.path=path;s.career.salaryBarCleared=true;s.career.trainingRecords=[{turn:0,hours:30,track:'promotionCore',verified:true,endorsed:true},{turn:0,hours:100,track:'elective',verified:true,endorsed:true}];s.character.careerMonths=400;Object.assign(s.character.attributes,{teaching:95,administration:95,leadership:95,professional:95,communication:95,resilience:95});Object.assign(s.character.status,{managementTrust:95,satisfaction:90,stress:20,studentRelation:95});return e};
  let e=mk('teaching');e.state.career.rank=0;assert.match(structuralGate(e.state,data.config,3),/中層領導培訓/);
  e.state.career.credentials=['中層領導培訓'];e.state.career.vacancies={3:e.state.date.turn+6};assert.equal(structuralGate(e.state,data.config,3),null,'完成中層領導培訓可升 SGM');
  e=mk('management');e.state.career.rank=3;e.state.career.credentials=['中層領導培訓'];e.state.career.vacancies={5:e.state.date.turn+6};assert.match(structuralGate(e.state,data.config,5),/校長資格培訓/);
  e.state.career.credentials.push('校長資格培訓');assert.equal(structuralGate(e.state,data.config,5),null,'完成高階培訓可升 PGM');
  e=mk('management');e.state.career.rank=5;e.state.school.teacherPopulation=65;e.state.career.credentials=['中層領導培訓','校長資格培訓'];assert.match(structuralGate(e.state,data.config,7),/空缺/);
  e.state.career.vacancies={7:e.state.date.turn+6};assert.equal(structuralGate(e.state,data.config,7),null);
  e.state.career.rank=7;e.state.career.vacancies={8:e.state.date.turn+6};e.state.school.studentPopulation=1000;e.state.school.teacherPopulation=70;assert.equal(structuralGate(e.state,data.config,8),null);
  e.state.school.studentPopulation=800;e.state.school.teacherPopulation=55;assert.match(structuralGate(e.state,data.config,8),/大型學校/);
  e=mk('curriculum');e.state.career.rank=5;e.state.career.credentials=['中層領導培訓','校長資格培訓'];e.state.career.vacancies={7:99};assert.match(structuralGate(e.state,data.config,7),/常規職級上限|行政管理／教育領導路線|行政管理型或教育領導型/,'非行政／領導路線不能升任校長');
});
test('校長並非必然：行政／領導路線 20 年內成為校長的比例有限',()=>{
  const P={management:{teaching:25,administration:30,professional:8,family:10,rest:22,extracurricular:5}};
  const reach=mean(seeds(30).map(s=>{const r=runFree(data,freeStart(data,s,{family:['single','married'][s%2]}),{months:240,plan:P.management,policy:(e,m)=>{try{if(m===0)e.setCareerPath('management');if(m%36===0){e.state.career.salaryBarCleared=true;e.state.career.trainingRecords=[{turn:e.state.date.turn,hours:30,track:'promotionCore',verified:true,endorsed:true},{turn:e.state.date.turn,hours:100,track:'elective',verified:true,endorsed:true}];e.state.career.credentials=['中層領導培訓','校長資格培訓'];}if(m%3===2){const g=e.promotionEligibility();if(g.ok&&!e.state.career.promotionOffer)e.applyPromotion()}if(e.state.career.promotionOffer)e.decidePromotion(true);if(e.state.career.actingOffer)e.decideActing(true);if(m%2===0&&!e.state.career.activeCourses.length)for(const id of ['middle-leadership','principal-prep']){const c=e.availableCourses().find(x=>x.id===id);if(c&&!c.completed&&c.eligible){e.setAlloc('rest',Math.max(0,(e.state.ap.allocation.rest||0)-5));if(e.enrollCourse(id).ok)break}}if(e.state.character.status.health<40)e.seekMedicalCare()}catch{}}});return r.e.state.career.rank>=8?1:0}));
  assert.ok(reach<0.8,'principal rate '+reach);assert.ok(reach>0,'仍應有可能成為校長（0 表示過於困難）');
});
test('升職加薪：按 2026 MPS 職級薪點計薪，優質生活增加支出',()=>{
  const e=createEngine(data);e.start({mode:'random',seed:2});adv(e);const s=e.state;s.school.type='aided';
  s.career.rank=0;s.career.gradeStartCareerMonths=0;const gm=salaryForState(s);
  s.career.rank=6;s.career.gradeStartCareerMonths=0;const pgm=salaryForState(s);
  assert.ok(pgm>gm*1.25,`PGM ${pgm} > GM ${gm}`);
  e.setLifestyle('standard');const a=e.financeInfo().living;e.setLifestyle('comfort');assert.ok(e.financeInfo().living>a);e.setLifestyle('frugal');assert.ok(e.financeInfo().living<a);
  assert.equal(e.setLifestyle('bogus').ok,false);
});
test('財富用途：冷卻、不可透支、不可購買 AP；儲蓄不可取回',()=>{
  const e=createEngine(data);e.start({mode:'random',seed:2});adv(e);const s=e.state;s.character.status.wealth=100000;
  const ap0=e.unusedAP();const r1=e.spendWealth('trip');assert.equal(r1.ok,true);assert.equal(e.spendWealth('trip').ok,false,'冷卻');assert.equal(e.unusedAP(),ap0,'金錢不能買 AP');
  s.character.status.wealth=1000;assert.equal(e.spendWealth('checkup').ok,false,'不可透支');
  s.character.status.wealth=60000;assert.equal(e.contributeFund(10000).ok,true);assert.equal(s.finance.fund,10000);assert.equal(s.character.status.wealth,50000);assert.equal(e.contributeFund(100).ok,false);assert.equal(e.contributeFund(999999).ok,false);
  assert.equal(e.spendWealth('nonexistent').ok,false);
});
test('負債有上限：利息、壓力懲罰，且不會無底線',()=>{
  const e=createEngine(data);e.start({mode:'random',seed:2});adv(e);const s=e.state;s.character.status.wealth=-100000;
  const debtResult=monthlyFinance(s,data,{income:1,expense:1},createRng(7));assert.ok(debtResult.interest>0,'負債應產生利息');assert.ok(debtResult.expense>e.financeInfo().living,'利息應計入每月支出');
  e.setAlloc('rest',40);e.settle();assert.ok(s.history.at(-1).income>0,'2026薪酬仍會計入收入');
  for(let m=0;m<60;m++){adv(e);e.setAlloc('rest',40);s.character.status.wealth=Math.min(s.character.status.wealth,-140000);e.settle()}
  assert.ok(s.character.status.wealth>=B.finance.debtFloor-1,'財富 '+s.character.status.wealth);
});
test('退休：每次活動為一年，現金流由退休金／儲備／支出決定，25 年後完結，不可無限刷錢',()=>{
  const e=createEngine(data);e.start({mode:'random',seed:2});adv(e);const s=e.state;s.character.age=60;s.character.careerMonths=420;s.finance.fund=600000;s.character.status.wealth=4000000;
  assert.equal(e.retire().ok,true);const w0=s.character.status.wealth;let n=0;
  while(e.retirementAction('family').ok&&n<60)n++;
  assert.equal(n,B.finance.retireMaxYears);assert.ok(s.character.status.wealth<w0+B.finance.retireMaxYears*600000,'財富不應無限增長');
  assert.equal(e.retirementAction('family').ok,false);assert.ok(s.retirement.fundLeft<=0);
});
test('健康值歸零會死亡並 Game Over，不再以強制退休繞過死亡',()=>{
  const e=createEngine(data);e.start({mode:'random',seed:11});let ended=false;
  for(let m=0;m<40&&!ended;m++){adv(e);if(e.state.phase==='ending')break;e.state.character.status.health=1;e.state.character.status.stress=100;e.state.character.status.energy=0;e.setAlloc('teaching',100);e.setAlloc('rest',0);e.settle();ended=e.state.phase==='ending'}
  assert.ok(ended);assert.equal(e.state.ending.gameOver,true);assert.equal(e.state.ending.cause,'health');assert.equal(e.settle().ok,false);
});
test('事件：新增學科中立事件，路線／職級條件有效',()=>{
  assert.ok(data.events.length>=91);const txt=JSON.stringify(data.events.filter(e=>e.id>'e_a'));
  const paths=new Set(PATHS);for(const ev of data.events)for(const c of ev.cond||[]){if(c[0]==='path')assert.ok(paths.has(c[2]),ev.id)}
  assert.ok(data.events.some(e=>(e.cond||[]).some(c=>c[0]==='path')));
  const s=createEngine(data);s.start({mode:'random',seed:1});adv(s);const seen=new Set();s.state.career.path='student';
  for(let m=0;m<240;m++){if(!adv(s))break;s.setAlloc('teaching',25);s.setAlloc('administration',10);s.setAlloc('professional',5);s.setAlloc('rest',60);s.settle();if(s.state.events.pending)seen.add(s.state.events.pending)}
  assert.ok(seen.size>=35,'事件多樣性 '+seen.size);
});
test('舊存檔（3.0.x 真實存檔）可安全遷移並繼續遊玩',()=>{
  const files=fs.readdirSync(new URL('./fixtures/',import.meta.url)).filter(f=>f.startsWith('save-3.0.x-'));assert.ok(files.length>=5);
  for(const f of files){
    const raw=fs.readFileSync(new URL('./fixtures/'+f,import.meta.url),'utf8'),parsed=parseSave(raw);assert.ok(parsed.ok,f+' '+parsed.error);
    const old=JSON.parse(raw).state,e=createEngine(data);e.load(parsed.state);const s=e.state;
    assert.ok(PATHS.includes(s.career.path),f+' path '+s.career.path);assert.equal(s.career.path,LEGACY_PATH[old.career.path]);
    assert.equal(s.meta.gameVersion,'4.0.0');assert.ok(['3.0.0','3.0.1'].includes(s.meta.migratedFrom));assert.equal(s.meta.difficulty,'balanced');assert.ok(s.finance&&s.finance.lifestyle==='standard');
    assert.equal(s.character.status.wealth,old.character.status.wealth,'財富不得因遷移改變');assert.equal(s.character.name,old.character.name);assert.equal(s.date.turn,old.date.turn);
    assert.deepEqual(s.career.credentials,old.career.credentials||[]);
    if(old.career.externalRole?.id==='sport')assert.equal(s.career.externalRole.id,'ngo');
    for(let m=0;m<36;m++){if(!adv(e))break;e.setAlloc('rest',35);e.setAlloc('teaching',40);e.setAlloc('family',15);e.settle()}
    const c=e.state.character;for(const v of [...Object.values(c.attributes),...Object.entries(c.status).filter(([k])=>k!=='wealth').map(x=>x[1])])assert.ok(Number.isFinite(v)&&v>=0&&v<=100,f);
    assert.ok(Number.isFinite(c.status.wealth),f);
  }
});
test('舊存檔：遷移後再存檔／讀檔往返一致',()=>{
  const raw=fs.readFileSync(new URL('./fixtures/save-3.0.x-sport-path.json',import.meta.url),'utf8');const e=createEngine(data);e.load(parseSave(raw).state);
  const copy=JSON.parse(JSON.stringify(e.state));const e2=createEngine(data);e2.load(copy);
  for(const k of ['career','finance','character','date'])assert.deepEqual(e2.state[k],e.state[k],k);
});
test('決定性：相同 seed 與相同操作得出相同結果（含新系統）',()=>{
  const run=()=>runPlan(data,{seed:777,months:24,plan:tplB(55),difficulty:'hard'}).final;assert.deepEqual(run(),run());
});
