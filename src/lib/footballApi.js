// Client-side helpers that talk to our Netlify function (which proxies
// football-data.org server-side to avoid CORS and keep the key secret).
//
// Local dev: run `netlify dev` (not `npm run dev`) so the function is served.
// Without the function/key, calls resolve to null and the UI falls back to
// local data — no crashes.

import { normalize, toEnglish, toPortuguese } from './teams'

const FUNCTION_URL = '/.netlify/functions/football'

function namesMatch(a, b) {
  return a.includes(b) || b.includes(a)
}

// football-data.org bakes penalty shootout goals directly into `fullTime`
// for matches decided by a shootout (e.g. a 1-1 draw settled 6-5 on penalties
// is reported as fullTime 7-6) — see their "overtime" docs. Predictions here
// are scored on the played result only, capped at 120 minutes, so strip the
// shootout tally back out.
function regulationScore(score) {
  const full = score?.fullTime
  if (!full || full.home == null || full.away == null) {
    return { home: undefined, away: undefined }
  }
  if (score.duration !== 'PENALTY_SHOOTOUT') {
    return full
  }
  const pens = score.penalties || {}
  return {
    home: full.home - (pens.home ?? 0),
    away: full.away - (pens.away ?? 0),
  }
}

async function callFootballFunction(status, stage) {
  const params = new URLSearchParams({ status })
  if (stage) params.set('stage', stage)
  const response = await fetch(`${FUNCTION_URL}?${params.toString()}`)

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

    const results = data.matches.map(match => {
      const score = regulationScore(match.score)
      return {
        teamA: match.homeTeam.name,
        teamB: match.awayTeam.name,
        scoreA: score.home,
        scoreB: score.away,
        date: match.utcDate,
        status: match.status,
      }
    })

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

    const score = regulationScore(m.score)
    return {
      id: `fixture_${m.id}`,
      teamA: m.homeTeam.name,
      teamB: m.awayTeam.name,
      scoreA: score.home ?? 0,
      scoreB: score.away ?? 0,
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

// Fetch the fixtures for a given knockout stage (e.g. 'QUARTER_FINALS') to
// pre-populate a new round's games. Returns an empty `games` list (not an
// error) when the bracket for that stage hasn't been published yet — that's
// an expected state, not a failure.
export async function fetchRoundFixtures(stage) {
  try {
    const data = await callFootballFunction('SCHEDULED,TIMED', stage)

    if (!data.matches || data.matches.length === 0) {
      return { games: [], deadline: null, message: 'No fixtures published yet for this stage.' }
    }

    const sorted = [...data.matches].sort(
      (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
    )

    // Fixtures whose bracket slot isn't decided yet (previous round still in
    // progress) come back with a null team name — show "TBD" rather than
    // guessing, so the admin knows to revisit that row once it's known.
    const games = sorted.map((m, i) => ({
      id: `game_${i + 1}`,
      teamA: m.homeTeam?.name ? toPortuguese(m.homeTeam.name) : 'TBD',
      teamB: m.awayTeam?.name ? toPortuguese(m.awayTeam.name) : 'TBD',
    }))

    const undecidedCount = games.filter(g => g.teamA === 'TBD' || g.teamB === 'TBD').length
    const message = undecidedCount > 0
      ? `Fetched ${games.length} fixtures from API — ${undecidedCount} matchup${undecidedCount === 1 ? '' : 's'} not decided yet (marked TBD)`
      : `Fetched ${games.length} fixtures from API`

    return {
      games,
      deadline: sorted[0].utcDate,
      message,
    }
  } catch (error) {
    console.error('Football API error:', error)
    throw new Error(`Failed to fetch fixtures: ${error.message}`)
  }
}
