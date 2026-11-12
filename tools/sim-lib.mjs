// 平衡模擬共用函式庫：使用真實遊戲引擎（無 DOM），供 tools/*.mjs 及 tests 使用。
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
const names=['config','subjects','schools','events','careers'];
export const loadData=()=>{const d=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url),'utf8'))]));
  try{d.balance=JSON.parse(fs.readFileSync(new URL('../data/balance.json',import.meta.url),'utf8'))}catch{}return d};
export const adv=(e,pick=0)=>{let g=0;while(e.state.phase!=='play'&&g++<8){if(e.state.phase==='event'){const ev=e.currentEvent?e.currentEvent():null;e.choose(typeof pick==='function'?pick(e):pick)}else if(e.state.phase==='ending')return false;else e.ack()}return e.state.phase==='play'};
export const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
export const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*s.length))]};
export const snapshot=e=>{const c=e.state.character,s=c.status,a=c.attributes;return{stress:s.stress,energy:s.energy,health:s.health,wealth:s.wealth,satisfaction:s.satisfaction,family:s.familyRelation,mgmt:s.managementTrust,student:s.studentRelation,teaching:a.teaching,administration:a.administration,professional:a.professional,leadership:a.leadership,rank:e.state.career.rank}};
// 用指定 AP 配置跑 months 個月；plan 可為物件或 (engine,month)=>物件
export function runPlan(data,{seed,months=12,plan,difficulty,mode='random',eventPick=0,policy,form}={}){
  const e=createEngine(data,{});const o={mode,seed};if(difficulty)o.difficulty=difficulty;if(form)Object.assign(o,form);e.start(o);
  const series=[];let illMonths=0;
  for(let m=0;m<months;m++){
    if(!adv(e,eventPick))break;
    const p=typeof plan==='function'?plan(e,m):plan;
    for(const k of Object.keys(data.config.actions))e.setAlloc(k,0);
    for(const [k,v] of Object.entries(p||{}))e.setAlloc(k,v);
    if(policy)policy(e,m);
    e.settle();series.push(snapshot(e));if(e.state.health?.illness)illMonths++;
  }
  adv(e,eventPick);
  return{e,series,final:series[series.length-1]||snapshot(e),illMonths};
}
// 崩盤定義：壓力≥90 且精力≤15，或健康≤25
export const collapsed=f=>f&&((f.stress>=90&&f.energy<=15)||f.health<=25);

// 建立「自由模式」開局參數（固定家庭／學科／學校類型），供受控模擬使用
export function freeStart(data,seed,{family='single',subject='chi',schoolType='aided',age=28,education='bachelor',qualification='pgde',difficulty,rank,path}={}){
  const e=createEngine(data,{});
  const schools=e.rollSchools(seed,{type:schoolType,religion:'all'});
  const o={mode:'free',seed,form:{name:'模擬',age,gender:'其他',education,qualification,subject,family,birthMonth:3},school:schools[0]};
  if(difficulty)o.difficulty=difficulty;if(rank!==undefined)o.initialRank=rank;
  return o;
}
// 常用政策：每 6 個月申請升職、接受邀請；健康低時就醫
export const autoCareer=(e,m)=>{
  try{if(m%6===5&&e.state.phase==='play')e.applyPromotion();if(e.state.career.promotionOffer)e.decidePromotion(true);
    if(e.state.career.actingOffer)e.decideActing(true);
    if(e.state.character.status.health<40&&e.state.character.status.wealth>3000)e.seekMedicalCare();}catch{}
};
export function runFree(data,startOpts,{months=240,plan,eventPick=0,policy=autoCareer}={}){
  const e=createEngine(data,{});const r=e.start(startOpts);if(r&&r.ok===false)throw new Error(r.error);
  const series=[];
  for(let m=0;m<months;m++){
    if(!adv(e,eventPick))break;
    const p=typeof plan==='function'?plan(e,m):plan;
    for(const k of Object.keys(data.config.actions))e.setAlloc(k,0);
    for(const [k,v] of Object.entries(p||{}))e.setAlloc(k,v);
    if(policy)policy(e,m);
    e.settle();series.push(snapshot(e));
  }
  adv(e,eventPick);return{e,series,final:series[series.length-1]||snapshot(e),ended:e.state.phase==='ending'};
}
