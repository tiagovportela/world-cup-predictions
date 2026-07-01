// Netlify serverless function — proxies football-data.org to avoid CORS
// and keep the API key secret (server-side only).
//
// Called from the client as:
//   /.netlify/functions/football?status=SCHEDULED   -> upcoming matches
//   /.netlify/functions/football?status=FINISHED     -> completed matches
//
// Requires the FOOTBALL_DATA_KEY environment variable (set in Netlify UI
// or in a local .env file when running `netlify dev`).

export default async (req) => {
  const apiKey = process.env.FOOTBALL_DATA_KEY

  const jsonHeaders = { 'Content-Type': 'application/json' }

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'FOOTBALL_DATA_KEY not configured on the server' }),
      { status: 500, headers: jsonHeaders }
    )
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'SCHEDULED'
  const competition = url.searchParams.get('competition') || 'WC'
  const stage = url.searchParams.get('stage')

  // Whitelist allowed status values to avoid arbitrary passthrough.
  // Supports a single status or a comma-separated list (e.g. "IN_PLAY,PAUSED").
  const allowedStatus = ['SCHEDULED', 'TIMED', 'LIVE', 'IN_PLAY', 'PAUSED', 'FINISHED']
  const parts = status.split(',').map(s => s.trim()).filter(s => allowedStatus.includes(s))
  const safeStatus = parts.length > 0 ? parts.join(',') : 'SCHEDULED'

  // Whitelist allowed knockout stage values; drop silently if not recognized.
  const allowedStages = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']
  const stageQuery = allowedStages.includes(stage) ? `&stage=${stage}` : ''

  try {
    const apiResponse = await fetch(
      `https://api.football-data.org/v4/competitions/${competition}/matches?status=${safeStatus}${stageQuery}`,
      { headers: { 'X-Auth-Token': apiKey } }
    )

    const body = await apiResponse.text()

    return new Response(body, {
      status: apiResponse.status,
      headers: jsonHeaders,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Failed to reach football-data.org: ${error.message}` }),
      { status: 502, headers: jsonHeaders }
    )
  }
}
