// ─────────────────────────────────────────────
//  NAFC FC — Firebase Seed Data
//  Run this ONCE after setting up Firebase to
//  create all 15 players and the admin account
//
//  How to run:
//  1. npm install firebase
//  2. Replace firebaseConfig below with yours
//  3. node src/firebase/seed.js
// ─────────────────────────────────────────────

const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection } = require("firebase/firestore");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");

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
const db = getFirestore(app);
const auth = getAuth(app);

const players = [
  { id:"p1",  name:"ISHAN",     jersey:5,  pos:"Forward",    age:22, email:"ishan@nafc.in",     password:"Nafc@Ishan5" },
  { id:"p2",  name:"VIGNESH",   jersey:4,  pos:"Midfielder", age:21, email:"vignesh@nafc.in",   password:"Nafc@Vignesh4" },
  { id:"p3",  name:"VARDHAN",   jersey:6,  pos:"Defender",   age:23, email:"vardhan@nafc.in",   password:"Nafc@Vardhan6" },
  { id:"p4",  name:"AKARSH",    jersey:1,  pos:"Goalkeeper", age:24, email:"akarsh@nafc.in",    password:"Nafc@Akarsh1" },
  { id:"p5",  name:"PRIKSHIT",  jersey:7,  pos:"Winger",     age:21, email:"prikshit@nafc.in",  password:"Nafc@Prikshit7" },
  { id:"p6",  name:"HRUTHIK",   jersey:10, pos:"Midfielder", age:22, email:"hruthik@nafc.in",   password:"Nafc@Hruthik10" },
  { id:"p7",  name:"RUDDY",     jersey:8,  pos:"Midfielder", age:25, email:"ruddy8@nafc.in",    password:"Nafc@Ruddy8" },
  { id:"p8",  name:"HAFEEZ",    jersey:9,  pos:"Striker",    age:23, email:"hafeez@nafc.in",    password:"Nafc@Hafeez9" },
  { id:"p9",  name:"GOPAL",     jersey:3,  pos:"Defender",   age:26, email:"gopal@nafc.in",     password:"Nafc@Gopal3" },
  { id:"p10", name:"DHEEMANTH", jersey:30, pos:"Defender",   age:24, email:"dheemanth@nafc.in", password:"Nafc@Dheemanth30" },
  { id:"p11", name:"NITHIN",    jersey:14, pos:"Winger",     age:21, email:"nithin@nafc.in",    password:"Nafc@Nithin14" },
  { id:"p12", name:"SHETTY",    jersey:11, pos:"Midfielder", age:23, email:"shetty@nafc.in",    password:"Nafc@Shetty11" },
  { id:"p13", name:"MEGUR",     jersey:17, pos:"Forward",    age:22, email:"megur@nafc.in",     password:"Nafc@Megur17" },
  { id:"p14", name:"RUDDY2",    jersey:7,  pos:"Striker",    age:25, email:"ruddy7@nafc.in",    password:"Nafc@Ruddy7" },
  { id:"p15", name:"VIGNESH2",  jersey:2,  pos:"Defender",   age:21, email:"vignesh2@nafc.in",  password:"Nafc@Vignesh2" },
];

async function seed() {
  console.log("🔥 Seeding NAFC Firebase...\n");

  // Create admin account
  try {
    const adminCred = await createUserWithEmailAndPassword(auth, "admin@nafc.in", "NafcAdmin@2025");
    await setDoc(doc(db, "users", adminCred.user.uid), {
      name: "Admin", role: "admin", email: "admin@nafc.in"
    });
    console.log("✅ Admin created: admin@nafc.in / NafcAdmin@2025");
  } catch(e) { console.log("Admin may already exist:", e.message); }

  // Create player accounts + Firestore docs
  for (const p of players) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, p.email, p.password);
      const playerData = {
        uid: cred.user.uid,
        name: p.name,
        jersey: p.jersey,
        pos: p.pos,
        age: p.age,
        email: p.email,
        nationality: "Indian",
        goals: 0,
        assists: 0,
        appearances: 1,
        yellowCards: 0,
        redCards: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "players", p.id), playerData);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: p.name, role: "player", playerId: p.id, email: p.email
      });
      console.log(`✅ ${p.name} — ${p.email} / ${p.password}`);
    } catch(e) { console.log(`⚠️  ${p.name}: ${e.message}`); }
  }

  // Seed first match (Clivert loss)
  await setDoc(doc(db, "matches", "m1"), {
    opponent: "Clivert",
    nafcScore: 7,
    opponentScore: 13,
    date: "2025-02-01",
    venue: "Local Ground",
    competition: "Friendly",
    result: "L",
    scorers: [],
    scorersNote: "Scorers not recorded — will be updated from next match onwards",
    createdAt: new Date().toISOString()
  });
  console.log("✅ Match vs Clivert seeded");

  console.log("\n🏁 Seed complete!");
  console.log("\n📋 ADMIN LOGIN:");
  console.log("   Email: admin@nafc.in");
  console.log("   Password: NafcAdmin@2025");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
