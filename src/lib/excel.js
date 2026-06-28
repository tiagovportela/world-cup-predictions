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
