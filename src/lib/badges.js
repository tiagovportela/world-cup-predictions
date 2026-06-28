import { scoreGame } from './scoring'

const SKILL_BADGES = {
  perfect_round: {
    emoji: '🎯',
    name: 'Perfect Round',
    description: '100% accuracy in one round',
    category: 'skill',
  },
  sharp_shooter: {
    emoji: '🔫',
    name: 'Sharp Shooter',
    description: '3+ exact scores in single round',
    category: 'skill',
  },
  mind_reader: {
    emoji: '🧠',
    name: 'Mind Reader',
    description: '10+ correct outcomes total',
    category: 'skill',
  },
  bullseye: {
    emoji: '🎪',
    name: 'Bullseye',
    description: '5+ exact score predictions total',
    category: 'skill',
  },
  near_miss_master: {
    emoji: '😅',
    name: 'Near Miss Master',
    description: '8+ predictions off by exactly 1 goal',
    category: 'skill',
  },
}

export function calculateBadges(predictions, results, games) {
  const earnedBadges = []

  if (!predictions || !results || !games) return earnedBadges

  // Count stats
  let totalExactScores = 0
  let totalCorrectOutcomes = 0
  let totalNearMisses = 0
  let roundExactScores = 0
  let roundCorrectOutcomes = 0

  for (const pred of predictions) {
    const result = results.find(r => r.gameId === pred.gameId)
    if (!result) continue

    const points = scoreGame(pred, result)

    // Exact score
    if (pred.scoreA === result.scoreA && pred.scoreB === result.scoreB) {
      totalExactScores++
      roundExactScores++
    } else if (points === 1) {
      // Correct outcome
      totalCorrectOutcomes++
      roundCorrectOutcomes++
    }

    // Near miss (off by 1)
    const scoreDiffA = Math.abs(pred.scoreA - result.scoreA)
    const scoreDiffB = Math.abs(pred.scoreB - result.scoreB)
    if ((scoreDiffA === 1 && scoreDiffB === 0) || (scoreDiffA === 0 && scoreDiffB === 1)) {
      totalNearMisses++
    }
  }

  // 🎯 Perfect Round: 100% accuracy (all 3+ points)
  const allExact = predictions.every(pred => {
    const result = results.find(r => r.gameId === pred.gameId)
    return result && scoreGame(pred, result) === 3
  })
  if (allExact && predictions.length > 0) {
    earnedBadges.push('perfect_round')
  }

  // 🔫 Sharp Shooter: 3+ exact in single round
  if (roundExactScores >= 3) {
    earnedBadges.push('sharp_shooter')
  }

  // 🧠 Mind Reader: 10+ correct outcomes total (across all rounds)
  if (totalCorrectOutcomes >= 10) {
    earnedBadges.push('mind_reader')
  }

  // 🎪 Bullseye: 5+ exact scores total (across all rounds)
  if (totalExactScores >= 5) {
    earnedBadges.push('bullseye')
  }

  // 😅 Near Miss Master: 8+ off by exactly 1
  if (totalNearMisses >= 8) {
    earnedBadges.push('near_miss_master')
  }

  return [...new Set(earnedBadges)] // Remove duplicates
}

export function getBadgeInfo(badgeId) {
  return SKILL_BADGES[badgeId]
}

export function getAllBadges() {
  return SKILL_BADGES
}
