import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { scoreGame, calculatePlayerScore } from '../lib/scoring'

// Wide matrix: one row per game, two columns per player (their predicted
// scoreA / scoreB). Mirrors the classic spreadsheet view, populated live
// from the round's submissions. Cells are shaded by how each prediction
// scored once a result exists.
export default function PredictionsMatrix({ roundId, games = [], results = [] }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const wrapperRef = useRef(null)

  // Sync our state when the user leaves native fullscreen via Esc / system UI.
  // On iOS Safari the Fullscreen API isn't available for non-video elements,
  // so the layout is driven by the CSS overlay below and this simply never
  // fires there — the overlay still works.
  useEffect(() => {
    const onChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement
      if (!fsEl) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const toggleFullscreen = () => {
    const el = wrapperRef.current
    if (!isFullscreen) {
      setIsFullscreen(true) // CSS overlay — works everywhere, incl. iPhone
      // Best effort: also go true-fullscreen where supported (desktop, Android).
      const req = el?.requestFullscreen || el?.webkitRequestFullscreen
      if (req) Promise.resolve(req.call(el)).catch(() => {})
    } else {
      setIsFullscreen(false)
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement
      const exit = document.exitFullscreen || document.webkitExitFullscreen
      if (fsEl && exit) Promise.resolve(exit.call(document)).catch(() => {})
    }
  }

  useEffect(() => {
    if (!roundId) {
      setPlayers([])
      setLoading(false)
      return
    }

    const q = query(collection(db, 'submissions'), where('roundId', '==', roundId))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(d => {
          const data = d.data()
          const byGame = {}
          for (const p of data.predictions || []) byGame[p.gameId] = p
          return {
            userName: data.userName,
            submittedAt: data.submittedAt,
            byGame,
            totalScore: calculatePlayerScore(data.predictions || [], results),
          }
        })
        // Best predictor first — keeps the column order aligned with the leaderboard.
        list.sort((a, b) => b.totalScore - a.totalScore || (a.userName || '').localeCompare(b.userName || ''))
        setPlayers(list)
        setLoading(false)
      },
      (error) => {
        console.error('Predictions matrix error:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [roundId, results])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading predictions…</div>
  }

  if (players.length === 0 || games.length === 0) {
    return <div className="text-center py-8 text-gray-500">No predictions to show yet</div>
  }

  const gid = (g) => g.id || g.gameId
  const resultFor = (gameId) => results.find(r => r.gameId === gameId)

  // Heatmap class for a single prediction cell, given the game's result.
  const cellShade = (pred, result) => {
    if (!pred || !result || result.scoreA == null || result.scoreB == null) return ''
    const pts = scoreGame(pred, result)
    if (pts === 3) return 'bg-[#e8f7e8]' // exact
    if (pts === 1) return 'bg-[#fff7cc]' // correct outcome
    return 'bg-[#fdecec]' // wrong
  }

  const fmt = (v) => (v == null ? '–' : v)

  return (
    <div
      ref={wrapperRef}
      className={isFullscreen ? 'fixed inset-0 z-50 bg-white p-4 flex flex-col' : ''}
    >
      <div className="flex justify-end mb-2">
        <button
          onClick={toggleFullscreen}
          className="border border-gray-300 text-black font-600 text-xs uppercase tracking-wide px-3 py-1.5 hover:bg-gray-100 transition-colors"
        >
          {isFullscreen ? '✕ Exit fullscreen' : '⛶ Fullscreen'}
        </button>
      </div>
      <div className={`border border-gray-300 overflow-auto ${isFullscreen ? 'flex-1 min-h-0' : ''}`}>
        <table className="w-auto text-sm">
          <thead>
            <tr>
              <th
                colSpan={2}
                className="sticky left-0 top-0 z-30 bg-black text-white normal-case text-left whitespace-nowrap px-3 py-2"
                style={{ boxShadow: 'inset -1px 0 0 0 #4b5563' }}
              >
                Match
              </th>
              <th
                colSpan={2}
                className="sticky top-0 z-20 bg-black text-white normal-case text-center whitespace-nowrap px-2 py-2"
              >
                Result
              </th>
              {players.map((p) => (
                <th
                  key={p.userName}
                  colSpan={2}
                  className="sticky top-0 z-20 bg-black text-white normal-case text-center whitespace-nowrap px-2 py-2 border-l border-gray-600"
                >
                  <div className="font-600">{p.userName}</div>
                  <div className="text-[10px] font-400 text-gray-300">{p.totalScore} pts</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {games.map((g, idx) => {
              const id = gid(g)
              const result = resultFor(id)
              const rowBg = idx % 2 === 1 ? '#eaf2fd' : '#ffffff' // zebra striping
              return (
                <tr key={id} style={{ background: rowBg }}>
                  <td
                    className="sticky left-0 z-10 text-right font-500 text-black text-xs leading-tight pl-2 pr-0.5 py-1.5 w-[78px]"
                    style={{ background: rowBg }}
                  >
                    {g.teamA}
                  </td>
                  <td
                    className="sticky left-[78px] z-10 text-left font-500 text-black text-xs leading-tight pl-0.5 pr-2 py-1.5 w-[78px]"
                    style={{ background: rowBg, boxShadow: 'inset -1px 0 0 0 #d1d5db' }}
                  >
                    {g.teamB}
                  </td>
                  <td
                    colSpan={2}
                    className="text-center font-bold text-black px-2 py-1.5 border-r border-gray-300"
                    style={{ background: '#e5e7eb' }}
                  >
                    {result ? `${fmt(result.scoreA)}–${fmt(result.scoreB)}` : '–'}
                  </td>
                  {players.map((p) => {
                    const pred = p.byGame[id]
                    const shade = cellShade(pred, result)
                    return (
                      <td
                        key={p.userName}
                        colSpan={2}
                        className={`text-center text-black px-2 py-1.5 border-l border-gray-200 ${shade}`}
                      >
                        {pred ? `${fmt(pred.scoreA)}–${fmt(pred.scoreB)}` : <span className="text-gray-300">·</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-[#e8f7e8] border border-gray-300" /> Exact score
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-[#fff7cc] border border-gray-300" /> Correct outcome
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-[#fdecec] border border-gray-300" /> Wrong
        </span>
      </div>
    </div>
  )
}
