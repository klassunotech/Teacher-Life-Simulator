import {createEngine} from '../js/game-engine.js';
import {loadData} from './sim-lib.mjs';
const data=loadData();
const strategies={
  idle:{teaching:0,administration:0,professional:0,extracurricular:0,family:0,rest:100},
  teaching:{teaching:100},
  administration:{administration:100},
  pd:{professional:100},
  communication:{extracurricular:100},
  overwork:{teaching:75,administration:15,rest:10},
  balanced:{teaching:25,administration:15,professional:10,extracurricular:8,family:12,rest:30},
  contract:{teaching:30,administration:15,professional:10,extracurricular:10,family:10,rest:25},
  contractNoPerm:{teaching:30,administration:15,professional:10,extracurricular:10,family:10,rest:25},
  promotion:{teaching:20,administration:25,professional:20,extracurricular:8,family:10,rest:17},
  schoolrisk:{teaching:20,administration:10,professional:5,extracurricular:5,family:10,rest:50}
};
const stats={};
for(const [name,plan] of Object.entries(strategies)){
  const rows=[];
  for(let seed=1;seed<=100;seed++){
    const e=createEngine(data);e.start({mode:'random',seed:seed*7919});const s=e.state;
    if(name==='contract'||name==='contractNoPerm'){s.career.employmentType='contract';s.career.contractStartTurn=0;s.career.contractMonths=12;s.career.contractEndTurn=12;}
    if(name==='promotion')e.setCareerPath('management');
    if(name==='schoolrisk'){s.school.studentPopulation=420;s.school.health={studentPopulation:420,enrolmentTrend:-2,status:'concern',warningMonths:0};s.school.culture.academic=20;s.school.reputation=20;s.management.parentTrust=20;}
    let turns=0;
    while(s.date.turn<240&&s.phase!=='ending'){
      if(s.phase==='event'){e.choose(turns%Math.max(1,data.events.find(x=>x.id===s.events.pending)?.choices.length||1));continue;}
      if(s.phase==='result'||s.phase==='yearEnd'){e.ack();continue;}
      for(const k of Object.keys(s.ap.allocation))e.setAlloc(k,plan[k]||0);
      if(name==='contract'&&s.date.turn>=12&&s.career.employmentType==='contract'&&!s.career.permOffer&&s.career.communicationPoints>=2){e.applyForPerm();if(s.career.permOffer)e.decidePerm(true);}
      if(name==='promotion'&&s.career.employmentType==='perm'){for(const rec of s.career.trainingRecords||[])if(['promotionCore','elective'].includes(rec.track)&&!rec.endorsed)e.endorseTraining(rec.courseId);if(s.date.turn%12===0&&e.availableAP('professional')>=12)e.careerProject('policyForum');if(!s.career.activeCourses.length){for(const id of [(!s.career.salaryBarCleared&&s.character.qualification==='untrained'?'pgde-equivalent':null),'new-teacher-core','promotion-core','middle-leadership','principal-prep'].filter(Boolean)){const c=e.availableCourses().find(x=>x.id===id);if(c&&c.eligible&&!c.completed&&s.career.professionalDevelopmentPoints>=2){e.enrollCourse(id);break}}}if(s.date.turn%3===2){const g=e.promotionEligibility();if(g.ok&&!s.career.promotionOffer)e.applyPromotion();if(s.career.promotionOffer)e.decidePromotion(true)}}
      if(name==='schoolrisk'&&s.school.closureTurn&&s.date.turn<s.school.closureTurn){const opts=e.getTransferOptions();if(opts.length)e.transferSchool(opts[0]);}
      const r=e.settle();if(!r.ok)break;turns++;
    }
    rows.push({turn:s.date.turn,phase:s.phase,rank:s.career.rank,health:s.character.status.health,stress:s.character.status.stress,ending:s.ending?.cause||'none',employment:s.career.employmentType,perm:s.career.employmentType==='perm',schoolPopulation:s.school.studentPopulation,contractHistory:s.career.contractHistory||[],transfers:(s.career.applications||[]).filter(x=>x.type==='transfer')});
  }
  const avg=k=>rows.reduce((a,x)=>a+(Number(x[k])||0),0)/rows.length;
  stats[name]={runs:rows.length,gameOvers:rows.filter(x=>x.phase==='ending'&&x.ending!=='none').length,avgTurn:Math.round(avg('turn')),avgRank:Number(avg('rank').toFixed(2)),avgHealth:Number(avg('health').toFixed(1)),avgStress:Number(avg('stress').toFixed(1)),permConversions:rows.filter(x=>x.perm&&name==='contract').length,renewalDecisions:rows.reduce((a,x)=>a+x.contractHistory.length,0),transferAttempts:rows.reduce((a,x)=>a+x.transfers.length,0),transferSuccesses:rows.reduce((a,x)=>a+x.transfers.filter(t=>t.success).length,0),causes:Object.fromEntries([...new Set(rows.map(x=>x.ending))].map(k=>[k,rows.filter(x=>x.ending===k).length]))};
}
console.log(JSON.stringify({seedsPerStrategy:100,strategies:stats},null,2));
