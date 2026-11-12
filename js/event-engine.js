import {getV,addV} from './character.js';
const OPS={'>=':(a,b)=>a>=b,'<=':(a,b)=>a<=b,'>':(a,b)=>a>b,'<':(a,b)=>a<b,'==':(a,b)=>a===b};
export const checkCond=(state,conds=[])=>conds.every(([k,op,v])=>OPS[op](k==='month'?state.date.month:k==='path'?state.career.path:k==='rank'?state.career.rank:getV(state.character,k),v));
// 每月最多一個事件：conditional(50%) → scheduled(55%) → random(80%)；若全部未觸發，保底 scheduled 或 random。
// 校外職涯期間不觸發學校年曆事件。
export function pickEvent(state,events,rng){
  const ok=e=>{const h=state.events.history[e.id];
    if(h){if(e.max&&h.count>=e.max)return false;if(state.date.turn-h.last<e.cd)return false}
    if(state.career?.externalRole&&e.type==='scheduled')return false;
    return checkCond(state,e.cond)};
  const pool=events.filter(ok),of=t=>pool.filter(e=>e.type===t);
  const sch=of('scheduled'),con=of('conditional'),rnd=of('random');
  if(con.length&&rng.next()<0.5)return rng.pick(con);
  if(sch.length&&rng.next()<0.55)return sch[0];
  if(rnd.length&&rng.next()<0.8)return rng.pick(rnd);
  if(sch.length)return sch[0];
  return rnd.length?rng.pick(rnd):null;
}
// severity：難度對「不利變化」（壓力上升、精力／健康／滿意度／財富下降）的倍率
const ADVERSE=(k,v)=>(k==='stress'&&v>0)||(['energy','health','satisfaction','wealth'].includes(k)&&v<0);
export function resolveChoice(state,ev,i,rng,severity=1){
  const ch=ev.choices[i];if(!ch)return null;
  const win=ch.p===undefined||rng.next()<ch.p;
  const fx=win?ch.fx:ch.fx2,text=win?ch.r:ch.r2;
  for(const[k,v]of Object.entries(fx))addV(state.character,k,ADVERSE(k,v)?Math.round(v*severity*100)/100:v);
  return{text,fx};
}
