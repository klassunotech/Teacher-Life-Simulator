import test from 'node:test';
import assert from 'node:assert/strict';
import {NEWS_ITEMS,initNewsState,newsItemsForState,respondToNews,settleNewsConsequences} from '../js/news-system.js';
import {readFileSync} from 'node:fs';
const state=()=>({
 date:{turn:0},history:[],school:{financialCondition:50,reputation:50},management:{morale:50},
 staff:{people:[{trust:50}]},kpi:{support:50,parent:50,intake:50,holistic:50,teacher:50,safety:50,attendance:50,valueAdded:50,overall:50},
 administration:{auditTrail:[]}
});
test('新聞資料庫包含可追溯來源、日期及校本決策',()=>{
 assert.ok(NEWS_ITEMS.length>=10);
 const ordered=newsItemsForState(state());assert.equal(ordered[0].date,'2026-11-05');
 for(const n of NEWS_ITEMS){assert.match(n.date,/^2026-/);assert.ok(n.url.startsWith('https://'));assert.ok(n.source&&n.sourceNote);assert.ok(n.actions.length>=2);}
});
test('新聞跟進行動消耗 AP、寫入歷史並排定延遲後果',()=>{
 const s=state();initNewsState(s);let spent=0;
 const r=respondToNews(s,'hk-2026-mental-health','map_support',n=>(spent+=n,true));
 assert.equal(r.ok,true);assert.equal(spent,3);assert.equal(s.news.actions.length,1);assert.equal(s.news.pending.length,1);
 assert.equal(respondToNews(s,'hk-2026-mental-health','map_support',()=>true).ok,false);
});
test('新聞延遲後果在指定月份結算而不重複觸發',()=>{
 const s=state();initNewsState(s);respondToNews(s,'hk-2026-wellbeing-campaign','4rs_campaign',()=>true);
 assert.equal(s.kpi.holistic,52);s.date.turn=1;assert.equal(settleNewsConsequences(s),0);
 s.date.turn=2;assert.equal(settleNewsConsequences(s),1);assert.equal(s.kpi.holistic,55);
 assert.equal(settleNewsConsequences(s),0);
});
test('新聞頁面、操作按鈕及 Service Worker 離線快取已接入',()=>{
 const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(ui,/\['news','新聞政策'\]/);assert.match(ui,/data-act="newsAction"/);
 assert.match(sw,/js\/news-system\.js/);assert.match(sw,/tls-4\.0\.3-completion-v1/);
});
