export default function RoundTabs({ rounds, activeRound, onRoundChange, extraTabs = [], roundsActive = true }) {
  const tabClass = (active) =>
    `px-6 py-4 font-600 text-sm uppercase tracking-wide transition-all border-b-2 whitespace-nowrap ${
      active ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
    }`

  return (
    <div className="flex gap-0 mb-8 border-b border-gray-300 overflow-x-auto">
      {extraTabs.map((tab) => (
        <button key={tab.key} onClick={tab.onClick} className={tabClass(tab.active)}>
          {tab.label}
        </button>
      ))}
      {rounds.map((round) => (
        <button
          key={round.id}
          onClick={() => onRoundChange(round.id)}
          className={tabClass(roundsActive && activeRound === round.id)}
        >
          {round.name}
        </button>
      ))}
    </div>
  )
}
