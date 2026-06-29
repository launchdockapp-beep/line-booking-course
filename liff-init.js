// ── L3: LIFF 認人 + 查堂數 ──
// 載入順序：firebase SDK → firebase-init.js → liff-init.js
// 不使用 setTimeout 等待，一律事件驅動。

const LIFF_ID = '2010535112-TSx5ybrk';

let lineUserId = null;
let lineDisplayName = null;

// ── 入口 ──
async function initLIFF() {
  try {
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      // 未登入 → 導向 LINE 登入（不用 setTimeout，liff.login() 本身會 redirect）
      liff.login({ redirectUri: location.href });
      return;
    }

    const profile = await liff.getProfile();
    lineUserId    = profile.userId;
    lineDisplayName = profile.displayName;

    // 等待 Firebase 匿名驗證就緒（Promise 來自 firebase-init.js）
    await authReady;

    // 查詢會員資料
    await checkMember();

  } catch (e) {
    console.error('LIFF init error:', e);
    renderMemberSection('error', `初始化失敗：${e.message}`);
  }
}

// ── 查 Firestore members/{lineUserId} ──
async function checkMember() {
  try {
    const snap = await db.collection('members').doc(lineUserId).get();
    if (snap.exists) {
      renderMemberInfo(snap.data());
      // L5: 載入預約清單
      if (typeof loadMyBookings === 'function') {
        loadMyBookings();
      }
    } else {
      renderRegisterForm();
      const area = document.getElementById('my-bookings-area');
      if (area) area.style.display = 'none';
    }
  } catch (e) {
    renderMemberSection('error', `查詢失敗：${e.message}`);
  }
}

// ── 已有會員 → 顯示資訊 ──
function renderMemberInfo(data) {
  let expiryStr = '—';
  if (data.expiresAt) {
    const d = data.expiresAt.toDate();
    expiryStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  }

  const isPending = data.status === 'pending';
  const credits   = data.credits ?? 0;
  const creditsColor = credits === 0 ? 'var(--danger)' : credits <= 2 ? 'var(--warning)' : 'var(--primary)';

  document.getElementById('member-section').innerHTML = `
    <div class="member-card">
      <div class="member-greeting">👋 ${data.name || lineDisplayName}</div>
      <div class="member-credits-row">
        <div class="credits-display" style="color:${creditsColor}">
          <span class="credits-num">${credits}</span>
          <span class="credits-unit">堂</span>
        </div>
        <div class="member-expiry">到期日<br><strong>${expiryStr}</strong></div>
      </div>
      ${isPending ? '<div class="member-pending">⏳ 帳號待老師開通中，請稍候</div>' : ''}
    </div>
  `;
  document.getElementById('member-section').style.display = 'block';
}

// ── 新會員 → 顯示一次性註冊表單 ──
function renderRegisterForm() {
  document.getElementById('member-section').innerHTML = `
    <div class="register-card">
      <div class="register-title">📝 歡迎！請先完成會員登錄</div>
      <div class="register-hint">LINE 暱稱：${lineDisplayName}</div>
      <div class="form-group">
        <label for="reg-name">真實姓名</label>
        <input type="text" id="reg-name" placeholder="請輸入姓名" autocomplete="name">
      </div>
      <div class="form-group">
        <label for="reg-phone">聯絡電話</label>
        <input type="tel" id="reg-phone" placeholder="請輸入電話" autocomplete="tel">
      </div>
      <button id="reg-submit-btn" class="btn-register">送出申請</button>
      <div id="reg-error" class="reg-error" style="display:none"></div>
    </div>
  `;
  document.getElementById('member-section').style.display = 'block';
  document.getElementById('reg-submit-btn').addEventListener('click', submitRegister);
}

// ── 送出註冊 ──
async function submitRegister() {
  const name    = (document.getElementById('reg-name').value || '').trim();
  const phone   = (document.getElementById('reg-phone').value || '').trim();
  const errEl   = document.getElementById('reg-error');
  const btn     = document.getElementById('reg-submit-btn');

  if (!name || !phone) {
    errEl.textContent = '請填寫姓名與電話';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled    = true;
  btn.textContent = '送出中…';
  errEl.style.display = 'none';

  try {
    // 建立 members/{lineUserId}（符合 firestore.rules 會員自建規則：status=pending, credits=0）
    await db.collection('members').doc(lineUserId).set({
      displayName : lineDisplayName,
      name,
      phone,
      credits  : 0,
      status   : 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // 寫完後重新查詢，渲染會員資訊畫面
    await checkMember();
  } catch (e) {
    errEl.textContent = `送出失敗：${e.message}`;
    errEl.style.display = 'block';
    btn.disabled    = false;
    btn.textContent = '送出申請';
  }
}

// ── 錯誤狀態 ──
function renderMemberSection(type, msg) {
  document.getElementById('member-section').innerHTML =
    `<div class="member-error">⚠ ${msg}</div>`;
  document.getElementById('member-section').style.display = 'block';
}

// ── 啟動 ──
initLIFF();
