import { useState, useEffect } from 'react'

export const TIMEFRAME_SECONDS = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
}

export function useCandleCountdown(timeframe = '1m') {
  const [secondsRemaining, setSecondsRemaining] = useState(60)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const total = TIMEFRAME_SECONDS[timeframe] || 60

    const update = () => {
      const now = Math.floor(Date.now() / 1000)
      const passed = now % total
      const remaining = total - passed
      const rem = remaining === 0 ? total : remaining
      setSecondsRemaining(rem)
      setProgress(((total - rem) / total) * 100)
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [timeframe])

  const total = TIMEFRAME_SECONDS[timeframe] || 60
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const hours = Math.floor(minutes / 60)
  const displayMin = minutes % 60

  const pad = (n) => String(n).padStart(2, '0')
  const formatted = hours > 0
    ? `${pad(hours)}:${pad(displayMin)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`

  return {
    secondsRemaining,
    formatted,
    progress,
    isUrgent: secondsRemaining <= 10,
    timeframe,
    totalSeconds: total,
  }
}

export default useCandleCountdown
