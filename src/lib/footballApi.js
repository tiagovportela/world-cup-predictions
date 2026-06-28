// Fetch World Cup results from api-football.com via RapidAPI
// Free tier: 100 requests/day

export async function fetchWorldCupResults(roundId) {
  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY
  if (!apiKey) {
    throw new Error(
      'RapidAPI key not configured. Add VITE_RAPIDAPI_KEY to .env.local. ' +
      'Sign up free at rapidapi.com and subscribe to api-football.com'
    )
  }

  // World Cup 2026 league ID (adjust if needed for your tournament)
  const leagueId = 1 // FIFA World Cup
  const season = 2026

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
    },
  }

  try {
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&season=${season}&status=FT`,
      options
    )

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('API rate limit exceeded (100 requests/day). Try again later.')
      }
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.response || data.response.length === 0) {
      return { results: [], message: 'No completed matches found yet.' }
    }

    // Map API response to our result format
    const results = data.response.map(match => {
      // Try to match by team names
      const gameId = `game_${data.response.indexOf(match) + 1}`

      return {
        gameId,
        teamA: match.teams.home.name,
        teamB: match.teams.away.name,
        scoreA: match.goals.home,
        scoreB: match.goals.away,
        date: match.fixture.date,
        status: match.fixture.status.short,
      }
    })

    return {
      results,
      message: `Fetched ${results.length} completed matches`,
      raw: data.response,
    }
  } catch (error) {
    console.error('Football API error:', error)
    throw new Error(`Failed to fetch results: ${error.message}`)
  }
}

export function matchResultsByTeams(apiResults, gameTeams) {
  // Try to match API results to our games by team names (fuzzy matching)
  const matched = []

  for (const game of gameTeams) {
    const match = apiResults.find(
      r =>
        (r.teamA.toLowerCase().includes(game.teamA.toLowerCase()) ||
          game.teamA.toLowerCase().includes(r.teamA.toLowerCase())) &&
        (r.teamB.toLowerCase().includes(game.teamB.toLowerCase()) ||
          game.teamB.toLowerCase().includes(r.teamB.toLowerCase()))
    )

    if (match) {
      matched.push({
        gameId: game.id || game.gameId,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
      })
    }
  }

  return matched
}
