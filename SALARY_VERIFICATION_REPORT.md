# 薪酬制度核實報告 — Teacher Life Simulator 3.4.1

**核實基準：2026 年 4 月 1 日生效的 MPS；資料檢查日：2026-11-11。**

## 已核實的官方資料

### MPS 月薪（HKD）

資料來源：香港公務員事務局 Master Pay Scale 官方頁面，清楚列出 2026-03-31 與 2026-04-01 生效的兩欄薪酬。

| 薪點 | 2026-04-01 月薪 | 薪點 | 2026-04-01 月薪 |
|---:|---:|---:|---:|
| 15 | $35,780 | 34 | $83,975 |
| 16 | $37,585 | 35 | $84,815 |
| 17 | $39,490 | 36 | $86,835 |
| 18 | $41,430 | 37 | $90,955 |
| 19 | $43,495 | 38 | $95,120 |
| 20 | $45,660 | 39 | $99,525 |
| 21 | $47,950 | 40 | $103,810 |
| 22 | $50,215 | 41 | $108,280 |
| 23 | $52,575 | 42 | $112,955 |
| 24 | $55,060 | 43 | $117,805 |
| 25 | $57,580 | 44 | $122,045 |
| 26 | $60,290 | 45 | $130,255 |
| 27 | $63,100 | 46 | $134,920 |
| 28 | $66,075 | 47 | $139,825 |
| 29 | $69,205 | 48 | $144,850 |
| 30 | $72,430 | 49 | $150,070 |
| 31 | $75,830 |  |  |
| 32 | $79,410 |  |  |
| 33 | $83,140 |  |  |

官方來源：
- Civil Service Bureau — [Master Pay Scale](https://www.csb.gov.hk/english/admin/pay/42.html)
- Civil Service Bureau — [Pay Policy](https://www.csb.gov.hk/english/admin/pay/38.html)

### 職級範圍

教育局《Guide to Salary Assessment for Aided Secondary Schools》（2026 年 8 月版本）及教育局職業資料所列的相關薪級範圍，核對遊戲使用的範圍：

| 遊戲職級 | 薪點範圍 | 核實狀態 |
|---|---:|---|
| 學位教師（GM） | MPS 15–33 | 已核實 |
| 高級學位教師（SGM） | MPS 34–39 | 已核實 |
| 首席學位教師（PGM） | MPS 38–41 | 已核實 |
| 校長（二級） | MPS 40–44 | 已核實 |
| 校長（一級） | MPS 45–49 | 已核實 |

官方來源：
- EDB — [Salary Assessment Guides](https://www.edb.gov.hk/en/sch-admin/admin/about-sch-staff/salary-assessment/guides.html)
- EDB — [Life Planning: Assistant Education Officer / Education Officer / Senior Education Officer / Principal](https://lifeplanning.edb.gov.hk/en/career/career-information/16.html)
- EDB 2026-08 Secondary School Salary Assessment Guide：<https://www.edb.gov.hk/attachment/en/sch-admin/admin/about-sch-staff/salary-assessment/SalaryGuide_SecSchool%20(Aug%202026).pdf>

### 未受訓 GM 薪酬關限

EDB 2026 年 8 月薪酬評估指南列出，2010-10-01 起 GM 未受訓教師薪酬關限為 MPS 20；現行 GM 起薪點為 MPS 15，因此遊戲採用 20 點作簡化上限。取得合資格教師訓練後解除遊戲關限。實際資格是否獲承認須由 EDB／學校核實，遊戲的「PGDE 等值課程」只作模擬條件，不構成正式資格認可。

## 官方增薪及年資規則 — 遊戲差異

EDB 指南確認：

- 新聘教師 incremental date 由正式履行全職職務日期決定；每月 1–15 日到職，incremental date 為該月 1 日；16 日至月底到職，則為下月 1 日。
- 年度增薪受相關 Code of Aid 及滿意表現條件約束；達到薪級上限後不再自動增薪。
- GM 年資評估須按可認可的任職紀錄及完整月份計算；部分兼職、未取得有效 RT/PT、未具資格前經驗、日薪／時薪工作等，不可一概計入。
- 連續 no-pay leave 超過 15 日至 45 日，incremental date 延後一個月；超過 45 日至 75 日，延後兩個月，以此類推；15 日或以下不改變 incremental date。
- 2006-09-01 起，超過一年服務中斷可視為 salary assessment break；跨校、職級、聘用比例及薪酬承接另有規則。
- GM→SGM、SGM→PGM 等不同晉升的薪點承接並非一條通用公式；部分情況按新職級最低薪點，部分情況可按原薪點及服務情況 fit-in。

官方來源：EDB 2026-08 Salary Assessment Guide 第 1.1–1.8 節及附錄 12。

### 3.4.1 實際程式處理

| 項目 | 目前實作 | 狀態／限制 |
|---|---|---|
| MPS 薪酬數字 | MPS 15–49 完整寫入 `js/salary-system.js` | 已核實 |
| GM／SGM／PGM／校長薪級範圍 | 寫入 `SALARY_GRADES` | 已核實 |
| 年度增薪 | 每 12 個遊戲月評核；年度表現分數達 48 才增一點 | 遊戲化；並非真實 EDB 評分門檻 |
| 最高薪點 | 到達職級最高薪點後停止 | 已實作 |
| GM 未受訓關限 | MPS 20；完成指定遊戲教師訓練課程後解除 | 遊戲化資格判斷 |
| 晉升薪點 | 不低於新職級最低點，採用遊戲承接公式 | 不代表個別 EDB 薪金評估 |
| 年資 | 只在受聘為教師期間累積；失業及校外職涯不累積 | 已實作的簡化服務年資 |
| no-pay leave | 遊戲沒有 no-pay leave 操作／紀錄 | **未實作** |
| incremental date | 按遊戲開始後每 12 個月學年週期處理 | **未實作個人到職日及延後日期** |
| 兼職比例、RT/PT、資助來源、認可資格、完整服務證明 | 沒有資料欄位 | **未實作** |
| Contract 薪酬及退休福利 | 以同級 MPS 作遊戲參考；實際聘書可不同 | **不作官方待遇聲稱** |
| DSS／私立薪酬 | 校本模擬倍率 | 非官方薪酬資料 |

## 必須保留的限制聲明

本版本已核實薪級表及薪級範圍，但不能宣稱已完整複製 EDB 個別薪金評估。起薪點、認可年資、增薪日期、no-pay leave、跨校承接、晉升薪點及合約福利，仍須按聘書、服務證明、資格及 EDB 最新指引核定。若需要完全精確的個人薪酬評估，必須另外實作個人 incremental date、no-pay leave days、RT/PT、FTE、服務中斷、資格及資助來源等欄位與規則。


## 3.4.1 資格起薪及教師訓練增額

EDB 2026 年 8 月《Guide to Salary Assessment for Aided Secondary Schools》附錄 5Di（第 41 頁）列出 GM 的資格薪級：Degree 為 MPS 15–20（未受訓薪酬關限），完成適當 PGCE 可獲兩個薪點增額並可進至 Pt.33；Degree + PGCE／TC／PGCE+TC 為 MPS 17–33。附錄同時註明未受訓教師不得超過 Pt.20。

3.4.1 遊戲對應如下：

| 角色資格 | 模擬起薪 | 模擬最高點 | 完成認可教師訓練 |
|---|---:|---:|---|
| 學位、未受教師訓練 | Pt.15 | Pt.20 | 解除關限，另加兩薪點（最高 Pt.33） |
| BEd 教育學士 | Pt.17 | Pt.33 | 已按受訓教師處理 |
| 學士＋PGDE／PCEd | Pt.17 | Pt.33 | 已按受訓教師處理 |
| 碩士／博士 | 不自動加薪 | 依教師訓練資格 | 學位本身不等於 ICQ；須個別核定 |

遊戲以角色建立時的「認可教學年資」模擬 ICE：受訓 GM 從 Pt.17 起加認可年資；未受訓 GM 從 Pt.15 起加認可年資並受 Pt.20 薪酬關限。完成 12 個合資格服務月及年度表現評核達標後增一點。未受訓 GM 完成教師訓練課程時另記錄兩薪點資格增額。

**仍未模擬的真實個別評估：** EDB 會按完整任職紀錄計算 ICE／ICQ；增薪日期由正式履行職務日期及日份決定；兼職服務按比例折算；no-pay leave、服務中斷、有效 RT/PT、資助來源及不同聘用／晉升情況均會影響薪點。遊戲目前以 12 個合資格服務月簡化，並非薪酬評估工具。

官方指南：<https://www.edb.gov.hk/attachment/en/sch-admin/admin/about-sch-staff/salary-assessment/SalaryGuide_SecSchool%20(Aug%202026).pdf>（Appendix 5Di, p.41；Sections 1.2、1.6、1.7、2.1）。

## 2026 年 4 月 1 日起生效 MPS 例子

| MPS | 月薪（HKD） |
|---:|---:|
| 15 | $35,780 |
| 17 | $39,490 |
| 20 | $45,660 |
| 33 | $83,140 |
| 34 | $83,975 |
| 39 | $99,525 |
| 41 | $108,280 |
| 44 | $122,045 |
| 45 | $130,255 |
| 49 | $150,070 |

完整薪點表以公務員事務局 2026 年 4 月 1 日生效的總薪級表為準：<https://www.csb.gov.hk/english/admin/pay/42.html>。GM／SGM／PGM／校長職級薪級範圍及受訓／未受訓薪酬關限，以 EDB 2026 年 8 月《Guide to Salary Assessment for Aided Secondary Schools》Appendix 5Di 為準。
