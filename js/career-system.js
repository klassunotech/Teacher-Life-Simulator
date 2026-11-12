// 職涯規則集中管理；不依賴 DOM，方便長期模擬及測試。
export const RANKS=['學位教師（GM）','學位教師（GM）','學位教師（GM）','高級學位教師（SGM）','高級學位教師（SGM）','首席學位教師（PGM）','首席學位教師（PGM）','校長（二級）','校長（一級）'];
export const NEXT_PROMOTION_RANK={0:3,1:3,2:3,3:5,4:5,5:7,6:7,7:8};
export const nextPromotionRank=rank=>NEXT_PROMOTION_RANK[rank]??RANKS.length;
export function rankName(rank){return RANKS[rank]||'已達最高職級'}
export const PATHS=['teaching','management','student','curriculum','study','innovation','leadership','balanced'];
export const PATH_NAMES={teaching:'教學專業型',management:'行政管理型',student:'學生發展型',curriculum:'課程發展型',study:'專業進修型',innovation:'教育創新型',leadership:'教育領導型',balanced:'平衡生活型'};
// 舊版（3.0.x）路線 → 新路線（遷移用；不刪除任何舊存檔資料）
export const LEGACY_PATH={teaching:'teaching',management:'management',sport:'student',edtech:'innovation',balanced:'balanced',educationExpert:'study',referee:'curriculum',entrepreneur:'innovation'};
export const migratePath=p=>PATHS.includes(p)?p:(LEGACY_PATH[p]||'balanced');
const DEFAULT_W={teaching:.22,administration:.16,leadership:.18,professional:.14,communication:.08,managementTrust:.12,satisfaction:.05,resilience:.05};
export function careerScore(c,w=DEFAULT_W){let t=0;for(const[k,v]of Object.entries(w))t+=(c.attributes[k]??c.status[k]??0)*v;return t}
const no=reason=>({ok:false,reason});
// 結構性門檻（職級上限、證書、行政／領導路線、職位空缺）：升職申請、署任邀請及接受升職時共用。通過回傳 null。
export function structuralGate(state,cfg,next){
  const {character:c,career}=state,B=cfg?.balance,P=B?.paths?.[career.path],G=B?.rankGate,creds=career.credentials||[];
  if(!G)return null;
  const cap=P?.cap??8;
  if(next>cap&&(next>cap+1||c.attributes.leadership<G.beyondCapLeadership||!creds.includes(G.midCredential)))return`「${PATH_NAMES[career.path]}」的常規職級上限為「${rankName(cap,state.school?.type)}」；之後最多再晉升一級（需領導力 ≥ ${G.beyondCapLeadership} 並完成「${G.midCredential}」），更高職位需轉往行政管理／教育領導路線`;
  if(next>=3&&c.qualification==='untrained'&&!career.salaryBarCleared)return'未受訓教師須先取得認可教師訓練資格（例如 PGDE／PCEd 或 BEd），完成資格訓練後才可競逐 SGM 或以上職級';
  if(next>=G.midFromRank&&!creds.includes(G.midCredential))return`升任「${rankName(next,state.school?.type)}」需要先完成「${G.midCredential}」`;
  // 資助中學晉升培訓：晉升核心 30 小時；SGM 選修 60 小時，PGM 選修 100 小時，須在晉升前五年內完成並獲校方認可。
  if(state.school?.type==='aided'&&next>=3&&next<=6){const records=(career.trainingRecords||[]).filter(x=>x.verified!==false&&x.endorsed===true&&x.turn>=state.date.turn-60);const core=records.filter(x=>x.track==='promotionCore').reduce((n,x)=>n+(x.hours||0),0);const elective=records.filter(x=>x.track==='elective').reduce((n,x)=>n+(x.hours||0),0);if(core<30)return`晉升培訓未達標：近五年認可核心培訓需 30 小時（目前 ${core} 小時）`;const required=next>=5?100:60;if(elective<required)return`晉升培訓未達標：${rankName(next)}需近五年認可選修培訓 ${required} 小時（目前 ${elective} 小時）`;}

  if(next>=G.pgmFromRank&&!creds.includes(G.pgmCredential))return`升任「${rankName(next,state.school?.type)}」需要先完成「${G.pgmCredential}」`;
  if(next>=3&&!((career.vacancies||{})[next]>state.date.turn))return `目前沒有「${rankName(next)}」空缺（校內編制及年度招聘競爭決定空缺）`;
  if(next>=5&&(state.school?.teacherPopulation||0)<35)return'學校教師編制不足，未能設立首席學位教師（PGM）職位';
  if(next>=7&&(state.school?.teacherPopulation||0)<50)return'學校規模未達校長（二級）職位編制要求';
  if(next>=8&&((state.school?.studentPopulation||0)<950||(state.school?.teacherPopulation||0)<65))return'校長（一級）職位按大型學校編制模擬；請先轉往較大規模的中學再競逐相關空缺';
  if(next>=G.topFromRank&&!G.topPaths.includes(career.path))return`升任「${rankName(next,state.school?.type)}」需要行政管理型或教育領導型路線（目前：${PATH_NAMES[career.path]}）`;
  if(next>=G.topFromRank&&!((career.vacancies||{})[next]>state.date.turn))return`目前沒有「${rankName(next,state.school?.type)}」空缺（此類職位空缺每年隨機出現，約維持 ${G.vacancyMonths} 個月）`;
  return null;
}
export function promotionEligibility(state,cfg){
  const {character:c,career}=state,next=nextPromotionRank(career.rank);
  if(next>=RANKS.length)return no('已達最高職級');
  if(career.employmentType!=='perm')return no('合約教師須先爭取常額 Perm 職位，取得常額身份後才可申請職級晉升');
  if(career.unemployed)return no('目前未獲續約，請先尋找新學校重新受聘');
  const B=cfg?.balance,P=B?.paths?.[career.path];
  const minMonths=Math.round([0,12,36,60,84,108,132,180,240][next]*(P?.paceMonths||1));
  if(c.careerMonths<minMonths)return no(`尚需累積 ${minMonths-c.careerMonths} 個月年資`);
  const score=careerScore(c,P?.weights);
  const threshold=48+next*2.5+(B?.difficulty?.[state.meta?.difficulty]?.promotion||0)+(P?.thresholdAdj||0);
  if(score<threshold)return no(`綜合表現需達 ${threshold.toFixed(0)} 分（目前 ${score.toFixed(1)}）`);
  if(c.status.stress>=90)return no('目前壓力過高，建議先調整工作節奏');
  const bad=structuralGate(state,cfg,next);if(bad)return no(bad);
  return{ok:true,rank:next,score,threshold};
}
export function competePromotion(state,rng,cfg){
  const gate=promotionEligibility(state,cfg);if(!gate.ok)return{ok:false,reason:gate.reason};
  const G=cfg?.balance?.rankGate||{},candidates=(state.npc.people||[]).filter(n=>n.active&&n.rank>=gate.rank-1&&n.rank<gate.rank+1);
  const rival=candidates.length?rng.pick(candidates):null;
  const bonus=gate.rank>=(G.principalRank||7)?(G.principalRival||0):gate.rank>=5?(G.deputyRival||0):0;
  const edge=gate.rank>=(G.topFromRank||7)?(cfg?.balance?.paths?.[state.career.path]?.topEdge||0):0;// 教育領導型在高層競爭中具優勢
  const rivalScore=(rival?52.5+(rival.rank||0)*3+rng.int(-8,8):45+rng.int(-8,8))+bonus-edge;
  const playerScore=gate.score+(state.character.status.managementTrust-50)*.12+rng.int(-6,6);
  return{ok:true,won:playerScore>=rivalScore,rank:gate.rank,playerScore:Math.round(playerScore),rivalScore:Math.round(rivalScore),rivalId:rival?.id||null};
}
// 路線對月結算的影響：加成按「路線經驗」逐步到位（換路線不能立即取得全部優勢），代價即時生效
export function pathMods(state,cfg,rng){
  const B=cfg.balance,P=B.paths[state.career.path];if(!P)return{};
  const X=B.pathXp,months=(state.career.pathMonths||{})[state.career.path]||0,xp=Math.min(1,X.start+(1-X.start)*months/X.ramp);
  const scale=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k,1+(v-1)*xp]));
  const stress={},energy={};
  for(const k of B.workCategories){stress[k]=((P.stress||{})[k]||1)*(P.stressAll||1);energy[k]=((P.energy||{})[k]||1)*(P.energyAll||1)}
  let extraStress=P.extraStress||0;if(P.riskStress&&rng.next()<P.riskStress.p)extraStress+=P.riskStress.v;
  return{growth:scale(P.growth),attr:scale(P.attr),stress,energy,extra:{stress:extraStress},effects:P.effects||{}};
}
export function progressNPCs(state,rng){const changes=[];for(const n of state.npc.people){if(!n.active)continue;n.trust=Math.max(5,Math.min(100,n.trust+rng.int(-2,2)));if(rng.next()<.025&&n.rank<7){n.rank++;changes.push({npcId:n.id,type:'promotion',rank:n.rank})}else if(rng.next()<.012&&n.role!=='校長'){n.active=false;changes.push({npcId:n.id,type:'departure'})}}return changes}
export function courseStatus(state,courses){return courses.map(course=>({...course,completed:state.career.completedCourses.includes(course.id),eligible:(course.id==='pgde-equivalent'||state.character.status.wealth>=course.fee)&&state.character.careerMonths>=course.minMonths&&(course.requires||[]).every(k=>state.character.attributes[k]>=50)&&(!course.requiresEducation||course.requiresEducation.includes(state.character.education))&&(!course.onlyIfUntrained||state.character.qualification==='untrained')&&(!course.onlyForNJT||!!state.career.njtTraining?.applies)}))}
