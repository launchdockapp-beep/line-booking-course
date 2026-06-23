// Firebase Configuration from Console
const firebaseConfig = {
  apiKey: "AIzaSyBp5WmNmxNjpOVkeEdH9Cb-4wmG3dVD7z8",
  authDomain: "line-booking-course.firebaseapp.com",
  projectId: "line-booking-course",
  storageBucket: "line-booking-course.firebasestorage.app",
  messagingSenderId: "1019002891217",
  appId: "1:1019002891217:web:3764d172dd78e186934ef0",
  measurementId: "G-6F2VVRJMYL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// Event-driven authentication using Promise to prevent race conditions (anti-pattern: setTimeout)
const authReady = new Promise((resolve, reject) => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("Firebase Auth Ready. User UID:", user.uid);
      resolve(user);
      unsubscribe();
    }
  });

  // Start anonymous sign-in if no active session
  if (!auth.currentUser) {
    auth.signInAnonymously().catch((error) => {
      console.error("Firebase Anonymous Auth failed:", error);
      reject(error);
    });
  }
});
