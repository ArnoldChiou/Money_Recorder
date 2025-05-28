// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// 如果您暫時不用 Analytics，可以先移除，簡化問題
// import { getAnalytics } from "firebase/analytics"; 

// ====================================================================
const firebaseConfig = {
apiKey: "Example",
authDomain: "Example",
projectId: "Example",
storageBucket: "Example",
messagingSenderId: "Example",
appId: "Example",
measurementId: "Example"
};
// ====================================================================

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // 暫時移除

// 取得 Firestore 實例
const db = getFirestore(app);
const auth = getAuth(app);

// 匯出 db 和 auth 供其他組件使用
export { db, auth };