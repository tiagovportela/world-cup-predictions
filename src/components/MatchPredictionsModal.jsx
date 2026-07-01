import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { scoreGame } from '../lib/scoring'

// Lists every player's prediction for a single match.
export default function MatchPredictionsModal({ roundId, gameId, teamA, teamB, result, onClose }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roundId || !gameId) return

    const q = query(collection(db, 'submissions'), where('roundId', '==', roundId))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map(d => {
            const data = d.data()
            const pred = (data.predictions || []).find(p => p.gameId === gameId)
            return pred ? { userName: data.userName, pred } : null
          })
          .filter(Boolean)
          .sort((a, b) => (a.userName || '').localeCompare(b.userName || ''))
        setRows(list)
        setLoading(false)
      },
      () => setLoading(false)
    )

    return () => unsubscribe()
  }, [roundId, gameId])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-300 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-black">{teamA} vs {teamB}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {result ? `Result: ${result.scoreA}–${result.scoreB}` : 'Not played yet'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading predictions...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No predictions for this match</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="text-left">Player</th>
                  <th className="w-24 text-center">Prediction</th>
                  {result && <th className="w-16 text-center">Pts</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const points = result ? scoreGame(row.pred, result) : null
                  return (
                    <tr key={`${row.userName}-${idx}`} className="hover:bg-gray-100">
                      <td className="font-500 text-black">{row.userName}</td>
                      <td className="text-center font-bold text-black">
                        {row.pred.scoreA ?? '–'} - {row.pred.scoreB ?? '–'}
                      </td>
                      {result && (
                        <td className="text-center">
                          <span className={`badge ${points === 3 ? 'gold' : points === 1 ? 'silver' : ''}`}>
                            {points}
                          </span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 p-4">
          <button
            onClick={onClose}
            className="w-full bg-black text-white font-600 py-3 uppercase tracking-wide hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
