# CLAUDE.md — LINE 課程預約系統｜學員建置版（課程包）

> 這是**教學用的乾淨起點**：系統還沒建，要靠 `lessons/` 一課一課長出來。
> Antigravity／agy 啟動會自動讀這份。**先讀第 0 節。**

---

## 0. 教學模式鐵律（最高優先，務必遵守）
> 本 repo 是逐堂課程。**嚴禁一次把整套做完。**

1. **一次只做一課**：只執行講師本次指名的 `lessons/Lx.md`，完成該檔「✅ 驗收」後**立即停止**，輸出「本課完成，等待下一步指示」。
2. **嚴禁跑在前面**：不得自行開始下一課、不得預建之後才需要的檔案或功能——即使你已知道怎麼做、即使 `安裝包/` 已有參考碼。
3. **遇 🧰 設定關卡就停**：標 🧰 的步驟是講師要去 Console 手動設定／貼金鑰的人工關卡。走到就停、列待辦、等講師回「完成」再續。**課前的 🧰 gate 必須在動工前先輸出並實際驗證（例如 L0 先跑 `gh auth status`），禁止直奔建檔、禁止假設已完成、禁止只用括號註解帶過。**
4. **`安裝包/` 是唯讀對照真理**：agy **只能讀，絕不可修改、刪除、覆寫、移動**其中任何檔（`firestore-資料模型.md`、`firestore.rules`、`扣堂與取消-交易參考.js`）。需要調整資料模型／規則／交易碼時，**停下告知講師**，由講師或 Cowork 改。
5. **git commit/push**：agy 可自行 commit（每課做完一筆，留存還原點）；講師／Cowork 也可。**鐵律：絕不 force-push、不重寫歷史、不刪 `.git`**——正常 commit 都救得回，這三件會砸了還原機制。
6. 每課只 ship 一個可驗收功能；做完就停。

開課咒語（講師每堂貼）：
```
讀 CLAUDE.md 第 0 節與 安裝包/。本次只執行 lessons/Lx.md，
完成它的「✅ 驗收」後停止並回報，不要碰下一課或之後任何功能。先回我「OK」。
```

---

## 1. 專案是什麼
為舞蹈／瑜珈教室做的 **LINE 課程預約系統**：會員在 LINE 內「查課表／查剩餘堂數／預約／取消」，老師後台「管課／加堂(購課)／看名單／停課通知」，取代外部預約平台。

## 2. 受眾與限制
- 學員＝教室經營者，**無後端經驗、不懂 GitHub/Cloudflare**，手上 AI 是 Gemini 級的 `agy`。
- 原則「**安裝包＋動手感**」：核心、易錯、難 debug 的程式預先寫好（見 `安裝包/`）；學員親手做安全可錯、看得見成果的部分。

## 3. 架構（勿輕易推翻）
- 前端：靜態 **PWA** + GitHub Pages（先用 `<user>.github.io`）。Firebase 用 `<script>` compat SDK，不用 npm。
- 資料：**Firestore（正式版模式）**，`runTransaction` 做交易式扣堂（原生 ACID，不超賣）。
- 身份：**LIFF 自動認人**。鐵律：**LINE Login channel 與 OA 的 Messaging API channel 同一 Provider**，userId 才一致。
- 前台 LIFF in LINE／後台一般瀏覽器。
- 通知：**Cloudflare Worker + Cron**（UTC，台灣 −8）＋ LINE push（**一律定向，不 broadcast**）。
- **不做金流**：購課＝後台手動登記＋90 天到期。
- 安全上限：純前端會員端理論可竄改自己 `credits ±1`，小教室可接受；v2 把扣堂搬 Worker 驗 LIFF token。

## 4. 資料模型（單一真相＝`安裝包/firestore-資料模型.md`）
`members/{lineUserId}`、`courses/{日期_時間}`、`bookings/{courseId_lineUserId}`、`purchases/{auto}`、`config/app`。
**改任何欄位名前先改該檔。不要更動 `安裝包/扣堂與取消-交易參考.js` 的交易邏輯與錯誤碼。**

## 5. 目前狀態
**全新起點，尚未建任何 app 檔。** 依 `lessons/` 從 L0 逐課建起：
`L0` 網站上線 → `L1` 接 Firestore → `L2` 課表 → `L3` LIFF 認人查堂數 → `L4` 預約引擎 → `L5` 取消 → `L6` 後台購課到期 → `L7A` 停課通知 → `L7B` 自動到期提醒 → `L8` 收尾。
（每課的設定關卡、指令、驗收、STOP 都在對應 `lessons/Lx.md`。）

## 6. 鐵律（給未來的 Claude／agy）
- **上傳一律 `gh auth login`（一次性瀏覽器授權）**；絕不產 PAT、不建 `.env`、不寫 `deploy.sh`、不把 token 組進 git remote URL。
- **密鑰不進會員端檔**：`PUSH_SECRET`／`WORKER_URL` 只放 `admin.html`，絕不放 `firebase-init.js` 或任何 `index.html` 載入的檔。
- **不要 `db.enablePersistence()`**：預約類資料要即時，名額/堂數讀伺服器最新值，避免顯示過時。
- **不要用 `setTimeout` 等登入**：用 `onAuthStateChanged` 或 Promise 確保 `db`/匿名登入就緒後再用。
- **courseId 一律 `YYYYMMDD_HHmm`**（去掉 `-` 與 `:`），admin/前台/預約三處一致。
- Firestore **一定正式版模式**＋規則要**發布**；`STUDIO_EMAIL` 必須與老師登入帳號完全一致。
- LIFF SDK 正確網址：`https://static.line-scdn.net/liff/edge/2/sdk.js`。
- Cloudflare：改了程式一定按 Deploy；Cron 用「Cron expression」分頁、**UTC**（台灣 08:00＝`0 0 * * *`）。
- 機密（LINE token、service account JSON、PUSH_SECRET）只放部署平台 Secret，**絕不進 repo**（見 `.gitignore`）。
- `firebaseConfig` 放前端是正常且安全的（apiKey 本就公開，安全靠規則）。
- 詳細的分段設定與「agy 實測踩坑」見 `安裝指引.md`。
