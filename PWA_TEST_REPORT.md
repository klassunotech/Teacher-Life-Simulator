# PWA 測試報告 — 3.4.2

## 靜態檢查

- `manifest.webmanifest` 保留名稱、啟動畫面、顯示模式及圖示。
- Service Worker cache key 更新為 `tls-3.4.2-shell-v1`。
- Service Worker 使用相對路徑，適用 GitHub Pages 專案子路徑。
- activate 階段會清除舊版 `tls-*` cache。
- 3.4.2 核心 JavaScript、CSS、JSON、圖示仍列入快取。
- Node PWA 靜態測試通過；專案所列 PWA 資產均存在。

## 真實瀏覽器測試

已嘗試使用系統 Chromium（`/usr/bin/chromium`）及 Playwright 啟動本機靜態伺服器並執行 `tools/browser-test.py`。桌面及手機測試均於 `page.goto(http://localhost:8123/index.html)` 被環境封鎖，錯誤為 `ERR_BLOCKED_BY_ADMINISTRATOR`。

因此以下項目仍需真人瀏覽器／手機驗證：

- 桌面 Sticky Header、內容捲動及按鈕點擊。
- 360px／390px／430px 手機版橫向溢位、底部導航及 Safe Area。
- iOS Safari 加入主畫面及離線啟動。
- Android Chrome 安裝提示及離線啟動。
- 更新後 Service Worker 接管、舊 cache 清除及存檔保留。

**本報告只確認靜態資產與自動化測試，不聲稱 PWA 真機安裝或離線流程已通過。**
