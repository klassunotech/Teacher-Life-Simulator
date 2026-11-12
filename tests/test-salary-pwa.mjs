import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MPS_2026,payPointForState,salaryForState,EMPLOYMENT_TYPES,promotedPayPoint} from '../js/salary-system.js';
import {createEngine} from '../js/game-engine.js';
import {rankName} from '../js/career-system.js';
import config from '../data/config.json' with {type:'json'};
import schools from '../data/schools.json' with {type:'json'};
import careers from '../data/careers.json' with {type:'json'};
import subjects from '../data/subjects.json' with {type:'json'};
import events from '../data/events.json' with {type:'json'};
const data={config,schools,careers,subjects,events};
const baseState=(rank=0,months=0,qualification='pgde')=>({career:{rank,gradeStartCareerMonths:months,employmentType:'perm'},character:{careerMonths:months,qualification},school:{type:'aided'}});

test('2026 MPS：關鍵薪點與薪酬職級準確',()=>{
  assert.equal(rankName(0,'aided'),'學位教師（GM）');assert.equal(rankName(0,'government'),'學位教師（GM）');assert.equal(rankName(5,'government'),'首席學位教師（PGM）');
  assert.equal(MPS_2026[15],35780);assert.equal(MPS_2026[20],45660);assert.equal(MPS_2026[33],83140);
  assert.equal(MPS_2026[34],83975);assert.equal(MPS_2026[39],99525);assert.equal(MPS_2026[41],108280);
  assert.equal(MPS_2026[40],103810);assert.equal(MPS_2026[44],122045);assert.equal(MPS_2026[45],130255);assert.equal(MPS_2026[49],150070);
});
test('薪點按 GM／SGM／PGM／校長二級／一級職級計算',()=>{
  assert.deepEqual([payPointForState(baseState(0,0)).point,salaryForState(baseState(0,0))],[17,39490]);
  assert.deepEqual([payPointForState(baseState(0,60)).point,salaryForState(baseState(0,60))],[22,50215]);
  assert.equal(payPointForState(baseState(3,60)).point,34);
  assert.equal(payPointForState(baseState(5,108)).point,38);
  assert.equal(payPointForState(baseState(7,180)).point,40);
  assert.equal(payPointForState(baseState(8,240)).point,45);
  assert.equal(payPointForState(baseState(0,180,'untrained')).point,20,'未受訓 GM 薪酬關限');
  assert.equal(promotedPayPoint(39,5),40,'SGM 39 點升 PGM 不可倒退至 38 點');
  assert.equal(promotedPayPoint(41,7),42,'PGM 41 點升校長二級不應減薪');
  assert.equal(promotedPayPoint(44,8),45,'校長二級升一級從 45 點開始');
});
test('年度增薪：考績達標後按 MPS 薪點增加一點',()=>{
  const e=createEngine(data);const school=e.rollSchools(77,{type:'aided'})[0];
  const form={name:'薪點測試',age:22,experienceYears:0,gender:'男',education:'bachelor',qualification:'pgde',subject:subjects[0].id,family:'single',birthMonth:3,employmentType:'perm'};
  assert.equal(e.start({mode:'story',seed:77,form,school}).ok,true);
  const s=e.state;Object.assign(s.character.attributes,{teaching:95,administration:95,communication:90,relationship:90,leadership:95,professional:95,resilience:90,efficiency:90});s.character.status.managementTrust=95;
  for(let m=0;m<12;m++){assert.equal(e.settle().ok,true);while(s.phase!=='play'){if(s.phase==='event')e.choose(0);else e.ack();}}
  assert.equal(s.career.salaryPoint,18);
});
test('直資／私立清楚標示為校本模擬，不冒充 MPS 實際薪酬',()=>{
  const dss=baseState();dss.school.type='dss';assert.equal(salaryForState(dss),Math.round(39490*1.08));
  const priv=baseState();priv.school.type='private';assert.equal(salaryForState(priv),Math.round(39490*.92));
});
test('建立角色可選 Perm／Contract，薪酬按職級計算並保存聘用身份',()=>{
  const e=createEngine(data);const school=e.rollSchools(41,{type:'aided'})[0];
  const form={name:'測試老師',age:28,experienceYears:0,gender:'男',education:'bachelor',qualification:'pgde',subject:subjects[0].id,family:'single',birthMonth:3,employmentType:'contract'};
  assert.equal(e.start({mode:'story',seed:41,form,school}).ok,true);
  assert.equal(e.state.career.employmentType,'contract');assert.equal(e.state.career.contractEndTurn,12);
  assert.equal(e.financeInfo().salary.monthlySalary,39490,'PGDE 受訓 GM 由 MPS 17 起薪');
  const perm=structuredClone(e.state);perm.career.employmentType='perm';assert.equal(salaryForState(perm),salaryForState(e.state),'DCP 與 Perm 使用同一 MPS 薪級參考');
  assert.equal(e.state.character.careerMonths,0);
  assert.equal(EMPLOYMENT_TYPES.perm.short,'Perm');assert.equal(EMPLOYMENT_TYPES.contract.short,'Contract');
});

test('職級晉升只出現五個真實薪級，不會出現 GM 升 GM',async()=>{
  const {nextPromotionRank}=await import('../js/career-system.js');
  assert.deepEqual([nextPromotionRank(0),nextPromotionRank(3),nextPromotionRank(5),nextPromotionRank(7)],[3,5,7,8]);
});

test('PWA：manifest、service worker、離線核心資產及圖示齊備',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
  assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.match(sw,/addAll\(ASSETS\)/);assert.match(sw,/request\.mode === 'navigate'/);
  for(const f of ['../icons/icon-192.png','../icons/icon-512.png','../icons/maskable-512.png','../icons/apple-touch-icon.png'])assert.equal(existsSync(new URL(f,import.meta.url)),true,f);
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/rel="manifest"/);assert.match(html,/apple-touch-icon/);
  const main=readFileSync(new URL('../js/main.js',import.meta.url),'utf8');assert.match(main,/serviceWorker\.register/);
});
