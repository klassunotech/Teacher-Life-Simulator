// 由 tools/out/*.json 產生 BALANCE_REPORT.md（所有數字來自真實引擎模擬，不手填）
import fs from 'node:fs';
const J=n=>JSON.parse(fs.readFileSync(new URL(`./out/${n}.json`,import.meta.url),'utf8'));
const g=J('gradient'),s=J('strategies'),p=J('paths'),fAll=J('finance'),f=fAll.balanced,fh=fAll.hard;
const cfg=JSON.parse(fs.readFileSync(new URL('../data/config.json',import.meta.url),'utf8')).balance;
const DN={easy:'輕鬆 Easy',balanced:'平衡 Balanced',hard:'困難 Hard'};
const PN={teaching:'教學專業型',management:'行政管理型',student:'學生發展型',curriculum:'課程發展型',study:'專業進修型',innovation:'教育創新型',leadership:'教育領導型',balanced:'平衡生活型'};
const k=x=>Math.round(x/1000)+'k';
const FN={single:'單身',married:'已婚',kids:'有子女',elder:'照顧長者'},LN={frugal:'節儉',standard:'一般',comfort:'優質'};
let md=`# BALANCE_REPORT — 3.3.0 平衡分析

> 所有數據由真實遊戲引擎（\`tools/sim-lib.mjs\`／\`tools/balance-sim.mjs\`）模擬得出，可用 \`node tools/balance-sim.mjs all 100 && node tools/make-report.mjs\` 重現。每個難度每個設定 **100 個 Seed**，使用相同 Seed 集合以便比較。
> 官立／資助學校教師底薪按 2026 年 4 月 1 日起生效的 MPS 薪點計算；直資／私立校本薪酬、家庭支出、退休儲備及退休金仍屬遊戲模擬。

## 0. 方法與定義
- **崩盤**：期末健康 ≤ 25，或（壓力 ≥ 90 且精力 ≤ 15）。**過勞率**：期末壓力 ≥ 85 的比例。
- 事件選擇固定輪替選項 0／1／2（以涵蓋不同選擇），所有模擬使用同一組 Seed。
- 所有可調參數集中於 \`data/config.json → balance\`（疲勞、精力、壓力、技能成長及荒廢、健康、難度倍率、財務、職涯路線、職級門檻）。
- 本次模擬假設玩家按固定配置行動；真人玩家可按情況調整，因此結果代表「固定策略的下限／趨勢」，並非最優玩法。

## 1. 教學 AP 梯度（12 個月）
兩組配置：**A 標準**＝行政 10／家庭 10／專業 5，其餘休息；**B 留休息**＝行政 5／家庭 5，其餘全部休息。
格式：壓力／精力／健康／教學／崩盤%／過勞%。
`;
for(const d of Object.keys(DN)){
  md+=`\n### ${DN[d]}\n| 配置＼教學 AP | 20 | 30 | 40 | 50 | 60 | 70 | 80 |\n|---|---|---|---|---|---|---|---|\n`;
  for(const [tn,row] of Object.entries(g[d])){md+=`| ${tn} | ${Object.values(row).map(v=>`${v.stress}/${v.energy}/${v.health}/${v.teaching}/${v.collapse}%/${v.burnout}%`).join(' | ')} |\n`}
}
md+=`
**結論**
- 壓力及精力隨教學 AP **平滑變化**，沒有 3.0.1 時「50→60 AP 之間的懸崖」；教學 60 AP 在 B 配置下於平衡難度壓力約 ${g.balanced['B留休息(行政5/家庭5/其餘休息)'][60].stress}、崩盤 ${g.balanced['B留休息(行政5/家庭5/其餘休息)'][60].collapse}%。
- 教學 70 AP＋休息不足才會高機率崩盤（平衡 A 配置 70 AP 崩盤 ${g.balanced['A標準(行政10/家庭10/專業5/其餘休息)'][70].collapse}%）；80 AP 且幾乎無休息基本必然崩盤——這是合理代價，而非單憑「超過 50 AP」。
- 教學成果隨投入上升，但有**遞減回報**（成長軟上限＋荒廢）；過度投入因疲勞及壓力令表現倍率下降，所以 70–80 AP 的教學成果與 60 AP 相約，代價卻大得多。
- 三種難度有**實質差異**（見各表：同一配置下壓力、精力、過勞率隨難度明顯拉開）。

## 2. 策略比較（36 個月；家庭狀況及學科輪替；平均值）
策略定義見 \`tools/balance-sim.mjs → STRATEGIES\`。欄位：壓力／精力／健康／財富／教學／行政／專業／學生／家庭／滿意／職級／崩盤%。
`;
for(const d of Object.keys(DN)){
  md+=`\n### ${DN[d]}\n| 策略 | 壓力 | 精力 | 健康 | 財富 | 教學 | 行政 | 專業 | 學生 | 家庭 | 滿意 | 職級 | 崩盤 |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  for(const [n,v] of Object.entries(s[d]))md+=`| ${n} | ${v.stress} | ${v.energy} | ${v.health} | ${k(v.wealth)} | ${v.teaching} | ${v.administration} | ${v.professional} | ${v.student} | ${v.family} | ${v.satisfaction} | ${v.rank} | ${v.collapse}% |\n`;
}
const sb=s.balanced;const best=m=>Object.keys(sb).reduce((a,b)=>sb[b][m]>sb[a][m]?b:a);
md+=`
**結論**：教學最高＝「${best('teaching')}」、行政最高＝「${best('administration')}」、專業最高＝「${best('professional')}」、學生關係最高＝「${best('student')}」、家庭關係最高＝「${best('family')}」、職級最高＝「${best('rank')}」、滿意度最高＝「${best('satisfaction')}」。**沒有任何策略在所有指標領先**；工作狂策略在平衡難度崩盤 ${sb['工作狂'].collapse}%（困難 ${s.hard['工作狂'].collapse}%）；休息導向壓力最低但技能及職級落後；「平衡」雖穩健，教學／行政／專業均不是最高，且職級不及行政導向。

## 3. 八條職涯路線
模擬：自由模式，家庭狀況（單身／已婚／有子女／長者）及學科（中／英／數／科學／歷史／公民／資訊科技／體育）輪替，**學科中立性檢查：各學科皆可完成各路線**。
每條路線使用一套與路線相符的 AP 配置（\`PATH_PLANS\`），並用同一個自動策略：每 3 個月申請升職、接受邀請、符合條件時進修（中層領導培訓／校長資格培訓／路線相關課程）、每年做一次路線專案。
輕鬆及困難模擬 10 年（120 月）；**平衡難度模擬 20 年（240 月）**。
完成率定義：教學／學生／課程＝至少 SGM（職級索引≥3）；行政／教育領導＝至少校長（二級，索引≥7）；進修＝至少 SGM 且證書≥4；創新＝至少 SGM 且成功完成創新專案；平衡＝健康≥60、滿意≥60、家庭≥55。
`;
for(const d of Object.keys(DN)){
  md+=`\n### ${DN[d]}（${p[d].teaching.months} 個月）\n| 路線 | 平均職級索引 | SGM+ | PGM+ | 校長 II+ | 校長 I | 完成率 | 壓力 | 健康 | 財富 | 教學 | 行政 | 專業 | 領導 | 學生 | 家庭 | 滿意 | 崩盤 |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  for(const [id,name] of Object.entries(PN)){const v=p[d][id];md+=`| ${name} | ${v.rankAvg} | ${v.reachSGM}% | ${v.reachPGM}% | ${v.reachPrincipal}% | ${v.reachPrincipalI}% | ${v.completion}% | ${v.stress} | ${v.health} | ${k(v.wealth)} | ${v.teaching} | ${v.administration} | ${v.professional} | ${v.leadership} | ${v.student} | ${v.family} | ${v.satisfaction} | ${v.collapse}% |\n`}
}
md+=`
**結論**
- 每條路線有**不同優勢與代價**：教學型教學最強但職級上限 ${cfg.paths.teaching.cap}；行政及領導型可達校長但壓力較高；專業進修型專業最高但需每月學費；學生發展型學生關係最高；平衡生活型壓力最低、家庭及滿意度最好但晉升較慢。
- **校長不是必然**：平衡難度 20 年，行政管理型 ${p.balanced.management.reachPrincipal}%、教育領導型 ${p.balanced.leadership.reachPrincipal}%；其餘路線 0%（需轉路線）。校長職位另受 **年度隨機空缺**、資格證書及更強競爭影響。
- 其他路線的職級上限靠「領導力≥${cfg.rankGate.beyondCapLeadership}＋${cfg.rankGate.midCredential}」最多再升一級；校長（二級／一級）一定要行政管理型或教育領導型。
- **已知偏差（如實報告）**：
  - 行政管理型的校長比例高於教育領導型（見表）。原因：本模擬中行政管理型的行政投入（30 AP）使其行政能力接近滿分，而領導型要兼顧教學；真人玩家的配置不同。教育領導型在高層競爭有 ${cfg.paths.leadership.topEdge} 分優勢，並有領導力成長加成，但未能抵消配置差異。此項**未達到理想設計**，建議日後再以真人數據調整。
  - 困難難度下教育領導型 10 年完成率偏低（高壓力＋高競爭），符合「困難」定位，但如玩家覺得過於嚴苛，可調低 \`paths.leadership.extraStress\`。

## 4. 財務及退休（20 年，再模擬 25 年退休）
### 4.1 平衡難度
路線：教學專業型（職級上限 3，屬較保守的收入情境）；AP 配置：平衡；每格 100 Seed。財富＝現金（k＝千元，**負數＝負債，上限 ${k(cfg.finance.debtFloor)}**）。
| 家庭 | 生活質素 | 20 年財富 p10／p50／p90 | 退休 25 年後財富 p10／p50／p90 | 退休後赤字比例 |
|---|---|---|---|---|
`;
for(const fam of Object.keys(f))for(const l of Object.keys(f[fam])){const v=f[fam][l];md+=`| ${FN[fam]} | ${LN[l]} | ${v.wealth20y.p10}／${v.wealth20y.p50}／${v.wealth20y.p90}k | ${v.retireWealthEnd.p10}／${v.retireWealthEnd.p50}／${v.retireWealthEnd.p90}k | ${v.retireNegativePct}% |\n`}
md+=`
### 4.2 困難難度（同一模擬）
| 家庭 | 生活質素 | 20 年財富 p10／p50／p90 | 退休 25 年後財富 p10／p50／p90 | 退休後赤字比例 |
|---|---|---|---|---|
${Object.keys(fh).flatMap(fam=>Object.keys(fh[fam]).map(l=>{const v=fh[fam][l];return `| ${FN[fam]} | ${LN[l]} | ${v.wealth20y.p10}／${v.wealth20y.p50}／${v.wealth20y.p90}k | ${v.retireWealthEnd.p10}／${v.retireWealthEnd.p50}／${v.retireWealthEnd.p90}k | ${v.retireNegativePct}% |`})).join('\n')}

**結論**
- 財富成為真實選擇：**節儉**所有家庭穩健（平衡難度退休赤字 ${['single','married','kids','elder'].map(x=>FN[x]+' '+f[x].frugal.retireNegativePct+'%').join('、')}）；**一般**退休赤字比例：${['single','married','kids','elder'].map(x=>FN[x]+' '+f[x].standard.retireNegativePct+'%').join('、')}；**優質**退休赤字：${['single','married','kids','elder'].map(x=>FN[x]+' '+f[x].comfort.retireNegativePct+'%').join('、')}（優質生活只有單身及部分高收入玩家負擔得起，其餘家庭長期貼近負債上限）。
- 困難難度下，有子女／長者家庭以「一般」生活質素的 20 年財富中位數為 ${fh.kids.standard.wealth20y.p50}k／${fh.elder.standard.wealth20y.p50}k（仍為正），但 p10 貼近負債上限，退休赤字 ${fh.kids.standard.retireNegativePct}%／${fh.elder.standard.retireNegativePct}%；改用「節儉」則 p10 為 ${fh.kids.frugal.wealth20y.p10}k／${fh.elder.frugal.wealth20y.p10}k。即困難難度**有生存空間，但需要主動調整生活質素及儲蓄**。
- 財富不能購買 AP；財富用途有冷卻時間；負債有利息、壓力及 ${k(cfg.finance.debtFloor)} 上限；退休每次活動＝1 年，25 年後完結，不再可無限累積（3.0.1 的 A7 問題已修正）。
- 這是以「教學專業型（職級上限 3）」為例；升至高層的玩家收入明顯較高（見路線表財富欄）。
- **財務自由**門檻提高至 ${k(cfg.finance.freedomAt)}（現金＋退休儲備）。

## 5. 難度定位驗證
| 難度 | 設計 | 驗證 |
|---|---|---|
| Easy | 較大修正空間 | 同配置壓力較低、過勞率較低、財富較高（見 §1、§2） |
| Balanced | 需取捨 | 教學 60–70 AP 有真實風險；各策略互有勝負（§2） |
| Hard | 需精準分配 | 壓力／過勞率顯著提高；有子女／長者家庭可靠節儉生活穩健過關（§4.2）；**非單純拉高所有負面數值**，而是調整壓力流入、精力成本、休息效率、健康損耗、收入／支出、事件嚴重度及升職門檻 |

## 6. 限制與未驗證
- 模擬只覆蓋固定策略；真實玩家（如會因事件調整分配）的結果需要實際遊玩資料。
- 事件選項以固定輪替代替「聰明選擇」，因此事件對結果的影響偏平均。
- 財務模擬的路線為教學專業型，未涵蓋所有路線×家庭組合。
- 平衡 Easy／Hard 的路線模擬只跑 10 年。
`;
fs.writeFileSync(new URL('../BALANCE_REPORT.md',import.meta.url),md);console.log('BALANCE_REPORT.md',md.length,'chars');
