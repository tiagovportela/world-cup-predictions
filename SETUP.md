# Quick Start Guide

## TL;DR Setup (5 minutes)

### 1. Firebase Project
- Go to https://console.firebase.google.com
- Create a new project
- Go to **Firestore Database** → **Create database** → **Locked mode**
- Copy your Firebase config from **Project Settings**

### 2. Configure Project
```bash
# Copy example config
cp .env.local.example .env.local

# Edit .env.local and paste Firebase keys
# Add any admin password you want
```

### 3. Deploy Firestore Rules
In Firebase Console:
- Go to **Firestore Database** → **Rules** tab
- Copy contents of `firestore.rules` from this repo
- Click **Publish**

### 4. Run Locally
```bash
npm install
npm run dev
```

Open http://localhost:5173 and test:
1. Go to **Admin** → enter password → **Initialize Round of 16**
2. Go to **Submit** → upload Excel → submit predictions
3. Go to **Home** → see live leaderboard

### 5. Deploy to Netlify

**Option A: GitHub Auto-Deploy (Recommended)**
1. Push repo to GitHub
2. Go to https://netlify.com → **Import from GitHub**
3. Select repo → Deploy (Netlify auto-detects settings)
4. In **Site Settings** → **Environment** → add env vars:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_ADMIN_PASSWORD`

**Option B: CLI Deploy**
```bash
npm run build
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Firebase config is not valid" | Check `.env.local` — all VITE_ vars must be filled |
| "Submissions closed" too early | Check deadline in Firestore (should be 2026-06-28T19:30:00) |
| Excel upload fails | Make sure columns are: Game#, Team A, Team B, Score A, Score B |
| Leaderboard empty after submit | Firestore rules deployed? Check Firebase Console → Rules tab |
| `/admin` returns 404 after deploy | Make sure `netlify.toml` is in root and redeploy |

---

## Key Pages

- **Home** (`/`) — Live leaderboard, countdown timer
- **Submit** (`/submit`) — Upload Excel predictions (locked after deadline)
- **Admin** (`/admin`) — Password-protected, enter actual scores

---

## Deadlines & Scoring

**Deadline:** 2026-06-28 19:30 Lisbon time  
**Scoring:**
- Exact score: **3 points**
- Correct outcome (winner/draw): **1 point**
- Wrong: **0 points**

Predictions hidden until deadline passes.

---

See **README.md** for full documentation.
