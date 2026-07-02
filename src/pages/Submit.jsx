import { useState, useEffect } from 'react'
import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { parseExcel, exportPredictionsToExcel } from '../lib/excel'
import { sortRounds, isRoundOpen } from '../lib/rounds'
import MatchCard from '../components/MatchCard'

export default function Submit() {
  const [step, setStep] = useState('name')
  const [userName, setUserName] = useState('')
  const [file, setFile] = useState(null)
  const [manualIndex, setManualIndex] = useState(0)
  const [rounds, setRounds] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [roundData, setRoundData] = useState(null)
  const [games, setGames] = useState([])
  const [predictions, setPredictions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [existingSubmission, setExistingSubmission] = useState(null)
  const [deadlinePassed, setDeadlinePassed] = useState(false)

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'rounds'))
        const allRounds = sortRounds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        const openRounds = allRounds.filter(isRoundOpen)
        setRounds(openRounds)
        if (openRounds.length > 0) {
          setActiveRound(openRounds[0].id)
        } else if (allRounds.length > 0) {
          setMessage('❌ No rounds are currently open for submission.')
        } else {
          setMessage('❌ No rounds available. Ask an admin to initialize a round.')
        }
      } catch (error) {
        setMessage('❌ Failed to load rounds: ' + error.message)
      }
    }
    fetchRounds()
  }, [])

  useEffect(() => {
    if (!activeRound) return

    const fetchRoundData = async () => {
      const docRef = doc(db, 'rounds', activeRound)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setRoundData(data)

        if (data.deadline) {
          const now = Date.now()
          const deadlineMs = data.deadline.toMillis?.() || data.deadline
          if (now > deadlineMs) {
            setDeadlinePassed(true)
            setMessage('❌ Submissions are closed for this round')
            setStep('closed')
            return
          }
        }

        setDeadlinePassed(false)
        setGames(data.games || [])
        setPredictions((data.games || []).map(g => ({ gameId: g.id || g.gameId, scoreA: 0, scoreB: 0 })))
        setStep(prev => (prev === 'closed' ? 'name' : prev))
      }
    }
    fetchRoundData()
  }, [activeRound])

  useEffect(() => {
    if (step === 'name' || !userName || !activeRound) return

    const checkExisting = async () => {
      const q = query(
        collection(db, 'submissions'),
        where('userName', '==', userName),
        where('roundId', '==', activeRound)
      )
      const snapshot = await getDocs(q)
      if (snapshot.docs.length > 0) {
        const existing = snapshot.docs[0].data()
        setExistingSubmission({ id: snapshot.docs[0].id, ...existing })
        setPredictions(existing.predictions || [])
      }
    }
    checkExisting()
  }, [step, userName, activeRound])

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    try {
      const parsed = await parseExcel(selectedFile)
      setFile(selectedFile)
      setPredictions(parsed)
      setStep('preview')
      setMessage('')
    } catch (error) {
      setMessage('❌ Error parsing Excel file: ' + error.message)
    }
  }

  const handlePredictionChange = (index, newPrediction) => {
    const updated = [...predictions]
    updated[index] = newPrediction
    setPredictions(updated)
  }

  const handleSubmit = async () => {
    if (!userName.trim()) {
      setMessage('❌ Please enter your name')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const submissionData = {
        userName: userName.trim(),
        roundId: activeRound,
        predictions,
        submittedAt: new Date(),
      }

      if (existingSubmission) {
        await updateDoc(doc(db, 'submissions', existingSubmission.id), submissionData)
        setMessage('✅ Predictions updated!')
      } else {
        const docId = `${userName.trim()}_${activeRound}`
        await setDoc(doc(db, 'submissions', docId), submissionData)
        setMessage('✅ Predictions submitted!')
      }

      setTimeout(() => {
        setStep('name')
        setUserName('')
        setFile(null)
        setPredictions([])
        setExistingSubmission(null)
      }, 2000)
    } catch (error) {
      setMessage('❌ Error submitting: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'closed') {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="banner error mb-8">
          <p className="text-lg font-semibold">{message}</p>
        </div>

        {rounds.length > 1 && (
          <div className="border border-gray-300 p-8">
            <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Try a Different Round</label>
            <select
              value={activeRound || ''}
              onChange={(e) => setActiveRound(e.target.value)}
              className="w-full"
            >
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="mb-8">Submit Predictions</h1>

      {message && (
        <div className={`banner ${message.startsWith('✅') ? 'success' : 'error'} mb-8`}>
          {message}
        </div>
      )}

      {step === 'name' && (
        <div className="border border-gray-300 p-8 mb-8">
          <div className="mb-8">
            <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
            />
          </div>

          <div className="mb-8">
            <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Select Round</label>
            <select
              value={activeRound || ''}
              onChange={(e) => setActiveRound(e.target.value)}
              className="w-full"
            >
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Upload Excel File</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="w-full border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-black transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">Accepted formats: .xlsx, .xls</p>
            </div>

            <div className="flex flex-col">
              <label className="block text-black font-600 text-sm uppercase tracking-wide mb-3">Or Enter Manually</label>
              <button
                onClick={() => {
                  setManualIndex(0)
                  setStep('manual')
                }}
                disabled={!userName.trim() || !activeRound || games.length === 0}
                className="flex-1 border-2 border-black text-black font-600 py-6 uppercase tracking-wide hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enter Predictions Manually
              </button>
              <p className="text-xs text-gray-500 mt-2">Predict one match at a time</p>
            </div>
          </div>
        </div>
      )}

      {step === 'manual' && games.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-600 uppercase tracking-wide">
              Match {manualIndex + 1} of {games.length}
            </h2>
            <button
              onClick={() => setStep('name')}
              className="text-sm text-gray-600 hover:text-black underline"
            >
              Change name/round
            </button>
          </div>

          <MatchCard
            game={games[manualIndex]}
            prediction={predictions[manualIndex]}
            isEditable={true}
            onPredictionChange={(newPred) => handlePredictionChange(manualIndex, newPred)}
          />

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setManualIndex(i => Math.max(0, i - 1))}
              disabled={manualIndex === 0}
              className="flex-1 bg-gray-200 text-black font-600 py-4 uppercase tracking-wide hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {manualIndex < games.length - 1 ? (
              <button
                onClick={() => setManualIndex(i => Math.min(games.length - 1, i + 1))}
                className="flex-1 bg-black text-white font-600 py-4 uppercase tracking-wide hover:bg-gray-800 transition-colors"
              >
                Next Match
              </button>
            ) : (
              <button
                onClick={() => setStep('preview')}
                className="flex-1 bg-black text-white font-600 py-4 uppercase tracking-wide hover:bg-gray-800 transition-colors"
              >
                Review & Submit
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <h2 className="mb-8 text-lg font-600 uppercase tracking-wide">Review Your Predictions</h2>

          <div className="grid grid-cols-1 gap-6 mb-8">
            {predictions.map((pred, idx) => (
              <div key={idx}>
                <MatchCard
                  game={games[idx] || { teamA: '?', teamB: '?' }}
                  prediction={pred}
                  isEditable={true}
                  onPredictionChange={(newPred) => handlePredictionChange(idx, newPred)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setStep('name')
                setFile(null)
              }}
              className="flex-1 bg-gray-200 text-black font-600 py-4 uppercase tracking-wide hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => exportPredictionsToExcel({ userName, predictions }, games)}
              className="flex-1 border-2 border-black text-black font-600 py-4 uppercase tracking-wide hover:bg-gray-100 transition-colors"
            >
              ⬇ Export Excel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-black text-white font-600 py-4 uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : existingSubmission ? 'Update Submission' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
