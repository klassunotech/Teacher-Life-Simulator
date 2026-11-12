import {ATTRS,STATS} from './character.js';
export const KEY='tls:autosave',SAVE_VERSION=2;
const PHASES=['play','event','result','yearEnd','ending'];
export function validateState(s){
  if(!s||typeof s!=='object')return'存檔格式錯誤';
  const c=s.character;if(!c||!c.attributes||!c.status)return'缺少角色資料';
  for(const a of ATTRS){const v=c.attributes[a];if(typeof v!=='number'||!(v>=0&&v<=100))return'屬性無效：'+a}
  for(const k of STATS){const v=c.status[k];if(typeof v!=='number'||!(v>=0&&v<=100))return'狀態無效：'+k}if(c.status.health!==undefined&&(typeof c.status.health!=='number'||c.status.health<0||c.status.health>100))return'健康數值無效'
  if(typeof c.status.wealth!=='number'||!Number.isFinite(c.status.wealth))return'財富無效';
  if(typeof c.name!=='string'||!Number.isInteger(c.age)||!Number.isInteger(c.careerMonths)||!(c.birthMonth>=1&&c.birthMonth<=12))return'角色資料無效';
  const d=s.date;if(!d||!Number.isInteger(d.year)||!(d.month>=1&&d.month<=12)||!Number.isInteger(d.turn)||d.turn<0)return'日期無效';
  if(!s.school||!s.school.name||!s.school.culture||!s.school.type)return'學校資料無效';
  const al=s.ap&&s.ap.allocation;if(!al)return'AP 資料無效';
  let sum=0;for(const v of Object.values(al)){if(!Number.isInteger(v)||v<0)return'AP 分配無效';sum+=v}
  const spent=s.ap.spent??0;if(!Number.isInteger(spent)||spent<0||spent>100)return'已使用 AP 無效';if(sum+spent>100)return'AP 超過上限';
  if(!Array.isArray(s.history)||!s.events||typeof s.events.history!=='object'||!s.meta||typeof s.meta.rngState!=='number')return'紀錄資料無效';
  if(!PHASES.includes(s.phase)||(s.phase==='event'&&!s.events.pending))return'遊戲階段無效';
  return null;
}
export function saveGame(state,storage,key=KEY){
  try{storage.setItem(key,JSON.stringify({saveVersion:SAVE_VERSION,savedAt:Date.now(),state}));return{ok:true}}
  catch(e){return{ok:false,error:String(e)}}
}
export function loadGame(storage,key=KEY){
  let raw;try{raw=storage.getItem(key)}catch(e){return{ok:false,error:'無法讀取存檔'}}
  if(!raw)return{ok:false,error:'沒有存檔'};
  const r=parseSave(raw);return r.ok?r:{ok:false,error:r.error==='存檔 JSON 格式錯誤'?'存檔已損壞':r.error};
}
export const hasValidSave=(storage,key=KEY)=>loadGame(storage,key).ok;
export function parseSave(raw){let o;try{o=JSON.parse(raw)}catch{return{ok:false,error:'存檔 JSON 格式錯誤'}}if(!o||![1,SAVE_VERSION].includes(o.saveVersion))return{ok:false,error:'存檔版本不相容'};const err=validateState(o.state);if(err)return{ok:false,error:err};const state=o.state;state.meta??={};state.meta.saveSchemaVersion=2;return{ok:true,state}}
export function exportSave(state){return JSON.stringify({saveVersion:SAVE_VERSION,savedAt:Date.now(),state},null,2)}
