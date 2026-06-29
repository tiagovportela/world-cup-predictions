import { useState, useEffect } from 'react'

export default function Countdown({ deadline }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [isClosed, setIsClosed] = useState(false)

  useEffect(() => {
    function updateCountdown() {
      if (!deadline) return

      const now = Date.now()
      const deadlineMs = deadline.getTime ? deadline.getTime() : deadline
      const diff = deadlineMs - now

      if (diff <= 0) {
        setIsClosed(true)
        setIsActive(false)
        setTimeLeft('')
        return
      }

      setIsClosed(false)

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      setIsActive(hours < 1)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  if (!deadline || isClosed) return null

  return (
    <div className={`countdown ${isActive ? 'warning pulse-red' : ''}`}>
      <div className="text-xs font-600 text-gray-600 uppercase tracking-wider mb-3">Deadline</div>
      <div className={`text-4xl font-bold ${isActive ? 'text-orange-600' : 'text-black'}`}>
        {timeLeft}
      </div>
    </div>
  )
}
