import {addV} from './character.js';
import {difficultyOf} from './monthly-system.js';
export function tickHealth(state,data){
  const c=state.character,st=c.status,h=state.health,H=data.config.balance.health,D=difficultyOf(state,data.config),ap=state.ap.allocation,rest=ap.rest||0;
  const before=st.health;let drain=0,heal=0;
  if(st.stress>H.stressFrom)drain+=(st.stress-H.stressFrom)/35*H.stressDrain;
  if(st.energy<H.exhaustBelow)drain+=(H.exhaustBelow-st.energy)/H.exhaustBelow*H.exhaustDrain;
  if(h.illness)drain+=H.illnessDrain;
  const over=Math.max(0,c.age-H.ageFrom);drain+=over*H.ageDrain;
  if(st.stress<55&&st.energy>=50)heal+=H.recover;
  if(rest>=H.restAP&&st.stress<75)heal+=H.restRecover;
  heal*=Math.max(0.4,1-over*H.ageRecover*3);
  addV(c,'health',heal-drain*D.health);
  if(st.health<55)h.warningMonths++;else h.warningMonths=0;
  if(st.health<42&&h.warningMonths>=3&&!h.illness){h.illness=true;h.illnessMonths=0;h.warnings.push({turn:state.date.turn,type:'illness',text:'健康狀況持續轉差，已進入患病狀態，需要治療及休息。'});}
  if(h.illness)h.illnessMonths++;
  if(st.health>=65&&h.illness){h.illness=false;h.illnessMonths=0;h.warnings.push({turn:state.date.turn,type:'recovered',text:'健康狀況已逐步穩定。'});}
  h.criticalMonths=st.health<=H.criticalAt?(h.criticalMonths||0)+1:0;
  const lastWarning=h.warnings[h.warnings.length-1];if(st.health<65&&lastWarning?.type!=='warning'&&lastWarning?.turn!==state.date.turn)h.warnings.push({turn:state.date.turn,type:'warning',text:'健康開始亮起警號；建議減少過勞並安排休息。'});
  if(h.warnings.length>12)h.warnings.shift();return Math.round((st.health-before)*100)/100;
}
export function retirementEligible(state){return state.character.age>=60||state.character.careerMonths>=420;}
export function retirementSummary(state,cfg){const c=state.character,s=c.status,a=c.attributes,rank=state.career.rank;let ending='平凡但滿足',reason='你在教育工作中累積了不少經驗，亦為自己保留了生活空間。';
  const fund=state.finance?.fund||0;
  if(s.health<25||s.stress>=95&&s.satisfaction<35){ending='身心耗盡';reason='長期壓力及健康代價成為這段職涯最深刻的提醒。';}
  else if(rank>=8){ending='行政管理成功';reason='你曾帶領學校走過不同階段，留下制度與團隊的影響。';}
  else if(state.career.path==='teaching'&&a.teaching>=70){ending='教學專家';reason='你把大部分心力放在課堂、學生及教學專業，建立了自己的教育理念。';}
  else if(state.career.path==='student'&&s.studentRelation>=70){ending='學生成長引路人';reason='你長年陪伴學生成長，許多畢業生仍然記得你的支持。';}
  else if(state.career.path==='curriculum'&&a.professional>=65&&a.administration>=55){ending='課程發展領航者';reason='你推動跨科協作及校本課程，為學校建立了可持續的課程文化。';}
  else if(state.career.path==='study'&&(a.professional>=75||state.career.credentials.length>=5)){ending='專業進修學者';reason='你持續學習及研究，把學術與課堂經驗結合，成為同儕的專業參考。';}
  else if(state.career.path==='innovation'&&(s.wealth>=250000||(a.professional>=70&&a.efficiency>=65))){ending='教育創新者';reason='你把教育現場的經驗轉化為創新方案，開拓了新的教學方式。';}
  else if(state.career.path==='leadership'&&rank>=7&&a.leadership>=70){ending='教育界領袖';reason='你在學校以至教育界的專業交流中發揮影響力，帶領不同持份者前進。';}
  else if(state.career.path==='balanced'&&s.satisfaction>=65&&s.familyRelation>=65&&s.health>=60){ending='工作與生活平衡';reason='你選擇可持續的教師生涯，在工作、家庭、健康及個人生活之間取得了難得的平衡。';}
  else if(s.wealth+fund<0){ending='退休財務緊絀';reason='長期入不敷支令退休生活充滿壓力，提早規劃儲蓄會是最大的教訓。';}
  else if(s.wealth+fund>=(cfg?.balance?.finance?.freedomAt||3000000)){ending='財務自由';reason='多年規劃及累積讓你在退休時擁有相當大的財務自主。';}
  else if(s.familyRelation>=78){ending='家庭幸福';reason='你在工作以外亦投入了足夠時間，維繫重要的家庭關係。';}
  else if(s.satisfaction>=72){ending='平凡但滿足';reason='你未必追逐最高職位，但整體而言對自己走過的路感到滿意。';}
  return{title:ending,reason,years:Math.floor(c.careerMonths/12),months:c.careerMonths,age:c.age,highestRank:rank,path:state.career.path,schools:[...new Set([...(state.schoolHistory||[]).map(x=>x.school),state.school.name])],promotions:state.career.promotions.length,credentials:[...state.career.credentials],wealth:s.wealth,familyRelation:s.familyRelation,health:s.health,satisfaction:s.satisfaction,stress:s.stress,importantEvents:state.history.filter(x=>x.event).length,turn:state.date.turn};
}
