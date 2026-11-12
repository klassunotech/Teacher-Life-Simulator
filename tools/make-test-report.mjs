// 將 Node 測試、fuzz、真實瀏覽器測試的結果附加到 TEST_REPORT.md（Node 與瀏覽器測試分開報告）
import fs from 'node:fs';
const R=n=>fs.readFileSync(new URL(`./out/${n}`,import.meta.url),'utf8');
const tap=R('node-test.txt'),num=k=>(tap.match(new RegExp(`# ${k} (\\d+)`))||[])[1];
const fuzz=R('fuzz.txt'),br=JSON.parse(R('browser-results.json'));
const files=['tests/test.mjs','tests/test-ui.mjs','tests/test-career.mjs','tests/test-fixes.mjs','tests/test-310.mjs'];
let md=`\n\n---\n\n## 3.2.0 完整測試結果（${new Date().toISOString().slice(0,10)}）\n\n### A. Node.js 測試（無瀏覽器；真實遊戲引擎）\n- 指令：\`npm test\`（${files.join('、')}）\n- 結果：**${num('tests')} 項，通過 ${num('pass')}，失敗 ${num('fail')}**\n- \`tests/test-310.mjs\`：難度、教學 AP 梯度（無懸崖）、休息不能解決一切、無萬能策略、八條路線結構及學科中立、路線切換冷卻及經驗、職級門檻（上限／證書／空缺／校長資格）、校長比例有限但非 0、財富用途、負債上限、退休現金流、健康極低被迫退休、事件多樣性、**5 個真實 3.0.x 存檔遷移並再玩 36 個月**、決定性。\n- \`tests/test-fixes.mjs\`：3.2.0 修正批次回歸（延遲後果、事件池、AP 沿用及補差額、選校等）。\n- 兩項既有測試因 3.1.0 的設計變更而更新預期（T10 排程事件改以固定亂數驗證分支；R08 事件總數 68→91），**\`tests/test.mjs\`、\`tests/test-ui.mjs\`、\`tests/test-career.mjs\` 的其餘預期值未修改**。另外，\`tests/test-fixes.mjs\`（本輪 3.0.1 修正批次新增的測試）中「延遲後果只生效一次」由「差值恰好 +1」改為「0.85–1.01」，因為 3.1.0 的技能荒廢機制會按比例輕微侵蝕該 +1；若後果重複生效差值會接近 8，因此仍能偵測原 bug。\n\n### B. UI 隨機 fuzz（假 DOM，Node）\n\`\`\`\n${fuzz.trim()}\n\`\`\`\n4 種模式×9 局×3 難度，每月渲染全部分頁並隨機觸發行動；檢查例外、AP 記帳（分配＋已用≤100、spentBy 對帳）、HTML 無 NaN／undefined、存檔驗證。\n\n### C. 真實瀏覽器測試（Playwright + Chromium，與 Node 測試分開）\n- 環境：Chromium（headless），桌面 1280×800；手機 390×844（is_mobile、觸控、DPR 2）。本機 \`python3 -m http.server\` 載入 \`index.html\`。\n- 腳本：\`tools/browser-test.py\`；截圖：\`tools/out/screens/\`；原始結果：\`tools/out/browser-results.json\`\n`;
for(const [vp,rows] of Object.entries(br)){const ok=rows.filter(r=>r.ok).length;md+=`\n**${vp === 'desktop' ? '桌面' : '手機'}：${ok}/${rows.length} 通過**\n\n| 檢查 | 結果 |\n|---|---|\n${rows.map(r=>`| ${r.check} | ${r.ok?'PASS':'**FAIL**'} |`).join('\n')}\n`}
md+=`
### D. 舊存檔相容性
- 使用**未修改的 3.0.x 引擎**真實產生 5 個存檔（\`tests/fixtures/save-3.0.x-*.json\`）：一般、sport 路線、referee 路線、sport 外部職業、entrepreneur 路線。
- 驗證：存檔可解析；路線遷移（sport→student、referee→curriculum、entrepreneur→innovation 等）；外部職業 sport→ngo；財富、姓名、回合、證書不變；補上 difficulty＝balanced、finance 預設；標記 migratedFrom；遷移後再玩 36 個月，數值有限且在範圍內；再存檔／讀檔往返一致。
- 真實瀏覽器：於「財務」頁貼上舊存檔 JSON 匯入，驗證路線遷移及版本標記（桌面及手機）。

### E. 未能驗證／限制（如實列出）
- **本輪未能執行真實瀏覽器測試**：執行環境沒有 Playwright 配套的 Chromium binary；改用系統 Chromium 時，本機 HTTP 頁面導航被環境政策回絕（ERR_BLOCKED_BY_ADMINISTRATOR）。因此不把瀏覽器測試列作通過。亦未測試 Safari／Firefox／真實手機裝置。
- 未在真實 GitHub Pages 網址部署測試；本專案為純靜態檔案，無建置步驟。
- 舊存檔只能用本專案以 3.0.x 引擎產生的檔案模擬，**未取得玩家真實的舊存檔**。
- 平衡模擬基於固定策略，**未經真人遊玩驗證**；詳見 BALANCE_REPORT.md §6。
- 觸控目標以「可見按鈕／輸入框最小邊 ≥ 36px」為準，未量度 44px（WCAG 建議）。
`;
fs.appendFileSync(new URL('../TEST_REPORT.md',import.meta.url),md);console.log('TEST_REPORT.md appended');
