// Seeded PRNG (mulberry32)。所有遊戲隨機必須經此模組。
export function createRng(seed){
  let s=seed>>>0;
  const next=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
  return{next,int:(a,b)=>a+Math.floor(next()*(b-a+1)),pick:arr=>arr[Math.floor(next()*arr.length)],get state(){return s}};
}
