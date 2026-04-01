// Fix Clivert match - mark it as a past LOSS not upcoming
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc, getDocs, collection, query, where } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBMSC6Qn2jKfco8iKk8rapt1wuwsPhUUbo",
  authDomain: "nafc-football-club.firebaseapp.com",
  projectId: "nafc-football-club",
  storageBucket: "nafc-football-club.firebasestorage.app",
  messagingSenderId: "550800064236",
  appId: "1:550800064236:web:918077d586ae81ea492fc9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fix() {
  console.log("🔧 Fixing Clivert match...");
  
  // Update match m1 to be a past match
  try {
    await updateDoc(doc(db, "matches", "m1"), {
      isUpcoming: false,
      result: "L",
      nafcScore: 7,
      opponentScore: 13,
      date: "2025-02-01"
    });
    console.log("✅ Clivert match fixed! Now shows as LOSS not upcoming.");
  } catch(e) {
    console.log("Error:", e.message);
  }
  
  process.exit(0);
}

fix();
