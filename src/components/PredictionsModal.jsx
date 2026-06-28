import { scoreGame } from '../lib/scoring'
import { exportPredictionsToExcel } from '../lib/excel'

export default function PredictionsModal({ player, games, results, onClose }) {
  if (!player) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-300 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">{player.userName}'s Predictions</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => exportPredictionsToExcel(player, games)}
              className="bg-black text-white text-xs font-600 uppercase tracking-wide px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              ⬇ Export Excel
            </button>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-black text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {player.predictions && player.predictions.length > 0 ? (
            player.predictions.map((pred, idx) => {
              const game = games.find(g => g.id === pred.gameId || g.gameId === pred.gameId)
              const result = results.find(r => r.gameId === pred.gameId)
              const points = result ? scoreGame(pred, result) : null

              if (!game) return null

              return (
                <div key={pred.gameId} className="border border-gray-300 p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-3 gap-4 items-center mb-3">
                    <div className="text-right">
                      <div className="text-xs font-600 text-gray-600 uppercase tracking-wide">{game.teamA}</div>
                      <div className="text-2xl font-bold text-black mt-1">{pred.scoreA ?? '—'}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-600 text-gray-600 uppercase tracking-wide mb-1">Result</div>
                      <div className="text-2xl font-bold text-black">
                        {result ? `${result.scoreA}-${result.scoreB}` : '—'}
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-xs font-600 text-gray-600 uppercase tracking-wide">{game.teamB}</div>
                      <div className="text-2xl font-bold text-black mt-1">{pred.scoreB ?? '—'}</div>
                    </div>
                  </div>

                  {points !== null && (
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        {points === 3 && '🎯 Exact score'}
                        {points === 1 && '✓ Correct outcome'}
                        {points === 0 && '✗ Wrong outcome'}
                      </div>
                      <div className={`badge ${points === 3 ? 'gold' : points === 1 ? 'silver' : ''}`}>
                        {points} {points === 1 ? 'point' : 'points'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">No predictions submitted</div>
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
