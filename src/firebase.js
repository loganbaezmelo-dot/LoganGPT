import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your LoganGPT Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIojrYnZo0vW329z42MUm6T-_--qwXfbg",
  authDomain: "logangpt.firebaseapp.com",
  projectId: "logangpt",
  storageBucket: "logangpt.firebasestorage.app",
  messagingSenderId: "911989158480",
  appId: "1:911989158480:web:21991c1ef3b2887908d755",
  measurementId: "G-JD1BW6J6P2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication and Database for use in App.js
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
