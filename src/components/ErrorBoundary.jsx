import { useState, useEffect } from 'react'

export default function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleError = (event) => {
      setHasError(true)
      setError(event.error?.message || 'An unexpected error occurred')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-red-900 border-l-4 border-red-500 p-6 rounded">
          <h2 className="text-xl font-bold text-red-100 mb-2">⚠️ Something went wrong</h2>
          <p className="text-red-100 mb-4">{error}</p>
          <button
            onClick={() => {
              setHasError(false)
              setError(null)
              window.location.reload()
            }}
            className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return children
}
