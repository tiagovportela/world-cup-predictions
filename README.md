# World Cup Predictions Game

A modern, football-themed web app for tracking World Cup predictions across multiple rounds. Players submit Excel files with their predicted scores, and an admin enters actual results to calculate live leaderboards.

**Features:**
- 📊 Real-time leaderboard with live scoring
- ⚽ Football-inspired design with modern UI
- 🔐 Admin panel with password protection
- 📁 Excel file upload for predictions
- ⏰ Automatic deadline enforcement
- 🔄 Reusable across rounds (R16 → QF → SF → Final)
- 🚀 Free deployment on Netlify

---

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Create a new project**
3. Enter project name (e.g., "world-cup-predictions")
4. Disable Google Analytics (optional)
5. Click **Create project**

### 2. Enable Firestore

1. In Firebase Console, go to **Firestore Database** (left sidebar)
2. Click **Create database**
3. Select **Start in locked mode** (security rules below will handle access)
4. Choose a region (closest to you for latency)
5. Click **Create**

### 3. Add Firebase Config to the Project

1. In Firebase Console, click **Project Settings** (gear icon)
2. Copy the **Firebase SDK snippet** (shows `firebaseConfig` object)
3. Create a `.env.local` file in project root:

```bash
cp .env.local.example .env.local
```

4. Fill in the values from Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ADMIN_PASSWORD=your_secret_password_here
```

### 4. Deploy Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** → **Rules** tab
2. Replace the default rules with contents of `firestore.rules` file in this repo
3. Click **Publish**

**What these rules do:**
- Anyone can read all submissions and rounds
- Anyone can create a submission (with required fields: userName, roundId, predictions)
- Players can only update their own submissions
- Admin can create/update rounds
- No one can delete (prevents accidents)

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Locally

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Usage

### For Players

1. Go to **Submit** page
2. Enter your name
3. Upload the Excel file with your predictions
4. Review your predictions
5. Click **Confirm & Submit**
6. Your name appears on the live leaderboard
7. After deadline (19:30 Lisbon time), your predictions become visible on the leaderboard

### For Admin

1. Go to **Admin** page
2. Enter the admin password you set in `.env.local`
3. Click **Initialize Round of 16** to seed the first round with 16 matches
4. After matches are played:
   - **Option A (Auto):** Click **"🔄 Auto-fetch from API"** to automatically populate scores (requires VITE_RAPIDAPI_KEY)
   - **Option B (Manual):** Manually enter the actual scores for each game
5. Click **Save All Results** to update the leaderboard in real-time

**To add new rounds (Quarterfinals, Semifinals, Final):**
1. On Admin page, fill in **Create New Round** form
2. Enter round name and deadline (use datetime picker)
3. Click **Create Round**
4. Use auto-fetch or manually enter results

---

## Excel File Format

The upload file should match `Mundial 16.xlsx` structure:

| Game# | Team A | Team B | Score A | Score B |
|-------|--------|--------|---------|---------|
| 1 | Africa do Sul | Canada | | |
| 2 | Brasil | Japao | | |
| ... | ... | ... | | |

- **Game#**: Sequential number (1-16 for R16, 1-8 for QF, etc.)
- **Team A, Team B**: Team names (must match Excel)
- **Score A, Score B**: Your predicted scores (leave empty initially)

---

## Scoring Rules

- **Exact score** (e.g., predict 2-1, actual 2-1): **3 points**
- **Correct outcome** (e.g., predict 2-1, actual 3-0, both are home wins): **1 point**
- **Wrong outcome**: **0 points**

Total score = sum across all completed games in the round.

---

## Deployment to Netlify

### Option 1: Connect GitHub (Recommended)

1. Push this repo to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click **Import an existing project** → **GitHub**
4. Select your repository
5. Netlify auto-detects Vite config
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click **Deploy**
7. In **Site settings** → **Environment**, add your `.env.local` variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_ADMIN_PASSWORD`

### Option 2: Deploy from CLI

```bash
npm run build
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

When prompted for environment variables, enter them one by one.

---

## Project Structure

```
worldcup/
├── src/
│   ├── lib/
│   │   ├── firebase.js      # Firebase initialization
│   │   ├── excel.js         # Excel file parser
│   │   └── scoring.js       # Scoring logic
│   ├── components/
│   │   ├── Header.jsx       # Navigation
│   │   ├── Countdown.jsx    # Deadline timer
│   │   ├── MatchCard.jsx    # Game prediction card
│   │   ├── Leaderboard.jsx  # Real-time rankings
│   │   └── RoundTabs.jsx    # Round selector
│   ├── pages/
│   │   ├── Home.jsx         # Leaderboard view
│   │   ├── Submit.jsx       # Prediction upload
│   │   └── Admin.jsx        # Results entry
│   ├── App.jsx              # Main app
│   ├── main.jsx             # Entry point
│   └── index.css            # Tailwind styles
├── firestore.rules          # Firestore security rules
├── netlify.toml             # Netlify config (SPA routing)
├── tailwind.config.js       # Tailwind customization
├── vite.config.js           # Vite config
└── README.md                # This file
```

---

## Troubleshooting

### "Firebase config is not valid"
- Check that all env variables in `.env.local` are correctly copied from Firebase Console
- Make sure you're using the correct Firebase project

### "Submissions closed" but deadline hasn't passed
- Your local time might be incorrect
- Check that the deadline in Firestore is set to 2026-06-28T19:30:00 (Lisbon time = UTC+1)
- Adjust deadline on Admin page if needed

### "Failed to parse Excel"
- Make sure the file has columns: Game#, Team A, Team B, Score A, Score B
- Column names are case-sensitive
- File must be `.xlsx` format (not `.xls` or `.csv`)

### Leaderboard not updating after entering results
- Check admin page console for errors (F12 → Console tab)
- Make sure you clicked **Save All Results**
- Refresh the Home page (Ctrl+Shift+R for hard refresh)

### Can't access `/admin` page after deploy
- Make sure `netlify.toml` is present in root (handles SPA routing)
- Redeploy: changes to `netlify.toml` require a new build

---

## Security Notes

- **Admin password** is stored client-side and checked in the browser. This is acceptable for a friends-only game, not for public apps.
- **Firestore rules** prevent players from editing other players' submissions
- **No user authentication** is used — anyone can view leaderboards
- For a serious tournament, consider adding Firebase Authentication

---

## Auto-Fetch Real Results (Optional)

The admin panel can **automatically fetch real World Cup results from api-football.com** via RapidAPI (free tier: 100 requests/day).

**To enable:**
1. Get a free RapidAPI key: https://rapidapi.com/api-sports/api/api-football
2. Add to `.env.local`: `VITE_RAPIDAPI_KEY=your_key`
3. In Admin panel, click **"🔄 Auto-fetch from API"** after games are played

See **[API_SETUP.md](API_SETUP.md)** for detailed instructions.

---

## Future Enhancements

- Export leaderboard to CSV/PDF
- Round history and archives
- Tie-breaking rules (head-to-head, bonus points)
- Mobile app version
- Email notifications for deadline reminders

---

## Support

If you encounter issues:
1. Check the **Troubleshooting** section above
2. Verify Firebase config in Console matches `.env.local`
3. Check browser console (F12) for error messages
4. Ensure Firestore rules are deployed correctly

Enjoy the World Cup! ⚽🏆
