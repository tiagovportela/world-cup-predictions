import { useState, useEffect } from 'react'
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { fetchWorldCupResults, matchResultsByTeams } from '../lib/footballApi'
import MatchCard from '../components/MatchCard'

const WORLDCUP_R16_GAMES = [
  { id: 'game_1', teamA: 'Africa do Sul', teamB: 'Canada' },
  { id: 'game_2', teamA: 'Brasil', teamB: 'Japao' },
  { id: 'game_3', teamA: 'Alemanha', teamB: 'Paraguai' },
  { id: 'game_4', teamA: 'Paises Baixos', teamB: 'Marrocos' },
  { id: 'game_5', teamA: 'Costa do Marfim', teamB: 'Noruega' },
  { id: 'game_6', teamA: 'França', teamB: 'Suécia' },
  { id: 'game_7', teamA: 'Mexico', teamB: 'Equador' },
  { id: 'game_8', teamA: 'Inglaterra', teamB: 'Congo' },
  { id: 'game_9', teamA: 'Belgica', teamB: 'Senegal' },
  { id: 'game_10', teamA: 'Estados Unidos', teamB: 'Bosnia' },
  { id: 'game_11', teamA: 'Espanha', teamB: 'Austria' },
  { id: 'game_12', teamA: 'Portugal', teamB: 'Croacia' },
  { id: 'game_13', teamA: 'Suiça', teamB: 'Argélia' },
  { id: 'game_14', teamA: 'Australia', teamB: 'Egito' },
  { id: 'game_15', teamA: 'Argentina', teamB: 'Cabo Verde' },
  { id: 'game_16', teamA: 'Colombia', teamB: 'Gana' },
]

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [rounds, setRounds] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [roundData, setRoundData] = useState(null)
  const [results, setResults] = useState([])
  const [newRound, setNewRound] = useState({ name: '', deadline: '', games: [] })
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('admin_auth')
    if (stored === 'true') {
      setAuthenticated(true)
      fetchRounds()
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setAuthenticated(true)
      localStorage.setItem('admin_auth', 'true')
      fetchRounds()
      setPassword('')
      setMessage('✅ Logged in')
    } else {
      setMessage('❌ Incorrect password')
    }
  }

  const fetchRounds = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'rounds'))
      const roundsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      roundsList.sort((a, b) => {
        const order = { 'r16': 0, 'qf': 1, 'sf': 2, 'final': 3 }
        return (order[a.id] ?? 4) - (order[b.id] ?? 4)
      })
      setRounds(roundsList)
      if (roundsList.length > 0 && !activeRound) {
        setActiveRound(roundsList[0].id)
      }
    } catch (error) {
      setMessage('❌ Failed to load rounds: ' + error.message)
    }
  }

  useEffect(() => {
    if (!activeRound) return

    const fetchRoundData = async () => {
      try {
        const docRef = doc(db, 'rounds', activeRound)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setRoundData(data)
          setResults(data.results || [])
        } else {
          setMessage('❌ Round not found')
        }
      } catch (error) {
        setMessage('❌ Failed to load round: ' + error.message)
      }
    }
    fetchRoundData()
  }, [activeRound])

  const handleResultChange = (gameId, scoreA, scoreB) => {
    const updated = [...results]
    const idx = updated.findIndex(r => r.gameId === gameId)
    if (idx >= 0) {
      updated[idx] = { gameId, scoreA: scoreA !== '' ? parseInt(scoreA) : null, scoreB: scoreB !== '' ? parseInt(scoreB) : null }
    } else {
      updated.push({ gameId, scoreA: scoreA !== '' ? parseInt(scoreA) : null, scoreB: scoreB !== '' ? parseInt(scoreB) : null })
    }
    setResults(updated)
  }

  const handleSaveResults = async () => {
    if (!activeRound) return

    setSaving(true)
    setMessage('')

    try {
      const roundRef = doc(db, 'rounds', activeRound)
      await updateDoc(roundRef, { results })
      setMessage('✅ Results saved')
    } catch (error) {
      setMessage('❌ Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInitializeR16 = async () => {
    setSaving(true)
    setMessage('')

    try {
      const deadline = new Date('2026-06-28T19:30:00')
      await setDoc(doc(db, 'rounds', 'r16'), {
        name: 'Round of 16',
        status: 'open',
        deadline: Timestamp.fromDate(deadline),
        games: WORLDCUP_R16_GAMES,
        results: [],
      })
      setMessage('✅ Round of 16 initialized')
      fetchRounds()
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRound = async () => {
    if (!newRound.name.trim()) {
      setMessage('❌ Please enter round name')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const roundId = newRound.name.toLowerCase().replace(/\s+/g, '_')
      const deadline = newRound.deadline ? new Date(newRound.deadline) : new Date()

      await setDoc(doc(db, 'rounds', roundId), {
        name: newRound.name,
        status: 'open',
        deadline: Timestamp.fromDate(deadline),
        games: newRound.games || [],
        results: [],
      })

      setMessage('✅ Round created')
      setNewRound({ name: '', deadline: '', games: [] })
      fetchRounds()
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('admin_auth')
    setRounds([])
    setActiveRound(null)
    setRoundData(null)
    setMessage('')
  }

  const handleAutoFetchResults = async () => {
    if (!roundData || !roundData.games) {
      setMessage('❌ No round selected')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const { results: apiResults } = await fetchWorldCupResults(activeRound)

      // Try to match API results to our games
      const matched = matchResultsByTeams(apiResults, roundData.games)

      if (matched.length === 0) {
        setMessage('⚠️ No matches found in API for this round')
        setSaving(false)
        return
      }

      // Update the results state with matched results
      const newResults = [...results]
      for (const match of matched) {
        const idx = newResults.findIndex(r => r.gameId === match.gameId)
        if (idx >= 0) {
          newResults[idx] = match
        } else {
          newResults.push(match)
        }
      }
      setResults(newResults)
      setMessage(`✅ Fetched ${matched.length} match results from API`)
    } catch (error) {
      setMessage('❌ ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!authenticated) {
    return (
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="border border-gray-300 p-8">
          <h1 className="mb-8 text-2xl">Admin Panel</h1>

          {message && (
            <div className={`banner ${message.startsWith('✅') ? 'success' : 'error'} mb-8`}>
              {message}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-8">
              <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white font-600 py-4 uppercase tracking-wide hover:bg-gray-800 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex justify-between items-center mb-12">
        <h1>Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-3 font-600 text-sm uppercase tracking-wide hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {message && (
        <div className={`banner ${message.startsWith('✅') ? 'success' : 'error'} mb-8`}>
          {message}
        </div>
      )}

      <section className="mb-16">
        <h2 className="mb-8 text-lg font-600 uppercase tracking-wide">Setup Rounds</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-gray-300 p-8">
            <h3 className="mb-6 font-600 text-sm uppercase tracking-wide text-gray-700">World Cup Round of 16</h3>
            <p className="text-sm text-gray-600 mb-6">Initialize the tournament with 16 knockout matches</p>
            <button
              onClick={handleInitializeR16}
              disabled={saving}
              className="w-full bg-black text-white font-600 py-4 uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Initialize R16'}
            </button>
          </div>

          <div className="border border-gray-300 p-8">
            <h3 className="mb-6 font-600 text-sm uppercase tracking-wide text-gray-700">New Round</h3>
            <p className="text-sm text-gray-600 mb-6">Create a new round (Quarterfinals, Semifinals, Final)</p>
            <div className="space-y-4">
              <input
                type="text"
                value={newRound.name}
                onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
                placeholder="Round name"
                className="w-full"
              />
              <input
                type="datetime-local"
                value={newRound.deadline}
                onChange={(e) => setNewRound({ ...newRound, deadline: e.target.value })}
                className="w-full"
              />
              <button
                onClick={handleCreateRound}
                disabled={saving}
                className="w-full bg-black text-white font-600 py-4 uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Round'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {rounds.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-8 text-lg font-600 uppercase tracking-wide">Manage Results</h2>
          <div className="mb-8">
            <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Select Round</label>
            <select
              value={activeRound || ''}
              onChange={(e) => setActiveRound(e.target.value)}
              className="w-full md:w-64"
            >
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </section>
      )}

      {roundData && (
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-lg font-600 uppercase tracking-wide mb-1">{roundData.name}</h2>
              <p className="text-sm text-gray-600">{roundData.games?.length || 0} matches</p>
            </div>
            <button
              onClick={handleAutoFetchResults}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 font-600 text-sm uppercase tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Fetching...' : '🔄 Auto-fetch from API'}
            </button>
          </div>

          <div className="space-y-6 mb-8">
            {(roundData.games || []).map((game) => {
              const result = results.find(r => r.gameId === game.id)
              const scoreA = result?.scoreA ?? 0
              const scoreB = result?.scoreB ?? 0
              return (
                <div key={game.id} className="border border-gray-300 p-8 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-6">
                    {/* Team A */}
                    <div className="flex-1 text-right">
                      <div className="text-sm font-600 text-gray-700 mb-6">{game.teamA}</div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResultChange(game.id, Math.max(0, scoreA - 1), scoreB)}
                          className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 transition-colors"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleResultChange(game.id, scoreA + 1, scoreB)}
                          className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 transition-colors"
                        >
                          ↑
                        </button>
                      </div>
                    </div>

                    {/* Result Center */}
                    <div className="text-center">
                      <div className="text-5xl font-bold text-black">
                        {scoreA} - {scoreB}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">Result</div>
                    </div>

                    {/* Team B */}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-600 text-gray-700 mb-6">{game.teamB}</div>
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => handleResultChange(game.id, scoreA, Math.max(0, scoreB - 1))}
                          className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 transition-colors"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleResultChange(game.id, scoreA, scoreB + 1)}
                          className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 transition-colors"
                        >
                          ↑
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleSaveResults}
            disabled={saving}
            className="w-full bg-black text-white font-600 py-4 uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Results'}
          </button>
        </section>
      )}
    </main>
  )
}
