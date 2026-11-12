export const ATTRS=['teaching','administration','communication','relationship','leadership','professional','resilience','efficiency'];
export const STATS=['stress','energy','satisfaction','familyRelation','managementTrust','studentRelation'];
export const clamp=(v,a=0,b=100)=>Math.min(b,Math.max(a,v));
export const byId=(arr,id)=>arr.find(x=>x.id===id);
const r2=x=>Math.round(x*100)/100;
export const getV=(c,k)=>k in c.attributes?c.attributes[k]:c.status[k];
// 唯一修改數值的入口：自動夾限 0–100（財富除外）
export function addV(c,k,d){
  if(k in c.attributes)c.attributes[k]=r2(clamp(c.attributes[k]+d));
  else if(k==='wealth')c.status.wealth=Math.round(c.status.wealth+d);
  else if(k in c.status)c.status[k]=r2(clamp(c.status[k]+d));
  else throw new Error('未知數值 '+k);
}
export function validateForm(f,d){
  if(!f||typeof f.name!=='string'||!f.name.trim()||f.name.trim().length>12)return'請輸入姓名（1–12 字）';
  if(!Number.isInteger(f.age)||f.age<22||f.age>40)return'年齡必須為 22–40 歲';
  if(!d.careers.genders.includes(f.gender))return'請選擇性別';
  if(!byId(d.careers.education,f.education)||!byId(d.careers.qualification,f.qualification)||!byId(d.careers.family,f.family)||!byId(d.subjects,f.subject))return'選項無效';
  if(!Number.isInteger(f.birthMonth)||f.birthMonth<1||f.birthMonth>12)return'生日月份無效';
  if(f.experienceYears!==undefined&&(!Number.isInteger(f.experienceYears)||f.experienceYears<0||f.experienceYears>Math.min(f.age-22,15)))return'認可教學年資必須介乎 0 至年齡相符的 15 年內';
  return null;
}
export function createCharacter(f,d,rng){
  const attributes={};ATTRS.forEach(a=>attributes[a]=40+rng.int(-4,4));
  const exp=f.experienceYears===undefined?Math.max(0,Math.min(f.age-23,15)):Math.max(0,Math.min(f.age-22,15,f.experienceYears));
  attributes.teaching+=exp*0.8;attributes.administration+=exp*0.5;attributes.resilience+=exp*0.5;
  const fam=byId(d.careers.family,f.family);
  for(const m of [byId(d.careers.education,f.education).mods,byId(d.careers.qualification,f.qualification).mods,fam.mods,byId(d.subjects,f.subject).mods])
    for(const[k,v]of Object.entries(m))attributes[k]+=v;
  ATTRS.forEach(a=>attributes[a]=r2(clamp(attributes[a])));
  return{name:f.name.trim(),age:f.age,birthMonth:f.birthMonth,gender:f.gender,education:f.education,qualification:f.qualification,subject:f.subject,familyStatus:f.family,careerMonths:exp*12,attributes,
    status:{stress:30,energy:80,satisfaction:60,wealth:80000+exp*30000,familyRelation:fam.famRel,managementTrust:50,studentRelation:50}};
}
const SUR=['陳','李','黃','張','梁','林','何','鄭','吳','周'],GIV=['嘉欣','子謙','詠怡','俊傑','曉彤','家豪','美玲','志明','雅婷','栢賢'];
export function randomForm(d,rng){
  const age=rng.int(22,40);
  return{name:rng.pick(SUR)+rng.pick(GIV),age,gender:rng.pick(d.careers.genders),education:rng.pick(d.careers.education).id,
    qualification:rng.pick(d.careers.qualification).id,subject:rng.pick(d.subjects).id,family:rng.pick(d.careers.family).id,birthMonth:rng.int(1,12),experienceYears:Math.max(0,Math.min(age-23,15))};
}
