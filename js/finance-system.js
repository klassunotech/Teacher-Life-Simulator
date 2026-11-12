// 財務系統：官立／資助中學按 2026 MPS 薪點計薪；生活開支及退休儲備仍屬遊戲模擬。
import {salaryForState, salaryInfoForState} from './salary-system.js';
export const initFinance=()=>({lifestyle:'standard',fund:0,cooldowns:{},lastNet:0});
const yrs=state=>Math.min(Math.floor(state.character.careerMonths/12),20);
const familyBase=(state,data)=>data.careers.family.find(f=>f.id===state.character.familyStatus).expense;
export const livingExpense=(state,data,D={expense:1})=>{const F=data.config.balance.finance,L=F.lifestyle[state.finance?.lifestyle]||F.lifestyle.standard;return Math.round(familyBase(state,data)*F.expenseScale*(1+yrs(state)*F.inflation)*L.expense*D.expense)};
// 月收支。會更新 state.finance（退休儲備增長及供款）。回傳 income／expense／contribution／interest／effects
export function monthlyFinance(state,data,D,rng){
  const F=data.config.balance.finance,c=state.character,s=state.school;
  state.finance??=initFinance();
  const external=state.career?.externalRole,y=yrs(state);
  let gross;
  if(external){
    if(external.id==='startup'){const base=Math.max(12000,Math.round(18000+c.attributes.professional*220+c.attributes.efficiency*120));gross=base*(0.55+0.9*rng.next());}
    else gross=external.baseIncome*(1+Math.min(y,10)*F.externalGrowth);
  }else gross=salaryForState(state);
  const partner=Math.round((data.careers.family.find(x=>x.id===c.familyStatus)?.partner||0)*(1+y*F.seniority));// 伴侶收入（模擬值）
  // 教師薪級按官方 MPS 計算，不因遊戲難度倍率而改變；校外職涯收入仍受難度影響。
  const income=(external?Math.round(gross*D.income):Math.round(gross))+partner;
  const interest=c.status.wealth<0?Math.round(-c.status.wealth*F.debtInterest):0;
  const tuition=external?0:(data.config.balance.paths?.[state.career.path]?.expense||0);
  const expense=livingExpense(state,data,D)+interest+tuition;
  const contribution=Math.round(Math.min(F.contribCap,income*F.contribRate));
  state.finance.fund=Math.min(F.fundCap,Math.round(state.finance.fund*(1+F.fundGrowth)+contribution));
  const L=F.lifestyle[state.finance.lifestyle]||F.lifestyle.standard;
  const effects={...L.fx};
  if(c.status.wealth<0){effects.stress=(effects.stress||0)+F.debtStress;effects.satisfaction=(effects.satisfaction||0)-0.4;}
  state.finance.lastNet=income-expense-contribution;
  return{income,expense,contribution,interest,effects,breakdown:{salary:external?0:Math.round(gross),otherIncome:external?Math.round(gross*D.income):0,partner,living:livingExpense(state,data,D),interest,tuition}};
}
// 退休金（模擬值）：職級＋服務年資；提早退休（<60 歲且年資 <35 年）按比例扣減
export function pensionMonthly(state,data){
  const c=state.character,P=data.config.balance.finance.pension,years=Math.floor(c.careerMonths/12);
  let p=P.base+state.career.rank*P.perRank+Math.max(0,years-20)*P.perYearOver20;
  if(c.age<60&&c.careerMonths<420)p*=P.early;
  return Math.round(p);
}
export {salaryInfoForState};
export const retirementExpense=(state,data)=>Math.round(livingExpense(state,data)*data.config.balance.finance.retireExpense*12);
// 退休後伴侶的退休收入（模擬值）：按在職時伴侶收入的比例
export const partnerRetireIncome=(state,data)=>{const F=data.config.balance.finance,y=Math.min(Math.floor(state.character.careerMonths/12),20);return Math.round((data.careers.family.find(x=>x.id===state.character.familyStatus)?.partner||0)*(1+y*F.seniority)*F.partnerRetire*12)};
