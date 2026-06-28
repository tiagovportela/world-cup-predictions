import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateBadges } from '../lib/badges'
import Countdown from '../components/Countdown'
import NextGame from '../components/NextGame'
import Leaderboard from '../components/Leaderboard'
import RoundTabs from '../components/RoundTabs'
import PredictionsModal from '../components/PredictionsModal'

export default function Home() {
  const [rounds, setRounds] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [roundData, setRoundData] = useState(null)
  const [results, setResults] = useState([])
  const [deadlinePassed, setDeadlinePassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

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
      <h1 className="mb-12">World Cup Predictions</h1>

      {rounds.length > 0 && <RoundTabs rounds={rounds} activeRound={activeRound} onRoundChange={setActiveRound} />}

      <div className="mb-12">
        <h2 className="mb-2">{roundData.name}</h2>
        <p className="text-gray-600 text-sm uppercase tracking-wide">{roundData.games?.length || 0} Matches</p>
      </div>

      <NextGame games={roundData?.games || []} results={results} />

      {deadline && <Countdown deadline={deadline} />}

      <section className="mb-12">
        <h3 className="mb-8 text-lg font-600 uppercase tracking-wide">Leaderboard</h3>
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
    </main>
  )
}
