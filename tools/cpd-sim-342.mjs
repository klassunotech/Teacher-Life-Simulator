import {createEngine} from '../js/game-engine.js';
import {loadData} from './sim-lib.mjs';
const data=loadData();
const form={name:'CPD 模擬教師',age:28,experienceYears:0,gender:'女',education:'bachelor',qualification:'untrained',subject:data.subjects[0].id,family:'single',birthMonth:3,employmentType:'perm'};
const strategies={noTraining:{},schoolBased:{schoolActivity:true},njtCoreOnly:{core:true},completeNJT:{core:true,electives:true,schoolActivity:true}};
const results={};
for(const [name,policy] of Object.entries(strategies)){
 const rows=[];
 for(let seed=1;seed<=100;seed++){
  const e=createEngine(data);const school=e.rollSchools(seed*7919,{type:'aided'})[0];e.start({mode:'story',seed:seed*104729,form,school});const s=e.state;s.character.status.wealth=100000;
  while(s.date.turn<36&&s.phase!=='ending'){
   if(s.phase==='event'){e.choose(0);continue;}if(s.phase!=='play'){e.ack();continue;}
   for(const k of Object.keys(s.ap.allocation))e.setAlloc(k,0);e.setAlloc('professional',20);e.setAlloc('rest',80);
   if(policy.core&&!s.career.completedCourses.includes('new-teacher-core')&&!s.career.activeCourses.some(x=>x.id==='new-teacher-core')&&s.career.professionalDevelopmentPoints>=1)e.enrollCourse('new-teacher-core');
   if(policy.electives&&!s.career.activeCourses.length){
    if(!s.career.completedCourses.includes('classroom-research')&&s.career.professionalDevelopmentPoints>=2)e.enrollCourse('classroom-research');
    else if(!s.career.completedCourses.includes('assessment-literacy')&&s.career.professionalDevelopmentPoints>=2)e.enrollCourse('assessment-literacy');
   }
   if(policy.schoolActivity&&s.date.turn%2===0)e.recordSchoolCPD('coPlanning');
   const r=e.settle();if(!r.ok)break;
  }
  const total=s.career.cpd.lastCycle?.totalHours??s.career.cpd.cycleHours;
  rows.push({hours:total,core:s.career.njtTraining.coreHours||0,elective:s.career.njtTraining.electiveHours||0,softNotice:!!s.career.njtTraining.softTargetNoticeIssued,formalWarning:!!s.career.njtTraining.warningIssued,status:s.career.njtTraining.status,turn:s.date.turn});
 }
 const avg=k=>rows.reduce((a,x)=>a+(x[k]||0),0)/rows.length;
 results[name]={runs:100,avgHours:Number(avg('hours').toFixed(1)),avgCore:Number(avg('core').toFixed(1)),avgElective:Number(avg('elective').toFixed(1)),softTargetNotices:rows.filter(x=>x.softNotice).length,formalWarnings:rows.filter(x=>x.formalWarning).length,njtCompleted:rows.filter(x=>x.status==='completed').length,avgTurn:Number(avg('turn').toFixed(1))};
}
console.log(JSON.stringify({seedsPerStrategy:100,strategies:results},null,2));
