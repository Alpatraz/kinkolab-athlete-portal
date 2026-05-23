import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyARfuGx846NgfmeMZ4FjpxzJMLsv3T--e0",
  authDomain: "kinkolab-athletes.firebaseapp.com",
  projectId: "kinkolab-athletes",
  storageBucket: "kinkolab-athletes.firebasestorage.app",
  messagingSenderId: "692057353319",
  appId: "1:692057353319:web:823f9d18ee08238f9a38c2",
  measurementId: "G-TDQ63XMTH4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
