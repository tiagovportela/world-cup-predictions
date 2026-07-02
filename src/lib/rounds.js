// Canonical knockout round sequence, used to order rounds consistently and
// to detect which round should be created next. `stage` is the suggested
// football-data.org stage value for that round (used to pre-fill, not a
// hard mapping — it's editable in the UI since a round's real-world stage
// can be ambiguous relative to how it's labeled here).
export const ROUND_SEQUENCE = [
  { id: 'r16', name: 'Round of 32', stage: 'LAST_32' },
  { id: 'ro16', name: 'Round of 16', stage: 'LAST_16' },
  { id: 'qf', name: 'Quarterfinals', stage: 'QUARTER_FINALS' },
  { id: 'sf', name: 'Semifinals', stage: 'SEMI_FINALS' },
  { id: 'third_place', name: 'Third Place Playoff', stage: 'THIRD_PLACE' },
  { id: 'final', name: 'Final', stage: 'FINAL' },
]

// Sort a list of round docs (each with an `id`) by their position in
// ROUND_SEQUENCE. Unknown ids are pushed to the end, in stable order.
export function sortRounds(rounds) {
  const order = Object.fromEntries(ROUND_SEQUENCE.map((r, i) => [r.id, i]))
  return [...rounds].sort((a, b) => (order[a.id] ?? ROUND_SEQUENCE.length) - (order[b.id] ?? ROUND_SEQUENCE.length))
}

// First round in the sequence that isn't already present in `existingRounds`,
// or null if every round has been created.
export function getNextRound(existingRounds) {
  const existingIds = new Set(existingRounds.map(r => r.id))
  return ROUND_SEQUENCE.find(r => !existingIds.has(r.id)) || null
}

// Whether a round's submission deadline hasn't passed yet. Rounds without a
// deadline are treated as always open.
export function isRoundOpen(round) {
  if (!round?.deadline) return true
  const deadlineMs = round.deadline.toMillis?.() ?? round.deadline
  return Date.now() <= deadlineMs
}
