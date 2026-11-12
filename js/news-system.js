// Hong Kong secondary-school news briefing for Teacher Life Simulator.
// Verified public reporting is separated from game-only consequences.
// All simulated effects are game assumptions, not official EDB rules.
export const NEWS_ITEMS = [
 {id:'hk-2026-merger',date:'2026-09-18',kind:'政策消息',title:'「匯流升級計劃」：資助學校合併及資源整合',summary:'教育局表示將推出計劃，鼓勵合適的公帑資助中小學合併，以集中資源及壯大教師團隊；報道指最快 2027/28 學年推出。官立學校與資助學校合併涉及不同聘用制度，不能視作一般合併。',source:'香港電台',url:'https://news.rthk.hk/rthk/ch/component/k2/1870572-20260918.htm',sourceNote:'新聞報道；計劃細節仍待公布，遊戲不將尚未公布的細節當成既定規則。',actions:[
  {id:'study_merger',label:'成立合併可行性小組',cost:3,now:{reputation:1,morale:-1},later:{financial:3,staffTrust:2},delay:4,follow:'完成校本合併可行性評估，釐清人手、課程及過渡安排。'},
  {id:'resource_plan',label:'先制定資源共享方案',cost:2,now:{financial:1,morale:1},later:{financial:2,kpi:1},delay:3,follow:'跨校資源共享試行結果提交管理層。'}
 ]},
 {id:'hk-2026-mental-health',date:'2026-09-12',kind:'官方資訊',title:'學生精神健康：三層支援及跨專業協作',summary:'政府新聞網引述教育局說明，學校支援採用普及性、選擇性及針對性三層模式，並透過校本教育心理學家、輔導人員、學校社工及校外網絡協作。教育局亦提醒學生輕生涉及多重因素，不應簡化歸因。',source:'香港政府新聞網',url:'https://www.news.gov.hk/chi/2026/09/20260912/20260912_175714_626.html',sourceNote:'官方政策說明；個案處理仍須按適用指引、校本程序及專業意見執行。',actions:[
  {id:'map_support',label:'檢視校內三層支援及轉介流程',cost:3,now:{support:2,morale:-1},later:{support:3,parent:2},delay:2,follow:'跨專業團隊檢視轉介流程及支援缺口。'},
  {id:'staff_training',label:'安排教師識別及轉介培訓',cost:2,now:{support:1,teacher:1},later:{support:2,teacher:2},delay:3,follow:'教師培訓完成，檢視識別及轉介能力。'}
 ]},
 {id:'hk-2026-sen-retention',date:'2026-10-13',kind:'行政指引報道',title:'SEN 學生留級：須重視個別需要及專業諮詢',summary:'媒體報道教育局更新《學校行政手冊》，資助學校考慮 SEN 學生留級時，須透過包括家長、校內支援團隊及教育心理學家在內的專業團隊諮詢。報道指出，留級可能加劇部分學生的社交及情緒適應困難。',source:'South China Morning Post',url:'https://www.scmp.com/news/hong-kong/education/article/3370771/schools-urged-not-make-pupils-special-educational-needs-repeat-grades',sourceNote:'媒體對更新指引的報道；具體程序以最新《學校行政手冊》及適用校本規定為準。',actions:[
  {id:'sen_case_review',label:'召開個別學生專業檢討會議',cost:3,now:{support:3,parent:1},later:{support:3,holistic:2},delay:2,follow:'個案團隊完成檢討，確認調適及跟進責任。'},
  {id:'sen_adjustment',label:'先檢視課程及評估調適',cost:2,now:{support:2,teacher:-1},later:{valueAdded:2,support:2},delay:3,follow:'完成個別學習支援及評估調適檢討。'}
 ]},
 {id:'hk-2026-wellbeing-campaign',date:'2026-08-31',kind:'官方政策消息',title:'2026/27「友『晴』凝聚校園大行動」及 4Rs 精神健康月',summary:'教育局公布新學年校園推廣活動，涵蓋抗逆力、人際關係、反欺凌、家校合作及校園精神健康；2026 年 10 月至 2027 年 1 月定為 4Rs 精神健康月。',source:'政府新聞公報',url:'https://www.info.gov.hk/gia/general/202608/31/P2026083100608.htm',sourceNote:'官方公布；活動形式及成效由學校按校情規劃，遊戲中的 KPI 變化屬模擬。',actions:[
  {id:'4rs_campaign',label:'制定校本 4Rs 活動計劃',cost:2,now:{holistic:2,parent:1},later:{holistic:3,support:1},delay:2,follow:'校本 4Rs 活動完成，收集學生及家長回饋。'},
  {id:'peer_support',label:'建立學生朋輩支援活動',cost:3,now:{holistic:1,support:2},later:{safety:2,holistic:2},delay:3,follow:'朋輩支援活動檢討，評估參與及校園氣氛。'}
 ]},
 {id:'hk-2026-s1-planning',date:'2026-04-30',kind:'官方行政消息',title:'中學規劃未來路向優化方案更新',summary:'教育局更新中學規劃安排，包括合併學校過渡期的部分中一班數安排，以及延長符合條件學校申請五班中一參加派位的先導計劃至 2029 年。具體資格及適用條件須查閱教育局通告。',source:'香港電台',url:'https://gbcode.rthk.hk/TuniS/news.rthk.hk/rthk/ch/component/k2/1853085-20260430.htm',sourceNote:'教育局安排的新聞報道；不可將先導計劃視為所有學校均自動適用。',actions:[
  {id:'s1_forecast',label:'檢視未來三年中一收生及班級預測',cost:2,now:{intake:2},later:{intake:2,financial:1},delay:3,follow:'三年收生預測及班級規劃提交校董會／管理層。'},
  {id:'admission_outreach',label:'加強家長及小學聯繫',cost:2,now:{parent:1,intake:1},later:{intake:2,reputation:1},delay:3,follow:'收生推廣成效及家長查詢趨勢完成檢討。'}
 ]},
 {id:'hk-2026-diagnosed-needs',date:'2026-04-16',kind:'新聞數據',title:'中學生精神健康診斷個案數字上升',summary:'媒體引述教育局數據，2020/21 至 2024/25 學年中學生精神病患個案由 660 宗增至 1,330 宗。這是被報告的診斷個案數目，不等同整體學生患病率；成因涉及個人、家庭、學業及社交等多因素。',source:'South China Morning Post',url:'https://www.scmp.com/news/hong-kong/education/article/3350299/rise-mental-illness-cases-among-hong-kong-students-reflects-growing-openness',sourceNote:'媒體引述官方數據及教育局局長回應；不能單憑個案數推論成因或個別教師責任。',actions:[
  {id:'wellbeing_baseline',label:'建立校本需要評估及支援資源盤點',cost:2,now:{support:1,teacher:-1},later:{support:3,parent:1},delay:2,follow:'校本精神健康需要及支援資源盤點完成。'},
  {id:'early_help',label:'加強及早識別與專業轉介',cost:3,now:{support:2},later:{support:2,attendance:1,safety:1},delay:3,follow:'檢視及早識別、家長溝通及專業轉介成效。'}
 ]},
 {id:'hk-2026-tsa-results',date:'2026-11-05',kind:'官方評估消息',title:'2026 年全港性系統評估：中三中英數表現保持平穩',summary:'教育局表示，2026 年參與全港性系統評估的中三學生在中國語文、英國語文及數學科表現與上次評估結果相若；考評局稍後向學校發放校本數據，供學校結合校內評估檢視課程及教學。',source:'香港政府新聞網',url:'https://www.news.gov.hk/chi/2026/11/20261105/20261105_120342_663.html?type=ticker',sourceNote:'官方公布；全港性系統評估結果不可直接當作個別學生或學校的排名。',actions:[
  {id:'tsa_data_review',label:'召開中三學科數據檢視會議',cost:2,now:{academic:1},later:{academic:2,valueAdded:1},delay:2,follow:'中三校本評估數據檢視完成，訂立課程及教學改善項目。'},
  {id:'assessment_literacy',label:'安排教師評估素養及回饋培訓',cost:2,now:{teacher:1},later:{academic:1,teacher:2},delay:3,follow:'教師完成評估數據應用培訓並檢視學習回饋。'}
 ]},
 {id:'hk-2026-private-sector',date:'2026-10-24',kind:'學校市場新聞',title:'香港私立中學數目近五年增加',summary:'媒體引述教育局數字報道，私立中學數目由 2021/22 學年的 16 間增至 2025/26 學年的 25 間，增幅約 56.3%；報道提及另類課程需求及家長選擇變化。',source:'South China Morning Post',url:'https://www.scmp.com/news/hong-kong/education/article/3371974/hong-kong-private-secondary-sector-expands-local-universities-reputation-grows',sourceNote:'媒體報道引述教育局數字；市場增長不代表每所私立學校均有相同收生或財政狀況。',actions:[
  {id:'curriculum_position',label:'檢視學校課程定位及家長需求',cost:2,now:{intake:1,reputation:1},later:{intake:2,parent:1},delay:3,follow:'完成課程定位及家長需求調查，檢視收生策略。'},
  {id:'alternative_pathways',label:'研究多元課程及升學銜接',cost:3,now:{academic:1},later:{intake:2,academic:1},delay:4,follow:'多元課程及升學銜接方案提交校務會議。'}
 ]},
 {id:'hk-2026-secondary-classes',date:'2026-09-30',kind:'收生及班級新聞',title:'公營中學 2026/27 學年中一核准班數減少',summary:'媒體報道引述教育局資料，經點算後公營中學本學年中一核准班數合共減少 4 班；報道亦提及符合條件學校可申請相關班數先導安排。這不代表所有中學均須縮班。',source:'東方日報',url:'https://img-hk-cdn.on.cc/hk/bkn/cnt/news/20260930/bkn-20260930085556645-0930_00822_001.html',sourceNote:'媒體報道；個別學校核准班數、申請資格及最新安排須以教育局通知為準。',actions:[
  {id:'class_size_plan',label:'檢視班級結構及教師編制風險',cost:2,now:{financial:1},later:{financial:2,teacher:1},delay:3,follow:'班級結構及人手編制風險評估提交管理層。'},
  {id:'retain_students',label:'制定學生留校及家長溝通方案',cost:2,now:{parent:1,reputation:1},later:{intake:2,parent:1},delay:3,follow:'家長溝通及學生留校方案完成檢討。'}
 ]},
 {id:'hk-2026-safeguarding-data',date:'2026-10-07',kind:'學生安全新聞',title:'教育局向立法會交代學生高風險個案轉介數據',summary:'媒體報道引述教育局向立法會提供的資料，過去約兩年半校長曾將 547 名高自殺風險學生轉介公營醫療系統；報道亦指出懷疑學生自殺個案涉及不同年齡層。數字反映需要及早識別和轉介，不能用來推斷個別學校或教師責任。',source:'South China Morning Post',url:'https://www.scmp.com/news/hong-kong/health-environment/article/3370055/60-hong-kongs-suspected-student-suicides-involved-children-aged-15-or-below',sourceNote:'媒體報道引述教育局提交立法會的數據；只作制度及支援資源背景，不作風險預測或單一成因歸責。',actions:[
  {id:'safeguarding_protocol',label:'檢視高風險學生通報及緊急轉介流程',cost:3,now:{safety:2,support:1},later:{safety:2,support:2},delay:2,follow:'跨專業團隊完成危機通報、轉介及跟進流程檢討。'},
  {id:'workload_balance',label:'檢視功課量、考試節奏及學生壓力',cost:2,now:{holistic:1,teacher:-1},later:{support:2,attendance:1},delay:3,follow:'完成學生工作量及壓力檢視，提出教學調整。'}
 ]}

];
const clamp=(n)=>Math.max(0,Math.min(100,Number(n)||0));
export function initNewsState(state){
 state.news??={read:[],actions:[],pending:[],lastBriefingTurn:-1};
 state.news.read??=[];state.news.actions??=[];state.news.pending??=[];
 return state.news;
}
export function newsItemsForState(state){
 const n=initNewsState(state);
 return NEWS_ITEMS.map(item=>({...item,read:n.read.includes(item.id),action:n.actions.find(a=>a.newsId===item.id)||null})).sort((a,b)=>b.date.localeCompare(a.date));
}
export function respondToNews(state,newsId,actionId,spend){
 const item=NEWS_ITEMS.find(x=>x.id===newsId);
 if(!item)return{ok:false,error:'找不到新聞資料'};
 const action=item.actions.find(x=>x.id===actionId);
 if(!action)return{ok:false,error:'找不到校本行動'};
 const n=initNewsState(state);
 if(n.actions.some(x=>x.newsId===newsId))return{ok:false,error:'這則新聞已制定校本行動'};
 if(!spend(action.cost))return{ok:false,error:`行政 AP 不足：需要 ${action.cost} 點`};
 const now=action.now||{};
 const apply=(key,value)=>{
  if(key==='morale'&&state.management)state.management.morale=clamp(state.management.morale+value);
  else if(key==='financial'&&state.school)state.school.financialCondition=clamp((state.school.financialCondition||50)+value);
  else if(key==='reputation'&&state.school)state.school.reputation=clamp((state.school.reputation||50)+value);
  else if(key==='staffTrust'&&state.staff?.people)state.staff.people.forEach(p=>p.trust=clamp(p.trust+value));
  else if(state.kpi&&key in state.kpi)state.kpi[key]=clamp((state.kpi[key]||50)+value);
  else if(key==='support'&&state.kpi)state.kpi.support=clamp((state.kpi.support||50)+value);
  else if(key==='parent'&&state.kpi)state.kpi.parent=clamp((state.kpi.parent||50)+value);
  else if(key==='intake'&&state.kpi)state.kpi.intake=clamp((state.kpi.intake||50)+value);
 };
 Object.entries(now).forEach(([k,v])=>apply(k,v));
 const actionRecord={newsId,actionId,turn:state.date.turn,action:action.label,cost:action.cost};
 n.actions.push(actionRecord);n.read.push(newsId);
 n.pending.push({id:`news_${newsId}_${state.date.turn}`,newsId,dueTurn:state.date.turn+(action.delay||2),effects:action.later||{},follow:action.follow,resolved:false});
 state.history.push({turn:state.date.turn,type:'news-action',text:`根據新聞「${item.title}」制定校本行動：${action.label}`});
 state.administration??={cases:[],auditTrail:[]};state.administration.auditTrail??=[];
 state.administration.auditTrail.push({turn:state.date.turn,action:`新聞政策跟進：${item.title}／${action.label}`});
 return{ok:true,action:action.label,dueTurn:state.date.turn+(action.delay||2)};
}
export function settleNewsConsequences(state){
 const n=initNewsState(state);const due=n.pending.filter(x=>!x.resolved&&x.dueTurn<=state.date.turn);
 for(const p of due){
  const effects=p.effects||{};
  for(const[k,v]of Object.entries(effects)){
   if(k==='morale'&&state.management)state.management.morale=clamp(state.management.morale+v);
   else if(k==='financial'&&state.school)state.school.financialCondition=clamp((state.school.financialCondition||50)+v);
   else if(k==='reputation'&&state.school)state.school.reputation=clamp((state.school.reputation||50)+v);
   else if(k==='staffTrust'&&state.staff?.people)state.staff.people.forEach(x=>x.trust=clamp(x.trust+v));
   else if(state.kpi&&k in state.kpi)state.kpi[k]=clamp((state.kpi[k]||50)+v);
  }
  p.resolved=true;p.resolvedTurn=state.date.turn;
  state.history.push({turn:state.date.turn,type:'news-followup',text:p.follow});
 }
 n.pending=n.pending.filter(x=>!x.resolved);
 return due.length;
}
