# World Cup Predictions Game — Project Documentation

## Overview

A modern React + Vite web app for tracking World Cup predictions with real-time leaderboards powered by Firebase Firestore. Players submit Excel files with score predictions, admins enter actual results, and scores update live.

**Key tech stack:**
- Frontend: React 19 + React Router v7
- Build: Vite
- Styling: Tailwind CSS
- Database: Firebase Firestore (free Spark plan)
- Excel parsing: SheetJS (xlsx)
- Deployment: Netlify

---

## Project Structure

```
src/
├── lib/
│   ├── firebase.js          # Firebase init, config validation, exports db
│   ├── excel.js             # parseExcel() — parses .xlsx files into predictions
│   └── scoring.js           # scoreGame(), calculatePlayerScore(), aggregateLeaderboard()
├── components/
│   ├── Header.jsx           # Nav header with links to /, /submit, /admin
│   ├── ErrorBoundary.jsx    # Global error handler for uncaught JS errors
│   ├── Countdown.jsx        # Live countdown timer to deadline, changes color <1hr
│   ├── MatchCard.jsx        # Displays one game; editable in submit, read-only with points elsewhere
│   ├── Leaderboard.jsx      # Real-time ranked table, listens to /submissions Firestore
│   └── RoundTabs.jsx        # Tabs to switch between rounds (R16, QF, SF, Final)
├── pages/
│   ├── Home.jsx             # Leaderboard view, round tabs, countdown, shows predictions after deadline
│   ├── Submit.jsx           # Name → Excel upload → preview → confirm; checks deadline
│   └── Admin.jsx            # Password gate → enter results per game → save all
├── App.jsx                  # Router setup, Firebase config check, error boundary
├── main.jsx                 # React DOM root
└── index.css                # Tailwind imports, custom utility classes
```

---

## Data Model (Firestore)

### `/rounds/{roundId}`
```javascript
{
  name: "Round of 16",
  status: "open" | "closed" | "completed",
  deadline: Timestamp(2026-06-28T19:30:00),
  games: [
    { id: "game_1", teamA: "Team A", teamB: "Team B" },
    ...
  ],
  results: [
    { gameId: "game_1", scoreA: 2, scoreB: 1 },
    ...
  ]
}
```

### `/submissions/{userName}_{roundId}`
```javascript
{
  userName: "John",
  roundId: "r16",
  submittedAt: Timestamp,
  predictions: [
    { gameId: "game_1", scoreA: 2, scoreB: 1 },
    ...
  ]
}
```

---

## Key Functions

### `src/lib/scoring.js`

**`scoreGame(prediction, result)`**
- Returns: 3 (exact), 1 (correct outcome), 0 (wrong), or null (no result yet)
- Handles: null results, draws vs wins logic via `Math.sign()`

**`calculatePlayerScore(predictions, results)`**
- Sums points across all games with results for one player

**`aggregateLeaderboard(submissions, results)`**
- Takes array of submissions and results
- Returns sorted array `[{userName, totalScore, submittedAt, predictions}, ...]`
- Sorted descending by totalScore

### `src/lib/excel.js`

**`parseExcel(file)`**
- Input: File blob from `<input type="file">`
- Output: `[{gameId, teamA, teamB, scoreA, scoreB}, ...]`
- Parses first sheet, skips header row, maps columns by position

### `src/lib/firebase.js`

- Validates required env vars on module load
- Throws if initialization fails
- Exports `db` (Firestore instance) and `isFirebaseConfigured` (boolean)

---

## Firebase Setup

**Firestore Rules** (`firestore.rules`):
- Read: anyone (public leaderboard)
- Write submissions: must have userName, roundId, predictions
- Update submissions: only if userName/roundId unchanged (prevents tampering)
- Delete rounds: allowed (admin can remove a round from the panel)
- No submission deletes (prevents accidental loss)

**Security notes:**
- No user authentication; client-side password only for admin
- Acceptable for friends-only game; not for public apps
- Add Firebase Auth if deploying publicly

---

## Deadline Logic

**In Countdown.jsx:**
- Compares `deadline.getTime()` vs `Date.now()` every 1s
- Turns red <1 hour to deadline
- Shows "Submissions closed" when past

**In Submit.jsx:**
- Checks deadline on page load and round selection
- Disables file upload if closed
- Shows "Submissions closed" message

**In Home.jsx:**
- Sets `deadlinePassed` flag when loading round data
- Uses flag to show/hide predictions on leaderboard

**Important:** All deadline checks are client-side. Server-side validation (Firestore rules) does NOT currently enforce deadlines — only client honor system.

---

## Environment Variables

Required in `.env.local` (or Netlify env settings for deploy):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET     (optional, can be empty)
VITE_FIREBASE_MESSAGING_SENDER_ID (optional, can be empty)
VITE_FIREBASE_APP_ID
VITE_ADMIN_PASSWORD
```

Vite prefix `VITE_` exposes these to client-side code. Non-VITE vars are not bundled.

---

## Common Tasks

### Initialize Round of 16

Admin page → "Initialize Round of 16" button → seeds hardcoded WORLDCUP_R16_GAMES list → creates `/rounds/r16` doc with games, empty results, deadline=2026-06-28T19:30:00.

### Create New Round (QF, SF, Final)

Admin page → "Create New Round" form → enter name + deadline → generates roundId from name (lowercase, space→underscore) → creates new `/rounds/{roundId}` doc.

### Enter Results

Admin page → Select round → Enter scores per game in grid → Click "Save All Results" → updateDoc() sends results to Firestore → Leaderboard re-renders live via onSnapshot listener.

### Submit Predictions

Submit page → Enter name + select round + upload .xlsx → parsed Excel validated → edit scores in preview → confirm → setDoc() creates `/submissions/{userName}_{roundId}` → appears on leaderboard immediately.

---

## Error Handling

**Firebase config missing:**
- `isFirebaseConfigured` flag set in firebase.js
- App.jsx checks flag, renders `<FirebaseConfigError>` if false
- User sees clear message pointing to README setup

**Firestore errors:**
- All onSnapshot/getDocs calls have error handler
- Logs to console, user sees fallback UI (usually empty leaderboard or "failed to load")
- Home.jsx shows explicit error banner for collection errors

**Excel parsing:**
- try/catch in Submit.jsx, catch block shows error message
- Falls back to empty predictions if parse fails

**Global errors:**
- ErrorBoundary.jsx catches JS errors, shows reload button
- Window 'error' event listener logs stack

---

## Testing Checklist

Before deploying:

1. **Firebase**
   - [ ] Create Firebase project + Firestore
   - [ ] Copy config to .env.local
   - [ ] Deploy firestore.rules
   - [ ] Can read/write to /rounds and /submissions

2. **Local dev**
   - [ ] `npm run dev` starts server on :5173
   - [ ] Navigate to /, /submit, /admin without 404s
   - [ ] Admin: Initialize R16, see games in Firestore

3. **Submissions**
   - [ ] Upload Excel as 2 different players
   - [ ] Both names appear on leaderboard (scores hidden pre-deadline)
   - [ ] Can update submission within deadline
   - [ ] Deadline enforcement works

4. **Results + Scoring**
   - [ ] Admin: enter results for 3 games
   - [ ] Leaderboard shows correct points (3 for exact, 1 for outcome, 0 for wrong)
   - [ ] Results save to Firestore

5. **UI**
   - [ ] Countdown timer ticks down
   - [ ] Leaderboard ranks correctly (high scores first)
   - [ ] Mobile responsive (test on phone)
   - [ ] Errors show user-friendly messages

6. **Deployment**
   - [ ] `npm run build` produces `/dist`
   - [ ] `netlify.toml` redirects SPA routes
   - [ ] Deploy to Netlify, set env vars
   - [ ] Direct `/admin` URL doesn't 404

---

## Gotchas

1. **Deadline timezone:** Currently client-local time. To fix: explicitly show "Lisbon time (UTC+1)" or calculate deadline offset in Countdown.

2. **No server-side deadline check:** Firestore rules don't enforce deadline. A determined player could submit after deadline by sending raw Firestore API call. Use Firebase Auth + server functions if stricter enforcement needed.

3. **Timestamp serialization:** `data.deadline.toMillis()` works for Timestamp objects from Firestore, but hardcoded dates need `.getTime()` check. See Home.jsx line 46.

4. **Admin password in client:** Clear-text in browser memory. For a public app, use Firebase Auth (sign admin with email/password) instead.

5. **Leaderboard shows all submissions:** No privacy. Anyone can see everyone else's predictions (after deadline). Add user auth if needed.

6. **Excel parsing:** Relies on column order (Game#, Team A, Team B, Score A, Score B). If column headers shift, parsing breaks.

---

## Future Work

- [ ] Server-side deadline enforcement (Cloud Functions)
- [ ] Firebase Authentication for admin + player roles
- [ ] Tie-breaker rules (head-to-head, goal differential)
- [ ] Export leaderboard to PDF
- [ ] Email notifications at deadline
- [ ] Dark/light mode toggle
- [ ] Undo/history of result edits
