# Teacher Life Simulator 4.0.1 — Hong Kong School News Edition

香港中學教師職涯與生存模擬 RPG。純前端 HTML、CSS、JavaScript ES Modules 及 JSON，無需後端或付費 API；支援 PWA、瀏覽器本機存檔及離線快取。

## 開始遊戲

- 本機：`python -m http.server 8000`，然後開啟 `http://localhost:8000`。
- GitHub Pages：可部署整個專案資料夾；本次沒有部署或 Push。
- PWA：首次連線載入後快取遊戲程式及資料。Chrome／Edge 可使用安裝入口；iPhone Safari 可使用「分享 → 加入主畫面」。

## 3.4.2 主要系統

### 香港教師職涯及薪酬

- 正式職級：學位教師（GM）、高級學位教師（SGM）、首席學位教師（PGM）、校長（二級）、校長（一級）。
- 按 EDB 2026 年 8 月薪酬評估指南：GM 學位未受訓模擬起點 Pt.15／薪酬關限 Pt.20；Degree + PGDE／PCEd 或 BEd 受訓教師模擬起點 Pt.17。未受訓 GM 完成認可教師訓練後模擬獲兩薪點資格增額並解除關限。
- 按可認可年資、年度表現、薪級上限及晉升承接薪點；增薪進度以 12 個合資格服務月顯示。碩士／博士學位不自動加薪，ICQ 須個別核定。
- 薪酬系統是可遊玩的簡化模型，並非教育局個別薪金評估工具；no-pay leave、兼職年資、RT/PT、資助來源、個別增薪日期及特殊薪酬安排尚未完整模擬。詳見 `SALARY_VERIFICATION_REPORT.md` 及 `PROFESSIONAL_DEVELOPMENT_REPORT.md`。

### Perm／Contract

- 常額教師（Perm）沒有固定合約到期日，可參與正式晉升競爭。
- 合約教師（Contract）有 12、24 或 36 個月等不同合約期；到期評估包括學校人手需要、工作表現、管理層支持、學校財政及競爭因素。
- 合約教師須先爭取常額職位；未取得 Perm 前不可直接晉升 SGM、PGM 或校長。
- 合約薪酬及福利以聘書為準。遊戲以同級 MPS 作計算參考，不代表所有合約聘用均享有與常額教師相同薪酬或退休福利。

### 三套獨立資源

| 資源 | 用途 | 取得方式 |
|---|---|---|
| AP | 備課、教學、批改、行政、學生支援、會議、課外活動及校務工作 | 每月工作資源 |
| CP | 校長、同事、家長及學生溝通；爭取支持 | 每月投入課外活動 AP 等工作成果 |
| PD | 報讀課程及專業發展 | 每月投入專業發展 AP |

AP 每月有限，長期忽略工作類別會影響評核及職涯；不同職級的工作負荷倍率亦不同。溝通及進修不會再直接佔用 AP，只有報讀課程的指定時間部分會扣除 AP。

### 專業進修

20 項課程，分五類。未受訓學位教師可重新報讀兩年兼讀制 PGDE／PCEd（30–33 學分），首年及第二年分期繳費，亦可申請遊戲內校本資助。系統分開追蹤在職 CPD 核心 30 小時、新入職教師 NJT 核心 30＋選修 60 小時，以及晉升指定核心 30＋SGM 60／PGM 100 小時選修；另記錄課程時數、月數、PD、AP、學費、完成條件及校方認可。

新入職教師每三年 150 小時是整體 CPD 軟指標；未達時會出現進度關注信，不會自動當成正式紀律警告。核心 30 小時不足會獨立觸發正式教育局跟進／警告風險。校本共同備課、同儕觀課、校本研討及反思可計入整體 CPD，但不會自動計作 NJT 指定選修。

財務頁亦會顯示 PGDE 第二年學費的每月預留額及一次性待繳金額，避免學費只在扣款時才突然出現。

### 生存及學校風險

- 健康歸零：死亡 Game Over；可求醫、休息及申請病假。
- 長期表現不達標：依次進入口頭提醒、正式警告、改善計劃、最終評估，持續不改善可被解僱 Game Over。
- 學校收生下降：關注、正式風險、結束辦學公告及六個月轉校窗口；招聘要求按學校條件不同。期限前未能轉校則 Game Over。
- 轉校成功率受工作紀錄、專業能力、職級、管理層評價及學校招聘要求影響；每月最多申請一次，每次需 5 點專業 AP。

## 舊存檔

3.3.1、3.4.0 及 3.4.1 存檔可遷移至 3.4.2。新增聘用、CP、PD、學校健康及 Game Over 欄位會補上預設值；既有角色、年資、職級、資產及歷史紀錄保留。建議升級前仍匯出 JSON 備份。

## 開發及測試

- `npm test`：110/110 通過。
- `node tools/fuzz-ui.mjs`：約 34,003 次 UI 隨機操作測試，0 問題。
- `node tools/sim-342.mjs`：11 種策略，每種 100 個 random seeds，共 1,100 次情境模擬。
- `node tools/cpd-sim-342.mjs`：4 種進修策略 × 100 seeds，共 400 局。
- `tools/out/sim-342.json`：完整模擬結果。
- `TEST_REPORT.md`、`BALANCE_REPORT.md`、`PWA_TEST_REPORT.md`：測試及限制。
- `tools/browser-test.py`：真實 Chromium 桌面／手機流程測試；本次 Playwright Chromium 已啟動，但環境封鎖 localhost 導航（ERR_BLOCKED_BY_ADMINISTRATOR），因此未能完成真人瀏覽器驗證。

## 重要限制

遊戲的合約續聘機率、表現門檻、學校收生趨勢、招聘要求、轉校成功率、死亡及解僱條件均為遊戲平衡模型，不代表香港教育局的法定程序或真實學校招聘統計。薪酬資料核對 MPS 表及教師資格起薪規則；個別教師的起薪、增薪日期、薪點承接及合約福利仍須由學校／教育局按聘書及服務紀錄核定。真實手機安裝、離線啟動及 iOS sticky 行為仍需在實機驗證。

## 4.0.0 — School Ecosystem Foundation

4.0.0 builds on the existing 3.4.2 game rather than replacing its career, salary, AP/CP/PD, PGDE, health, finance, retirement, story-event, save and PWA systems.

### New connected systems

- **School identity:** game-only Band 1/2/3 intake positioning, school specialty, sponsor culture, school stage, classes and a three-year development-cycle record. Banding is explicitly a simulation label, not an EDB classification.
- **School KPI:** weighted academic performance, value-added, holistic development, student support, attendance, safety, teacher morale, parent trust, intake and specialty metrics. KPI weights vary by simulated band.
- **Student cohort:** 48 representative individual student agents with ability, motivation, family support, economic context, attendance, stress, habits, interests, SEN profile and longitudinal monthly history. They are representative agents, not a literal full-school census.
- **Teaching model:** balanced, intensive examination practice, differentiated teaching, teacher-led instruction and project learning affect student progress, motivation, stress and attendance each month.
- **Staff network:** 12 named colleague agents with personality, ability, stress, trust, cooperation, influence, goals, memories and colleague-to-colleague relationship values. Collaboration, workload support and disagreement are actionable.
- **Administration workbench:** creates auditable procurement, off-campus activity risk-assessment and parent-complaint records. The examples are game workflows; thresholds and approval levels must be checked against the actual school's applicable policy.
- **Causal events:** low academic KPI, excessive teaching load and poor overall KPI can schedule delayed department review, student-pressure and school-accountability follow-ups.
- **Persistence:** save wrapper schema version 2; schema version 1 saves remain readable and are hydrated with 4.0 ecosystem defaults.

### Current 4.0 scope boundary

This is a substantial first 4.0 implementation tranche, not a claim that every item in the master brief is finished. Full safeguarding multi-stage case management, detailed per-student intervention plans and specialist referrals, full school-wide staffing/appointment/allowance workflow, comprehensive policy-source-linked scenario library, separate household/insurance/investment planning, and full subject-specific DSE grade distributions remain future work. The new student model currently uses 48 representative agents. The current PWA and responsive layout are retained, but installation/offline behavior still needs real-device verification.

### Run and test

- `npm test`: 117/117 Node tests pass (including seven new 4.0 ecosystem tests).
- `node tools/fuzz-ui.mjs`: approximately 34,003 randomized UI actions, zero reported problems.
- Full legacy strategy Monte Carlo (`tools/sim-342.mjs`) was attempted after adding per-student monthly simulation but exceeded the execution time limit; it is not reported as passed.
- Real browser/mobile/PWA installation tests remain unverified in this environment.

## 4.0.1 香港中學新聞與政策動態

遊戲新增「新聞政策」分頁，內置截至 2026-11-11 搜集的十則香港中學教育新聞及官方政策資訊，包括：

- 匯流升級計劃及學校合併資源整合；
- 學生精神健康三層支援、危機轉介及校園精神健康推廣；
- SEN 學生留級及專業諮詢；
- 中學中一班數及收生規劃；
- 私立中學市場變化；
- 2026 全港性系統評估中三中英數表現；
- 學生高風險個案轉介及校園安全。

玩家可花費行政 AP 選擇校本跟進行動。行動會即時影響部分校本 KPI／管理狀態，並於指定月份產生延遲檢討效果。所有遊戲效果均明確標示為模擬假設，不代表教育局規則或政策成效承諾。

新聞頁會顯示報道日期、來源、分類、摘要及原文連結。官方公布與媒體報道分開標示。資料來源及使用界線見 `NEWS_SOURCES.md`。新聞資料內置於專案，無需遊戲時連線抓取新聞；新版本首次載入後亦會由 Service Worker 快取新聞引擎，支援離線閱讀。

升級方式：將 4.0.1 專案整個資料夾內容部署至 GitHub Pages。不要只更新 HTML。存檔會在載入時自動補上 `news` 欄位，無需清除瀏覽器資料。


### 4.0.2 重要時刻分享
在「職涯」頁可按「分享目前職涯卡」或「分享最近一次升職」，在人生總結頁亦可產生紀念圖片。支援瀏覽器原生分享；若裝置不支援分享圖片，會下載 PNG，再自行分享到社交平台。圖片只在本機產生。
