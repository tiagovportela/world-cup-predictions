import * as XLSX from 'xlsx'

export async function parseExcel(file) {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

  const games = []
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (row[0] !== null && row[0] !== undefined) {
      games.push({
        gameId: `game_${Math.floor(row[0])}`,
        teamA: row[1]?.toString().trim() || '',
        teamB: row[2]?.toString().trim() || '',
        scoreA: row[3] !== null && row[3] !== undefined ? parseInt(row[3]) : null,
        scoreB: row[4] !== null && row[4] !== undefined ? parseInt(row[4]) : null,
      })
    }
  }
  return games
}

// Download a player's predictions as an .xlsx file in the same layout as the
// original Mundial 16.xlsx: Game#, Team A, Team B, Score A, Score B.
export function exportPredictionsToExcel(player, games) {
  const header = ['Game#', 'Team A', 'Team B', 'Score A', 'Score B']

  const rows = games.map((game, index) => {
    const gameId = game.id || game.gameId
    const pred = (player.predictions || []).find(p => p.gameId === gameId)
    return [
      index + 1,
      game.teamA,
      game.teamB,
      pred?.scoreA ?? '',
      pred?.scoreB ?? '',
    ]
  })

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Folha1')

  const safeName = (player.userName || 'player').replace(/[^a-z0-9_-]+/gi, '_')
  XLSX.writeFile(workbook, `${safeName}_Mundial16.xlsx`)
}
