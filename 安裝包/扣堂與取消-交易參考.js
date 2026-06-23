// ============================================================
// 扣堂 / 取消 — Firestore runTransaction 參考（對照真理 v1）
// 這是整套系統最不能錯的核心：預約 = 同一筆交易內完成
//   檢查 → 扣堂 → 名額+1 → 寫預約，全成或全不成（原生 ACID）。
//
// 前提：頁面已用 compat SDK 初始化好 firebase，且已知道目前會員的 LINE userId。
//   <script src=".../firebase-app-compat.js"></script>
//   <script src=".../firebase-firestore-compat.js"></script>
//   const db = firebase.firestore();
//   const currentUserId = "<LIFF 取得的 userId>";
// ============================================================

const db = firebase.firestore();
const FieldValue = firebase.firestore.FieldValue;

// 錯誤碼 → 給使用者看的中文
const BOOK_MSG = {
  NOT_MEMBER:     '找不到你的會員資料，請先註冊或聯絡老師',
  NO_COURSE:      '這堂課不存在或已被移除',
  COURSE_CLOSED:  '這堂課已停課或關閉',
  EXPIRED:        '你的方案已過期，請聯絡老師加購',
  NO_CREDITS:     '剩餘堂數不足，請聯絡老師加購',
  FULL:           '這堂課名額已滿',
  ALREADY_BOOKED: '你已經預約過這堂課了',
  NOT_BOOKED:     '查無這筆有效預約',
};

// ---------- 預約 ----------
async function bookCourse(courseId, userId) {
  const memberRef  = db.collection('members').doc(userId);
  const courseRef  = db.collection('courses').doc(courseId);
  const bookingRef = db.collection('bookings').doc(`${courseId}_${userId}`); // 組合主鍵防重複

  await db.runTransaction(async (tx) => {
    const memberSnap  = await tx.get(memberRef);
    const courseSnap  = await tx.get(courseRef);
    const bookingSnap = await tx.get(bookingRef);

    if (!memberSnap.exists) throw new Error('NOT_MEMBER');
    if (!courseSnap.exists) throw new Error('NO_COURSE');

    const m = memberSnap.data();
    const c = courseSnap.data();

    if (bookingSnap.exists && bookingSnap.data().status === 'booked') {
      throw new Error('ALREADY_BOOKED');
    }
    if (c.status !== 'open') throw new Error('COURSE_CLOSED');
    if (m.expiresAt && m.expiresAt.toDate() < new Date()) throw new Error('EXPIRED');
    if ((m.credits || 0) < 1) throw new Error('NO_CREDITS');
    if ((c.enrolled || 0) >= c.capacity) throw new Error('FULL');

    // 三個寫入，同一筆交易
    tx.update(memberRef, { credits: m.credits - 1 });
    tx.update(courseRef, { enrolled: (c.enrolled || 0) + 1 });
    tx.set(bookingRef, {
      courseId, lineUserId: userId,
      name: m.name || m.displayName || '',
      status: 'booked',
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
}

// ---------- 取消（退堂、名額回補） ----------
async function cancelBooking(courseId, userId) {
  const memberRef  = db.collection('members').doc(userId);
  const courseRef  = db.collection('courses').doc(courseId);
  const bookingRef = db.collection('bookings').doc(`${courseId}_${userId}`);

  await db.runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bookingRef);
    const memberSnap  = await tx.get(memberRef);
    const courseSnap  = await tx.get(courseRef);

    if (!bookingSnap.exists || bookingSnap.data().status !== 'booked') {
      throw new Error('NOT_BOOKED');
    }
    const m = memberSnap.data();
    const c = courseSnap.data();

    tx.update(bookingRef, { status: 'cancelled' });
    tx.update(memberRef, { credits: (m.credits || 0) + 1 });          // 退一堂
    tx.update(courseRef, { enrolled: Math.max((c.enrolled || 0) - 1, 0) }); // 名額回補
  });

  return { ok: true };
}

// ---------- 包一層好用：把錯誤碼轉中文 ----------
async function tryBook(courseId, userId) {
  try {
    await bookCourse(courseId, userId);
    return { ok: true, msg: '預約成功！' };
  } catch (e) {
    return { ok: false, msg: BOOK_MSG[e.message] || ('預約失敗：' + e.message) };
  }
}
