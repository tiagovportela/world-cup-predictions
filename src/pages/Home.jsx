import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateBadges } from '../lib/badges'
import { fetchWorldCupResults, matchResultsByTeams } from '../lib/footballApi'
import Countdown from '../components/Countdown'
import NextGame from '../components/NextGame'
import Leaderboard from '../components/Leaderboard'
import RoundTabs from '../components/RoundTabs'
import PredictionsModal from '../components/PredictionsModal'
import MatchPredictionsModal from '../components/MatchPredictionsModal'

// How often to re-check the API for new results while a tab stays open.
const AUTO_FETCH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export default function Home() {
  const [rounds, setRounds] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [roundData, setRoundData] = useState(null)
  const [results, setResults] = useState([])
  const [deadlinePassed, setDeadlinePassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [nextMatch, setNextMatch] = useState(null) // resolved {gameId, teamA, teamB}
  const [showMatchPredictions, setShowMatchPredictions] = useState(false)

  // Mirror latest results into a ref so the auto-fetch effect can read them
  // without re-subscribing every time results change.
  const resultsRef = useRef(results)
  useEffect(() => {
    resultsRef.current = results
  }, [results])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'rounds'),
      (snapshot) => {
        const roundsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        if (roundsList.length > 0) {
          roundsList.sort((a, b) => {
            const order = { 'r16': 0, 'qf': 1, 'sf': 2, 'final': 3 }
            return (order[a.id] ?? 4) - (order[b.id] ?? 4)
          })
          setRounds(roundsList)
          if (!activeRound || !roundsList.find(r => r.id === activeRound)) {
            setActiveRound(roundsList[0].id)
          }
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error loading rounds:', err)
        setError('Failed to load rounds. Check your Firebase connection.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!activeRound) return

    const unsubscribe = onSnapshot(
      query(collection(db, 'rounds'), where('__name__', '==', activeRound)),
      (snapshot) => {
        if (snapshot.docs.length > 0) {
          const data = snapshot.docs[0].data()
          setRoundData(data)
          setResults(data.results || [])

          if (data.deadline) {
            const now = Date.now()
            const deadlineMs = data.deadline.toMillis?.() || data.deadline
            setDeadlinePassed(now > deadlineMs)
          }
        }
      },
      (err) => {
        console.error('Error loading round data:', err)
        setError('Failed to load round details.')
      }
    )

    return () => unsubscribe()
  }, [activeRound])

  // Stable signature of the game set — changes only when the round's games
  // actually change, not on every results snapshot. Keeps the auto-fetch
  // effect from re-running (and re-calling the API) on each results write.
  const gamesKey = (roundData?.games || []).map(g => g.id || g.gameId).join('|')

  // Auto-fetch real results when the page is open: pull finished WC matches,
  // fill any games that don't yet have a result, and save back to Firestore.
  // Idempotent — only writes when there's something new, so it won't loop.
  useEffect(() => {
    const games = roundData?.games
    if (!activeRound || !games || games.length === 0) return

    let cancelled = false

    const syncResults = async () => {
      try {
        const { results: apiResults } = await fetchWorldCupResults()
        if (cancelled || !apiResults || apiResults.length === 0) return

        const matched = matchResultsByTeams(apiResults, games)
        if (matched.length === 0) return

        const current = resultsRef.current || []
        // Only add results for games that don't already have one
        const toAdd = matched.filter(m => {
          const existing = current.find(r => r.gameId === m.gameId)
          return !existing || existing.scoreA == null || existing.scoreB == null
        })
        if (toAdd.length === 0) return

        const merged = [
          ...current.filter(r => !toAdd.some(t => t.gameId === r.gameId)),
          ...toAdd,
        ]
        await updateDoc(doc(db, 'rounds', activeRound), { results: merged })
      } catch {
        // Silent — e.g. no API key locally, or the function is unavailable.
        // Manual entry in Admin remains the fallback.
      }
    }

    syncResults()
    const intervalId = setInterval(syncResults, AUTO_FETCH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRound, gamesKey])

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="banner error">
          <p className="font-semibold mb-2">⚠️ {error}</p>
          <p className="text-sm">Check your Firebase connection and ensure the database is accessible.</p>
        </div>
      </main>
    )
  }

  if (loading || !roundData || !activeRound) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center py-12">
          {rounds.length === 0 && !loading && (
            <div className="banner warning inline-block text-left">
              <p className="font-semibold mb-2">📋 No rounds created yet</p>
              <p className="text-sm">Ask an admin to initialize the first round from the Admin panel</p>
            </div>
          )}
          {loading && <p className="text-gray-500 font-500">Loading rounds...</p>}
        </div>
      </main>
    )
  }

  const deadline = roundData.deadline ? new Date(roundData.deadline.toMillis?.() || roundData.deadline) : null

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      {rounds.length > 0 && <RoundTabs rounds={rounds} activeRound={activeRound} onRoundChange={setActiveRound} />}

      <div className="mb-12" />

      <NextGame
        games={roundData?.games || []}
        results={results}
        onMatchResolved={setNextMatch}
      />

      {deadlinePassed && nextMatch && (
        <div className="-mt-8 mb-12 text-center">
          <button
            onClick={() => setShowMatchPredictions(true)}
            className="border-2 border-black text-black font-600 text-sm uppercase tracking-wide px-6 py-3 hover:bg-gray-100 transition-colors"
          >
            👁 Show everyone's predictions for this match
          </button>
        </div>
      )}

      {deadline && <Countdown deadline={deadline} />}

      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-8">
          <h3 className="text-lg font-600 uppercase tracking-wide">Leaderboard</h3>
          <span className="text-xs text-gray-500">⚡ Results update automatically</span>
        </div>
        <Leaderboard
          roundId={activeRound}
          results={results}
          showPredictions={deadlinePassed}
          onPlayerClick={deadlinePassed ? setSelectedPlayer : null}
          games={roundData?.games || []}
        />
      </section>

      {!deadlinePassed && (
        <div className="banner info">
          <p className="font-semibold mb-1">💡 Predictions are hidden until the deadline passes</p>
          <p className="text-sm">Submit your predictions and check the leaderboard after the deadline.</p>
        </div>
      )}

      {deadlinePassed && (
        <div className="banner info">
          <p className="font-semibold">👆 Click on any player name to view their predictions</p>
        </div>
      )}

      {selectedPlayer && (
        <PredictionsModal
          player={selectedPlayer}
          games={roundData?.games || []}
          results={results}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {showMatchPredictions && nextMatch && (
        <MatchPredictionsModal
          roundId={activeRound}
          gameId={nextMatch.gameId}
          teamA={nextMatch.teamA}
          teamB={nextMatch.teamB}
          result={results.find(r => r.gameId === nextMatch.gameId) || null}
          onClose={() => setShowMatchPredictions(false)}
        />
      )}
    </main>
  )
}
