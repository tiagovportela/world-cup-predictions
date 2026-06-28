# Badge System — Quick Reference Guide

## All 20 Badges at a Glance

### 🎯 SKILL (5 badges)
| Emoji | Badge | Unlock When | Rarity |
|-------|-------|-------------|--------|
| 🎯 | Perfect Round | 100% accuracy in one round (3+ pts all games) | Rare |
| 🔫 | Sharp Shooter | 3+ exact score predictions in single round | Common |
| 🧠 | Mind Reader | 10+ correct outcomes (W/L/D) total | Common |
| 🎪 | Bullseye | 5+ exact score predictions total | Uncommon |
| 😅 | Near Miss Master | 8+ predictions off-by-1 (e.g., pred 2-0, actual 2-1) | Uncommon |

### ⭐ CONSISTENCY (4 badges)
| Emoji | Badge | Unlock When | Rarity |
|-------|-------|-------------|--------|
| ✋ | Steady Hand | 1.5+ avg points per game (12+ games) | Uncommon |
| 🏌️ | Clutch Player | Score 2+ points higher in R2 than R1 | Rare |
| ⭐ | Reliable | Submit predictions in all 4 rounds | Common |
| 📈 | Consistent Performer | Finish in top 5 of final standings | Uncommon |

### 🐦 ENGAGEMENT (4 badges)
| Emoji | Badge | Unlock When | Rarity |
|-------|-------|-------------|--------|
| 🐦 | Early Bird | First to submit each round | Rare |
| ⏰ | Last Call | Submit <5 minutes before deadline | Uncommon |
| 🎰 | All In | Submit 16 predictions per round | Very Common |
| 👀 | Tournament Witness | View leaderboard in all 4 rounds | Common |

### 👑 RARE (4 badges)
| Emoji | Badge | Unlock When | Rarity |
|-------|-------|-------------|--------|
| 👑 | Untouchable | Perfect R16 (100% of 16 games) | Very Rare |
| 🔮 | Prophecy | 2+ consecutive exact scores in same round | Very Rare |
| 🏆 | Tournament Champion | #1 highest score in final standings | Rare |
| 🚀 | Comeback King | Finish top 5 final after being last after R1 | Very Rare |

### 🎨 FUN/HUMOR (3 badges)
| Emoji | Badge | Unlock When | Rarity |
|-------|-------|-------------|--------|
| 🎨 | Upset Artist | Predict underdog win in 80%+ of predictions | Uncommon |
| 🤐 | Conservative | Lowest score variance (std dev < 0.5) | Rare |
| ⚽ | Goal Junkie | Average predicted score >2.5 goals per game | Common |

---

## MVP Priority Order (Week 1-2)

**Tier 1 (Launch):**
1. 🐦 Early Bird
2. ⏰ Last Call
3. 🔫 Sharp Shooter
4. 🏆 Tournament Champion
5. ✋ Reliable
6. 🎰 All In
7. ⭐ Steady Hand
8. 🧠 Mind Reader

**Why these 8?** All calculated from existing data; no external APIs needed; mix of rarity levels; instant gratification + long-term goals.

---

## Badge Display Template

### Leaderboard (Minimal)
```
RANK  PLAYER         SCORE  BADGES
1.    Sarah Chen     51     🏆🎯⭐🔫✋🐦
2.    John Doe       47     🎯🔫🧠⭐🏆✋
3.    Maria Silva    43     🔫✋⏰
```

### Player Card (Hover Tooltip)
```
🐦 Early Bird
First to submit predictions in a round
Earned by 6% of players | Earned: Round of 16
```

### Profile Modal (Full View)
```
✓ EARNED BADGES (6)
  🎯 Perfect Round — Round of 16
  🔫 Sharp Shooter — Quarter Finals
  🧠 Mind Reader — Overall
  ⭐ Steady Hand — Overall
  🏆 Tournament Champion — Final
  ✋ Reliable — Overall

📈 IN PROGRESS
  🚀 Comeback King — 42% (need Top 5 final)
  👑 Untouchable — 75% (6/8 games in R16)
  🎪 Bullseye — 40% (2/5 exact scores)
```

---

## Rarity Tiers

| Tier | % Players | Badges |
|------|-----------|--------|
| Very Common (25%+) | 🟢 | All In, Goal Junkie, Mind Reader |
| Common (15-25%) | 🔵 | Reliable, Tournament Witness, Steady Hand, Upset Artist |
| Uncommon (10-15%) | 🟣 | Sharp Shooter, Last Call, Consistent Performer |
| Rare (5-10%) | 🟠 | Perfect Round, Early Bird, Clutch Player, Conservative |
| Very Rare (<5%) | 🔴 | Untouchable, Prophecy, Comeback King, Bullseye |

---

## Implementation Checklist

### Week 1: MVP Launch
- [ ] Create `/badges/{playerId}` Firestore collection
- [ ] Add badge calculation logic to `src/lib/badgeCalculations.js`
- [ ] Display badges emoji on leaderboard (24px)
- [ ] Add badge tooltip with name + rarity %
- [ ] Toast notification on badge earn ("You earned: 🐦 Early Bird!")
- [ ] Update submission document with `badgesEarnedThisRound`

### Week 2: Profile & Progress
- [ ] Build `PlayerProfile.jsx` modal component
- [ ] Show earned badges with unlock dates
- [ ] Show in-progress badges with progress bars
- [ ] Add "View Profile" button to each leaderboard row
- [ ] Update Firestore rules to allow public read of `/badges/`

### Week 3: Achievements Page
- [ ] Create `/achievements` route
- [ ] Display all 20 badges with category filters
- [ ] Show progress toward locked badges
- [ ] Calculate rarity % for each badge
- [ ] Add social share button ("I earned 12 badges! 🏆")

### Week 4: Cloud Functions
- [ ] Deploy `calculateBadges.js` Cloud Function
- [ ] Trigger on results submission
- [ ] Auto-update badge records
- [ ] Send email/push notifications

---

## Code Skeleton (Start Here)

### `src/lib/badges.js` — Badge Definitions
```javascript
export const BADGES = {
  early_bird: {
    id: 'early_bird',
    emoji: '🐦',
    name: 'Early Bird',
    description: 'First to submit predictions in a round',
    category: 'engagement',
    rarity: 'rare',
    unlockCriteria: 'earliest submission timestamp'
  },
  sharp_shooter: {
    id: 'sharp_shooter',
    emoji: '🔫',
    name: 'Sharp Shooter',
    description: '3+ exact score predictions in single round',
    category: 'skill',
    rarity: 'common',
    unlockCriteria: 'count scoreA===resultA && scoreB===resultB >= 3'
  },
  // ... 18 more
}

export const BADGE_CATEGORIES = {
  skill: { name: 'Skill', color: 'blue' },
  consistency: { name: 'Consistency', color: 'green' },
  engagement: { name: 'Engagement', color: 'yellow' },
  rare: { name: 'Rare Achievements', color: 'purple' },
  fun: { name: 'Fun & Humor', color: 'orange' }
}
```

### `src/lib/badgeCalculations.js` — Core Logic
```javascript
export function calculateEarlyBird(submissions, roundId) {
  const roundSubmissions = submissions.filter(s => s.roundId === roundId)
  if (roundSubmissions.length === 0) return null
  
  const earliest = roundSubmissions.reduce((min, s) =>
    s.submittedAt < min.submittedAt ? s : min
  )
  return earliest.userName
}

export function calculateSharpShooter(submission, results) {
  const exactCount = submission.predictions.filter(pred => {
    const result = results.find(r => r.gameId === pred.gameId)
    return result && pred.scoreA === result.scoreA && pred.scoreB === result.scoreB
  }).length
  return exactCount >= 3
}

export function calculateMindReader(submissions, results) {
  const correctOutcomes = {}
  
  submissions.forEach(submission => {
    const userName = submission.userName
    correctOutcomes[userName] = (correctOutcomes[userName] || 0) +
      submission.predictions.filter(pred => {
        const result = results.find(r => r.gameId === pred.gameId)
        if (!result) return false
        
        const predOutcome = Math.sign(pred.scoreA - pred.scoreB)
        const actualOutcome = Math.sign(result.scoreA - result.scoreB)
        return predOutcome === actualOutcome
      }).length
  })
  
  const winners = Object.entries(correctOutcomes)
    .filter(([_, count]) => count >= 10)
    .map(([name, _]) => name)
  
  return winners
}

// ... more calculations
```

### `src/components/BadgeDisplay.jsx` — Badge Rendering
```jsx
export default function BadgeDisplay({ badges, showRarity = false }) {
  return (
    <div className="badge-display">
      {badges.map(badgeId => {
        const badge = BADGES[badgeId]
        return (
          <div
            key={badgeId}
            className="badge"
            title={badge.name}
            data-rarity={badge.rarity}
          >
            <span className="emoji">{badge.emoji}</span>
            {showRarity && (
              <span className="rarity">{badge.rarity}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

### `src/components/BadgeToast.jsx` — Notification
```jsx
export function BadgeToast({ badge, visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  return (
    <div className={`badge-toast ${visible ? 'show' : ''}`}>
      <span className="emoji">{BADGES[badge].emoji}</span>
      <span className="text">You earned {BADGES[badge].name}!</span>
    </div>
  )
}
```

### Firestore Schema
```javascript
// /badges/{userName}
{
  userName: "john_doe",
  earned: [
    {
      badgeId: "early_bird",
      earnedAt: Timestamp(2026-06-28T18:45:00),
      roundId: "r16",
      progress: { submittedAt: Timestamp(2026-06-28T14:00:00) }
    }
  ],
  inProgress: [
    {
      badgeId: "mind_reader",
      progress: { correctOutcomes: 7, target: 10 }
    }
  ]
}
```

---

## Testing Checklist

### Unit Tests (Jest)
- [ ] `calculateEarlyBird()` returns earliest submission
- [ ] `calculateSharpShooter()` counts exact matches correctly
- [ ] `calculateMindReader()` counts outcomes across rounds
- [ ] `calculateSteadyHand()` calculates average correctly

### Integration Tests
- [ ] Badge calculation runs after results submission
- [ ] Badge data persists to Firestore
- [ ] Multiple badges earn in same round
- [ ] Progress bars update correctly

### Manual Tests
- [ ] First user submission gets Early Bird 🐦
- [ ] Last submission <5 min before deadline gets Last Call ⏰
- [ ] Toast notification appears on badge earn
- [ ] Profile modal shows 0 badges for new player
- [ ] Achievements page loads and filters work
- [ ] Rarity % updates after new round results

---

## Cutover Plan

### Go-Live Week 1
1. Deploy Firestore schema updates
2. Backfill `/badges/` with MVP 8 badges for all players from existing submissions
3. Launch with toast notifications only
4. Monitor Firebase reads/writes

### Go-Live Week 2
1. Ship leaderboard badge display
2. Add player profile modal
3. Announce badges on home page banner

### Rollout Week 3+
1. Achievements page
2. Phase 2 badges (medium complexity)
3. Rarity calculations
4. Social share integration

---

## Monitoring & Analytics

### Key Metrics to Track
```javascript
// Firebase Analytics events
analytics.logEvent('badge_earned', {
  badge_id: badgeId,
  round_id: roundId,
  timestamp: Date.now()
})

analytics.logEvent('badge_viewed', {
  badge_id: badgeId,
  page: 'leaderboard' // or 'profile' or 'achievements'
})

analytics.logEvent('profile_viewed', {
  player_name: playerName,
  badges_earned: count
})
```

### Dashboard Queries
- Total badges earned by type
- % of players with 1+ badge
- Average badges per player (over time)
- Most earned badge
- Rarest earned badge

---

## FAQ

**Q: Can players see progress toward locked badges?**
A: Yes! Show progress bars for badges not yet earned.

**Q: What if someone ties for Early Bird?**
A: Both get the badge (use `submittedAt <= earliest + 1second`).

**Q: Can badges be revoked?**
A: No, but logs show earned timestamp for auditing.

**Q: Do badges affect the score leaderboard?**
A: No, purely cosmetic. Keep score ranking clean.

**Q: Can I earn the same badge twice?**
A: No, each badge earned once per player for MVP. Could enhance later to "Badge Mastery" tiers.

---

## Files to Create/Modify

**New Files:**
- `src/lib/badges.js` — Badge definitions
- `src/lib/badgeCalculations.js` — Calculation logic
- `src/components/BadgeDisplay.jsx` — Badge rendering
- `src/components/BadgeToast.jsx` — Notifications
- `src/components/PlayerProfile.jsx` — Profile modal
- `src/pages/Achievements.jsx` — Achievements page
- `GAMIFICATION_DESIGN.md` — This comprehensive guide
- `functions/calculateBadges.js` — Cloud Function

**Modify:**
- `src/components/Leaderboard.jsx` — Add badge emoji + tooltip
- `src/pages/Home.jsx` — Add profile modal trigger + badge toast
- `firestore.rules` — Add badge collection read rules
- `src/index.css` — Add badge styling + toast animations

---

**Total New Code:** ~1,200 lines (components, calculations, styles)
**Total Time:** 8 hours MVP, 35 hours full system
