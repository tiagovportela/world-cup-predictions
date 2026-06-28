// Client-side helpers that talk to our Netlify function (which proxies
// football-data.org server-side to avoid CORS and keep the key secret).
//
// Local dev: run `netlify dev` (not `npm run dev`) so the function is served.
// Without the function/key, calls resolve to null and the UI falls back to
// local data — no crashes.

const FUNCTION_URL = '/.netlify/functions/football'

// Maps the Portuguese team names used in the Excel to the exact English
// names football-data.org returns for the FIFA World Cup. Keys are
// normalized (lowercase, accents stripped) — see normalize().
const PT_TO_EN = {
  'africa do sul': 'South Africa',
  'canada': 'Canada',
  'brasil': 'Brazil',
  'japao': 'Japan',
  'alemanha': 'Germany',
  'paraguai': 'Paraguay',
  'paises baixos': 'Netherlands',
  'marrocos': 'Morocco',
  'costa do marfim': 'Ivory Coast',
  'noruega': 'Norway',
  'franca': 'France',
  'suecia': 'Sweden',
  'mexico': 'Mexico',
  'equador': 'Ecuador',
  'inglaterra': 'England',
  'congo': 'Congo DR',
  'belgica': 'Belgium',
  'senegal': 'Senegal',
  'estados unidos': 'United States',
  'bosnia': 'Bosnia-Herzegovina',
  'espanha': 'Spain',
  'austria': 'Austria',
  'portugal': 'Portugal',
  'croacia': 'Croatia',
  'suica': 'Switzerland',
  'argelia': 'Algeria',
  'australia': 'Australia',
  'egito': 'Egypt',
  'argentina': 'Argentina',
  'cabo verde': 'Cape Verde Islands',
  'colombia': 'Colombia',
  'gana': 'Ghana',
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .trim()
}

// Translate a Portuguese team name to its normalized English equivalent.
// Falls back to the normalized original if not in the map.
function toEnglish(ptName) {
  const n = normalize(ptName)
  return normalize(PT_TO_EN[n] || ptName)
}

function namesMatch(a, b) {
  return a.includes(b) || b.includes(a)
}

async function callFootballFunction(status) {
  const response = await fetch(`${FUNCTION_URL}?status=${status}`)

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const err = await response.json()
      if (err?.error) detail = err.error
    } catch {
      // response wasn't JSON (e.g. plain Vite dev server with no function)
    }
    throw new Error(detail)
  }

  return response.json()
}

export async function fetchWorldCupResults() {
  try {
    const data = await callFootballFunction('FINISHED')

    if (!data.matches || data.matches.length === 0) {
      return { results: [], message: 'No completed matches found yet.' }
    }

    const results = data.matches.map(match => ({
      teamA: match.homeTeam.name,
      teamB: match.awayTeam.name,
      scoreA: match.score?.fullTime?.home,
      scoreB: match.score?.fullTime?.away,
      date: match.utcDate,
      status: match.status,
    }))

    return {
      results,
      message: `Fetched ${results.length} completed matches`,
      raw: data.matches,
    }
  } catch (error) {
    console.error('Football API error:', error)
    throw new Error(`Failed to fetch results: ${error.message}`)
  }
}

export function matchResultsByTeams(apiResults, gameTeams) {
  // Translate each game's Portuguese names to English, then find an API
  // fixture containing both teams (in either home/away orientation) and
  // assign scores respecting that orientation.
  const matched = []

  for (const game of gameTeams) {
    const aEn = toEnglish(game.teamA)
    const bEn = toEnglish(game.teamB)

    const match = apiResults.find(r => {
      if (r.scoreA == null || r.scoreB == null) return false
      const rA = normalize(r.teamA)
      const rB = normalize(r.teamB)
      const sameOrder = namesMatch(rA, aEn) && namesMatch(rB, bEn)
      const swapped = namesMatch(rA, bEn) && namesMatch(rB, aEn)
      return sameOrder || swapped
    })

    if (match) {
      const rA = normalize(match.teamA)
      const orientationSame = namesMatch(rA, aEn)
      matched.push({
        gameId: game.id || game.gameId,
        scoreA: orientationSame ? match.scoreA : match.scoreB,
        scoreB: orientationSame ? match.scoreB : match.scoreA,
      })
    }
  }

  return matched
}

// Find the local game (Portuguese names) that corresponds to a pair of team
// names (which may be English from the API or Portuguese from local data).
// Returns the matching game object or null.
export function findGameByTeams(teamA, teamB, games) {
  const aEn = toEnglish(teamA)
  const bEn = toEnglish(teamB)
  return (
    games.find(g => {
      const gA = toEnglish(g.teamA)
      const gB = toEnglish(g.teamB)
      return (
        (namesMatch(gA, aEn) && namesMatch(gB, bEn)) ||
        (namesMatch(gA, bEn) && namesMatch(gB, aEn))
      )
    }) || null
  )
}

export async function fetchLiveWorldCupGame() {
  try {
    const data = await callFootballFunction('IN_PLAY,PAUSED')
    if (!data.matches || data.matches.length === 0) {
      return null
    }

    const m = [...data.matches].sort(
      (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
    )[0]

    return {
      id: `fixture_${m.id}`,
      teamA: m.homeTeam.name,
      teamB: m.awayTeam.name,
      scoreA: m.score?.fullTime?.home ?? 0,
      scoreB: m.score?.fullTime?.away ?? 0,
      minute: m.minute ?? null,
      status: m.status, // IN_PLAY or PAUSED
      live: true,
    }
  } catch (error) {
    console.warn('Live match unavailable:', error.message)
    return null
  }
}

export async function fetchNextWorldCupGame() {
  try {
    const data = await callFootballFunction('SCHEDULED')

    if (!data.matches || data.matches.length === 0) {
      return null
    }

    // Earliest upcoming match
    const nextMatch = [...data.matches].sort(
      (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
    )[0]

    return {
      id: `fixture_${nextMatch.id}`,
      teamA: nextMatch.homeTeam.name,
      teamB: nextMatch.awayTeam.name,
      date: new Date(nextMatch.utcDate),
      status: nextMatch.status,
    }
  } catch (error) {
    // Silent fallback to local data — expected under plain `npm run dev`
    console.warn('Next game from API unavailable, using local data:', error.message)
    return null
  }
}
