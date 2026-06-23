# Firestore 資料模型（對照真理 v1）

> 整套系統的單一真相來源。**改任何欄位名前先回來改這份**，否則前端、規則、交易、推播會四處對不上。
> 用 `<script>` 版 compat SDK（不用 npm）。時間一律用 Firestore `Timestamp`。

## 集合（collections）

### `members/{lineUserId}` — 會員（主鍵＝LINE userId）
| 欄位 | 型別 | 說明 |
|---|---|---|
| `displayName` | string | LINE 顯示名稱（LIFF 自動帶入） |
| `name` | string | 真實姓名（註冊時填） |
| `phone` | string | 電話（註冊時填） |
| `credits` | number | 剩餘堂數 |
| `expiresAt` | Timestamp | 到期日（購課時 = 購課日 + 90 天） |
| `status` | string | `active`／`pending`（待老師核對） |
| `createdAt` | Timestamp | 建檔時間 |

### `courses/{courseId}` — 課程
| 欄位 | 型別 | 說明 |
|---|---|---|
| `date` | string | `YYYY-MM-DD` |
| `time` | string | `HH:mm` |
| `title` | string | 課名，例「流動瑜珈」 |
| `instructor` | string | 老師 |
| `capacity` | number | 名額上限 |
| `enrolled` | number | 已報名數（預約 +1、取消 −1） |
| `status` | string | `open`／`cancelled` |

> `courseId` 建議用 `日期_時間` 好讀好查，例 `2026-06-25_1900`。

### `bookings/{courseId_lineUserId}` — 預約（主鍵刻意組合，防重複預約）
| 欄位 | 型別 | 說明 |
|---|---|---|
| `courseId` | string | 對應課程 |
| `lineUserId` | string | 對應會員 |
| `name` | string | 報名時的姓名快照 |
| `status` | string | `booked`／`cancelled` |
| `createdAt` | Timestamp | 預約時間 |

> **主鍵＝`courseId_lineUserId`**：同一人對同一堂課只會有一筆，交易內 `get` 到就擋重複預約（Firestore 交易內不能下查詢，只能讀指定文件，所以用組合主鍵）。

### `purchases/{auto}` — 購課紀錄（老師後台建立，不做金流）
| 欄位 | 型別 | 說明 |
|---|---|---|
| `lineUserId` | string | 買課的會員 |
| `plan` | string | `trial`／`single`／`pack10` |
| `credits` | number | 加幾堂 |
| `amount` | number | 金額（體驗180／單堂300／十堂2600） |
| `purchasedAt` | Timestamp | 購課日 |
| `expiresAt` | Timestamp | 到期日 = 購課日 + 90 天 |
| `note` | string | 備註 |

### `config/app` — 設定（逐堂啟用功能、價格）
| 欄位 | 型別 | 說明 |
|---|---|---|
| `prices` | map | `{ trial:180, single:300, pack10:2600 }` |
| `validDays` | number | 課程有效天數，預設 `90` |
| `features` | map | 功能開關，例 `{ booking:true, cancel:false }` |

## 不變式（系統正確性靠這幾條）
1. 預約成功 ⇔ `members.credits −1` ＋ `courses.enrolled +1` ＋ 建 `bookings` 文件，三者同一筆交易，全成或全不成。
2. `courses.enrolled` 永遠 ≤ `capacity`。
3. 取消 ⇔ 上述反向（`credits +1`、`enrolled −1`、`bookings.status=cancelled`）。
4. 會員 `expiresAt < 今天` 或 `credits < 1` 不得預約。
