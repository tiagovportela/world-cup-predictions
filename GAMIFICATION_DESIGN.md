# World Cup Predictions: Gamification & Badge System Design

## Executive Summary

A three-tier badge system with 20 achievable badges organized by category: **Skill** (prediction accuracy), **Consistency** (sustained performance), **Engagement** (participation patterns), **Rare Achievements** (hard-to-earn status badges), and **Fun/Humor** (behavioral quirks). Badges unlock in real-time and appear on player profiles + leaderboard. MVP launches with 8-10 foundational badges (easy to calculate), evolving to full system post-launch.

---

## 1. Badge Categories & Architecture

### 1.1 Five Badge Categories

| Category | Purpose | Rarity | Unlock Timing | Points Reward |
|----------|---------|--------|--------------|---------------|
| **Skill** | Predict accurately | Common to Rare | After results posted | No |
| **Consistency** | Sustain high performance across rounds | Rare | Between rounds | No |
| **Engagement** | Show up and participate | Common | Real-time | No |
| **Rare Achievements** | Major tournament accomplishments | Very Rare | End of tournament | No |
| **Fun/Humor** | Behavioral patterns & quirks | Common to Rare | Real-time/post-round | No |

### 1.2 Tier Structure (Simple, Not Tiered)

**Decision:** Flat badge system with no bronze/silver/gold. Reasoning:
- Simpler to implement and explain
- Each badge is distinct and memorable
- Avoids complexity of "upgrading" badges
- Can still show rarity % on profile (e.g., "Untouchable — earned by 2% of players")

**Alternative (if progression desired):** Per-badge levels (e.g., "Sharp Shooter I, II, III" for 3+, 5+, 10+ exact scores), but adds implementation complexity for MVP.

---

## 2. Badge Catalog (20 Badges)

### SKILL BADGES (5 badges) — Predict Accurately

| Badge | Emoji | Unlock Criteria | Complexity | Notes |
|-------|-------|-----------------|-----------|-------|
| **Perfect Round** | 🎯 | 100% round accuracy (3+ pts per game, all games correct) | Medium | Requires tracking accuracy % per player per round |
| **Sharp Shooter** | 🔫 | 3+ exact score predictions in single round | Low | Count scoreA==resultA && scoreB==resultB per round |
| **Mind Reader** | 🧠 | 10+ correct outcomes (win/loss/draw) across all rounds | Low | Cumulative counter; calculate from all predictions |
| **Bullseye** | 🎪 | 5+ exact scores in tournament | Low | Cumulative counter across all rounds |
| **Near Miss Master** | 😅 | 8+ "outcome correct but score off by 1" predictions (e.g., predicted 2-0, actual 2-1) | Medium | Requires tolerance calculation |

### CONSISTENCY BADGES (4 badges) — Sustained Performance

| Badge | Emoji | Unlock Criteria | Complexity | Notes |
|-------|-------|-----------------|-----------|-------|
| **Steady Hand** | ✋ | Average 1.5+ points per game across all submitted rounds (min 10 games) | Medium | Requires avg calculation; needs min threshold to avoid trivial unlock |
| **Clutch Player** | 🏌️ | Score 2+ points higher in R2 than in R1 (comeback from low first round) | Medium | Compare per-player scores between consecutive rounds |
| **Reliable** | ⭐ | Submit predictions in every round of tournament | Low | Count submissions per player; simple binary check |
| **Consistent Performer** | 📈 | Finish top 5 in final standings | Low | Compare final leaderboard position |

### ENGAGEMENT BADGES (4 badges) — Participate & Show Up

| Badge | Emoji | Unlock Criteria | Complexity | Notes |
|-------|-------|-----------------|-----------|-------|
| **Early Bird** | 🐦 | First submission in round (earliest submittedAt timestamp) | Low | Query submissions, find min timestamp per round |
| **Last Call** | ⏰ | Submit within last 5 minutes before deadline | Low | Compare submittedAt vs deadline; require (deadline - submittedAt) < 5min |
| **All In** | 🎰 | Submit predictions for all 16 matches in single round | Low | Check predictions.length == 16 |
| **Tournament Witness** | 👀 | View leaderboard in all 4 rounds | Low | Requires client-side tracking of viewed rounds (store in localStorage) |

### RARE ACHIEVEMENTS (4 badges) — Major Accomplishments

| Badge | Emoji | Unlock Criteria | Complexity | Notes |
|-------|-------|-----------------|-----------|-------|
| **Untouchable** | 👑 | Perfect R16 (100% accuracy, all 16 games correct) | High | Most prestigious badge; rare by design |
| **Prophecy** | 🔮 | 2+ consecutive exact score predictions in same round | High | Track streaks; requires reading predictions in game order |
| **Tournament Champion** | 🏆 | Highest final score across all rounds | Low | Check final leaderboard position == 1 |
| **Comeback King** | 🚀 | Win tournament from last place after R1 | High | Track R1 position vs final position; must start bottom 3 |

### FUN/HUMOR BADGES (3 badges) — Behavioral Quirks

| Badge | Emoji | Unlock Criteria | Complexity | Notes |
|-------|-------|-----------------|-----------|-------|
| **Upset Artist** | 🎨 | Predict underdog win in 80%+ of predictions | Medium | Track win/loss predictions; calculate underdog %; requires knowing seeding/odds |
| **Conservative** | 🤐 | Lowest variance in predicted scores (std dev < 0.5 across all predictions) | High | Calculate std dev of all predicted scores |
| **Goal Junkie** | ⚽ | Average predicted score > 2.5 goals per game (sum/count of all goal predictions) | Low | Calculate mean of (scoreA + scoreB) across predictions |

---

## 3. Badge Data Model & Tracking

### 3.1 New Firestore Collections

#### `/badges/{playerId}`
```javascript
{
  playerId: "john_doe",
  earned: [
    {
      badgeId: "perfect_round",
      earnedAt: Timestamp,
      roundId: "r16",
      progress: { accuracy: 100, gamesCorrect: 16 }
    },
    {
      badgeId: "sharp_shooter",
      earnedAt: Timestamp,
      roundId: "r16",
      progress: { exactScores: 3, targetCount: 3 }
    }
  ],
  inProgress: [
    {
      badgeId: "mind_reader",
      progress: { correctOutcomes: 7, targetCount: 10 }
    },
    {
      badgeId: "steady_hand",
      progress: { avgScore: 1.3, gamesPlayed: 8, targetAvg: 1.5 }
    }
  ]
}
```

#### `/leaderboard-metadata/{year}`
```javascript
{
  year: 2026,
  totalPlayers: 8,
  badgeRarity: {
    "perfect_round": { count: 1, percentage: 12.5 },
    "sharp_shooter": { count: 3, percentage: 37.5 },
    "mind_reader": { count: 2, percentage: 25 },
    // ... etc
  }
}
```

### 3.2 Enhanced Submission Document

Add to existing `/submissions/{userName}_{roundId}`:
```javascript
{
  // ... existing fields ...
  badgesEarnedThisRound: ["sharp_shooter", "all_in"],
  roundBadgeProgress: {
    "perfect_round": { accuracy: 87.5, games: 14 },
    "consistent_performer": { avgScore: 1.45, gamesTotal: 24 }
  }
}
```

### 3.3 Data Tracking Requirements

**Per-Player Lifetime Metrics:**
- `totalGamesPlayed`: sum of all predictions across all rounds
- `correctOutcomes`: count of predictions with correct win/loss/draw
- `exactScores`: count of perfect score predictions
- `totalScore`: sum of all points (already tracked)
- `roundSubmissions`: array of {roundId, submittedAt, accuracy%, score}
- `predictionVariance`: std dev of all predicted scores
- `submissionTimings`: array of (submittedAt - deadline) for last-call detection
- `upsetPredictions`: count of underdog predictions (requires match odds data)

**Per-Round Metrics:**
- `roundAccuracy`: % of correct predictions
- `roundScore`: total points in this round
- `roundRank`: position in leaderboard for this round only
- `submissionTime`: milliseconds before deadline

---

## 4. Badge Unlock Timing & Real-Time Calculation

### 4.1 When Badges Unlock

**Real-Time (Immediate):**
- Early Bird (first submission)
- All In (16 predictions submitted)
- Last Call (within 5 min of deadline)
- Tournament Witness (client-side on navigation)

**After Round Results Posted:**
- Perfect Round (once admin enters all results)
- Sharp Shooter
- Bullseye
- Near Miss Master
- All "Skill" badges

**Between Rounds:**
- Steady Hand (calculate after R1, then after R2, etc.)
- Clutch Player (compare R1 vs R2)
- Reliable (check if submitted in round N)

**End of Tournament:**
- Untouchable (final R16 check)
- Tournament Champion (final standings)
- Comeback King (final standings)
- Prophecy (scan all predictions end-to-end)
- All cumulative badges (Mind Reader, Bullseye)

### 4.2 Progress Tracking

**Show progress in UI:**
```
🧠 Mind Reader — 7/10 correct outcomes [████░░░░░░] 70%
⭐ Steady Hand — Avg 1.3/2.5 pts per game [██░░░░░░░░] 52%
```

**On Submission Form:** Show which badges player can unlock this round.

### 4.3 Notifications

**When badge earned:**
- Toast notification: "🎯 You earned Perfect Round!"
- Logged in `/badges/{playerId}.earned[]` with earnedAt timestamp

---

## 5. Display & UX Strategy

### 5.1 Where Badges Appear

#### Player Profile Card (on Leaderboard)
```
┌─────────────────────────────────┐
│ 1. John Doe — 47 points         │
│    Badges: 🎯 🔫 🧠 ⭐ 🏆      │
│    [View Profile]               │
└─────────────────────────────────┘
```

Clicking badge shows tooltip:
```
Perfect Round — 100% round accuracy
Unlocked: Round of 16
Earned by 12% of players
```

#### Expanded Player Profile Modal
```
═══════════════════════════════════════════════
        JOHN DOE — PLAYER PROFILE
═══════════════════════════════════════════════

📊 STATISTICS
  Total Score: 47 points
  Accuracy: 62% (25/40 games)
  Rounds Played: 3/4
  Submission Streak: 3 (All rounds)

🏅 EARNED BADGES (6)
  🎯 Perfect Round — 100% accuracy, R16
  🔫 Sharp Shooter — 3 exact scores, QF
  🧠 Mind Reader — 10+ correct outcomes
  ⭐ Steady Hand — 1.5+ avg pts per game
  🏆 Tournament Champion — #1 final rank
  ✋ Reliable — Submitted all 4 rounds

📈 IN PROGRESS
  🚀 Comeback King — Currently last after R1 (need Top 5 final)
  👑 Untouchable — 6/8 games perfect so far (R16)

═══════════════════════════════════════════════
```

#### Dedicated Achievements Page
New route: `/achievements`

```
═══════════════════════════════════════════════
         TOURNAMENT ACHIEVEMENTS
═══════════════════════════════════════════════

YOUR EARNED BADGES: 6/20 (30%)

────────────────────────────────────────────
🎯 SKILL BADGES (3/5)
────────────────────────────────────────────
✓ Perfect Round — 100% accuracy
   Unlocked Round of 16
   Earned by 12% of players

✓ Sharp Shooter — 3+ exact scores
   Unlocked Quarter Finals
   Earned by 37% of players

✓ Mind Reader — 10+ correct outcomes
   Unlocked Quarter Finals
   Earned by 25% of players

□ Bullseye — 5+ exact scores (2/5)
   Earned by 15% of players
   Your Progress: ████░ 40%

□ Near Miss Master — 8+ off-by-1 (3/8)
   Earned by 8% of players
   Your Progress: ███░░ 37%

────────────────────────────────────────────
⭐ CONSISTENCY BADGES (2/4)
────────────────────────────────────────────
✓ Steady Hand — 1.5+ avg pts
   Earned by 50% of players

✓ Reliable — Submit every round
   Earned by 44% of players

□ Clutch Player — +2 points R2 vs R1
   Earned by 18% of players
   Your Status: +1.2 gain so far

□ Consistent Performer — Top 5 final
   Earned by 20% of players
   Your Rank: #7 (need Top 5)

────────────────────────────────────────────
🐦 ENGAGEMENT BADGES (2/4)
────────────────────────────────────────────
✓ Early Bird — First submission
   Earned by 6% of players
   Submitted 1h 23m before deadline

✓ All In — 16 predictions per round
   Earned by 88% of players

□ Last Call — <5 min before deadline
   Earned by 22% of players
   Your Status: 3h 14m early

□ Tournament Witness — View all rounds
   Earned by 55% of players
   Your Progress: 3/4 rounds viewed

────────────────────────────────────────────
👑 RARE ACHIEVEMENTS (0/4)
────────────────────────────────────────────
□ Untouchable — Perfect R16
  Earned by 2% of players
  Your Status: 6/8 games in R16

□ Prophecy — 2+ consecutive exact scores
  Earned by 4% of players
  Your Status: No streak yet

□ Tournament Champion — #1 final
  Earned by 12% of players (only 1!)
  Your Rank: #7

□ Comeback King — Last→Top 5
  Earned by 3% of players
  Your Status: Not last after R1

════════════════════════════════════════════

[Export as PNG] [Share to Socials]
```

#### Public Leaderboard Enhancement
Show badges inline:

```
RANK   PLAYER           SCORE   BADGES
───────────────────────────────────────
1.     Sarah Chen       51      🏆 🎯 ⭐ 🔫 ✋ 🐦
2.     John Doe         47      🎯 🔫 🧠 ⭐ 🏆 ✋
3.     Maria Silva      43      🔫 ✋ ⏰
4.     Alex Kumar       41      ✋ 👀
```

Clicking any badge shows rarity tooltip: "Earned by 12% of players (1/8)"

### 5.2 Visual Design

**Badge Display:**
- **Large (profile):** 48px emoji + label below
- **Medium (leaderboard):** 24px emoji + optional name on hover
- **Small (progress):** 16px emoji + progress bar

**Color-coding for rarity (optional enhancement):**
- Common (25%+): Gray background
- Uncommon (10-25%): Blue
- Rare (5-10%): Purple
- Legendary (<5%): Gold

**Visual Indicators:**
- Earned: Full color, glowing effect
- In Progress: Grayscale, progress bar below
- Locked: Darker gray with lock icon (🔒)

---

## 6. Motivation Design

### 6.1 Do Badges Have Point Rewards?

**Recommendation: NO direct point rewards**

**Reasoning:**
- Prevents badge-hunting from distorting prediction accuracy (e.g., chasing "Off-by-1" badge)
- Keeps leaderboard based on pure prediction skill
- Simplifies scoring logic
- Badges feel like cosmetic status, not gameplay advantage

**Alternative:** Small non-compounding bonus (e.g., +1 cosmetic point displayed separately in "Achievement Points" column), but this adds complexity and muddies the main leaderboard.

### 6.2 Leaderboard Ordering

**Primary sort:** Total points (game accuracy)
**Secondary sort:** Badge count (tiebreaker)
**Tertiary sort:** Submission time (earliest wins)

**Optional:** Separate "Achievements Leaderboard" showing badge count:
```
RANK  PLAYER          BADGES  EARNED
─────────────────────────────────────
1.    John Doe        8/20    ⭐⭐⭐⭐⭐
2.    Sarah Chen      7/20    ⭐⭐⭐⭐
3.    Maria Silva     5/20    ⭐⭐⭐
```

### 6.3 Hidden vs. Transparent Badges

**Recommendation: All transparent (visible + progress shown)**

**Reasoning:**
- Surprise badges demotivate players ("I had no idea this badge existed")
- Transparent progress drives engagement (see the bar filling up)
- Players work toward goals they understand

**Exception:** Rare "Prophecy" badge can have semi-hidden discovery — no progress bar, just "Unlocks if you predict 2+ exact consecutive scores" with no further hints about how close you are.

### 6.4 Cosmetic Rewards Beyond Badges

**Stretch goals (not MVP):**
- **Badge Frame:** Earn 5 badges → unlock special frame design for player card
- **Title:** "Sharp Shooter Master" appears next to name after 2+ badge categories
- **Custom Avatar:** Unlock alternate team flag colors after earning 10 badges
- **Leaderboard Highlight:** Top 5 badge earners get highlighted row

---

## 7. Implementation Complexity Matrix

### Complexity by Badge

| Badge | Complexity | Data Tracking | Effort (hrs) | Notes |
|-------|-----------|----------------|--------------|-------|
| **Early Bird** | Low | First timestamp per round | 0.5 | Query min(submittedAt) |
| **Sharp Shooter** | Low | Count exact score matches | 1 | Check scoreA==resultA && scoreB==resultB |
| **Mind Reader** | Low | Running counter of correct outcomes | 1 | Cumulative throughout tournament |
| **All In** | Low | Check predictions.length == 16 | 0.5 | Already have this data |
| **Last Call** | Low | deadline - submittedAt < 5min | 1 | Compare two timestamps |
| **Tournament Witness** | Low | localStorage: viewed rounds | 1 | Client-side tracking |
| **Goal Junkie** | Low | Calculate avg of all goal predictions | 1 | Sum/count of scoreA+scoreB |
| **Bullseye** | Low | Cumulative counter | 1 | Track across all rounds |
| **Reliable** | Low | Count submissions per player | 1 | Check # of rounds submitted |
| **Consistent Performer** | Low | Final leaderboard position | 0.5 | Check == top 5 |
| **Tournament Champion** | Low | Final position == 1 | 0.5 | Simple boolean |
| **Perfect Round** | Medium | % accuracy per round | 2 | (games correct / total games) * 100 |
| **Steady Hand** | Medium | Avg points across rounds | 2 | Requires threshold validation |
| **Near Miss Master** | Medium | Count off-by-1 predictions | 2 | Check abs(pred.scoreA - result.scoreA) <= 1 |
| **Clutch Player** | Medium | Compare R1 score vs R2 score | 2 | Need round-to-round tracking |
| **Upset Artist** | Medium | Track underdog predictions | 3 | Requires odds/seeding data (external API) |
| **Conservative** | High | Calculate std dev of predictions | 3 | Statistical calculation across all games |
| **Untouchable** | High | 100% R16 accuracy | 2 | Same as Perfect Round but R16 only; rare by design |
| **Prophecy** | High | Find 2+ consecutive exact scores | 3 | Scan prediction array for streak; consider game order |
| **Comeback King** | High | Track position change R1→Final | 3 | Requires intermediate standings; complex position logic |

**Total Implementation Effort:**
- **MVP (8 badges, Low complexity):** 8 hours
- **Phase 2 (6 badges, Medium complexity):** 12 hours
- **Phase 3 (6 badges, High complexity):** 15 hours
- **Total: ~35 hours**

---

## 8. Recommended MVP (Minimum Viable Product)

### MVP Scope: 8 Foundational Badges (Week 1-2)

Launch with these easy-to-calculate badges to validate player engagement:

1. **🐦 Early Bird** — First to submit each round
   - *Why:* Real-time, instant gratification, drives early participation
   - *Data:* Just query min(submittedAt)

2. **⏰ Last Call** — Submit <5 min before deadline
   - *Why:* Creates drama, encourages deadline awareness
   - *Data:* Simple timestamp math

3. **🎯 Sharp Shooter** — 3+ exact scores per round
   - *Why:* Pure skill badge, validates prediction accuracy system
   - *Data:* Count scoreA==resultA && scoreB==resultB

4. **🏆 Tournament Champion** — Highest score at end
   - *Why:* Ultimate prestige badge, drives overall engagement
   - *Data:* Final leaderboard position

5. **✋ Reliable** — Submit predictions in all 4 rounds
   - *Why:* Consistency metric, simple to implement
   - *Data:* Count of round submissions

6. **👀 All In** — 16 predictions per round (full participation)
   - *Why:* Engagement metric, low friction
   - *Data:* predictions.length == 16

7. **⭐ Steady Hand** — 1.5+ avg points per game (min 12 games)
   - *Why:* Skill + consistency, captures sustained excellence
   - *Data:* Sum(points) / count(games)

8. **🧠 Mind Reader** — 10+ correct outcomes across tournament
   - *Why:* Lifetime achievement, long-term goal
   - *Data:* Running cumulative counter

### MVP UX Components

**Priority 1 (Week 1):**
- [ ] Badges display on leaderboard (emoji only)
- [ ] Badge tooltip with unlock criteria + rarity %
- [ ] Toast notification on badge earn

**Priority 2 (Week 2):**
- [ ] Player profile modal with earned badges
- [ ] In-progress progress bars (shown on profile)
- [ ] Firestore collection `/badges/{playerId}` with earned history

**Priority 3 (Stretch):**
- [ ] `/achievements` page with full badge catalog
- [ ] Badge rarity calculation + metadata
- [ ] Social share functionality

### MVP Database Schema

**Minimal additions to current schema:**

```javascript
// Firestore collection: /badges/{playerId}
{
  playerId: "john_doe",
  earned: [
    { badgeId: "early_bird", earnedAt: Timestamp, roundId: "r16" },
    { badgeId: "sharp_shooter", earnedAt: Timestamp, roundId: "r16" }
  ],
  progress: {
    mind_reader: { count: 7, target: 10 },
    steady_hand: { avgScore: 1.4, gamesPlayed: 8, target: 1.5 }
  }
}

// Update /submissions/{userName}_{roundId} to include:
{
  badgesEarnedThisRound: ["early_bird", "sharp_shooter"],
  // ... rest of existing fields
}
```

### MVP Calculation Logic (New Function)

```javascript
// src/lib/badgeCalculations.js

export function calculateBadgeProgress(playerData, submissions, results, roundId) {
  const badges = {
    earnedThisRound: [],
    earnedLifetime: [],
    inProgress: {}
  }

  // Early Bird
  const earliestSubmission = submissions.reduce((min, s) => 
    s.submittedAt < min.submittedAt ? s : min
  )
  if (earliestSubmission.userName === playerData.userName) {
    badges.earnedThisRound.push("early_bird")
  }

  // Sharp Shooter (3+ exact scores)
  const exactScores = submissions
    .filter(s => s.roundId === roundId && s.userName === playerData.userName)[0]
    ?.predictions.filter(p => {
      const result = results.find(r => r.gameId === p.gameId)
      return result && p.scoreA === result.scoreA && p.scoreB === result.scoreB
    }).length || 0
  if (exactScores >= 3) {
    badges.earnedThisRound.push("sharp_shooter")
  }
  badges.inProgress.sharp_shooter = { count: exactScores, target: 3 }

  // ... more badges

  return badges
}
```

---

## 9. Phase 2 & 3 Roadmap (Post-MVP)

### Phase 2 (Week 3-4): Medium-Complexity Badges
- Perfect Round (accuracy % per round)
- Clutch Player (score improvement R1→R2)
- Near Miss Master (off-by-1 predictions)
- Consistent Performer (finish top 5)
- Goal Junkie (avg predicted score)
- Upset Artist (requires odds data integration)

**Effort:** 12 hours
**Dependencies:** May need external API for odds data (Upset Artist)

### Phase 3 (Week 5-6): Rare & Complex Badges
- Untouchable (perfect R16)
- Prophecy (consecutive exact scores)
- Comeback King (last→top 5)
- Conservative (score variance)
- Bullseye (5+ total exact scores)
- Tournament Witness (client-side round tracking)

**Effort:** 15 hours
**Dependencies:** None; mostly calculation complexity

### Phase 4 (Week 7-8): UX & Social Features
- [ ] Dedicated `/achievements` page
- [ ] Badge rarity tiers (color-coded)
- [ ] Social share cards ("I earned 12 badges! 🏆")
- [ ] Achievements leaderboard (separate from score leaderboard)
- [ ] Email notifications ("You earned a badge!")

**Effort:** 10 hours

---

## 10. Database Firestore Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // Badges collection: public read, no direct writes (only via Cloud Function)
    match /badges/{playerId} {
      allow read: if request.auth != null || true; // Public read
      allow write: if false; // Only via Cloud Function
    }
    
    // Leaderboard metadata: public read
    match /leaderboard-metadata/{document=**} {
      allow read: if true; // Public
      allow write: if false;
    }
  }
}
```

**Note:** Badge earning should be triggered via **Cloud Function** on result submission, not client-side writes. This ensures:
- No client-side badge fraud
- Consistent calculation logic
- Real-time updates to badge collection

---

## 11. Cloud Function Pseudocode

```javascript
// functions/calculateBadges.js (triggered on /rounds/{roundId}/results update)

exports.onResultsSubmitted = functions.firestore
  .document('rounds/{roundId}')
  .onUpdate(async (change, context) => {
    const roundId = context.params.roundId
    const newResults = change.after.data().results
    const previousResults = change.before.data().results || []
    
    if (newResults.length === previousResults.length) return // No new results
    
    // Get all submissions for this round
    const submissions = await admin.firestore()
      .collection('submissions')
      .where('roundId', '==', roundId)
      .get()
    
    // For each player, calculate earned badges
    const badgeUpdates = []
    for (const submission of submissions.docs) {
      const playerData = submission.data()
      const badges = calculateBadgeProgress(playerData, submissions.docs, newResults, roundId)
      
      // Update /badges/{playerId}
      await admin.firestore()
        .collection('badges')
        .doc(playerData.userName)
        .set({
          earnedThisRound: badges.earnedThisRound,
          earnedLifetime: [...existingBadges, ...badges.earnedThisRound]
        }, { merge: true })
      
      // Send notification if new badge earned
      if (badges.earnedThisRound.length > 0) {
        await sendNotification(playerData.userName, badges.earnedThisRound)
      }
    }
  })
```

---

## 12. UX/UI Mockup Implementation Notes

### Leaderboard Enhancement
**File:** `src/components/Leaderboard.jsx`

Add badge display after score:
```jsx
<tr key={player.userName}>
  <td className="rank">{rank}</td>
  <td className="player-name">
    {player.userName}
    <button onClick={() => setSelectedPlayer(player)} className="view-profile">
      View Profile
    </button>
  </td>
  <td className="score">{player.totalScore}</td>
  <td className="badges">
    {player.badges?.earned?.map(badge => (
      <span key={badge} title={badgeInfo[badge].name} className="badge-emoji">
        {badgeInfo[badge].emoji}
      </span>
    ))}
  </td>
</tr>
```

### Player Profile Modal
**File:** `src/components/PlayerProfile.jsx` (new component)

Modal showing:
- Player stats (accuracy %, games played, submission streak)
- Earned badges with unlock dates
- In-progress badges with progress bars
- Rarity % for each badge

### Achievements Page
**File:** `src/pages/Achievements.jsx` (new page)

Full badge catalog with filters:
- Sort by: Rarity, Category, Earned Status
- Filter by: Category, Status (Earned/In Progress/Locked)
- Search by badge name

---

## 13. Progression & Engagement Metrics

### Measure Success (Post-Launch Metrics)

**Week 1:**
- [ ] 80%+ of players have earned at least 1 badge
- [ ] Average badges per player: 2-3
- [ ] Badge view rate: 40%+ click on badges on leaderboard

**Week 2:**
- [ ] 60%+ of players view profile/achievements page
- [ ] Sustained engagement: +15% repeat submissions
- [ ] Badge unlocks trending (visible in analytics)

**By Tournament End:**
- [ ] Average badges per player: 5-8
- [ ] Rarest badge (<5% earned): "Untouchable" or "Prophecy"
- [ ] Badges drive 20-30% of engagement actions (clicks, shares)

### Future Enhancement: Seasonal Badges
After tournament ends, create rotating monthly challenges:
- "July Predictor" — submit X predictions in July
- "Comeback Challenge" — beat previous month's score
- "Speed Racer" — fastest 10 predictions ever

---

## 14. Localization & Accessibility

### Badge Names & Descriptions (i18n Ready)

Create translation file `src/lib/badges.i18n.js`:
```javascript
export const badgeInfo = {
  early_bird: {
    emoji: '🐦',
    name: 'Early Bird',
    description: 'First to submit predictions in a round',
    rarity: 'Common',
  },
  // ... etc
}
```

### Accessibility
- [ ] Alt text for badges: `<span aria-label="Early Bird badge">🐦</span>`
- [ ] High contrast badge colors (especially for color-coded rarity)
- [ ] Progress bars with ARIA labels: `role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100"`

---

## 15. Security & Fraud Prevention

### Client-Side Prediction Only (No Badge Fraud)
- All badge calculations run in Firestore rules or Cloud Functions
- Client never writes to `/badges/` collection directly
- Results submission by admin only (already enforced)
- Audit trail: logs all badge earn events with timestamp + round context

### Prevent Deadline Bypassing
- Cloud Function validates `submittedAt` <= deadline before accepting submission
- Badges earned post-deadline not counted (except legacy badges)

---

## Summary: Next Steps

### Immediate (Next Sprint)
1. **Finalize MVP badge list** — Validate 8 badges with stakeholders
2. **Design badge icons** — Iterate on emoji choice or commission icons
3. **Create Firestore schema** — `/badges/{playerId}` collection + rules
4. **Build badge calculation logic** — `src/lib/badgeCalculations.js`
5. **Implement leaderboard badges** — Display emoji on leaderboard + tooltip

### Short Term (2-3 Weeks)
6. **Player profile modal** — View earned + in-progress badges
7. **Toast notifications** — "You earned Early Bird!" on badge unlock
8. **Cloud Function deployment** — Automate badge calculation on results post

### Medium Term (4-6 Weeks)
9. **Achievements page** — Full badge catalog + filter/search
10. **Rarity calculation** — Update `/leaderboard-metadata/` after round ends
11. **Phase 2 badges** — Roll out medium-complexity badges

### Long Term (Post-Tournament)
12. **Social sharing** — "I earned 12 badges!" cards
13. **Seasonal badges** — Monthly challenges for sustained engagement
14. **Badge analytics** — Track which badges drive most engagement

---

**Estimated Total Build Time:** 40-50 hours (MVP 8 hours + full system 35-40 hours)

**Recommended Rollout:** MVP in Week 1, Phase 2 in Week 3, Phase 3 + Social in Week 5+
