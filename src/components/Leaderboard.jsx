import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { aggregateLeaderboard } from '../lib/scoring'
import { calculateBadges } from '../lib/badges'
import BadgeDisplay from './BadgeDisplay'

export default function Leaderboard({ roundId, results, showPredictions = false, onPlayerClick = null, games = [] }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roundId) {
      setLeaderboard([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'submissions'),
      where('roundId', '==', roundId)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const submissions = snapshot.docs.map(doc => ({ ...doc.data() }))

        // Calculate badges for each player
        const submissionsWithBadges = submissions.map(sub => ({
          ...sub,
          badges: calculateBadges(sub.predictions, results, games),
        }))

        const ranked = aggregateLeaderboard(submissionsWithBadges, results)
        setLeaderboard(ranked)
        setLoading(false)
      },
      (error) => {
        console.error('Leaderboard error:', error)
        console.warn('Failed to load leaderboard. This may be a Firestore permissions issue.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [roundId, results, games])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>
  }

  if (leaderboard.length === 0) {
    return <div className="text-center py-12 text-gray-500">No submissions yet</div>
  }

  return (
    <div className="border border-gray-300 overflow-hidden">
      <table>
        <thead>
          <tr>
            <th className="w-12 text-center">#</th>
            <th className="text-left">Player</th>
            <th className="w-32 text-center">Score</th>
            <th className="w-20 text-center">Exact</th>
            {showPredictions && <th className="w-40">Predictions</th>}
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player, idx) => {
            const exactCount = (player.predictions || []).filter(p => {
              const r = results.find(x => x.gameId === p.gameId)
              return r && r.scoreA != null && r.scoreB != null &&
                p.scoreA === r.scoreA && p.scoreB === r.scoreB
            }).length

            return (
            <tr
              key={`${player.userName}-${idx}`}
              className={`hover:bg-gray-100 transition-colors ${
                showPredictions && onPlayerClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => showPredictions && onPlayerClick && onPlayerClick(player)}
            >
              <td className="text-center font-bold text-xl">
                {idx === 0 && '🏆'}
                {idx === 1 && '🥈'}
                {idx === 2 && '🥉'}
                {idx > 2 && <span className="text-gray-600">{idx + 1}</span>}
              </td>
              <td className="font-500 text-black">
                <div className="flex items-center gap-3">
                  {showPredictions && onPlayerClick ? (
                    <span className="hover:underline cursor-pointer">{player.userName}</span>
                  ) : (
                    <span>{player.userName}</span>
                  )}
                  {player.badges && player.badges.length > 0 && (
                    <BadgeDisplay badgeIds={player.badges} size="sm" />
                  )}
                </div>
              </td>
              <td className="text-center">
                <span className={`badge ${
                  idx === 0 ? 'gold' :
                  idx === 1 ? 'silver' :
                  idx === 2 ? 'bronze' :
                  ''
                }`}>
                  {player.totalScore}
                </span>
              </td>
              <td className="text-center">
                <span className="badge-outline">{exactCount}</span>
              </td>
              {showPredictions && (
                <td className="text-sm text-gray-600">
                  {player.predictions?.length ? `${player.predictions.length} predictions` : '—'}
                </td>
              )}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
