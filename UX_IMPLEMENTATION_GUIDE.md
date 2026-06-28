# Badge System UX Implementation Guide

## Visual Layout & Component Structure

### 1. Leaderboard Badge Display

#### Current State
```
RANK  PLAYER NAME      SCORE  
─────────────────────────────
1.    Sarah Chen       51 points
2.    John Doe         47 points
3.    Maria Silva      43 points
```

#### Enhanced State (MVP)
```
RANK  PLAYER NAME      SCORE    BADGES
─────────────────────────────────────────────
1.    Sarah Chen       51 pts   🏆 🎯 ⭐
2.    John Doe         47 pts   🎯 🔫 🧠
3.    Maria Silva      43 pts   🔫 ✋
```

#### Responsive Behavior
**Desktop (>768px):**
- Badge column visible at all times
- 3-4 badges shown inline, +X more if crowded
- Hover shows full badge name tooltip

**Tablet (480-768px):**
- Badge column visible but condensed
- Show top 2 badges, "+2 more" expandable

**Mobile (<480px):**
- Badge column hidden on load
- Collapsible "Badges" section below score
- Full list in expandable card

---

### 2. Badge Tooltip (Hover State)

**HTML:**
```html
<div class="badge-container" data-badge="early_bird">
  <span class="badge-emoji">🐦</span>
  <div class="badge-tooltip">
    <h4>Early Bird</h4>
    <p>First to submit predictions in a round</p>
    <small>Earned by 6% of players</small>
    <small class="earned-date">Earned: Round of 16</small>
  </div>
</div>
```

**CSS (Tailwind):**
```css
.badge-container {
  position: relative;
  display: inline-block;
  cursor: help;
  font-size: 20px;
  margin: 0 4px;
}

.badge-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.badge-tooltip h4 {
  font-weight: 600;
  margin: 0 0 4px 0;
  font-size: 14px;
}

.badge-tooltip p {
  font-size: 12px;
  margin: 4px 0;
  color: #555;
}

.badge-tooltip small {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.badge-container:hover .badge-tooltip {
  opacity: 1;
  pointer-events: auto;
}
```

---

### 3. Badge Toast Notification

**Trigger:** When badge is earned

**Visual:**
```
┌─────────────────────────────────┐
│ 🐦 You earned Early Bird!       │  ← Bottom-right corner
└─────────────────────────────────┘
     (disappears after 3s)
```

**HTML:**
```html
<div class="badge-toast show">
  <span class="toast-emoji">🐦</span>
  <span class="toast-text">You earned <strong>Early Bird!</strong></span>
  <button class="toast-close">×</button>
</div>
```

**CSS:**
```css
.badge-toast {
  position: fixed;
  bottom: -100px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: bottom 0.4s ease-out;
  z-index: 1000;
  font-size: 14px;
  font-weight: 500;
  max-width: 300px;
}

.badge-toast.show {
  bottom: 20px;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    bottom: -100px;
    opacity: 0;
  }
  to {
    bottom: 20px;
    opacity: 1;
  }
}

.toast-emoji {
  font-size: 24px;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #999;
  padding: 0;
  margin-left: 8px;
}

.toast-close:hover {
  color: #333;
}
```

---

### 4. Player Profile Modal

**Trigger:** Click "View Profile" on leaderboard row

**Layout:**
```
╔═══════════════════════════════════════════════════╗
║          JOHN DOE — PLAYER PROFILE                ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  📊 STATISTICS                                    ║
║  ├─ Total Score: 47 points                        ║
║  ├─ Accuracy: 62% (25/40 games correct)          ║
║  ├─ Rounds Played: 3/4                            ║
║  └─ Submission Streak: 3 consecutive              ║
║                                                   ║
║  🏅 EARNED BADGES (5)                             ║
║  ├─ 🎯 Perfect Round — R16                        ║
║  ├─ 🔫 Sharp Shooter — QF                         ║
║  ├─ 🧠 Mind Reader — Overall                      ║
║  ├─ ⭐ Steady Hand — Overall                      ║
║  └─ ✋ Reliable — Overall                         ║
║                                                   ║
║  📈 IN PROGRESS (3)                               ║
║  ├─ 🚀 Comeback King                              ║
║  │  ████░░░░░░ 40% (need +2 pts from R2→R3)      ║
║  ├─ 👑 Untouchable                                ║
║  │  ██████░░░░ 67% (6/9 R16 games perfect)       ║
║  └─ 🎪 Bullseye                                   ║
║     ██░░░░░░░░ 20% (1/5 exact scores)            ║
║                                                   ║
║  [Close Modal]                                    ║
╚═══════════════════════════════════════════════════╝
```

**HTML Structure:**
```html
<div class="modal profile-modal" data-player="john_doe">
  <div class="modal-header">
    <h2>John Doe — Player Profile</h2>
    <button class="modal-close">×</button>
  </div>
  
  <div class="modal-body">
    <section class="statistics">
      <h3>📊 Statistics</h3>
      <div class="stat-row">
        <span class="stat-label">Total Score:</span>
        <span class="stat-value">47 points</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Accuracy:</span>
        <span class="stat-value">62% (25/40 games)</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Rounds Played:</span>
        <span class="stat-value">3/4</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Submission Streak:</span>
        <span class="stat-value">3 consecutive</span>
      </div>
    </section>

    <section class="earned-badges">
      <h3>🏅 Earned Badges ({count})</h3>
      <div class="badge-grid">
        <div class="badge-card">
          <span class="badge-emoji">🎯</span>
          <span class="badge-name">Perfect Round</span>
          <span class="badge-round">Round of 16</span>
        </div>
        {/* More badge cards */}
      </div>
    </section>

    <section class="progress-badges">
      <h3>📈 In Progress ({count})</h3>
      <div class="progress-list">
        <div class="progress-item">
          <span class="emoji">🚀</span>
          <div class="progress-info">
            <h4>Comeback King</h4>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 40%"></div>
            </div>
            <p class="progress-text">40% — Need +2 points from R2→R3</p>
          </div>
        </div>
        {/* More progress items */}
      </div>
    </section>
  </div>
</div>
```

**CSS (Tailwind Classes):**
```css
.profile-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  z-index: 100;
  animation: slideDown 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.modal-close:hover {
  opacity: 1;
}

.modal-body {
  padding: 20px;
}

.statistics {
  margin-bottom: 24px;
}

.statistics h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 500;
  color: #333;
}

.earned-badges h3,
.progress-badges h3 {
  margin: 20px 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.badge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  text-align: center;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s;
}

.badge-card:hover {
  border-color: #667eea;
  background: #f0f3ff;
}

.badge-emoji {
  font-size: 28px;
}

.badge-name {
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.badge-round {
  font-size: 10px;
  color: #999;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  align-items: flex-start;
}

.progress-item .emoji {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.progress-info {
  flex: 1;
}

.progress-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.3s ease-out;
}

.progress-text {
  margin: 0;
  font-size: 12px;
  color: #666;
}

@keyframes slideDown {
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .profile-modal {
    width: 95%;
    max-height: 90vh;
  }

  .badge-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
}
```

---

### 5. Achievements Page

**Route:** `/achievements`

**Layout:**
```
╔════════════════════════════════════════════════════════╗
║           🏅 TOURNAMENT ACHIEVEMENTS                   ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  YOUR PROGRESS: 5/20 badges (25%)                      ║
║  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 25%        ║
║                                                        ║
║  [Filter: All] [Skills] [Consistency] [Rare]...        ║
║  [Search by name...]                                   ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🎯 SKILL BADGES (3/5)                                 ║
║  ─────────────────────────────────────────────────     ║
║                                                        ║
║  ✓ 🎯 Perfect Round                                    ║
║    100% round accuracy in single round                 ║
║    Round of 16 • Earned by 12% of players              ║
║                                                        ║
║  ✓ 🔫 Sharp Shooter                                    ║
║    3+ exact score predictions in single round          ║
║    Quarter Finals • Earned by 37% of players           ║
║                                                        ║
║  ✓ 🧠 Mind Reader                                      ║
║    10+ correct outcomes (W/L/D) across rounds          ║
║    Overall • Earned by 25% of players                  ║
║                                                        ║
║  □ 🎪 Bullseye (40%)                                   ║
║    5+ exact score predictions total                    ║
║    ██░░░░░░░░ 2/5 exact scores earned                 ║
║    Earned by 15% of players                            ║
║                                                        ║
║  □ 😅 Near Miss Master (37%)                           ║
║    8+ off-by-1 predictions (e.g., pred 2-0, actual 2-1)║
║    ███░░░░░░░ 3/8 near misses                          ║
║    Earned by 8% of players                             ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ⭐ CONSISTENCY BADGES (2/4)                            ║
║  ─────────────────────────────────────────────────     ║
║  [Similar layout...]                                   ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  [Export as Image] [Share on Twitter/Facebook]         ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

**HTML Structure (Simplified):**
```html
<div class="achievements-page">
  <header class="achievements-header">
    <h1>🏅 Tournament Achievements</h1>
    <div class="progress-overview">
      <span class="progress-text">Your Progress: 5/20 badges (25%)</span>
      <div class="progress-bar large">
        <div class="progress-fill" style="width: 25%"></div>
      </div>
    </div>
  </header>

  <div class="achievements-controls">
    <div class="filter-buttons">
      <button class="filter-btn active">All</button>
      <button class="filter-btn">Skill</button>
      <button class="filter-btn">Consistency</button>
      <button class="filter-btn">Engagement</button>
      <button class="filter-btn">Rare</button>
      <button class="filter-btn">Fun</button>
    </div>
    <input type="search" class="search-input" placeholder="Search badges...">
  </div>

  <div class="badge-categories">
    <section class="badge-category">
      <h2>🎯 Skill Badges (3/5)</h2>
      
      <div class="badge-item earned">
        <div class="badge-icon">🎯</div>
        <div class="badge-info">
          <h3>Perfect Round</h3>
          <p>100% round accuracy in single round</p>
          <div class="badge-meta">
            <span class="unlock-round">Round of 16</span>
            <span class="rarity">Earned by 12% of players</span>
          </div>
        </div>
        <div class="badge-status">✓ Earned</div>
      </div>

      <div class="badge-item in-progress">
        <div class="badge-icon">🎪</div>
        <div class="badge-info">
          <h3>Bullseye</h3>
          <p>5+ exact score predictions total</p>
          <div class="progress-bar-small">
            <div class="progress-fill" style="width: 40%"></div>
          </div>
          <div class="progress-text">2/5 exact scores</div>
          <div class="badge-meta">
            <span class="rarity">Earned by 15% of players</span>
          </div>
        </div>
        <div class="badge-status">40%</div>
      </div>

      <div class="badge-item locked">
        <div class="badge-icon">😅</div>
        <div class="badge-info">
          <h3>Near Miss Master</h3>
          <p>8+ off-by-1 predictions</p>
          <div class="progress-bar-small">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">0/8 near misses</div>
          <div class="badge-meta">
            <span class="rarity">Earned by 8% of players</span>
          </div>
        </div>
        <div class="badge-status">0%</div>
      </div>
    </section>

    {/* More sections for other categories */}
  </div>

  <footer class="achievements-footer">
    <button class="export-btn">📥 Export as Image</button>
    <button class="share-btn">🐦 Share on Twitter</button>
    <button class="share-btn">📘 Share on Facebook</button>
  </footer>
</div>
```

**CSS (Key Styles):**
```css
.achievements-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.achievements-header {
  margin-bottom: 30px;
}

.achievements-header h1 {
  font-size: 28px;
  margin: 0 0 16px 0;
}

.progress-overview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar.large {
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar.large .progress-fill {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 100%;
}

.achievements-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.search-input {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.badge-category {
  margin-bottom: 32px;
}

.badge-category h2 {
  font-size: 18px;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #eee;
}

.badge-item {
  display: grid;
  grid-template-columns: 60px 1fr 80px;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid #eee;
  align-items: center;
  transition: all 0.2s;
}

.badge-item:hover {
  border-color: #667eea;
  background: #f9f3ff;
}

.badge-item.earned {
  background: #f0fff4;
  border-color: #4CAF50;
}

.badge-item.earned .badge-status {
  color: #4CAF50;
  font-weight: 600;
}

.badge-item.in-progress {
  background: #f9f9f9;
}

.badge-item.locked {
  opacity: 0.6;
}

.badge-icon {
  font-size: 40px;
  text-align: center;
}

.badge-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.badge-info p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #666;
}

.progress-bar-small {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-bar-small .progress-fill {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 100%;
  transition: width 0.3s ease-out;
}

.progress-text {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.badge-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.unlock-round {
  color: #999;
  font-style: italic;
}

.rarity {
  color: #999;
}

.badge-status {
  text-align: right;
  font-weight: 600;
  font-size: 14px;
}

.achievements-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #eee;
}

.export-btn,
.share-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #667eea;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.export-btn:hover,
.share-btn:hover {
  background: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .badge-item {
    grid-template-columns: 50px 1fr;
  }

  .badge-status {
    grid-column: 2;
    text-align: left;
    margin-top: 8px;
  }

  .achievements-footer {
    flex-direction: column;
  }
}
```

---

### 6. Integration Points in Existing Components

#### A. Leaderboard.jsx Changes

**Before:**
```jsx
<table className="leaderboard">
  <thead>
    <tr>
      <th>Rank</th>
      <th>Player</th>
      <th>Score</th>
    </tr>
  </thead>
  <tbody>
    {leaderboard.map((player, idx) => (
      <tr key={player.userName}>
        <td>{idx + 1}</td>
        <td>{player.userName}</td>
        <td>{player.totalScore}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**After:**
```jsx
import BadgeDisplay from './BadgeDisplay'
import PlayerProfile from './PlayerProfile'

export default function Leaderboard({ leaderboard, badgeData }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  return (
    <>
      <table className="leaderboard">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th className="badges-column">Badges</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player, idx) => (
            <tr key={player.userName}>
              <td>{idx + 1}</td>
              <td>
                <button
                  onClick={() => setSelectedPlayer(player)}
                  className="player-name-link"
                >
                  {player.userName}
                </button>
              </td>
              <td>{player.totalScore}</td>
              <td className="badges-cell">
                <BadgeDisplay
                  badges={badgeData[player.userName]?.earned || []}
                  showRarity={false}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer}
          badgeData={badgeData[selectedPlayer.userName]}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  )
}
```

#### B. Home.jsx Changes

**Add badge toast display:**
```jsx
import BadgeToast from '../components/BadgeToast'

export default function Home() {
  const [toastBadge, setToastBadge] = useState(null)
  const [showToast, setShowToast] = useState(false)

  // Listen for badge earned events (from Firebase listener)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'badges'), where('userName', '==', currentUser)),
      (snapshot) => {
        const newBadges = snapshot.docs[0]?.data()?.earned || []
        const previousBadges = badges.earned || []
        const earnedThisRound = newBadges.filter(
          b => !previousBadges.find(pb => pb.badgeId === b.badgeId)
        )

        if (earnedThisRound.length > 0) {
          setToastBadge(earnedThisRound[0].badgeId)
          setShowToast(true)
        }
      }
    )
    return () => unsubscribe()
  }, [])

  return (
    <>
      {/* Existing JSX */}
      <Leaderboard leaderboard={leaderboard} badgeData={badgeData} />

      <BadgeToast
        badge={toastBadge}
        visible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
```

#### C. App.jsx Router Changes

**Add achievements route:**
```jsx
import Achievements from './pages/Achievements'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/achievements" element={<Achievements />} />
      </Routes>
    </BrowserRouter>
  )
}
```

#### D. Header.jsx Changes

**Add achievements link:**
```jsx
export default function Header() {
  return (
    <header className="header">
      <nav>
        <Link to="/">🏠 Leaderboard</Link>
        <Link to="/achievements">🏅 Achievements</Link>
        <Link to="/submit">📝 Submit</Link>
        <Link to="/admin">⚙️ Admin</Link>
      </nav>
    </header>
  )
}
```

---

## Tailwind CSS Utilities to Add

**In `src/index.css` or custom Tailwind config:**

```css
@layer components {
  .badge-emoji {
    @apply inline-block cursor-help text-xl transition-transform hover:scale-110;
  }

  .badge-tooltip {
    @apply absolute bottom-full left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-lg p-2 text-xs whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-10 shadow-lg;
  }

  .badge-container:hover .badge-tooltip {
    @apply opacity-100 pointer-events-auto;
  }

  .progress-bar {
    @apply w-full h-1.5 bg-gray-200 rounded overflow-hidden;
  }

  .progress-fill {
    @apply h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300;
  }

  .modal-backdrop {
    @apply fixed inset-0 bg-black/50 z-40;
  }

  .achievement-card {
    @apply border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all;
  }
}
```

---

## Animation Keyframes

**Add to `src/index.css`:**

```css
@keyframes slideUp {
  from {
    transform: translateY(120%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(102, 126, 234, 0);
  }
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-2deg);
  }
  75% {
    transform: rotate(2deg);
  }
}

.badge-toast {
  animation: slideUp 0.4s ease-out;
}

.badge-newly-earned {
  animation: wiggle 0.6s ease-in-out;
}

.progress-fill {
  animation: pulse-glow 2s infinite;
}
```

---

## Mobile Responsiveness Breakpoints

```css
/* Mobile-first approach */

/* Extra small (mobile) */
@media (max-width: 480px) {
  .leaderboard .badges-column {
    display: none;
  }
  .badge-emoji {
    font-size: 18px;
  }
  .profile-modal {
    max-width: 95%;
  }
}

/* Small (tablet) */
@media (min-width: 481px) and (max-width: 768px) {
  .badge-display {
    max-width: 150px;
    overflow: hidden;
  }
  .badge-emoji {
    font-size: 20px;
  }
}

/* Medium (desktop) */
@media (min-width: 769px) {
  .badge-emoji {
    font-size: 24px;
  }
  .profile-modal {
    max-width: 600px;
  }
}
```

---

## Dark Mode Support (Future)

```css
@media (prefers-color-scheme: dark) {
  .badge-tooltip {
    @apply bg-gray-800 border-gray-600 text-gray-100;
  }

  .badge-card {
    @apply bg-gray-700 border-gray-600;
  }

  .achievement-card {
    @apply border-gray-600;
  }

  .achievement-card:hover {
    @apply bg-gray-700;
  }
}
```

---

## Accessibility Checklist

- [ ] Badge tooltips have proper `role="tooltip"` attribute
- [ ] Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Modal has `role="dialog"` and `aria-modal="true"`
- [ ] Buttons have proper `aria-label` for icon-only buttons
- [ ] Color is not the only indicator (use text + icons)
- [ ] Minimum contrast ratio 4.5:1 for text
- [ ] Focus states visible on all interactive elements
- [ ] Keyboard navigation works (tab through badges, enter to open profile)

---

## Performance Optimization Tips

1. **Lazy load achievements page** — Code-split `/achievements` route
2. **Virtual scrolling** — Use `react-window` if 1000+ badges to render
3. **Badge data caching** — Cache badge data in localStorage with TTL
4. **Image optimization** — If using badge PNG/SVG icons instead of emoji
5. **Debounce progress calculations** — Don't recalculate on every keystroke

---

**Ready to implement?** Start with the leaderboard badge display (Section 1), then add the profile modal (Section 4), then the achievements page (Section 5).
