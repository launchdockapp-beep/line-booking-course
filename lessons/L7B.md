# L7B — 自動到期提醒（Cron，全課最硬一堂）　⏱ ~60 分

**本課完課你會看到**：系統每天自動發到期提醒（剩 14/7/3 天、到期），超期自動歸零堂數。
詳細見根目錄 `L7-自動通知-操作手冊.md`（L7-3）。

> ⚠️ 這堂的「service account 簽 JWT(RS256)」是全案最硬一段，最可能要丟給 Claude 幫修。卡住別硬耗。

---

### 🧰 設定關卡（老師，課程開始）— service account＋Cron 金鑰
1. Firebase 專案設定 → 服務帳戶 → 產生新的私密金鑰（下載 JSON）。
2. Worker Secret 加 `FIREBASE_SA`（整個 JSON 貼成一行）、`PROJECT_ID`。

### 👩‍💻 給 agy 的指令（這一課）
```
只做 L7B：在 worker.js 加 scheduled(event)：
1) 用 FIREBASE_SA 簽 JWT(RS256, 用 Web Crypto crypto.subtle) → 換 Google OAuth token(scope datastore)。
2) Firestore REST 讀 members(status==active)。
3) 算到期天數(台灣時區 UTC+8)：14/7/3/0 天 → push 提醒；<0 且 credits>0 → PATCH credits=0。
4) 加 GET /?run=1&secret=PUSH_SECRET 手動觸發同邏輯方便測。
逐筆容錯、金鑰只從 Secret 取。做完停下並告訴我怎麼用 /?run=1 測。
```

### 🧰 設定關卡（本課末）— 設 Cron
Worker → Settings → Triggers → **用「Cron expression」分頁** 填 `0 0 * * *`（UTC 00:00 = 台灣 08:00）。Cron 只在下個觸發點才跑，當場用 `/?run=1` 驗。

### ✅ 驗收
- 會員到期日設「3 天後」→ 開 `/?run=1&secret=...` → LINE 收到「剩 3 天」。
- 到期日設昨天 → 跑一次 → credits 變 0。

### 🛑 STOP
本課結束。等「開始 L8」。JWT 卡住就把 worker.js + 錯誤訊息貼給 Claude 修。
