export default function NextGame({ games = [], results = [] }) {
  if (!games || games.length === 0) return null

  // Find first game without a result
  const nextGame = games.find(game => {
    const result = results.find(r => r.gameId === game.id || r.gameId === game.gameId)
    return !result
  })

  if (!nextGame) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 p-8 rounded-lg mb-12 text-center">
        <p className="text-green-700 font-bold text-lg">✓ All matches completed!</p>
      </div>
    )
  }

  const gameNumber = games.findIndex(g => g.id === nextGame.id || g.gameId === nextGame.gameId) + 1

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 p-8 rounded-lg mb-12">
      <div className="text-center">
        <p className="text-xs font-600 text-blue-600 uppercase tracking-wide mb-4">Next Match</p>

        <div className="flex items-center justify-center gap-8 mb-6">
          {/* Team A */}
          <div className="text-right flex-1">
            <p className="text-lg font-bold text-black">{nextGame.teamA}</p>
            <p className="text-sm text-blue-600 font-500">Match #{gameNumber}</p>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="text-3xl font-bold text-blue-500">VS</div>
          </div>

          {/* Team B */}
          <div className="text-left flex-1">
            <p className="text-lg font-bold text-black">{nextGame.teamB}</p>
            <p className="text-sm text-blue-600 font-500">Match #{gameNumber}</p>
          </div>
        </div>

        <p className="text-sm text-blue-600">Make your prediction on the Submit page</p>
      </div>
    </div>
  )
}
