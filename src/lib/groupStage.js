// Firestore location of the editable group-stage standings (managed from the
// Admin panel). When the doc doesn't exist yet the app falls back to the
// DEFAULT_GROUP_STAGE_STANDINGS below, which also seed the Admin editor.
export const GROUP_STAGE_COLLECTION = 'config'
export const GROUP_STAGE_DOC_ID = 'groupStage'

// Final group-stage standings, after all 72 group games (28/06/2026). The group
// stage was scored offline in a spreadsheet — the app only tracks the knockout
// rounds game-by-game — so these per-player totals seed the editable baseline
// that carries into the Overall standings. Order matches the source sheet,
// which is preserved for players tied on points.
export const DEFAULT_GROUP_STAGE_STANDINGS = [
  { userName: 'Diogo', points: 69, exact: 9 },
  { userName: 'Nando', points: 65, exact: 9 },
  { userName: 'Zé', points: 65, exact: 9 },
  { userName: 'Tiago', points: 58, exact: 7 },
  { userName: 'Joel', points: 58, exact: 8 },
  { userName: 'Mafiuza', points: 57, exact: 8 },
  { userName: 'Pereira', points: 53, exact: 8 },
  { userName: 'Gonçalo', points: 53, exact: 7 },
  { userName: 'Rafa', points: 52, exact: 7 },
  { userName: 'Fábio', points: 51, exact: 5 },
  { userName: 'Cachada', points: 44, exact: 4 },
  { userName: 'Andrezinho', points: 43, exact: 5 },
  { userName: 'Amorim', points: 36, exact: 3 },
]

// Accent- and case-insensitive name key, so a group entry ("Zé") and a knockout
// submission ("Ze") for the same person merge into one row in the standings.
export function normalizeName(name) {
  return (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

// Competition ranking by points (ties share a rank, e.g. 1, 2, 2, 4). Array
// order is preserved within a tie because Array.prototype.sort is stable.
export function rankedGroupStage(standings = DEFAULT_GROUP_STAGE_STANDINGS) {
  const sorted = [...standings].sort((a, b) => b.points - a.points)
  let prevPoints = null
  let prevRank = 0
  return sorted.map((p, i) => {
    const rank = p.points === prevPoints ? prevRank : i + 1
    prevPoints = p.points
    prevRank = rank
    return { ...p, rank }
  })
}
