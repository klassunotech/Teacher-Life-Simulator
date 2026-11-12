const range=(r,rng)=>rng.int(r[0],r[1]);
const SCHOOL_TYPES=['government','aided','dss','private'];
const RELIGIONS=['catholic','protestant','buddhist','taoist','confucian','islamic','none'];
export function generateSchool(type,d,rng,religion){
  const t=d.schools.types[type],s=d.schools,district=rng.pick(s.districts),culture={};
  for(const[k,r]of Object.entries(t.culture))culture[k]=range(r,rng);
  religion=religion||rng.pick(RELIGIONS);
  const rel=s.religions[religion]||s.religions.none;
  let base;
  if(type==='government') base=`${district}官立`;
  else if(religion==='none') base=rng.pick(s.prefix);
  else base=rng.pick(rel.prefix);
  const name=`${base}${rng.pick(s.suffix)}`;
  return{id:'sch_'+rng.int(1000,9999),name,type,religion,level:'secondary',district,studentPopulation:range(t.students,rng),teacherPopulation:range(t.teachers,rng),
    culture,managementStyle:rng.pick(s.styles).id,financialCondition:range(t.finance,rng),reputation:range(t.reputation,rng)};
}
const shuffle=(arr,rng)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=rng.int(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
// 官立學校一律沒有宗教背景（religion='none'）。
// 無篩選：16 間（每類 4 間），保證七種宗教各至少出現一次；有篩選：只抽符合條件的組合。
export const rollSchoolOptions=(d,rng,filter={})=>{
  const ft=filter&&filter.type&&filter.type!=='all'?filter.type:null,fr=filter&&filter.religion&&filter.religion!=='all'?filter.religion:null;
  let picks=[];
  if(ft||fr){
    const combos=[];
    for(const t of (ft?[ft]:SCHOOL_TYPES))for(const r of (t==='government'?['none']:RELIGIONS))if(!fr||fr===r)combos.push([t,r]);
    if(!combos.length)return[];
    const order=shuffle(combos,rng);
    for(let i=0;i<16;i++)picks.push(order[i%order.length]);
  }else{
    const relPool=shuffle([...shuffle(RELIGIONS,rng),...Array.from({length:5},()=>rng.pick(RELIGIONS))],rng);
    let ri=0;
    for(let i=0;i<16;i++){const type=SCHOOL_TYPES[i%SCHOOL_TYPES.length];picks.push([type,type==='government'?'none':relPool[ri++]])}
  }
  const list=picks.map(([t,r])=>generateSchool(t,d,rng,r)),seen=new Set();
  for(const sc of list){while(seen.has(sc.id))sc.id='sch_'+rng.int(1000,9999);seen.add(sc.id)}
  return list;
};
