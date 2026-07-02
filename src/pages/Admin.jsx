import { useState, useEffect } from 'react'
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { fetchWorldCupResults, matchResultsByTeams, fetchRoundFixtures } from '../lib/footballApi'
import { ROUND_SEQUENCE, sortRounds, getNextRound, isRoundOpen } from '../lib/rounds'
import { getFlag } from '../lib/teams'
import { GROUP_STAGE_COLLECTION, GROUP_STAGE_DOC_ID, DEFAULT_GROUP_STAGE_STANDINGS } from '../lib/groupStage'

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

// First entry in the sequence is the bootstrap round created by "Initialize".
const R16_ROUND = ROUND_SEQUENCE[0]

// Shared button styles so every action reads consistently across the panel.
const BTN_PRIMARY =
  'bg-black text-white font-600 py-4 px-8 uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const BTN_ACCENT =
  'bg-blue-600 text-white px-6 py-3 font-600 text-sm uppercase tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap'
const BTN_GHOST =
  'border border-gray-300 text-gray-700 px-5 py-2 font-600 text-sm uppercase tracking-wide hover:bg-gray-100 transition-colors'

function toDatetimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDeadline(deadline) {
  if (!deadline) return 'No deadline'
  const ms = deadline.toMillis?.() ?? deadline
  return new Date(ms).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

// Stable, order-independent fingerprint of a results list — used to detect
// unsaved edits by comparing the live grid against the last saved snapshot.
function resultsSignature(list) {
  return (list || [])
    .map(r => `${r.gameId}:${r.scoreA}:${r.scoreB}`)
    .sort()
    .join('|')
}

// Results-entry progress for a round: how many of its games have a score.
function roundProgress(round) {
  const total = round?.games?.length || 0
  const done = round?.results?.length || 0
  return { done, total, complete: total > 0 && done >= total }
}

// The round the admin most likely wants to work on when they open Results:
// the latest round whose deadline has passed (i.e. being played now), else the
// earliest round. `list` is assumed sorted by ROUND_SEQUENCE order.
function pickDefaultRound(list) {
  const closed = list.filter(r => !isRoundOpen(r))
  if (closed.length) return closed[closed.length - 1].id
  return list[0].id
}

function StatusBadge({ open }) {
  return (
    <span
      className={`text-xs font-600 uppercase tracking-wide px-2 py-1 ${
        open ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
      }`}
    >
      {open ? 'Open' : 'Closed'}
    </span>
  )
}

// Small feedback banner. Type maps directly to the .banner variants in CSS.
function Feedback({ feedback }) {
  if (!feedback) return null
  return <div className={`banner ${feedback.type} mb-8`}>{feedback.text}</div>
}

// A single team's score with large, touch-friendly −/+ steppers (admin often
// enters results on a phone at the venue).
function ResultStepper({ team, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">{getFlag(team)}</span>
        <span className="text-sm font-600 text-gray-700 uppercase tracking-wide truncate">{team}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-11 h-11 flex items-center justify-center bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-black text-xl font-bold transition-colors"
          aria-label={`Decrease ${team} score`}
        >
          −
        </button>
        <div className="w-12 h-11 flex items-center justify-center text-2xl font-bold text-black bg-gray-100 border border-gray-300">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-11 h-11 flex items-center justify-center bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-black text-xl font-bold transition-colors"
          aria-label={`Increase ${team} score`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState('rounds')
  const [rounds, setRounds] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [roundData, setRoundData] = useState(null)
  const [results, setResults] = useState([])
  const [savedResults, setSavedResults] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const [nextRoundGames, setNextRoundGames] = useState([{ teamA: '', teamB: '' }])
  const [nextRoundDeadline, setNextRoundDeadline] = useState('')
  const [createRoundId, setCreateRoundId] = useState('')
  const [editingRoundId, setEditingRoundId] = useState(null)
  const [roundNameDraft, setRoundNameDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [groupStandings, setGroupStandings] = useState([])
  const [groupCoefficient, setGroupCoefficient] = useState(1)
  const [coeffDraft, setCoeffDraft] = useState({}) // { group, [roundId]: weight }

  const nextRound = getNextRound(rounds)
  const existingRoundIds = new Set(rounds.map(r => r.id))
  // Rounds not yet created, offered as options for the create-round dropdown.
  const uncreatedRounds = ROUND_SEQUENCE.filter(r => !existingRoundIds.has(r.id))
  // The round the create form currently targets — follows the dropdown, falling
  // back to the next-in-sequence round before the form has been touched.
  const selectedCreateRound = ROUND_SEQUENCE.find(r => r.id === createRoundId) || nextRound
  const dirty = resultsSignature(results) !== resultsSignature(savedResults)

  // Structured, self-clearing feedback. Errors/warnings linger until the next
  // action; success/info auto-dismiss so the banner doesn't go stale.
  const notify = (type, text) => setFeedback({ type, text })
  useEffect(() => {
    if (!feedback || feedback.type === 'error' || feedback.type === 'warning') return
    const t = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(t)
  }, [feedback])

  // Point the create form at the next round to build whenever the set of
  // existing rounds changes (the auto-fetch effect below fills it in).
  useEffect(() => {
    setCreateRoundId(nextRound?.id || '')
  }, [nextRound?.id])

  useEffect(() => {
    const stored = localStorage.getItem('admin_auth')
    if (stored === 'true') {
      setAuthenticated(true)
      fetchRounds()
      fetchGroupStandings()
    }
  }, [])

  // Seed the weights editor from the loaded rounds + group config (default 1).
  // Re-seeds after fetches/saves; untouched while editing since those don't change.
  useEffect(() => {
    const draft = { group: groupCoefficient }
    for (const r of rounds) draft[r.id] = r.coefficient ?? 1
    setCoeffDraft(draft)
  }, [rounds, groupCoefficient])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setAuthenticated(true)
      localStorage.setItem('admin_auth', 'true')
      fetchRounds()
      fetchGroupStandings()
      setPassword('')
      notify('success', 'Logged in')
    } else {
      notify('error', 'Incorrect password')
    }
  }

  const fetchRounds = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'rounds'))
      const roundsList = sortRounds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setRounds(roundsList)
      if (roundsList.length > 0 && !activeRound) {
        setActiveRound(pickDefaultRound(roundsList))
      }
    } catch (error) {
      notify('error', 'Failed to load rounds: ' + error.message)
    }
  }

  const fetchGroupStandings = async () => {
    try {
      const snap = await getDoc(doc(db, GROUP_STAGE_COLLECTION, GROUP_STAGE_DOC_ID))
      const data = snap.exists() ? snap.data() : {}
      setGroupStandings(data.standings || [])
      setGroupCoefficient(data.coefficient ?? 1)
    } catch (error) {
      notify('error', 'Failed to load group stage: ' + error.message)
    }
  }

  const handleGroupChange = (index, field, value) => {
    setGroupStandings(list => list.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const handleAddGroupPlayer = () => {
    setGroupStandings(list => [...list, { userName: '', points: 0, exact: 0 }])
  }

  const handleRemoveGroupPlayer = (index) => {
    setGroupStandings(list => list.filter((_, i) => i !== index))
  }

  const handleLoadGroupDefaults = () => {
    setGroupStandings(DEFAULT_GROUP_STAGE_STANDINGS.map(r => ({ ...r })))
  }

  const handleSaveGroupStandings = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const standings = groupStandings
        .filter(r => r.userName.trim())
        .map(r => ({
          userName: r.userName.trim(),
          points: Number(r.points) || 0,
          exact: Number(r.exact) || 0,
        }))
      // Merge so a saved coefficient (from the Weights tab) isn't wiped.
      await setDoc(doc(db, GROUP_STAGE_COLLECTION, GROUP_STAGE_DOC_ID), { standings }, { merge: true })
      setGroupStandings(standings)
      notify('success', 'Group stage saved')
    } catch (error) {
      notify('error', 'Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCoeffChange = (key, value) => {
    setCoeffDraft(d => ({ ...d, [key]: value }))
  }

  const handleResetCoeffs = () => {
    const draft = { group: 1 }
    for (const r of rounds) draft[r.id] = 1
    setCoeffDraft(draft)
  }

  const handleSaveCoeffs = async () => {
    setSaving(true)
    setFeedback(null)
    // Coerce to a non-negative number, falling back to 1 for blank/invalid input.
    const toWeight = (v) => {
      const n = Number(v)
      return Number.isFinite(n) && n >= 0 ? n : 1
    }
    try {
      const groupWeight = toWeight(coeffDraft.group)
      await setDoc(
        doc(db, GROUP_STAGE_COLLECTION, GROUP_STAGE_DOC_ID),
        { coefficient: groupWeight },
        { merge: true }
      )
      setGroupCoefficient(groupWeight)
      for (const r of rounds) {
        await updateDoc(doc(db, 'rounds', r.id), { coefficient: toWeight(coeffDraft[r.id]) })
      }
      notify('success', 'Weights saved')
      fetchRounds()
    } catch (error) {
      notify('error', 'Error saving: ' + error.message)
    } finally {
      setSaving(false)
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
          setSavedResults(data.results || [])
        } else {
          notify('error', 'Round not found')
        }
      } catch (error) {
        notify('error', 'Failed to load round: ' + error.message)
      }
    }
    fetchRoundData()
  }, [activeRound])

  const handleResultChange = (gameId, scoreA, scoreB) => {
    const updated = [...results]
    const idx = updated.findIndex(r => r.gameId === gameId)
    const entry = { gameId, scoreA, scoreB }
    if (idx >= 0) updated[idx] = entry
    else updated.push(entry)
    setResults(updated)
  }

  const handleSaveResults = async () => {
    if (!activeRound) return

    setSaving(true)
    setFeedback(null)
    try {
      await updateDoc(doc(db, 'rounds', activeRound), { results })
      setSavedResults(results)
      // Keep the in-memory round list progress counters in sync.
      setRounds(rs => rs.map(r => (r.id === activeRound ? { ...r, results } : r)))
      notify('success', 'Results saved')
    } catch (error) {
      notify('error', 'Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAutoFetchResults = async () => {
    if (!roundData || !roundData.games) {
      notify('error', 'No round selected')
      return
    }

    setSaving(true)
    setFeedback(null)
    try {
      const { results: apiResults } = await fetchWorldCupResults(activeRound)
      const matched = matchResultsByTeams(apiResults, roundData.games)

      if (matched.length === 0) {
        notify('warning', 'No matches found in API for this round')
        return
      }

      const newResults = [...results]
      for (const match of matched) {
        const idx = newResults.findIndex(r => r.gameId === match.gameId)
        if (idx >= 0) newResults[idx] = match
        else newResults.push(match)
      }
      setResults(newResults)
      notify('success', `Fetched ${matched.length} match results — review and save`)
    } catch (error) {
      notify('error', error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRenameRound = async (roundId) => {
    const name = roundNameDraft.trim()
    if (!roundId || !name) return

    setSaving(true)
    setFeedback(null)
    try {
      await updateDoc(doc(db, 'rounds', roundId), { name })
      notify('success', 'Round renamed')
      setEditingRoundId(null)
      if (roundId === activeRound) setRoundData(prev => (prev ? { ...prev, name } : prev))
      fetchRounds()
    } catch (error) {
      notify('error', 'Error renaming: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRound = async (roundId) => {
    if (!roundId) return

    setSaving(true)
    setFeedback(null)
    try {
      await deleteDoc(doc(db, 'rounds', roundId))
      setConfirmDeleteId(null)
      if (editingRoundId === roundId) setEditingRoundId(null)

      // Update local state without a re-read so the derived next-round / active
      // -round values stay consistent (avoids racing the getDocs closure).
      const remaining = rounds.filter(r => r.id !== roundId)
      setRounds(remaining)
      if (roundId === activeRound) {
        const nextActive = remaining.length ? pickDefaultRound(remaining) : null
        setActiveRound(nextActive)
        if (!nextActive) {
          setRoundData(null)
          setResults([])
          setSavedResults([])
        }
      }
      notify('success', 'Round deleted')
    } catch (error) {
      notify('error', 'Error deleting: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInitializeR16 = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      const deadline = new Date('2026-06-28T19:30:00')
      await setDoc(doc(db, 'rounds', R16_ROUND.id), {
        name: R16_ROUND.name,
        status: 'open',
        deadline: Timestamp.fromDate(deadline),
        games: WORLDCUP_R16_GAMES,
        results: [],
      })
      notify('success', `${R16_ROUND.name} initialized`)
      fetchRounds()
    } catch (error) {
      notify('error', 'Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Pull a round's fixtures from the API to pre-fill the form. Shared by the
  // manual "Fetch Fixtures" button and the auto-fetch effect below. In silent
  // mode (auto) it stays quiet on empty/error, since manual entry is the
  // expected fallback when a bracket hasn't been drawn yet.
  const fetchFixturesForRound = async (round, { silent = false } = {}) => {
    if (!round) return
    setSaving(true)
    if (!silent) setFeedback(null)
    try {
      const { games, deadline, message } = await fetchRoundFixtures(round.stage)
      if (games.length > 0) {
        setNextRoundGames(games.map(g => ({ teamA: g.teamA, teamB: g.teamB })))
        if (deadline) setNextRoundDeadline(toDatetimeLocalValue(new Date(deadline)))
        notify('success', message)
      } else if (!silent) {
        notify('warning', message)
      }
    } catch (error) {
      if (silent) console.warn('Auto-fetch fixtures failed:', error.message)
      else notify('error', error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleFetchNextRoundFixtures = () => fetchFixturesForRound(selectedCreateRound)

  const handleSelectCreateRound = (id) => setCreateRoundId(id)

  // Auto-fetch fixtures whenever the create form targets a fresh round, so the
  // admin never has to click "Fetch Fixtures" for the common case. Clears the
  // form first so a previous round's fixtures can't linger. The bootstrap round
  // is skipped — it's seeded via the Initialize button with hardcoded teams.
  useEffect(() => {
    if (!authenticated || !createRoundId || createRoundId === R16_ROUND.id) return
    const round = ROUND_SEQUENCE.find(r => r.id === createRoundId)
    if (!round) return
    setNextRoundGames([{ teamA: '', teamB: '' }])
    setNextRoundDeadline('')
    fetchFixturesForRound(round, { silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRoundId, authenticated])

  const handleNextRoundGameChange = (index, field, value) => {
    setNextRoundGames(games => games.map((g, i) => (i === index ? { ...g, [field]: value } : g)))
  }

  const handleAddNextRoundGame = () => {
    setNextRoundGames(games => [...games, { teamA: '', teamB: '' }])
  }

  const handleRemoveNextRoundGame = (index) => {
    setNextRoundGames(games => games.filter((_, i) => i !== index))
  }

  const handleCreateNextRound = async () => {
    if (!selectedCreateRound) return

    const validGames = nextRoundGames
      .filter(g => g.teamA.trim() && g.teamB.trim())
      .map((g, i) => ({ id: `game_${i + 1}`, teamA: g.teamA.trim(), teamB: g.teamB.trim() }))

    if (validGames.length === 0) {
      notify('error', 'Add at least one match')
      return
    }
    if (!nextRoundDeadline) {
      notify('error', 'Set a deadline')
      return
    }

    setSaving(true)
    setFeedback(null)
    try {
      await setDoc(doc(db, 'rounds', selectedCreateRound.id), {
        name: selectedCreateRound.name,
        status: 'open',
        deadline: Timestamp.fromDate(new Date(nextRoundDeadline)),
        games: validGames,
        results: [],
      })
      notify('success', `${selectedCreateRound.name} created`)
      fetchRounds()
    } catch (error) {
      notify('error', 'Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Jump from a round card straight into entering that round's results.
  const goToResults = (roundId) => {
    setActiveRound(roundId)
    setTab('results')
    setFeedback(null)
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('admin_auth')
    setRounds([])
    setActiveRound(null)
    setRoundData(null)
    setFeedback(null)
  }

  // ---- Login gate ----
  if (!authenticated) {
    return (
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="border border-gray-300 p-8">
          <h1 className="mb-2 text-2xl">Admin Panel</h1>
          <p className="text-sm text-gray-600 mb-8">Enter the admin password to manage rounds and results.</p>

          <Feedback feedback={feedback} />

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

  const tabBtn = (active) =>
    `px-6 py-4 font-600 text-sm uppercase tracking-wide transition-all border-b-2 ${
      active ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
    }`

  const openCount = rounds.filter(isRoundOpen).length

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-8">
        <div>
          <h1>Admin Panel</h1>
          <p className="text-sm text-gray-600 mt-2">
            {rounds.length} round{rounds.length === 1 ? '' : 's'} · {openCount} open · {rounds.length - openCount} closed
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="border border-red-600 text-red-600 px-6 py-3 font-600 text-sm uppercase tracking-wide hover:bg-red-600 hover:text-white transition-colors flex-shrink-0"
        >
          Logout
        </button>
      </div>

      <Feedback feedback={feedback} />

      {/* Tab navigation */}
      <div className="flex gap-0 mb-12 border-b border-gray-300 overflow-x-auto">
        <button onClick={() => setTab('rounds')} className={tabBtn(tab === 'rounds')}>Rounds</button>
        <button onClick={() => setTab('results')} className={tabBtn(tab === 'results')}>Results</button>
        <button onClick={() => setTab('group')} className={tabBtn(tab === 'group')}>Group Stage</button>
        <button onClick={() => setTab('weights')} className={tabBtn(tab === 'weights')}>Weights</button>
      </div>

      {/* ================= ROUNDS TAB ================= */}
      {tab === 'rounds' && (
        <>
          <section className="mb-16">
            <h2 className="mb-8 text-lg font-600 uppercase tracking-wide">Create Round</h2>

            {!nextRound ? (
              <div className="border border-gray-300 p-8 text-center">
                <p className="text-sm text-gray-600">All rounds have been created.</p>
              </div>
            ) : nextRound.id === R16_ROUND.id ? (
              <div className="border border-gray-300 p-8 max-w-xl">
                <h3 className="mb-3 font-600 text-sm uppercase tracking-wide text-gray-700">Initialize Tournament</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Create the first round (<strong>{R16_ROUND.name}</strong>), seeded with the 32 knockout teams and their fixtures.
                </p>
                <button onClick={handleInitializeR16} disabled={saving} className={`w-full ${BTN_PRIMARY}`}>
                  {saving ? 'Creating…' : `Initialize ${R16_ROUND.name}`}
                </button>
              </div>
            ) : (
              <div className="border border-gray-300 p-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
                  <div>
                    <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Round to create</label>
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedCreateRound.id}
                        onChange={(e) => handleSelectCreateRound(e.target.value)}
                        className="text-sm"
                      >
                        {uncreatedRounds.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      {selectedCreateRound.id === nextRound.id && <span className="badge-outline">Next up</span>}
                    </div>
                  </div>
                  <button onClick={handleFetchNextRoundFixtures} disabled={saving} className={BTN_ACCENT}>
                    {saving ? 'Fetching…' : '🔄 Re-fetch'}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Fixtures for <strong>{selectedCreateRound.name}</strong> load automatically from the API — re-fetch, or edit matches manually below.
                </p>

                <div className="space-y-3 mb-6">
                  {nextRoundGames.map((game, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-600 text-gray-400 w-6 flex-shrink-0 text-right">{i + 1}</span>
                      <input
                        type="text"
                        value={game.teamA}
                        onChange={(e) => handleNextRoundGameChange(i, 'teamA', e.target.value)}
                        placeholder="Team A"
                        className="flex-1 min-w-0"
                      />
                      <span className="text-gray-400 flex-shrink-0 text-sm uppercase">vs</span>
                      <input
                        type="text"
                        value={game.teamB}
                        onChange={(e) => handleNextRoundGameChange(i, 'teamB', e.target.value)}
                        placeholder="Team B"
                        className="flex-1 min-w-0"
                      />
                      <button
                        onClick={() => handleRemoveNextRoundGame(i)}
                        disabled={nextRoundGames.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:opacity-30 px-2 flex-shrink-0"
                        aria-label="Remove match"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button onClick={handleAddNextRoundGame} className="text-sm text-gray-600 hover:text-black underline">
                    + Add match
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Deadline</label>
                  <input
                    type="datetime-local"
                    value={nextRoundDeadline}
                    onChange={(e) => setNextRoundDeadline(e.target.value)}
                    className="w-full md:w-64"
                  />
                </div>

                <button onClick={handleCreateNextRound} disabled={saving} className={`w-full md:w-auto ${BTN_PRIMARY}`}>
                  {saving ? 'Creating…' : `Create ${selectedCreateRound.name}`}
                </button>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-8 text-lg font-600 uppercase tracking-wide">Existing Rounds</h2>

            {rounds.length === 0 ? (
              <div className="border border-gray-300 p-8 text-center">
                <p className="text-sm text-gray-600">No rounds yet — create one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rounds.map((r) => {
                  const open = isRoundOpen(r)
                  const { done, total, complete } = roundProgress(r)
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0
                  return (
                    <div key={r.id} className="border border-gray-300 p-6">
                      {editingRoundId === r.id ? (
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                          <input
                            type="text"
                            value={roundNameDraft}
                            onChange={(e) => setRoundNameDraft(e.target.value)}
                            className="flex-1"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRenameRound(r.id)}
                              disabled={saving || !roundNameDraft.trim() || roundNameDraft.trim() === r.name}
                              className="bg-black text-white px-5 py-2 font-600 text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-40"
                            >
                              Save
                            </button>
                            <button onClick={() => setEditingRoundId(null)} className={BTN_GHOST}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : confirmDeleteId === r.id ? (
                        <div className="flex flex-col gap-4">
                          <div>
                            <div className="font-600 text-black truncate">{r.name}</div>
                            <div className="text-xs text-red-600 mt-1">
                              Delete this round permanently, including its {total} match{total === 1 ? '' : 'es'} and any saved results? This can't be undone.
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteRound(r.id)}
                              disabled={saving}
                              className="bg-red-600 text-white px-5 py-2 font-600 text-sm uppercase tracking-wide hover:bg-red-700 transition-colors disabled:opacity-40"
                            >
                              {saving ? 'Deleting…' : 'Delete round'}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className={BTN_GHOST}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-600 text-black truncate">{r.name}</span>
                                {complete && <span className="text-xs font-600 uppercase tracking-wide px-2 py-1 bg-black text-white">Complete</span>}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {total} match{total === 1 ? '' : 'es'} · {formatDeadline(r.deadline)}
                              </div>
                            </div>
                            <StatusBadge open={open} />
                          </div>

                          {/* Results progress */}
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span className="uppercase tracking-wide">Results</span>
                              <span>{done}/{total}</span>
                            </div>
                            <div className="h-1.5 bg-gray-200">
                              <div className={`h-full ${complete ? 'bg-green-600' : 'bg-black'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <button onClick={() => goToResults(r.id)} className="text-sm text-black font-600 hover:underline">
                              {complete ? 'Edit results →' : 'Enter results →'}
                            </button>
                            <button
                              onClick={() => { setEditingRoundId(r.id); setRoundNameDraft(r.name || ''); setConfirmDeleteId(null) }}
                              className="text-sm text-gray-600 hover:text-black underline"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => { setConfirmDeleteId(r.id); setEditingRoundId(null) }}
                              className="text-sm text-red-600 hover:text-red-800 underline ml-auto"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* ================= RESULTS TAB ================= */}
      {tab === 'results' && (
        <>
          {rounds.length === 0 ? (
            <div className="border border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-600">No rounds yet. Create one in the Rounds tab first.</p>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Select Round</label>
                <select
                  value={activeRound || ''}
                  onChange={(e) => setActiveRound(e.target.value)}
                  className="w-full md:w-72"
                >
                  {rounds.map(r => {
                    const { done, total } = roundProgress(r)
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} — {done}/{total} results
                      </option>
                    )
                  })}
                </select>
              </div>

              {roundData && (() => {
                const games = roundData.games || []
                const enteredCount = games.filter(g => results.some(r => r.gameId === g.id)).length
                return (
                  <section>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-600 uppercase tracking-wide">{roundData.name}</h2>
                          <StatusBadge open={isRoundOpen(roundData)} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{enteredCount} of {games.length} results entered</p>
                      </div>
                      <button onClick={handleAutoFetchResults} disabled={saving} className={BTN_ACCENT}>
                        {saving ? 'Fetching…' : '🔄 Auto-fetch from API'}
                      </button>
                    </div>

                    <div className="space-y-4 mb-8">
                      {games.map((game, i) => {
                        const result = results.find(r => r.gameId === game.id)
                        const hasResult = !!result
                        const scoreA = result?.scoreA ?? 0
                        const scoreB = result?.scoreB ?? 0
                        return (
                          <div key={game.id} className={`border p-6 ${hasResult ? 'border-gray-400' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-600 uppercase tracking-wide text-gray-400">Match {i + 1}</span>
                              <span
                                className={`text-xs font-600 uppercase tracking-wide px-2 py-1 ${
                                  hasResult ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {hasResult ? 'Result set' : 'Pending'}
                              </span>
                            </div>
                            <div className="mb-3">
                              <ResultStepper
                                team={game.teamA}
                                value={scoreA}
                                onChange={(v) => handleResultChange(game.id, v, scoreB)}
                              />
                            </div>
                            <div className="border-t border-gray-100 pt-3">
                              <ResultStepper
                                team={game.teamB}
                                value={scoreB}
                                onChange={(v) => handleResultChange(game.id, scoreA, v)}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Save bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-gray-300 pt-6">
                      <button onClick={handleSaveResults} disabled={saving || !dirty} className={`flex-1 ${BTN_PRIMARY}`}>
                        {saving ? 'Saving…' : dirty ? 'Save All Results' : 'All Saved'}
                      </button>
                      {dirty && (
                        <span className="text-xs font-600 uppercase tracking-wide text-orange-600 text-center whitespace-nowrap">
                          Unsaved changes
                        </span>
                      )}
                    </div>
                  </section>
                )
              })()}
            </>
          )}
        </>
      )}

      {/* ================= GROUP STAGE TAB ================= */}
      {tab === 'group' && (
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-lg font-600 uppercase tracking-wide mb-1">Group Stage</h2>
              <p className="text-sm text-gray-600">Final totals from the group games. These carry into the Overall standings.</p>
            </div>
            <button onClick={handleLoadGroupDefaults} disabled={saving} className={BTN_ACCENT}>
              Load default standings
            </button>
          </div>

          <div className="border border-gray-300 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3 text-xs font-600 uppercase tracking-wide text-gray-500">
              <span className="w-6 flex-shrink-0" />
              <span className="flex-1 min-w-0">Player</span>
              <span className="w-20 text-center flex-shrink-0">Points</span>
              <span className="w-20 text-center flex-shrink-0">Exact</span>
              <span className="w-6 flex-shrink-0" />
            </div>

            {groupStandings.length === 0 ? (
              <p className="text-sm text-gray-600 py-4">No players yet — add one, or load the default standings.</p>
            ) : (
              <div className="space-y-3">
                {groupStandings.map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 flex-shrink-0 text-right text-xs font-600 text-gray-400">{i + 1}</span>
                    <input
                      type="text"
                      value={row.userName}
                      onChange={(e) => handleGroupChange(i, 'userName', e.target.value)}
                      placeholder="Player name"
                      className="flex-1 min-w-0"
                    />
                    <input
                      type="number"
                      value={row.points}
                      onChange={(e) => handleGroupChange(i, 'points', e.target.value)}
                      className="w-20 text-center no-spinner flex-shrink-0"
                      aria-label={`${row.userName || 'Player'} points`}
                    />
                    <input
                      type="number"
                      value={row.exact}
                      onChange={(e) => handleGroupChange(i, 'exact', e.target.value)}
                      className="w-20 text-center no-spinner flex-shrink-0"
                      aria-label={`${row.userName || 'Player'} exact scores`}
                    />
                    <button
                      onClick={() => handleRemoveGroupPlayer(i)}
                      className="text-red-600 hover:text-red-800 px-2 flex-shrink-0"
                      aria-label="Remove player"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleAddGroupPlayer} className="mt-4 text-sm text-gray-600 hover:text-black underline">
              + Add player
            </button>
          </div>

          <button onClick={handleSaveGroupStandings} disabled={saving} className={`w-full mt-8 ${BTN_PRIMARY}`}>
            {saving ? 'Saving…' : 'Save Group Stage'}
          </button>
        </section>
      )}

      {/* ================= WEIGHTS TAB ================= */}
      {tab === 'weights' && (
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-lg font-600 uppercase tracking-wide mb-1">Round Weights</h2>
              <p className="text-sm text-gray-600">
                Multiply each stage's points in the Overall standings. Default 1 = every stage counts equally.
              </p>
            </div>
            <button onClick={handleResetCoeffs} disabled={saving} className={BTN_GHOST}>
              Reset all to 1
            </button>
          </div>

          <div className="border border-gray-300 divide-y divide-gray-200">
            {[{ key: 'group', name: 'Group Stage' }, ...rounds.map(r => ({ key: r.id, name: r.name }))].map(({ key, name }) => (
              <div key={key} className="flex items-center justify-between gap-4 px-6 py-4">
                <span className="font-600 text-black truncate">{name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-gray-400 text-lg">×</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={coeffDraft[key] ?? 1}
                    onChange={(e) => handleCoeffChange(key, e.target.value)}
                    className="w-24 text-center no-spinner"
                    aria-label={`${name} weight`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live formula preview */}
          <div className="mt-6 text-sm text-gray-600 break-words">
            <span className="font-600 uppercase text-xs tracking-wide text-gray-500 mr-2">Overall =</span>
            {[{ key: 'group', name: 'Group Stage' }, ...rounds.map(r => ({ key: r.id, name: r.name }))]
              .map(({ key, name }) => `${coeffDraft[key] ?? 1} × ${name}`)
              .join('  +  ')}
          </div>

          <button onClick={handleSaveCoeffs} disabled={saving} className={`w-full mt-8 ${BTN_PRIMARY}`}>
            {saving ? 'Saving…' : 'Save Weights'}
          </button>
        </section>
      )}
    </main>
  )
}
