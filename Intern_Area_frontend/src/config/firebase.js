import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCv8MAHLj_VPQtdYVuiFYnv9qOametFz1Y",
  authDomain: "internarea-92fff.firebaseapp.com",
  projectId: "internarea-92fff",
  storageBucket: "internarea-92fff.firebasestorage.app",
  messagingSenderId: "93644063026",
  appId: "1:93644063026:web:8c411e5fa908c1bba8172b",
  measurementId: "G-RBDQF8WDCM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
