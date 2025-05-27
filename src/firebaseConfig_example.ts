// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "example" ,
  authDomain:"example" ,
  projectId:"example" ,
  storageBucket:"example" ,
  messagingSenderId:"example" ,
  appId:"example" ,
  measurementId:"example" ,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// 取得 Firestore 實例
const db = getFirestore(app);

// 匯出 db 供其他組件使用
export { db };