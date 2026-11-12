// 2026-04-01 起生效的香港總薪級表（MPS）。
// 新聘 GM 的資格起薪在遊戲中作可解釋的簡化：受認可教師訓練（BEd／PGDE／PCEd）以 Pt.17 起；未受訓以 Pt.15 起並受 Pt.20 薪酬關限。個別 EDB 薪酬評估仍須按認可年資、ICE／ICQ、增薪日期及聘用紀錄核定。
export const MPS_2026 = {
  15:35780,16:37585,17:39490,18:41430,19:43495,20:45660,21:47950,22:50215,23:52575,24:55060,
  25:57580,26:60290,27:63100,28:66075,29:69205,30:72430,31:75830,32:79410,33:83140,
  34:83975,35:84815,36:86835,37:90955,38:95120,39:99525,40:103810,41:108280,42:112955,
  43:117805,44:122045,45:130255,46:134920,47:139825,48:144850,49:150070
};
export const SALARY_GRADES = [
  {id:'GM',name:'學位教師（GM）',min:15,max:33,from:0,to:2},
  {id:'SGM',name:'高級學位教師（SGM）',min:34,max:39,from:3,to:4},
  {id:'PGM',name:'首席學位教師（PGM）',min:38,max:41,from:5,to:6},
  {id:'P2',name:'校長（二級）',min:40,max:44,from:7,to:7},
  {id:'P1',name:'校長（一級）',min:45,max:49,from:8,to:8}
];
export const EMPLOYMENT_TYPES = {
  perm:{name:'常額職位（Perm）',short:'Perm',description:'常額編制內長期聘用，沒有固定合約到期日；仍須接受工作表現及校內評核。'},
  contract:{name:'定期合約教師（Contract）',short:'Contract',description:'按學校聘書訂立年期、薪酬及福利；遊戲以同級 MPS 作模擬參考，不代表所有真實合約均享有與常額教師相同待遇。'}
};
export function gradeForRank(rank){return SALARY_GRADES.find(g=>rank>=g.from&&rank<=g.to)||SALARY_GRADES[0]}
export function qualificationProfile(state){
  const q=state?.character?.qualification;
  const trained=state?.career?.salaryBarCleared===true||q==='pgde'||q==='bed';
  return {trained,qualificationName:q==='bed'?'教育學士（BEd）':q==='pgde'?'學士＋教育文憑／證書（PGDE／PCEd）':q==='untrained'?'未受教師訓練':'其他／待核實',entryPoint:trained?17:15,salaryBar:trained?33:20,incrementRule:trained?'完成 12 個月合資格服務並通過年度評核後增一薪點，最高 Pt.33':'完成 12 個月合資格服務並通過年度評核後增一薪點，最高 Pt.20；取得認可教師訓練後可獲兩薪點資格增額並解除薪酬關限',note:'碩士／博士學位本身不會自動增加薪點；須由教育局按適用 ICQ／認可資格及文件個別核定'};
}
export function initialPayPoint(state){
  const rank=Math.max(0,Math.min(8,Number(state?.career?.rank)||0));
  const grade=gradeForRank(rank),months=Math.max(0,Number(state?.character?.careerMonths)||0);
  if(rank<=2){const q=qualificationProfile(state);return Math.max(grade.min,Math.min(q.salaryBar,q.entryPoint+Math.floor(months/12)));}
  const gradeStart=Math.max(0,Number(state?.career?.gradeStartCareerMonths)||0);
  return Math.max(grade.min,Math.min(grade.max,grade.min+Math.floor(Math.max(0,months-gradeStart)/12)));
}
export function promotedPayPoint(currentPoint,nextRank){const grade=gradeForRank(nextRank);return Math.max(grade.min,Math.min(grade.max,(Number(currentPoint)||grade.min)+1));}
export function payPointForState(state){
  const rank=Math.max(0,Math.min(8,Number(state?.career?.rank)||0)),grade=gradeForRank(rank);
  let point=Number.isInteger(state?.career?.salaryPoint)?state.career.salaryPoint:initialPayPoint(state);
  point=Math.max(grade.min,Math.min(grade.max,point));
  const q=qualificationProfile(state);if(rank<=2&&!q.trained)point=Math.min(point,q.salaryBar);
  return {grade,point,salary:MPS_2026[point]||MPS_2026[grade.min],maxSalary:MPS_2026[grade.max],qualification:q};
}
export function salaryForState(state){
  if(!state||state.career?.externalRole||state.career?.unemployed)return 0;
  const info=payPointForState(state);
  if(['government','aided'].includes(state.school?.type))return info.salary;
  const factor=state.school?.type==='dss'?1.08:0.92;
  return Math.round(info.salary*factor);
}
export function salaryInfoForState(state){
  const info=payPointForState(state),employment=EMPLOYMENT_TYPES[state?.career?.employmentType]||EMPLOYMENT_TYPES.perm;
  const publicScale=['government','aided'].includes(state?.school?.type);
  return {...info,gradeName:info.grade.name,monthlySalary:salaryForState(state),incrementMonths:state?.career?.salaryMonthsTowardIncrement||0,incrementThreshold:12,employment,publicScale,
    contractEndTurn:state?.career?.employmentType==='contract'?state.career.contractEndTurn:null,
    unemployed:!!state?.career?.unemployed};
}
