import { scoreGame } from '../lib/scoring'

export default function MatchCard({ game, prediction, result, isEditable = false, onPredictionChange = null }) {
  const points = prediction && result ? scoreGame(prediction, result) : null
  const isExact = prediction && result && prediction.scoreA === result.scoreA && prediction.scoreB === result.scoreB

  let cardClass = 'match-card'
  if (points === 3) cardClass += ' exact'
  else if (points === 1) cardClass += ' correct'
  else if (result && points === 0) cardClass += ' wrong'

  return (
    <div className={cardClass}>
      <div className="grid grid-cols-3 gap-8 items-center mb-6">
        <div className="text-right">
          <div className="text-sm font-600 text-gray-600 uppercase tracking-wide">Prediction</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-600 text-gray-600 uppercase tracking-wide">Actual</div>
        </div>
        <div></div>
      </div>

      <div className="grid grid-cols-3 gap-8 items-center mb-8">
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{game.teamA}</div>
          <div className="text-3xl font-700">
            {isEditable ? (
              <input
                type="number"
                min="0"
                value={prediction?.scoreA ?? ''}
                onChange={(e) => onPredictionChange({ ...prediction, scoreA: e.target.value ? parseInt(e.target.value) : null })}
                className="w-16 text-right bg-gray-100 border border-gray-300 px-2 py-1"
              />
            ) : (
              prediction?.scoreA ?? '–'
            )}
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-700 text-black">
            {result ? `${result.scoreA}` : '–'}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-xl font-400 text-gray-400">:</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 items-center">
        <div className="text-right">
          <div className="text-3xl font-700">
            {isEditable ? (
              <input
                type="number"
                min="0"
                value={prediction?.scoreB ?? ''}
                onChange={(e) => onPredictionChange({ ...prediction, scoreB: e.target.value ? parseInt(e.target.value) : null })}
                className="w-16 text-right bg-gray-100 border border-gray-300 px-2 py-1"
              />
            ) : (
              prediction?.scoreB ?? '–'
            )}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{game.teamB}</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-700 text-black">
            {result ? `${result.scoreB}` : '–'}
          </div>
        </div>

        <div className="text-right">
          {points !== null && !isEditable && (
            <div className={`badge ${points === 3 ? 'gold' : points === 1 ? 'silver' : ''}`}>
              {points} {points === 1 ? 'point' : 'points'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
