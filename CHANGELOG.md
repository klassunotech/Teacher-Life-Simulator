## 4.0.0 Hotfix — 4.0 生態分頁

- 修正 `js/ui.js` 未定義 `traitNames`，令切換至「4.0生態」時發生 `ReferenceError`、無法渲染的問題。
- 將 Service Worker cache key 更新至 `tls-4.0.0-shell-v2`，避免部署後繼續使用舊版快取。
- 已重新執行全部 Node 自動測試：117/117 通過。

# CHANGELOG — Teacher Life Simulator

## 4.0.0 — School Ecosystem Foundation

- Preserved the 3.4.2 career, salary, AP/CP/PD, PGDE, health, finance, retirement, event, save and PWA foundations.
- Added school identity state, simulated Band 1/2/3 positioning, school specialties and three-year development-cycle records.
- Added ten weighted school KPI indicators with different simulated Band weight profiles.
- Added 48 representative individual student agents with longitudinal learning, motivation, stress and attendance records, plus SEN profiles.
- Added five teaching strategies with distinct student progress and wellbeing effects.
- Added 12 colleague NPCs with personality, goals, stress, trust, cooperation, memory and colleague relationship graphs.
- Added actionable colleague interaction and auditable school administration workbench records.
- Added delayed causal follow-ups for academic underperformance, intensive teaching load and school KPI risk.
- Added save schema v2 with v1 compatibility and ecosystem hydration.
- Added the ecosystem UI page and 4.0 Service Worker cache.

## 3.4.2 and earlier

See the archived 3.4.2 notes below in project history and prior reports.

## 4.0.1 — 香港中學新聞與政策版

- 新增「新聞政策」分頁，收錄截至 2026-11-11 的十則香港中學教育新聞／官方政策資訊。
- 每則資料標示日期、來源、分類及原文連結。
- 新增校本跟進選項，消耗行政 AP，立即影響校本 KPI／管理狀態，並可於數月後觸發延遲檢討效果。
- 新增新聞行動及後續紀錄，支援存檔。
- Service Worker 快取版本更新並快取 `news-system.js`。
- 新增新聞資料來源說明及測試。


## 4.0.2 — 重要時刻圖片分享
- 新增職涯紀念卡：可將目前職級、學校、年資及狀態繪製成 1200×630 PNG。
- 新增最近一次升職紀念卡；尚未有升職紀錄時會提示，不會產生虛構升職資料。
- 人生總結畫面新增分享圖片入口。
- 支援裝置原生分享（Web Share API）；不支援時自動下載 PNG。圖片在本機瀏覽器生成，不會上傳角色存檔。
- 更新 PWA 快取版本，確保 GitHub Pages 用戶可取得新 UI。

## 4.0.3 — 完成流程擴充
- Student support lifecycle: assessment, plan, referral, safeguarding escalation, review, closure.
- Staff HR lifecycle: coaching, performance improvement, contract review, promotion recommendation, exit record.
- Administration workflow: request documents, verify, approve, archive.
- End-of-year subject performance simulation with distributions.
- Regression coverage expanded to 133 passing tests.
