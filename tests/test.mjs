import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {createEngine} from '../js/game-engine.js';import {createUI} from '../js/ui.js';
import {saveGame,loadGame,hasValidSave,validateState,KEY} from '../js/save-system.js';
import {pickEvent,resolveChoice} from '../js/event-engine.js';import {ATTRS,STATS} from '../js/character.js';
import {createRng} from '../js/rng.js';
const R=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const rd=n=>JSON.parse(fs.readFileSync(path.join(R,'data',n+'.json'),'utf8'));
const data=Object.fromEntries(['config','subjects','schools','events','careers'].map(n=>[n,rd(n)]));
const mem=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=v},removeItem:k=>{delete m[k]},m}};
const rows=[];const ok=(c,m)=>{if(!c)throw new Error(m)};
function t(id,desc,exp,fn){let a,st='PASS';try{a=fn()}catch(e){a=String(e.message);st='FAIL'}rows.push({id,desc,exp,a,st})}
const mk=()=>{const store=mem();return{store,e:createEngine(data,{save:s=>saveGame(s,store)})}};
const form={name:'陳大文',age:28,gender:'男',education:'bachelor',qualification:'pgde',subject:'math',family:'single',birthMonth:3};
const inRange=s=>{for(const a of ATTRS)ok(s.character.attributes[a]>=0&&s.character.attributes[a]<=100,'屬性越界 '+a);for(const k of STATS)ok(s.character.status[k]>=0&&s.character.status[k]<=100,'狀態越界 '+k)};
const play=(e,plan,n=12)=>{for(let i=0;i<n;i++){let s=e.state;ok(s.phase==='play','phase '+s.phase);
  for(const[k,v]of Object.entries(plan(i)))e.setAlloc(k,v);ok(e.settle().ok,'settle');inRange(e.state);
  while(e.state.phase!=='play'){if(e.state.phase==='event')ok(e.choose(i%3).ok,'choose');else ok(e.ack().ok,'ack');inRange(e.state)}}};
const bal=()=>({teaching:30,administration:15,extracurricular:10,professional:5,family:10,rest:25,personal:5});

t('T01','新遊戲：隨機模式','合法角色、9月、AP 100',()=>{const{e,store}=mk();ok(e.start({mode:'random',seed:7}).ok,'start');const s=e.state;
  ok(s.date.month===9&&s.ap.total===100&&s.phase==='play','初始值');ok(!validateState(s),'state invalid');ok(hasValidSave(store),'autosave');inRange(s);return`${s.character.name}, ${s.character.age}歲, ${s.school.name}(${s.school.type})`});
t('T02','自由模式：自選月份＋無效表單被拒','起始2月；年齡50被拒',()=>{const{e}=mk();const sc=e.rollSchools(5)[1];
  ok(e.start({mode:'free',form:{...form,age:50},school:sc}).ok===false,'應拒絕');ok(e.state===null,'不應建立狀態');
  ok(e.start({mode:'free',form,school:sc,startMonth:2,seed:5}).ok,'start');ok(e.state.date.month===2,'月份');return'起始月='+e.state.date.month});
t('T03','學校生成：16 間學校、四種類型及宗教欄位完整','16 間學校欄位齊全',()=>{const l=createEngine(data).rollSchools(11);ok(l.length===16,'數量');
  for(const s of l){for(const k of['id','name','type','religion','district','studentPopulation','teacherPopulation','culture','managementStyle','financialCondition','reputation'])ok(s[k]!==undefined,k);
    const r=data.schools.types[s.type];ok(s.studentPopulation>=r.students[0]&&s.studentPopulation<=r.students[1],'人數範圍')}ok(new Set(l.map(s=>s.type)).size===4,'辦學類別');ok(new Set(l.map(s=>s.religion)).size===7,'宗教背景');return l.length+' 間；四種辦學類別；七種宗教背景'});
t('T04','AP 分配上限','總和≤100、不為負、無效行動被拒',()=>{const{e}=mk();e.start({mode:'random',seed:1});e.setAlloc('teaching',80);e.setAlloc('administration',50);
  const al=e.state.ap.allocation;ok(al.administration===20,'應被夾限為20，實際'+al.administration);e.setAlloc('rest',-5);ok(al.rest===0,'負數');
  ok(e.setAlloc('hack',5).ok===false,'無效行動');ok(Object.values(al).reduce((a,b)=>a+b)<=100,'總和');return JSON.stringify(al)});
t('T05','完整學年（12個月）流程','12筆紀錄、日期9月→8月、跨年、年度結算畫面',()=>{const{e}=mk();e.start({mode:'free',form,school:e.rollSchools(3)[0],seed:3});play(e,bal);
  const s=e.state;ok(s.history.length===12,'history');ok(s.date.month===9&&s.date.year===2027&&s.date.turn===12,'日期 '+JSON.stringify(s.date));ok(s.flags.yearShown===12,'年度結算未顯示');return`結束於 ${s.date.year}/${s.date.month}，共觸發 ${s.history.filter(h=>h.event).length} 個事件`});
t('T06','年齡按生日月份、年資按月累計','生日月(3月)年齡+1；年資+12個月',()=>{const{e}=mk();e.start({mode:'free',form,school:e.rollSchools(3)[0],seed:3});const c0=e.state.character.careerMonths;play(e,bal,6);
  const c=e.state.character;ok(c.age===29,'年齡 '+c.age);const h=e.state.history;ok(h.filter(x=>x.birthday).length===1,'生日次數');play(e,bal,6);ok(e.state.character.careerMonths===c0+12,'年資');ok(e.state.character.age===29,'年齡不應再增');return`age ${e.state.character.age}, careerMonths ${e.state.character.careerMonths}`});
t('T07','屬性／狀態極端值夾限','全力教學12個月仍在0–100',()=>{const{e}=mk();e.start({mode:'free',form,school:e.rollSchools(3)[0],seed:9});play(e,()=>({teaching:100}));const s=e.state;inRange(s);return`stress=${s.character.status.stress} energy=${s.character.status.energy}`});
t('T08','壓力計算','全教學壓力升；全休息壓力降',()=>{const r=p=>{const{e}=mk();e.start({mode:'free',form,school:e.rollSchools(3)[0],seed:4});e.setAlloc(p,100);e.settle();return e.state.history[0].deltas.stress};
  const a=r('teaching'),b=r('rest');ok(a>0&&b<0,`teaching ${a} rest ${b}`);return`teaching ${a}, rest ${b}`});
t('T09','事件資料','≥10個事件、每個≥2選項、兩種結果下都不越界',()=>{ok(data.events.length>=10,'數量');let n=0;
  for(const ev of data.events){ok(ev.choices.length>=2,ev.id);for(const ch of ev.choices)for(const r of[0,0.999]){const{e}=mk();e.start({mode:'random',seed:2});const s=e.state;s.character.status.stress=95;s.character.status.wealth=0;
    resolveChoice(s,ev,ev.choices.indexOf(ch),{next:()=>r});inRange(s);n++}}return`${data.events.length} 個事件，${n} 次結算測試`});
t('T10','事件觸發','scheduled(進入9月)、conditional(壓力≥75)皆能觸發',()=>{const{e}=mk();e.start({mode:'free',form,school:e.rollSchools(3)[0],startMonth:8,seed:6});e.setAlloc('rest',100);e.settle();
  const s9=JSON.parse(JSON.stringify(e.state));s9.events.history={};let rn=0;const seq=[0.9,0.1];const p9=pickEvent(s9,data.events,{next:()=>seq[rn++]??0.9,pick:a=>a[0]});// 3.1.0：事件按機率輪替，故以固定亂數選走「排程」分支驗證 9 月排程事件
  ok(s9.date.month===9&&p9&&p9.id==='e_open','scheduled: '+(p9&&p9.id));
  const s=JSON.parse(JSON.stringify(e.state));s.date.month=5;s.date.turn=5;s.events.history={};s.character.status.stress=80;const p=pickEvent(s,data.events.filter(e=>e.type!=='scheduled'),{next:()=>0,pick:a=>a[0]});ok(p&&p.id==='e_burnout','conditional: '+(p&&p.id));
  s.events.history={e_burnout:{count:1,last:4}};const q=pickEvent(s,data.events.filter(e=>e.type!=='scheduled'),{next:()=>0.99,pick:a=>a[0]});ok(!q||q.id!=='e_burnout','冷卻失效');return'e_open / e_burnout / 冷卻 OK'});
t('T11','確定性（固定 seed）','相同 seed＋相同操作 → 相同紀錄',()=>{const run=()=>{const{e}=mk();e.start({mode:'free',form,school:e.rollSchools(8)[2],seed:8});play(e,bal);return JSON.stringify(e.state.history)};ok(run()===run(),'結果不同');return'兩次完全一致'});
t('T12','自動存檔與繼續','結算後存檔可載入且等於當前狀態',()=>{const{e,store}=mk();e.start({mode:'random',seed:12});e.setAlloc('teaching',50);e.settle();const r=loadGame(store);ok(r.ok,r.error);
  ok(JSON.stringify(r.state)===JSON.stringify(e.state),'不一致');const e2=createEngine(data);e2.load(r.state);while(e2.state.phase!=='play'){e2.state.phase==='event'?e2.choose(0):e2.ack()}return'載入一致，可繼續'});
t('T13','損壞／不相容存檔','損壞JSON、錯版本、屬性越界皆被拒，不崩潰',()=>{const{e,store}=mk();e.start({mode:'random',seed:1});const good=store.m[KEY];
  store.m[KEY]='{bad';ok(!loadGame(store).ok,'壞JSON');store.m[KEY]=JSON.stringify({saveVersion:99,state:{}});ok(!loadGame(store).ok,'版本');
  const o=JSON.parse(good);o.state.character.attributes.teaching=150;store.m[KEY]=JSON.stringify(o);ok(!loadGame(store).ok,'越界');ok(!hasValidSave(store),'hasValid');store.m[KEY]=good;ok(hasValidSave(store),'還原');return'4 種情況皆正確處理'});
t('T14','UI 流程（無 DOM，模擬操作＋檢查輸出 HTML）','自由／隨機模式可進入遊戲並完成一個學年',()=>{
  for(const path of['random','free']){const store=mem(),e=createEngine(data,{save:s=>saveGame(s,store)}),root={innerHTML:'',addEventListener(){}},u=createUI(root,e,store,{seed:21});u.render();
    ok(root.innerHTML.includes('disabled'),'無存檔時繼續應停用');u.act('new');u.act(path);
    if(path==='free'){u.ui.form.name='測試';u.act('toschool');ok(root.innerHTML.includes('在此任教'),'學校列表');u.act('pick',{i:'1'})}
    ok(root.innerHTML.includes('總覽')||root.innerHTML.includes('狀態'),'dashboard');
    for(let i=0;i<12;i++){u.act('tab',{tab:'actions'});for(const[k,v]of[['teaching',30],['rest',30],['administration',20],['family',10]]){for(let j=0;j<v/10;j++)u.act('ap',{k,d:'10'})}ok(root.innerHTML.includes('結算本月'),'actions');u.act('settle');
      while(e.state.phase!=='play'){if(e.state.phase==='event'){ok(root.innerHTML.includes('data-act="choose"'),'event screen');u.act('choose',{i:'0'})}else if(e.state.phase==='result')u.act('ack');else{ok(root.innerHTML.includes('學年完結'),'year screen');u.act('ack')}}}
    ok(e.state.date.turn===12,'turn');u.act('title');ok(!root.innerHTML.includes('data-act="continue" disabled'),'應可繼續');u.act('continue');ok(root.innerHTML.includes('總覽')||root.innerHTML.includes('狀態'),'continue');}
  return'隨機／自由模式各完整跑 12 個月，繼續遊戲正常'});
for(const[id,d,x]of[['T15','桌面版版面（≥721px）','側邊欄＋主內容'],['T16','手機版版面（≤720px）','單欄、底部導航、無橫向捲動'],['T17','真實瀏覽器 localStorage／重新整理後繼續','可繼續']])rows.push({id,desc:d,exp:x,a:'未執行（沙盒無瀏覽器，需人手測試）',st:'NOT RUN'});
const md='# Teacher Life Simulator 3.4.2 Core Regression Report\n\n以 `node tests/test.mjs` 實際執行產生。\n\n| ID | 測試 | 預期 | 實際 | 狀態 |\n|---|---|---|---|---|\n'+rows.map(r=>`| ${r.id} | ${r.desc} | ${r.exp} | ${r.a.replace(/\|/g,'/')} | ${r.st} |`).join('\n')+'\n';
fs.writeFileSync(path.join(R,'tools','out','test-core-report-340.md'),md);console.log(md);process.exit(rows.some(r=>r.st==='FAIL')?1:0);
