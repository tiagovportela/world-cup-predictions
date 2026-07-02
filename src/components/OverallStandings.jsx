import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { scoreGame } from '../lib/scoring'
import { normalizeName } from '../lib/groupStage'

// Show at most 2 decimals, trimming trailing zeros — weighted totals can be
// fractional (e.g. 69 × 0.5 = 34.5) while raw points are always integers.
const fmt = (n) => String(Math.round(n * 100) / 100)

// A " ×c" suffix for a column header, shown only when the coefficient isn't 1.
const coeffTag = (c) => (Number(c) !== 1 ? ` ×${c}` : '')

// Tournament-wide standings: unlike the per-round Leaderboard, this sums each
// player's points across the group stage and every knockout round that has
// results. Each stage's points are multiplied by its coefficient (weight)
// before summing — default 1, so by default every stage counts equally. Reads
// all submissions live and derives per-round results/weights from the `rounds`
// prop, so it recomputes whenever an admin saves a result, weight, or a player
// submits.
export default function OverallStandings({ rounds, groupStandings = [], groupCoefficient = 1 }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'submissions'),
      (snapshot) => {
        setSubmissions(snapshot.docs.map(doc => ({ ...doc.data() })))
        setLoading(false)
      },
      (error) => {
        console.error('Overall standings error:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // Results / coefficients keyed by round for quick lookup; only rounds that
  // actually have results become breakdown columns (skip not-yet-played rounds).
  const resultsByRound = Object.fromEntries(rounds.map(r => [r.id, r.results || []]))
  const coeffByRound = Object.fromEntries(rounds.map(r => [r.id, r.coefficient ?? 1]))
  const scoredRounds = rounds.filter(r => (r.results || []).length > 0)
  const hasGroup = groupStandings.length > 0
  const groupCoeff = groupCoefficient ?? 1

  // Accumulate each player's points/exacts. The group stage (scored offline) is
  // seeded first as a fixed baseline, then live knockout submissions add on top.
  // Players are keyed by an accent/case-insensitive name so a group entry and a
  // knockout submission for the same person merge into a single row.
  const players = {}
  const ensurePlayer = (name) => {
    const key = normalizeName(name)
    if (!players[key]) {
      players[key] = { key, userName: name, group: null, total: 0, exact: 0, perRound: {} }
    }
    return players[key]
  }

  for (const g of groupStandings) {
    const p = ensurePlayer(g.userName)
    p.userName = g.userName // canonical display name from the group sheet
    p.group = g.points // raw points shown in the breakdown column
    p.total += g.points * groupCoeff // weighted contribution to the total
    p.exact += g.exact
  }

  for (const sub of submissions) {
    const results = resultsByRound[sub.roundId]
    if (!results) continue // submission for a deleted round — ignore

    let roundPoints = 0
    let roundExact = 0
    for (const pred of sub.predictions || []) {
      const points = scoreGame(pred, results.find(x => x.gameId === pred.gameId))
      if (points !== null) {
        roundPoints += points
        if (points === 3) roundExact += 1
      }
    }

    const p = ensurePlayer(sub.userName)
    p.total += roundPoints * (coeffByRound[sub.roundId] ?? 1)
    p.exact += roundExact
    p.perRound[sub.roundId] = roundPoints // raw points shown in the breakdown column
  }

  const standings = Object.values(players).sort(
    (a, b) => b.total - a.total || b.exact - a.exact || a.userName.localeCompare(b.userName)
  )

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading standings...</div>
  }

  if (standings.length === 0) {
    return <div className="text-center py-12 text-gray-500">No submissions yet</div>
  }

  return (
    <div className="border border-gray-300 overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th className="w-12 text-center">#</th>
            <th className="text-left">Player</th>
            <th className="w-24 text-center">Total</th>
            <th className="w-20 text-center">Exact</th>
            {hasGroup && <th className="text-center whitespace-nowrap px-4">Group Stage{coeffTag(groupCoeff)}</th>}
            {scoredRounds.map(r => (
              <th key={r.id} className="text-center whitespace-nowrap px-4">{r.name}{coeffTag(coeffByRound[r.id])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((player, idx) => (
            <tr key={player.userName} className="hover:bg-gray-100 transition-colors">
              <td className="text-center font-bold text-xl">
                {idx === 0 && '🏆'}
                {idx === 1 && '🥈'}
                {idx === 2 && '🥉'}
                {idx > 2 && <span className="text-gray-600">{idx + 1}</span>}
              </td>
              <td className="font-500 text-black">{player.userName}</td>
              <td className="text-center">
                <span className={`badge ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}>
                  {fmt(player.total)}
                </span>
              </td>
              <td className="text-center">
                <span className="badge-outline">{player.exact}</span>
              </td>
              {hasGroup && (
                <td className="text-center text-gray-700 px-4">
                  {player.group != null ? player.group : '—'}
                </td>
              )}
              {scoredRounds.map(r => (
                <td key={r.id} className="text-center text-gray-700 px-4">
                  {player.perRound[r.id] != null ? player.perRound[r.id] : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
