# Auto-Fetch World Cup Results Setup

The app can automatically fetch real World Cup match results from **api-football.com** via RapidAPI.

## How It Works

1. Admin goes to **Admin Panel** → selects a round
2. Clicks **"🔄 Auto-fetch from API"** button
3. App fetches completed matches from api-football.com
4. Results are populated into the form
5. Admin reviews and clicks **"Save All Results"** to finalize

## Setup Instructions

### 1. Get a Free RapidAPI Account

1. Go to https://rapidapi.com/
2. Sign up (free account, no credit card needed)
3. Confirm your email

### 2. Subscribe to api-football.com

1. Go to https://rapidapi.com/api-sports/api/api-football
2. Click **"Subscribe"** (choose the free **BASIC** plan)
3. Click **"Subscribe"** button on the free tier
4. You now have access!

### 3. Get Your API Key

1. After subscribing, go to your API dashboard
2. You'll see your **API Key** displayed
3. Copy it

### 4. Add to Your .env.local

```env
VITE_RAPIDAPI_KEY=your_api_key_here
```

Example:
```env
VITE_RAPIDAPI_KEY=abc123def456ghi789jkl
```

### 5. Restart Dev Server

```bash
npm run dev
```

## Using Auto-Fetch

In **Admin Panel**:

1. Select a round from the dropdown
2. Click **"🔄 Auto-fetch from API"** button
3. The app fetches completed matches for that round
4. Results auto-populate in the score fields
5. Review and click **"Save All Results"** to save to Firestore

## Rate Limits

**Free tier:** 100 requests per day

- Each fetch uses 1 request
- You can fetch ~100 times per day
- If you exceed the limit, try again tomorrow or upgrade to a paid plan

## How the Matching Works

The app tries to match API results to your games by **team names**:

- It searches for team names in both directions
- **Fuzzy matching:** handles slight name differences
- If no match found, that game is skipped
- You can still manually enter those scores

## Example

**Your games:**
```
1. Brasil vs Japao
2. Alemanha vs Paraguai
```

**API returns:**
```
Brazil vs Japan → Matched to "Brasil" ✓
Germany vs Paraguay → Matched to "Alemanha" ✓
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "RapidAPI key not configured" | Add VITE_RAPIDAPI_KEY to .env.local |
| "API rate limit exceeded" | You've used 100 requests today. Try tomorrow or upgrade plan |
| No matches found | No completed matches in API for this round yet (games haven't been played) |
| Some results not populated | Team names might not match exactly. Enter those manually |

## Manual Entry (Fallback)

If the API doesn't have results, or some are missing:
1. Simply enter scores manually in the form
2. Click **"Save All Results"**

The auto-fetch is **optional** — manual entry always works.

## For Netlify Deployment

Add `VITE_RAPIDAPI_KEY` to your Netlify environment variables:

1. Go to Netlify site settings
2. **Environment** → **Edit variables**
3. Add `VITE_RAPIDAPI_KEY=your_key`
4. Redeploy

---

**Want to use a different API?**

The code is modular. You can replace the API call in `src/lib/footballApi.js` with any other football data source.

Supported free APIs:
- **api-football.com** (recommended, used here)
- **football-data.org**
- **ESPN API** (unofficial, no key needed)
