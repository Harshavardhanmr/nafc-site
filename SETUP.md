# NAFC FC — Complete Setup Guide
# From zero to live website in ~30 minutes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 1 — CREATE FIREBASE PROJECT (5 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to → https://console.firebase.google.com
2. Click "Add project" → name it "nafc-football-club"
3. Disable Google Analytics (not needed) → Create project

4. ENABLE AUTHENTICATION:
   Sidebar → Build → Authentication → Get started
   → Sign-in method → Email/Password → Enable → Save

5. ENABLE FIRESTORE DATABASE:
   Sidebar → Build → Firestore Database → Create database
   → Start in TEST MODE → Choose region: asia-south1 → Enable

6. ENABLE STORAGE:
   Sidebar → Build → Storage → Get started
   → Start in TEST MODE → Done

7. GET YOUR CONFIG:
   Sidebar → Project Settings (gear icon) → Your apps
   → Click </> (web app) → Register app → name: "nafc-web"
   → Copy the firebaseConfig object — you need these values!

8. PASTE CONFIG into:
   → src/firebase/config.js   (replace the placeholder values)
   → src/firebase/seed.js     (replace the placeholder values)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 2 — INSTALL & SEED (5 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Open terminal in the nafc-football-club folder:

  npm install

Then seed the database (creates all 15 player accounts + admin):

  node src/firebase/seed.js

You'll see output like:
  ✅ Admin created: admin@nafc.in / NafcAdmin@2025
  ✅ ISHAN — ishan@nafc.in / Nafc@Ishan5
  ✅ VIGNESH — vignesh@nafc.in / Nafc@Vignesh4
  ... (all 15 players)

⚠️  IMPORTANT: Change the admin password after first login!
    Firebase Console → Authentication → Users → admin@nafc.in → Reset password


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 3 — TEST LOCALLY (2 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  npm start

Opens at → http://localhost:3000

Test login:
  Admin:  admin@nafc.in / NafcAdmin@2025
  Player: ishan@nafc.in / Nafc@Ishan5


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 4 — DEPLOY TO NETLIFY (10 min)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option A — Drag & Drop (easiest, no account needed):

  1. Run: npm run build
  2. Go to → https://app.netlify.com/drop
  3. Drag the "build" folder into the browser
  4. Netlify gives you a URL like: https://amazing-nafc-abc123.netlify.app
  5. That's your sharable link! 🎉

Option B — GitHub (auto-deploy on every update):

  1. Push this folder to a GitHub repo
  2. Go to → https://app.netlify.com → New site from Git
  3. Connect GitHub → select your repo
  4. Build command: npm run build
  5. Publish directory: build
  6. Deploy site!

CUSTOM DOMAIN (optional):
  Netlify → Site settings → Domain management → Add custom domain
  e.g. nafcfc.in or nafc.netlify.app (free subdomain)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 5 — FIREBASE SECURITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After testing, secure your database:

  Firebase Console → Firestore → Rules
  → Paste the contents of firestore.rules
  → Publish

This ensures:
  ✅ Public can READ everything (squad, matches, gallery)
  ✅ Only admin can WRITE (add matches, update stats, upload photos)
  ✅ Players can only see their own profile


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 6 — ADD NETLIFY URL TO FIREBASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

So Firebase auth works on your live URL:

  Firebase Console → Authentication → Settings
  → Authorized domains → Add domain
  → Paste your Netlify URL (e.g. amazing-nafc-abc123.netlify.app)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 7 — INSTALL AS MOBILE APP (PWA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For Android (Chrome):
  1. Open your Netlify URL in Chrome
  2. Tap the ⋮ menu → "Add to Home screen"
  3. Tap "Add" → app icon appears on home screen!

For iPhone (Safari):
  1. Open your Netlify URL in Safari
  2. Tap the Share button (box with arrow) 
  3. Scroll down → "Add to Home Screen"
  4. Tap "Add" → done!

The app works offline too (shows cached data when no internet).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DAILY USE — HOW TO UPDATE THE SITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AFTER A MATCH (Admin):
  1. Open website → click LOGIN → admin@nafc.in
  2. Click "ADMIN ⚙️" button
  3. Go to "Add Match Result" tab
  4. Fill in: Opponent, Date, Score, Result
  5. Add goal scorers — select player + how many goals
  6. Click "SAVE MATCH →"
  ✅ Stats update instantly for everyone!

UPCOMING MATCH:
  1. Admin login → "Add Upcoming Match" tab
  2. Fill opponent, date, venue
  3. Click "PUBLISH UPCOMING MATCH →"
  ✅ Shows on home page immediately!

UPLOAD PHOTOS:
  1. Admin login → "Photos" tab
  2. Click the upload area (or tap on mobile)
  3. Select photos from your phone/camera roll
  ✅ Appears in gallery instantly!

PLAYER STATS (manual edit):
  1. Admin login → "Player Stats" tab
  2. Click "Edit" next to any player
  3. Update goals, assists, appearances etc
  ✅ Live immediately!

PLAYER LOGIN (each player sees their own stats):
  Share their credentials — they login with:
  → ishan@nafc.in / Nafc@Ishan5
  → (see full list below)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ALL PLAYER LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Share these privately with each player.
Tell them to go to your Netlify URL and tap LOGIN.

  ADMIN      → admin@nafc.in        / NafcAdmin@2025  (YOU)
  ─────────────────────────────────────────
  ISHAN      → ishan@nafc.in        / Nafc@Ishan5
  VIGNESH    → vignesh@nafc.in      / Nafc@Vignesh4
  VARDHAN    → vardhan@nafc.in      / Nafc@Vardhan6
  AKARSH     → akarsh@nafc.in       / Nafc@Akarsh1
  PRIKSHIT   → prikshit@nafc.in     / Nafc@Prikshit7
  HRUTHIK    → hruthik@nafc.in      / Nafc@Hruthik10
  RUDDY      → ruddy8@nafc.in       / Nafc@Ruddy8
  HAFEEZ     → hafeez@nafc.in       / Nafc@Hafeez9
  GOPAL      → gopal@nafc.in        / Nafc@Gopal3
  DHEEMANTH  → dheemanth@nafc.in    / Nafc@Dheemanth30
  NITHIN     → nithin@nafc.in       / Nafc@Nithin14
  SHETTY     → shetty@nafc.in       / Nafc@Shetty11
  MEGUR      → megur@nafc.in        / Nafc@Megur17
  RUDDY (#7) → ruddy7@nafc.in       / Nafc@Ruddy7
  VIGNESH2   → vignesh2@nafc.in     / Nafc@Vignesh2

⚠️  Players should change their passwords after first login.
    Firebase Console → Authentication → select user → reset password


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SHARE LINKS (WhatsApp & Instagram)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WhatsApp group:
  "NAFC FC is officially online! Check squad, results & more 🔥
   👉 https://YOUR-NETLIFY-URL.netlify.app"

Instagram bio:
  Add your Netlify URL to your Instagram bio link
  OR use linktr.ee to combine multiple links

The site shows a rich preview (title + description) when shared!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FILE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

nafc-football-club/
├── public/
│   ├── index.html          ← PWA meta tags, font links
│   ├── manifest.json       ← PWA install config
│   ├── sw.js               ← Service worker (offline)
│   ├── logo192.png         ← App icon (ADD YOUR LOGO HERE)
│   └── logo512.png         ← App icon large (ADD YOUR LOGO HERE)
├── src/
│   ├── App.js              ← Full public website (HOME, PLAYERS, MATCHES, STATS, GALLERY)
│   ├── index.js            ← Entry point + SW registration
│   ├── logo.js             ← Your NAFC badge (embedded)
│   ├── components/
│   │   └── AuthContext.js  ← Login state management
│   ├── firebase/
│   │   ├── config.js       ← 🔴 YOUR FIREBASE CREDENTIALS GO HERE
│   │   └── seed.js         ← Run once to create all accounts
│   └── pages/
│       ├── LoginPage.js    ← Login modal (players + admin)
│       ├── AdminDashboard.js ← Full admin control panel
│       └── PlayerPortal.js ← Each player's personal stats page
├── firestore.rules         ← Security rules for Firestore
├── package.json
└── SETUP.md                ← This file!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 LOGO ICONS FOR PWA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The PWA needs logo192.png and logo512.png in the /public folder.

Quick way:
  1. Save your NAFC badge as logo.png
  2. Go to → https://realfavicongenerator.net
  3. Upload logo.png → it generates all sizes
  4. Download and put logo192.png + logo512.png into /public


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Most common issues:

❌ "Firebase: Error (auth/invalid-api-key)"
   → You forgot to paste your Firebase config in config.js

❌ "Permission denied" when saving matches
   → You're not logged in as admin, or security rules are wrong

❌ Photos not uploading
   → Firebase Storage not enabled, or storage rules too strict
   → Set storage rules to test mode temporarily

❌ Login works locally but not on Netlify
   → Add your Netlify domain to Firebase → Authentication → Authorized domains
