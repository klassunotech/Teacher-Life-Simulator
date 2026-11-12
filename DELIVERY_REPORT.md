# Teacher Life Simulator 4.0.3 交付報告

## 本次完成
- 保留 3.4.2 核心職涯及 4.0 校園生態／新聞政策功能。
- 新增學生支援個案生命周期、SEN 個別支援計劃及學生保護升級流程。
- 新增教職員專業指導、改善計劃、續約評估、晉升建議及離職程序。
- 新增校務行政文件索取、核對、批核及歸檔流程。
- 新增學年末學科成績指數及級別分布模擬報告。
- 保留 4.0.2 重要時刻 PNG 分享卡。
- Service Worker cache key 更新至 4.0.3。

## 測試
- `node --check js/game-engine.js`：通過。
- `node --check js/ui.js`：通過。
- `npm test`：133 tests，133 pass，0 fail。
- 新增 6 項 4.0.3 個案、人事、行政、DSE 及 UI 流程測試。

## 尚未人工驗收
- 真實手機原生分享面板及社交平台接收圖片。
- iOS Safari／Android Chrome 的安裝、離線及不同螢幕尺寸。
- 長時間遊玩下各項新流程的難度及經濟平衡。

## 部署
解壓完整 ZIP，將 `Teacher-Life-Simulator-4.0.3` 內所有檔案覆蓋 GitHub Pages repository 網站根目錄，commit 並 push。若仍見舊版，關閉並重新開啟網站，或清除該網站快取／Service Worker。
