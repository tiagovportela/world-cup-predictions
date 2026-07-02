import { scoreGame } from '../lib/scoring'
import { getFlag } from '../lib/teams'

// Score input with large, touch-friendly +/- buttons — the native number
// input's built-in spinner arrows are too small to tap reliably on a phone.
function ScoreStepper({ value, onChange }) {
  const step = (delta) => onChange(Math.max(0, (value ?? 0) + delta))

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        type="button"
        onClick={() => step(-1)}
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-black text-xl font-bold transition-colors"
        aria-label="Decrease score"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : 0)}
        onFocus={(e) => e.target.select()}
        className="no-spinner w-10 h-11 flex-shrink-0 text-center text-xl font-700 bg-gray-100 border border-gray-300 px-1 py-0"
      />
      <button
        type="button"
        onClick={() => step(1)}
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-black text-xl font-bold transition-colors"
        aria-label="Increase score"
      >
        +
      </button>
    </div>
  )
}

export default function MatchCard({ game, prediction, result, isEditable = false, onPredictionChange = null }) {
  const points = prediction && result ? scoreGame(prediction, result) : null
  const isExact = prediction && result && prediction.scoreA === result.scoreA && prediction.scoreB === result.scoreB

  let cardClass = 'match-card'
  if (points === 3) cardClass += ' exact'
  else if (points === 1) cardClass += ' correct'
  else if (result && points === 0) cardClass += ' wrong'

  if (isEditable) {
    return (
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">{getFlag(game.teamA)}</span>
            <span className="text-sm font-600 text-gray-700 uppercase tracking-wide truncate">{game.teamA}</span>
          </div>
          <ScoreStepper
            value={prediction?.scoreA}
            onChange={(v) => onPredictionChange({ ...prediction, scoreA: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">{getFlag(game.teamB)}</span>
            <span className="text-sm font-600 text-gray-700 uppercase tracking-wide truncate">{game.teamB}</span>
          </div>
          <ScoreStepper
            value={prediction?.scoreB}
            onChange={(v) => onPredictionChange({ ...prediction, scoreB: v })}
          />
        </div>
      </div>
    )
  }

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
          <div className="text-3xl font-700">{prediction?.scoreA ?? '–'}</div>
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
          <div className="text-3xl font-700">{prediction?.scoreB ?? '–'}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{game.teamB}</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-700 text-black">
            {result ? `${result.scoreB}` : '–'}
          </div>
        </div>

        <div className="text-right">
          {points !== null && (
            <div className={`badge ${points === 3 ? 'gold' : points === 1 ? 'silver' : ''}`}>
              {points} {points === 1 ? 'point' : 'points'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
