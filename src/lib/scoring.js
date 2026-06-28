export function scoreGame(prediction, result) {
  if (!result || result.scoreA === null || result.scoreB === null) {
    return null
  }

  if (prediction.scoreA === result.scoreA && prediction.scoreB === result.scoreB) {
    return 3
  }

  const pOutcome = Math.sign(prediction.scoreA - prediction.scoreB)
  const rOutcome = Math.sign(result.scoreA - result.scoreB)

  return pOutcome === rOutcome ? 1 : 0
}

export function calculatePlayerScore(predictions, results) {
  let totalScore = 0
  for (const pred of predictions) {
    const result = results.find(r => r.gameId === pred.gameId)
    const points = scoreGame(pred, result)
    if (points !== null) {
      totalScore += points
    }
  }
  return totalScore
}

export function aggregateLeaderboard(submissions, results) {
  const leaderboard = {}

  for (const submission of submissions) {
    const userName = submission.userName
    if (!leaderboard[userName]) {
      leaderboard[userName] = {
        userName,
        totalScore: 0,
        submittedAt: submission.submittedAt,
        predictions: submission.predictions || [],
      }
    }
    leaderboard[userName].totalScore = calculatePlayerScore(submission.predictions || [], results)
  }

  return Object.values(leaderboard)
    .sort((a, b) => b.totalScore - a.totalScore)
}
