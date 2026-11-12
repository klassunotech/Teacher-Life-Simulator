import {addV} from './character.js';
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export const difficultyOf=(state,cfg)=>cfg.balance.difficulty[state?.meta?.difficulty]||cfg.balance.difficulty.balanced;
export function validateAlloc(a,cfg){
  let sum=0;
  for(const k of Object.keys(cfg.actions)){const v=a&&a[k];if(!Number.isInteger(v)||v<0)return`行動「${k}」的 AP 無效`;sum+=v}
  return sum>cfg.ap?`AP 超過上限 ${cfg.ap}`:null;
}
// 月結算：只修改 state.character，回傳變化量。
// 模型（參數全部在 config.balance）：
//  工作 AP 越多，每點 AP 的疲勞成本越高（fatigue）；精力靠基礎睡眠＋休息 AP 回復，越接近滿值回復越少；
//  壓力＝（行動＋學校文化）流入 − 按壓力水平遞減的紓壓 − 自然衰減；技能越高成長越慢、長期不投入會荒廢。
export function settleMonth(state,data,rng,mods={}){
  const cfg=data.config,B=cfg.balance,D=difficultyOf(state,cfg),c=state.character,a=state.ap.allocation,s=state.school;
  const before={...c.attributes,...c.status};
  const sb=state.ap.spentBy||{},ea=k=>(a[k]||0)+(sb[k]||0);// 已即時使用的 AP 亦計入本月投入
  const baseWork=B.workCategories.reduce((t,k)=>t+ea(k),0);const rank=state.career?.rank||0;const roleLoad=rank>=7?1.25:rank>=5?1.16:rank>=3?1.09:1;const work=baseWork*roleLoad;
  const S0=c.status.stress,E0=c.status.energy;
  const fatigue=1+Math.max(0,work-B.fatigue.startAP)/B.fatigue.perAP;
  const perf=clamp(1-Math.max(0,S0-B.perf.stressFrom)/B.perf.stressDiv-Math.max(0,B.perf.energyBelow-E0)/B.perf.energyDiv,B.perf.min,1);
  const mult=(0.7+c.attributes.efficiency/200)*perf;
  const growth=mods.growth||{},extra=mods.extra||{};
  let eCost=0,eGain=B.energy.base*D.rest,sIn=0,sOut=0;
  for(const[k,ap]of Object.entries(a)){
    if(!ap)continue;
    const gm=growth[k]||1,sm=(mods.stress&&mods.stress[k])||1,em=(mods.energy&&mods.energy[k])||1;
    for(const[key,per]of Object.entries(cfg.actions[k].fx)){
      const raw=per*(key==='wealth'?Math.min(ap,B.finance.sideIncomeCapAP):ap);
      if(key==='energy'){if(raw<0)eCost+=raw*em;else eGain+=raw*D.rest;}
      else if(key==='stress'){if(raw>0)sIn+=raw*sm;else sOut+=-raw*D.rest;}
      else{
        let d=raw;
        if(d>0){d*=mult*gm*((mods.attr&&mods.attr[key])||1);if(key!=='wealth'){d*=B.skill.growthMult;const v=c.attributes[key]??c.status[key];d*=Math.max(0.15,(1-v/B.skill.softCap)/(1-50/B.skill.softCap))}}
        addV(c,key,d);
      }
    }
  }
  const style=data.schools.styles.find(x=>x.id===s.managementStyle)||{stress:0};
  const culture=(s.culture.workload-50)/10+style.stress+(rng.next()-0.5)*2;
  const inflow=(sIn*fatigue+culture+(extra.stress||0))*D.stress*(1-c.attributes.resilience/B.stress.resist);
  addV(c,'energy',eCost*fatigue*D.energy);
  addV(c,'energy',eGain*Math.max(0,1-c.status.energy/B.energy.restCap)+(extra.energy||0));
  addV(c,'stress',inflow);
  addV(c,'stress',-sOut*clamp(c.status.stress/B.stress.reliefScale,B.stress.reliefFloor,1));
  addV(c,'stress',-c.status.stress*B.stress.decay);
  if(ea('teaching')<20){addV(c,'studentRelation',-2);addV(c,'teaching',-0.5)}
  if(ea('administration')<10)addV(c,'managementTrust',-1.5);
  if(ea('family')<10)addV(c,'familyRelation',-1.5);
  // 技能荒廢：長期不投入對應工作，能力緩慢下降
  for(const[k,need]of Object.entries(B.skill.maintainAP)){const ap=ea(k);if(ap<need)addV(c,k,-B.skill.decayPerMonth*(1-ap/need))}
  for(const[k,e]of Object.entries(B.skill.erosion))addV(c,k,-e*(c.attributes[k]??c.status[k]));// 水平越高荒廢越快：沒有人能長期全部維持滿分
  if(c.status.energy<20){addV(c,'stress',3*D.stress);addV(c,'satisfaction',-2)}
  {const S=B.satisfaction,target=clamp(S.base-c.status.stress*S.stressWeight,0,100);addV(c,'satisfaction',(target-c.status.satisfaction)*S.rate);}// 滿意度向「由壓力決定的目標水平」漂移，生活安排的加成再疊加其上
  for(const[k,v]of Object.entries(mods.effects||{}))addV(c,k,v);
  const fin=mods.finance?mods.finance(state,data,D,rng):{income:0,expense:0,contribution:0,effects:{}};
  for(const[k,v]of Object.entries(fin.effects||{}))addV(c,k,v);
  addV(c,'wealth',fin.income-fin.expense-(fin.contribution||0));
  if(c.status.wealth<B.finance.debtFloor){c.status.wealth=B.finance.debtFloor;addV(c,'stress',4);addV(c,'satisfaction',-2);}// 負債上限：超出部分轉為額外壓力
  const after={...c.attributes,...c.status},deltas={};
  for(const k in after){const d=Math.round((after[k]-before[k])*100)/100;if(d)deltas[k]=d}
  return{deltas,income:fin.income,expense:fin.expense,contribution:fin.contribution||0,breakdown:fin.breakdown||null,work,fatigue};
}
export function sumDeltas(h,n=12){
  const o={};for(const e of h.slice(-n))for(const[k,v]of Object.entries(e.deltas))o[k]=Math.round(((o[k]||0)+v)*100)/100;return o;
}
