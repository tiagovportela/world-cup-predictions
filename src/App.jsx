import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Submit from './pages/Submit'
import Admin from './pages/Admin'
import { isFirebaseConfigured } from './lib/firebase'
import './index.css'

function FirebaseConfigError() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="banner error">
        <h2 className="text-2xl font-bold mb-2">⚠️ Firebase Not Configured</h2>
        <p className="mb-4">
          The app cannot start because Firebase configuration is missing.
        </p>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li>Create a `.env.local` file in the project root</li>
          <li>Copy all VITE_FIREBASE_* variables from your Firebase Console</li>
          <li>See README.md for detailed setup instructions</li>
          <li>Restart the development server</li>
        </ol>
        <a href="/README.md" className="text-blue-600 font-500 hover:underline">
          📖 View Setup Instructions
        </a>
      </div>
    </div>
  )
}

function App() {
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <FirebaseConfigError />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-white">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
