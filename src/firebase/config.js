// ─────────────────────────────────────────────
//  NAFC FC — Firebase Configuration
//  Replace the values below with YOUR Firebase
//  project credentials after creating the project
// ─────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBMSC6Qn2jKfco8iKk8rapt1wuwsPhUUbo",
  authDomain: "nafc-football-club.firebaseapp.com",
  projectId: "nafc-football-club",
  storageBucket: "nafc-football-club.firebasestorage.app",
  messagingSenderId: "550800064236",
  appId: "1:550800064236:web:918077d586ae81ea492fc9",
  measurementId: "G-KZLXQBWL4J"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
