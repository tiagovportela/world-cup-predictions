export default function RoundTabs({ rounds, activeRound, onRoundChange }) {
  return (
    <div className="flex gap-0 mb-8 border-b border-gray-300">
      {rounds.map((round) => (
        <button
          key={round.id}
          onClick={() => onRoundChange(round.id)}
          className={`px-6 py-4 font-600 text-sm uppercase tracking-wide transition-all border-b-2 ${
            activeRound === round.id
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          {round.name}
        </button>
      ))}
    </div>
  )
}
