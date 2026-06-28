import { useState, useEffect } from 'react'
import { fetchNextWorldCupGame, fetchLiveWorldCupGame } from '../lib/footballApi'

// How often to refresh the in-progress match score.
const LIVE_POLL_MS = 45 * 1000 // 45 seconds

export default function NextGame({ games = [], results = [] }) {
  const [apiGame, setApiGame] = useState(null)
  const [liveGame, setLiveGame] = useState(null)

  // Fetch the next upcoming match once on mount
  useEffect(() => {
    let cancelled = false
    fetchNextWorldCupGame().then(game => {
      if (!cancelled) setApiGame(game)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Poll for a live (in-progress) match and keep its score fresh
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      const game = await fetchLiveWorldCupGame()
      if (!cancelled) setLiveGame(game)
    }
    poll()
    const intervalId = setInterval(poll, LIVE_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  // 1) A match is being played right now → show LIVE score
  if (liveGame) {
    const isHalfTime = liveGame.status === 'PAUSED'
    return (
      <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-600 p-8 rounded-lg mb-12">
        <div className="text-center">
          <p className="text-xs font-600 text-red-600 uppercase tracking-wide mb-4 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-600 pulse-red"></span>
            {isHalfTime ? 'Half Time' : 'Live Now'}
            {!isHalfTime && liveGame.minute ? ` · ${liveGame.minute}'` : ''}
          </p>

          <div className="flex items-center justify-center gap-6">
            <div className="text-right flex-1">
              <p className="text-lg font-bold text-black">{liveGame.teamA}</p>
            </div>
            <div className="text-5xl font-bold text-black px-4">
              {liveGame.scoreA} - {liveGame.scoreB}
            </div>
            <div className="text-left flex-1">
              <p className="text-lg font-bold text-black">{liveGame.teamB}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2) Otherwise show the next upcoming match (API, else local fallback)
  let nextGame = apiGame

  if (!nextGame && (!games || games.length === 0)) return null

  if (!nextGame) {
    nextGame = games.find(game => {
      const result = results.find(r => r.gameId === game.id || r.gameId === game.gameId)
      return !result
    })
  }

  if (!nextGame) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 p-8 rounded-lg mb-12 text-center">
        <p className="text-green-700 font-bold text-lg">✓ All matches completed!</p>
      </div>
    )
  }

  const gameNumber = !apiGame && games.length > 0
    ? games.findIndex(g => g.id === nextGame.id || g.gameId === nextGame.gameId) + 1
    : null

  const matchDate = nextGame.date ? new Date(nextGame.date) : null
  const dateString = matchDate
    ? matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 p-8 rounded-lg mb-12">
      <div className="text-center">
        <p className="text-xs font-600 text-blue-600 uppercase tracking-wide mb-2">
          {apiGame ? '⚽ Next World Cup Match (Live Data)' : 'Next Match'}
        </p>

        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-right flex-1">
            <p className="text-lg font-bold text-black">{nextGame.teamA}</p>
            {gameNumber && <p className="text-sm text-blue-600 font-500">Match #{gameNumber}</p>}
          </div>

          <div className="flex items-center justify-center">
            <div className="text-3xl font-bold text-blue-500">VS</div>
          </div>

          <div className="text-left flex-1">
            <p className="text-lg font-bold text-black">{nextGame.teamB}</p>
            {gameNumber && <p className="text-sm text-blue-600 font-500">Match #{gameNumber}</p>}
          </div>
        </div>

        {dateString && (
          <p className="text-sm text-blue-600 font-500 mb-3">
            📅 {dateString}
          </p>
        )}

      </div>
    </div>
  )
}
