import {createRng} from './rng.js';
// Teacher Life Simulator 4.0 — school ecosystem simulation.
// All values here are explicit game-model assumptions, not EDB ratings or statutory rules.
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const pick=(rng,a)=>a[rng.int(0,a.length-1)];
const traits=['workaholic','political','passive','competent','relationship','conservative','competitive'];
const traitNames={workaholic:'工作狂',political:'政治型',passive:'被動型',competent:'能力型',relationship:'人情型',conservative:'保守型',competitive:'競爭型'};
const subjects=['中文','英文','數學','科學','人文','體育','藝術'];
const studentTypes=['高能力','中等能力','學習困難','低動機','高壓力','SEN支援'];
const senTypes=['ASD','ADHD','SpLD','肢體傷殘','情緒及行為需要','語言及溝通困難'];
const weightsByBand={
  1:{academic:1.35,valueAdded:1.15,holistic:.8,support:.8,attendance:.9,safety:.9,teacher:1,parent:1.1,intake:1.2,特色:.9},
  2:{academic:1,valueAdded:1.1,holistic:1,support:1.1,attendance:1,safety:1.05,teacher:1,parent:1,intake:1,特色:1},
  3:{academic:.75,valueAdded:1.15,holistic:1.05,support:1.4,attendance:1.25,safety:1.2,teacher:1.1,parent:.9,intake:.8,特色:1}
};
export function initEcosystem(state,rng){
 rng=createRng(state.causal?.rngState??(((state.meta.seed||1)^0x4e434f)>>>0));
 const band=state.school.band||pick(rng,[1,2,3]),type=state.school.type;
 state.school.band=band;state.school.bandDisclaimer='遊戲模擬收生定位，並非教育局官方評級';
 state.school.health??={studentPopulation:state.school.studentPopulation||600,enrolmentTrend:0,status:'stable',warningMonths:0};
 state.school.classes=state.school.classes||Math.max(18,Math.round(state.school.studentPopulation/30));
 state.school.identity??={specialty:pick(rng,['academic','stem','sports','arts','care','traditional']),stage:pick(rng,['development','stable','renewal']),sponsorCulture:pick(rng,['traditional','collaborative','performance','community'])};
 state.school.kpiWeights??=weightsByBand[band];
 state.school.strategyCycle??={cycle:1,yearPlan:[],annualPlans:[],selfEvaluation:[],schoolReports:[],nextImprovements:[]};
 const count=48;
 state.students??={cohort:[],history:[],incidents:[],supportCases:[],groupMetrics:{}};
 if(!state.students.cohort.length){
  for(let i=0;i<count;i++){const typeName=studentTypes[Math.min(5,Math.floor(rng.next()*6))],sen=typeName==='SEN支援'?pick(rng,senTypes):null;
   const ability=clamp((band===1?65:band===2?50:38)+rng.int(-24,25));
   state.students.cohort.push({id:`stu_${i+1}`,name:`學生${String(i+1).padStart(2,'0')}`,form:1+Math.floor(i/8),group:typeName,ability,motivation:clamp(rng.int(25,90)),familySupport:clamp(rng.int(15,90)),economic:clamp(rng.int(15,90)),attendance:clamp(rng.int(78,99)),stress:clamp(rng.int(15,65)),habits:clamp(rng.int(20,85)),interest:pick(rng,subjects),sen,progress:ability,bullyingRisk:rng.int(0,20),history:[]});
  }
 }
 state.students.groupMetrics??={};
 state.staff??={people:[],relations:[],history:[],vacancies:[]};
 if(!state.staff.people.length){
  const names=['許嘉怡','鄭文軒','羅詠珊','馮家朗','梁詠琪','陳俊傑','黃佩珊','周家明','李慧儀','張國強','吳嘉敏','林志遠'];
  state.staff.people=names.map((name,i)=>({id:`col_${i+1}`,name,role:i===0?'科主任':i===1?'級主任':'教師',trait:pick(rng,traits),ability:rng.int(40,92),attitude:rng.int(35,90),stress:rng.int(15,70),trust:50,cooperation:rng.int(30,85),influence:rng.int(10,90),goal:pick(rng,['升任主任','專注教學','維持穩定','爭取校內資源','平衡家庭']),relationships:{},memories:[],active:true}));
  for(const a of state.staff.people)for(const b of state.staff.people)if(a!==b)a.relationships[b.id]=rng.int(35,70);
 }
 state.staff.assignments??=[];state.staff.events??=[];
 state.teaching??={strategy:'balanced',workload:50,feedback:50,adaptation:45,examPractice:45,homework:45,coverage:50,subject:state.character.subject,monthlyLog:[]};
 state.administration??={cases:[],policyRegister:[],procurement:[],complaints:[],auditTrail:[]};
 state.schoolFinance??={reserve:state.management.budget||30000,annualIncome:0,annualExpense:0,tuition:0};
 state.schoolAdmission??={applications:0,offers:0,enrolled:0,competitors:rng.int(3,8),satisfaction:50};
 state.causal??={scheduled:[],resolved:[],riskFlags:[],lastMonthly:[],rngState:(((state.meta.seed||1)^0x4e434f)>>>0)};state.causal.rngState??=(((state.meta.seed||1)^0x4e434f)>>>0);
 state.kpi??={academic:50,valueAdded:50,holistic:50,support:50,attendance:90,safety:85,teacher:50,parent:50,intake:50,specialty:50,overall:50};
 state.career.adminAppointments??=[];state.career.formalGrade??=state.career.rank;
}
function teach(state,ecoRng){
 const t=state.teaching,s=state.students.cohort,st=state.character.status;
 const subject=String(state.character.subject||'');
 const multiplier=/math|english|science|數學|英文|科學/i.test(subject)?1.08:/pe|體育/i.test(subject)?.94:1;
 for(const p of s){
  const attendance=p.attendance/100, support=p.sen?((t.adaptation-35)/100):0;
  const learning=(t.coverage*.12+t.feedback*.13+t.adaptation*.16+t.examPractice*.12+t.homework*.08+t.workload*.06- t.workload*.08);
  const delta=(learning-5)*.025*multiplier+(p.motivation-50)*.006+(p.familySupport-50)*.003+(attendance-.85)*3+support+(ecoRng.next()-.5)*.55;
  p.progress=clamp(p.progress+delta,0,100);p.motivation=clamp(p.motivation+(t.feedback-50)*.018+(t.homework>70?-1.1:0)+(t.adaptation>60?.5:0)+(ecoRng.next()-.5)*1.3);
  p.stress=clamp(p.stress+(t.workload-50)*.035+(t.examPractice-50)*.02-(t.adaptation-40)*.018+(ecoRng.next()-.5)*1.4);
  p.attendance=clamp(p.attendance-(p.stress>75?.8:0)+(p.motivation>65?.15:0)+(ecoRng.next()-.5)*.25,40,100);
  if(p.stress>88&&p.attendance<75)state.students.incidents.push({id:`risk_${p.id}_${state.date.turn}`,studentId:p.id,type:'high-risk-absence',turn:state.date.turn,status:'monitoring',factors:['壓力偏高','出席率下降','需個別評估']});
  if(p.sen&&t.adaptation<35)p.progress=clamp(p.progress-.25);
  p.history.push({turn:state.date.turn,progress:+p.progress.toFixed(2),stress:+p.stress.toFixed(1),attendance:+p.attendance.toFixed(1)});
  if(p.history.length>36)p.history.shift();
 }
 const marks=avg(s.map(x=>x.progress)),stress=avg(s.map(x=>x.stress)),att=avg(s.map(x=>x.attendance));
 return{marks,stress,att};
}
function updateKpi(state,metrics,rng){
 state.school.identity??={specialty:'academic',stage:'stable',sponsorCulture:'traditional'};state.school.kpiWeights??=weightsByBand[state.school.band||2];
 const s=state.students.cohort,k=state.kpi,w=state.school.kpiWeights||weightsByBand[state.school.band||2];
 const sen=s.filter(x=>x.sen),gap=avg(s.filter(x=>x.group==='高能力').map(x=>x.progress))-avg(s.filter(x=>x.group==='學習困難'||x.group==='SEN支援').map(x=>x.progress));
 k.academic=clamp(metrics.marks);k.valueAdded=clamp(50+(metrics.marks-(state.school.band===1?65:state.school.band===2?50:38))*1.1);
 k.holistic=clamp((avg(s.map(x=>x.motivation))*.55)+(avg(s.map(x=>x.interest?60:40))*.1)+state.management.studentWellbeing*.35);
 k.support=clamp(75+(sen.length?((avg(sen.map(x=>x.progress))-avg(s.filter(x=>!x.sen).map(x=>x.progress)))*.5):0)+(state.teaching.adaptation-50)*.35);
 k.attendance=clamp(metrics.att);k.safety=clamp(90-state.students.incidents.filter(x=>x.status!=='closed').length*3);
 k.teacher=clamp(state.management.morale);k.parent=clamp(state.management.parentTrust);k.intake=clamp(state.schoolAdmission.satisfaction);
 k.specialty=clamp((state.school.identity.specialty==='stem'?state.teaching.adaptation:state.management.quality)+rng.int(-2,2));
 const pairs=[['academic','academic'],['valueAdded','valueAdded'],['holistic','holistic'],['support','support'],['attendance','attendance'],['safety','safety'],['teacher','teacher'],['parent','parent'],['intake','intake'],['specialty','特色']];
 const sum=pairs.reduce((a,[key,weight])=>a+k[key]*(w[weight]||1),0),den=pairs.reduce((a,[,weight])=>a+(w[weight]||1),0);
 k.overall=clamp(sum/den);
}
function processCausal(state,rng){
 const c=state.causal,turn=state.date.turn;
 for(const e of c.scheduled.filter(x=>!x.done&&x.dueTurn<=turn)){e.done=true;c.resolved.push({turn,type:e.type,text:e.text});if(e.effect==='pressure'){state.character.status.stress=clamp(state.character.status.stress+5);state.management.morale=clamp(state.management.morale-3);}if(e.effect==='review')state.management.appraisals.push({turn,reason:e.text,score:state.kpi.overall});}
 c.scheduled=c.scheduled.filter(x=>!x.done);
 if(state.kpi.academic<43&&!c.scheduled.some(x=>x.type==='department-review')&&rng.next()<.65){c.scheduled.push({type:'department-review',dueTurn:turn+1,text:'模擬試成績持續偏低，科主任須提交科組檢討及改善方案。',effect:'review'});}
 if(state.teaching.workload>72&&!c.scheduled.some(x=>x.type==='student-pressure')&&rng.next()<.4){c.scheduled.push({type:'student-pressure',dueTurn:turn+2,text:'密集操練後，學生壓力及缺席個案增加，學校要求檢視功課與補課安排。',effect:'pressure'});}
 if(state.kpi.overall<42&&!c.scheduled.some(x=>x.type==='annual-accountability')&&rng.next()<.3)c.scheduled.push({type:'annual-accountability',dueTurn:turn+3,text:'校本自評顯示多項指標未達目標，管理層要求跨組改善計劃。',effect:'review'});
 c.lastMonthly=[...c.scheduled];
}
export function settleEcosystem(state,rng){
 state.school.health??={studentPopulation:state.school.studentPopulation||600,enrolmentTrend:0,status:'stable',warningMonths:0};state.schoolAdmission??={applications:0,offers:0,enrolled:0,competitors:4,satisfaction:50};state.schoolFinance??={reserve:state.management.budget||30000,annualIncome:0,annualExpense:0,tuition:0};state.school.strategyCycle??={cycle:1,yearPlan:[],annualPlans:[],selfEvaluation:[],schoolReports:[],nextImprovements:[]};state.school.identity??={specialty:'academic',stage:'stable',sponsorCulture:'traditional'};
 const ecoRng=createRng(state.causal.rngState??(((state.meta.seed||1)^0x4e434f)>>>0));
 const metrics=teach(state,ecoRng);updateKpi(state,metrics,ecoRng);processCausal(state,ecoRng);state.causal.rngState=ecoRng.state;
 const w=state.teaching.workload,extra=Math.max(0,w-60)*.045;
 state.character.status.stress=clamp(state.character.status.stress+extra);
 state.management.morale=clamp(state.management.morale+(state.kpi.teacher-50)*.025-(extra*.2));
 state.schoolAdmission.satisfaction=clamp(state.schoolAdmission.satisfaction+(state.kpi.parent-50)*.025+(state.kpi.overall-50)*.015);
 state.schoolAdmission.applications=Math.max(0,Math.round((state.school.studentPopulation||600)*(.025+(state.school.reputation||50)/5000)));
 state.schoolAdmission.enrolled=Math.round(state.schoolAdmission.applications*(.25+state.schoolAdmission.satisfaction/200));
 state.schoolAdmission.offers=state.schoolAdmission.enrolled;
 state.school.health.studentPopulation=Math.max(0,Math.round((state.school.health.studentPopulation||state.school.studentPopulation)*(1+(state.schoolAdmission.enrolled-20)/Math.max(200,state.school.studentPopulation)*.01)));
 state.school.studentPopulation=state.school.health.studentPopulation;
 state.schoolFinance.annualIncome+=Math.round((state.school.financialCondition||50)*120);
 state.schoolFinance.annualExpense+=Math.round((state.management.budget||0)*.02);
 state.students.groupMetrics={};for(const g of studentTypes){const a=state.students.cohort.filter(x=>x.group===g);state.students.groupMetrics[g]={count:a.length,progress:+avg(a.map(x=>x.progress)).toFixed(1),stress:+avg(a.map(x=>x.stress)).toFixed(1),attendance:+avg(a.map(x=>x.attendance)).toFixed(1)};}
 state.students.history.push({turn:state.date.turn,...metrics,kpi:state.kpi.overall});if(state.students.history.length>60)state.students.history.shift();
 state.teaching.monthlyLog.push({turn:state.date.turn,...metrics,strategy:state.teaching.strategy});if(state.teaching.monthlyLog.length>36)state.teaching.monthlyLog.shift();
 state.staff.people.forEach((p,i)=>{p.stress=clamp(p.stress+(w>70?2:0)+(state.management.morale<40?2:0)-1);p.trust=clamp(p.trust+(p.cooperation-50)*.015);for(const other of state.staff.people.slice(i+1)){const key=other.id,rel=p.relationships[key]??50;p.relationships[key]=clamp(rel+(p.trait==='competitive'?-0.15:0.05)+(ecoRng.next()-.5)*.5);other.relationships[p.id]=p.relationships[key];}});
 if(state.date.month===8){state.school.strategyCycle.selfEvaluation.push({year:state.date.year,kpi:{...state.kpi},studentCount:state.school.studentPopulation});state.school.strategyCycle.schoolReports.push({year:state.date.year,overall:state.kpi.overall,summary:'校本模擬年度報告'});if(state.date.year%3===0){state.school.strategyCycle.cycle++;state.school.strategyCycle.nextImprovements=Object.entries(state.kpi).filter(([k,v])=>v<55).map(([k])=>k);}}
 return metrics;
}
export function applyTeachingDecision(state,choice){
 const plans={balanced:{workload:50,feedback:55,adaptation:55,examPractice:45,homework:45,coverage:55},cram:{workload:88,feedback:35,adaptation:25,examPractice:90,homework:85,coverage:75},differentiated:{workload:68,feedback:75,adaptation:88,examPractice:35,homework:45,coverage:45},lecture:{workload:48,feedback:35,adaptation:25,examPractice:55,homework:55,coverage:80},project:{workload:62,feedback:72,adaptation:68,examPractice:25,homework:35,coverage:48}};
 const p=plans[choice];if(!p)return{ok:false,error:'無效教學策略'};
 state.teaching={...state.teaching,...p,strategy:choice};state.teaching.monthlyLog.push({turn:state.date.turn,decision:choice});state.character.status.stress=clamp(state.character.status.stress+(p.workload-50)*.05);
 state.staff.people.forEach(x=>x.memories.push({turn:state.date.turn,event:`玩家選擇教學策略：${choice}`}));return{ok:true};
}
export function resolveStudentIncident(state,id,action){
 const e=state.students.incidents.find(x=>x.id===id&&!['closed'].includes(x.status));if(!e)return{ok:false,error:'找不到待處理個案'};
 const outcomes={refer:{status:'referred',stress:-2,trust:1},document:{status:'monitoring',stress:-1,trust:2},ignore:{status:'escalated',stress:5,trust:-5}};
 const o=outcomes[action];if(!o)return{ok:false,error:'無效處理方式'};e.status=o.status;e.action=action;e.followupTurn=state.date.turn+1;state.character.status.stress=clamp(state.character.status.stress+o.stress);state.management.parentTrust=clamp(state.management.parentTrust+o.trust);state.administration.auditTrail.push({turn:state.date.turn,action:`學生個案 ${id}：${action}`});return{ok:true};
}
export const ecosystemSummary=s=>({students:s.students?.cohort?.length||0,staff:s.staff?.people?.length||0,kpi:s.kpi||{},band:s.school?.band||2,openCases:(s.students?.incidents||[]).filter(x=>x.status!=='closed').length});
