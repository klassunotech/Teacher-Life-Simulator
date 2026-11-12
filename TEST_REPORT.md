# Teacher Life Simulator 4.0.3 — Test Report

## Automated regression

| Check | Result |
|---|---:|
| Full Node regression suite | **133 / 133 PASS** |
| New 4.0.3 lifecycle tests | 6 / 6 PASS |
| JavaScript syntax checks (`js/*.js`) | PASS |
| Legacy save migration and long-run core tests | PASS |
| News policy actions and delayed consequences | PASS |
| PNG milestone-share UI and Service Worker cache tests | PASS |
| Real iOS / Android native sharing and social-app handoff | NOT MANUALLY VERIFIED |
| Real browser responsive layout / offline install | NOT MANUALLY VERIFIED |

Run locally with `npm test` from the project folder.

## 4.0.3 completion coverage

1. Student support case lifecycle: assessment, individual support plan, specialist referral, safeguarding escalation, review and closure.
2. SEN support plan includes a game-model list of classroom / assessment accommodations.
3. Staff HR lifecycle: coaching, performance improvement plan, contract review, promotion recommendation and departure record.
4. Administration records can progress through document request, verification, approval and archive.
5. End-of-year subject performance model creates subject-level indicators and level distributions, and prevents duplicate annual reports.
6. UI renders the new controls and invokes the engine actions.
7. New state fields are stored within the existing save object; previous save schema remains loadable.

## Known verification limits

The project is a client-side simulation. Student risk flags are not diagnoses; safeguarding flows are illustrative and do not replace school-designated safeguarding leads, emergency services, statutory reporting, or professional judgement. DSE outputs are game indicators, not HKDSE predictions. Staff HR actions are fictional school-management decisions and do not implement every contract, employment-law, union, grievance, appeal or SMC/IMC approval requirement. Real-device sharing, browser installation, and offline behavior still require manual acceptance testing.

## Teacher Life Simulator 3.0.0 視覺與回歸測試（node tests/test-ui.mjs）

| ID | 測試 | 預期 | 實際 | 狀態 |
|---|---|---|---|---|
| R01 | 保護原有角色、隨機數及科目資料 | 角色建立及隨機模組維持原樣 | 2 個核心角色／隨機／科目檔案保持一致；career data 擴充屬預期 | PASS |
| R07 | 選校提供 16 間學校及七種宗教背景 | 官立／資助／直資／私立；天主教、基督教、佛教、道教、孔教、伊斯蘭教、非宗教 | 16 間；7 種宗教背景；4 種辦學類別 | PASS |
| R02 | 10 個場景皆可生成 SVG，且無外部 URL | 10 個場景、無 http 圖片 | classroom,staffroom,playground,principal,corridor,gate,gym,hall,computer,rest | PASS |
| R03 | 所有事件類別皆對應場景與 NPC | 60 個事件都有 | work,parent,admin,student,career,health,colleague,professional,family,personal | PASS |
| R08 | 新增職場及行政事件資料完整 | 60 個事件；每個事件至少 3 個選項；效果欄位有效 | 68 個事件，選項及效果欄位完整 | PASS |
| R04 | 主畫面顯示角色、場景、AP、日期、導覽；場景可切換 | HTML 含 sprite/stage/AP/學年/scene 按鈕 | OK | PASS |
| R05 | 事件畫面為對話場景；結果畫面有回饋 | NPC、名牌、對話框、選項；結果含「你選擇了」 | 12 個事件畫面／結果畫面 | PASS |
| R06 | 存檔擴充及舊結構遷移 | 新欄位可存取；缺少新欄位的舊存檔可補齊 | 新存檔及舊結構遷移正常 | PASS |
| R09 | 自動時間推進及 NPC 關係 | 倒數結束只結算一次；互動記錄信任變化 | 倒數自動結算一次；NPC 信任及記憶更新 | PASS |

## Teacher Life Simulator 3.0.0 視覺與回歸測試（node tests/test-ui.mjs）

| ID | 測試 | 預期 | 實際 | 狀態 |
|---|---|---|---|---|
| R01 | 保護原有角色、隨機數及科目資料 | 角色建立及隨機模組維持原樣 | 2 個核心角色／隨機／科目檔案保持一致；career data 擴充屬預期 | PASS |
| R07 | 選校提供 16 間學校及七種宗教背景 | 官立／資助／直資／私立；天主教、基督教、佛教、道教、孔教、伊斯蘭教、非宗教 | 16 間；7 種宗教背景；4 種辦學類別 | PASS |
| R02 | 10 個場景皆可生成 SVG，且無外部 URL | 10 個場景、無 http 圖片 | classroom,staffroom,playground,principal,corridor,gate,gym,hall,computer,rest | PASS |
| R03 | 所有事件類別皆對應場景與 NPC | 60 個事件都有 | work,parent,admin,student,career,health,colleague,professional,family,personal | PASS |
| R08 | 新增職場及行政事件資料完整 | 60 個事件；每個事件至少 3 個選項；效果欄位有效 | 68 個事件，選項及效果欄位完整 | PASS |
| R04 | 主畫面顯示角色、場景、AP、日期、導覽；場景可切換 | HTML 含 sprite/stage/AP/學年/scene 按鈕 | OK | PASS |
| R05 | 事件畫面為對話場景；結果畫面有回饋 | NPC、名牌、對話框、選項；結果含「你選擇了」 | 12 個事件畫面／結果畫面 | PASS |
| R06 | 存檔擴充及舊結構遷移 | 新欄位可存取；缺少新欄位的舊存檔可補齊 | 新存檔及舊結構遷移正常 | PASS |
| R09 | 自動時間推進及 NPC 關係 | 倒數結束只結算一次；互動記錄信任變化 | 倒數自動結算一次；NPC 信任及記憶更新 | PASS |

## Teacher Life Simulator 3.0.0 視覺與回歸測試（node tests/test-ui.mjs）

| ID | 測試 | 預期 | 實際 | 狀態 |
|---|---|---|---|---|
| R01 | 保護原有角色、隨機數及科目資料 | 角色建立及隨機模組維持原樣 | 2 個核心角色／隨機／科目檔案保持一致；career data 擴充屬預期 | PASS |
| R07 | 選校提供 16 間學校及七種宗教背景 | 官立／資助／直資／私立；天主教、基督教、佛教、道教、孔教、伊斯蘭教、非宗教 | 16 間；7 種宗教背景；4 種辦學類別 | PASS |
| R02 | 10 個場景皆可生成 SVG，且無外部 URL | 10 個場景、無 http 圖片 | classroom,staffroom,playground,principal,corridor,gate,gym,hall,computer,rest | PASS |
| R03 | 所有事件類別皆對應場景與 NPC | 60 個事件都有 | work,parent,admin,student,career,health,colleague,professional,family,personal | PASS |
| R08 | 新增職場及行政事件資料完整 | 60 個事件；每個事件至少 3 個選項；效果欄位有效 | 68 個事件，選項及效果欄位完整 | PASS |
| R04 | 主畫面顯示角色、場景、AP、日期、導覽；場景可切換 | HTML 含 sprite/stage/AP/學年/scene 按鈕 | OK | PASS |
| R05 | 事件畫面為對話場景；結果畫面有回饋 | NPC、名牌、對話框、選項；結果含「你選擇了」 | 12 個事件畫面／結果畫面 | PASS |
| R06 | 存檔擴充及舊結構遷移 | 新欄位可存取；缺少新欄位的舊存檔可補齊 | 新存檔及舊結構遷移正常 | PASS |
| R09 | 自動時間推進及 NPC 關係 | 倒數結束只結算一次；互動記錄信任變化 | 倒數自動結算一次；NPC 信任及記憶更新 | PASS |

## Teacher Life Simulator 3.0.0 視覺與回歸測試（node tests/test-ui.mjs）

| ID | 測試 | 預期 | 實際 | 狀態 |
|---|---|---|---|---|
| R01 | 保護原有角色、隨機數及科目資料 | 角色建立及隨機模組維持原樣 | 2 個核心角色／隨機／科目檔案保持一致；career data 擴充屬預期 | PASS |
| R07 | 選校提供 16 間學校及七種宗教背景 | 官立／資助／直資／私立；天主教、基督教、佛教、道教、孔教、伊斯蘭教、非宗教 | 16 間；7 種宗教背景；4 種辦學類別 | PASS |
| R02 | 10 個場景皆可生成 SVG，且無外部 URL | 10 個場景、無 http 圖片 | classroom,staffroom,playground,principal,corridor,gate,gym,hall,computer,rest | PASS |
| R03 | 所有事件類別皆對應場景與 NPC | 60 個事件都有 | work,parent,admin,student,career,health,colleague,professional,family,personal | PASS |
| R08 | 新增職場及行政事件資料完整 | 60 個事件；每個事件至少 3 個選項；效果欄位有效 | 68 個事件，選項及效果欄位完整 | PASS |
| R04 | 主畫面顯示角色、場景、AP、日期、導覽；場景可切換 | HTML 含 sprite/stage/AP/學年/scene 按鈕 | OK | PASS |
| R05 | 事件畫面為對話場景；結果畫面有回饋 | NPC、名牌、對話框、選項；結果含「你選擇了」 | 12 個事件畫面／結果畫面 | PASS |
| R06 | 存檔擴充及舊結構遷移 | 新欄位可存取；缺少新欄位的舊存檔可補齊 | 新存檔及舊結構遷移正常 | PASS |
| R09 | 自動時間推進及 NPC 關係 | 倒數結束只結算一次；互動記錄信任變化 | 倒數自動結算一次；NPC 信任及記憶更新 | PASS |
