# L7A — 停課定向通知（Cloudflare Worker，先做簡單的）　⏱ ~60 分

**本課完課你會看到**：老師按「停課並通知」→ 只推給有報名的人 + 自動退堂（不全體廣播）。
詳細見根目錄 `L7-自動通知-操作手冊.md`（L7-2）。

---

### ▶️ agy 第一步（先確認，未完成即停）
> 先把「設定關卡」輸出給老師，並確認：① Cloudflare 已建 **Workers**（不是 Pages）② 已設好 Secret `LINE_TOKEN`、`PUSH_SECRET` ③ token 取自**與 LIFF 同一 Provider** 的 OA。
> 未完成 → **停下**請老師補，不要假設、不要先寫 Worker 程式。

---

### 🧰 設定關卡（老師，課程開始）— 建 Worker＋金鑰
1. 取你 OA 的 **Channel access token**（Messaging API，與 L3 LINE Login 同 Provider）。
2. Cloudflare → Workers & Pages → Create → **Workers**（非 Pages）→ Hello World → Deploy。
3. Worker → Settings → Variables and Secrets（Type=Secret）：`LINE_TOKEN`、`PUSH_SECRET`（自訂隨機字）。

### 👩‍💻 給 agy 的指令（這一課）
```
只做 L7A：
1) worker.js 的 POST /push：{secret,userIds,text}，secret≠PUSH_SECRET 回401；逐個呼叫 LINE push
   (POST https://api.line.me/v2/bot/message/push, Bearer LINE_TOKEN, body {to:userId,messages:[{type:"text",text}]})；逐筆容錯。GET /?ping=1 回 ok。
2) 後台 admin.html 每堂課加「停課並通知」：讀該堂 booked → 逐筆退堂(credits+1、enrolled−1、booking→cancelled) + course設cancelled →
   收集 userIds POST 到 Worker /push，文字「您預約的{課名}({日期時間})因故停課，已退回 1 堂」。無人報名就不打 Worker。
**PUSH_SECRET 與 WORKER_URL 只能寫在 admin.html，絕不可放進 firebase-init.js 或任何 index.html 載入的檔**（否則會員看原始碼就能拿到密鑰、冒用 Worker 亂發訊息、燒光免費額度）。
做完停下。不要做 Cron/到期(L7B)。記得：改 Worker 一定按 Deploy。
```

### ✅ 驗收
- 測試帳號預約某堂 → 後台對該堂按「停課並通知」→ LINE 收到通知、堂數退回、course=cancelled。

### 🛑 STOP
本課結束。等「開始 L7B」。
