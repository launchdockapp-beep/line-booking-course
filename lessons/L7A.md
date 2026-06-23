# L7A — 停課定向通知（Cloudflare Worker，先做簡單的）　⏱ ~60 分

**本課完課你會看到**：老師按「停課並通知」→ 只推給有報名的人 + 自動退堂（不全體廣播）。
詳細見根目錄 `L7-自動通知-操作手冊.md`（L7-2）。

---

### ▶️ agy 第一步（先確認，未完成即停）
> 用 CLI 驗證 wrangler 已登入：`wrangler whoami`。
> - 未登入／沒裝 → **停下**，請老師先 `npm i -g wrangler` → `wrangler login`（瀏覽器授權，人工）。
> - 已登入 → 確認 token 取自**與 LIFF 同一 Provider** 的 OA，再往下。
> 絕不假設已設定、不編造 token。

---

### 🧰 設定關卡（老師，課程開始）— 建 Worker ＋ 金鑰（wrangler CLI 為主）
1. 取 OA 的 **Channel access token**：LINE Developers → 你的 **Messaging API channel** → 「Messaging API」分頁 → 發行 long-lived channel access token（**與 L3 LINE Login 同一 Provider**）。
2. 裝 wrangler 並登入（一次性，同 gh／firebase 精神）：
   ```
   npm i -g wrangler
   wrangler login        # 瀏覽器授權，此步人工，agy 停下等你回「完成」
   ```
3. Worker 的建立、部署、設密鑰都由 agy 用 CLI 做（見下方指令）：`wrangler.toml` → `wrangler deploy` → `wrangler secret put`。
> Dashboard 備援：Cloudflare → Workers & Pages → Create → **Workers**（非 Pages）；Secret 在 Settings → Variables and Secrets。一個 Worker 別 CLI 跟 Dashboard 混用。

### 👩‍💻 給 agy 的指令（這一課）
```
只做 L7A：
0) 建 wrangler.toml：name="line-booking-worker"、main="worker.js"、compatibility_date 設今天日期。
1) worker.js 的 POST /push：{secret,userIds,text}，secret≠PUSH_SECRET 回401；逐個呼叫 LINE push
   (POST https://api.line.me/v2/bot/message/push, Bearer env.LINE_TOKEN, body {to:userId,messages:[{type:"text",text}]})；逐筆容錯。GET /?ping=1 回 ok。
2) 後台 admin.html 每堂課加「停課並通知」：讀該堂 booked → 逐筆退堂(credits+1、enrolled−1、booking→cancelled) + course設cancelled →
   收集 userIds POST 到 Worker /push，文字「您預約的{課名}({日期時間})因故停課，已退回 1 堂」。無人報名就不打 Worker。
3) 部署：`wrangler deploy`（會印出 `*.workers.dev` 網址）→ 把該網址填進 admin.html 的 WORKER_URL 常數。
4) 設密鑰：`wrangler secret put LINE_TOKEN`、`wrangler secret put PUSH_SECRET`（值由老師貼，**你不要把值寫進任何檔**）。
**PUSH_SECRET 與 WORKER_URL 只能寫在 admin.html，絕不可放進 firebase-init.js 或任何 index.html 載入的檔**（否則會員看原始碼就能拿到密鑰、冒用 Worker 亂發訊息、燒光免費額度）。
做完停下。改 worker.js 一定重新 `wrangler deploy`。不要做 Cron/到期(L7B)。
```

### ✅ 驗收
- 測試帳號預約某堂 → 後台對該堂按「停課並通知」→ LINE 收到通知、堂數退回、course=cancelled。

### 🛑 STOP
本課結束。等「開始 L7B」。
