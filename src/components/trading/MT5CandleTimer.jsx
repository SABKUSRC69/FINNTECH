import React, { useState, useEffect } from 'react'
import { Clock, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react'
import useCandleCountdown from '../../hooks/useCandleCountdown'
import soundEffects from '../../utils/soundEffects'

export default function MT5CandleTimer({
  defaultTimeframe = '1m',
  onTimeframeChange,
  className = '',
  compact = false,
}) {
  const [tf, setTf] = useState(defaultTimeframe)
  const [isSoundAlert, setIsSoundAlert] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!compact)
  const { formatted, progress, isUrgent, secondsRemaining } = useCandleCountdown(tf)

  const handleTfClick = (newTf) => {
    setTf(newTf)
    if (onTimeframeChange) onTimeframeChange(newTf)
  }

  // Audio alert on final seconds or candle close
  useEffect(() => {
    if (isSoundAlert && secondsRemaining === 1) {
      soundEffects.playCandleClose()
    }
  }, [secondsRemaining, isSoundAlert])

  const timeframes = ['1m', '5m', '15m', '30m', '1h']

  return (
    <div
      className={`select-none font-mono transition-all duration-300 backdrop-blur-md rounded-2xl border shadow-xl ${
        isUrgent
          ? 'bg-slate-950/95 border-rose-500/60 ring-1 ring-rose-500/40 shadow-rose-500/20'
          : 'bg-slate-950/90 border-[#1e2638] ring-1 ring-emerald-500/20 shadow-black/40'
      } ${className}`}
    >
      {/* Header bar / Mini Badge */}
      <div className="flex items-center justify-between px-2.5 py-1.5 gap-2">
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isUrgent ? 'bg-rose-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isUrgent ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="text-[10px] font-bold tracking-tight text-slate-300 flex items-center space-x-1">
            <span className="text-amber-400 font-extrabold">MT5</span>
            <span className="hidden xs:inline text-slate-400">Bar</span>
          </span>
        </div>

        {/* Digital Countdown Timer Display [ MM:SS ] */}
        <div className="flex items-center space-x-1.5">
          <div
            className={`font-black tracking-widest text-xs sm:text-sm px-2 py-0.5 rounded-lg border font-mono transition-colors ${
              isUrgent
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            [ {formatted} ]
          </div>

          {/* Sound alert toggle */}
          <button
            type="button"
            onClick={() => setIsSoundAlert(!isSoundAlert)}
            title={isSoundAlert ? 'ปิดเสียงเตือนปิดแท่ง' : 'เปิดเสียงเตือนปิดแท่ง (MT5 Beep)'}
            className={`p-1 rounded-lg transition-colors ${
              isSoundAlert
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {isSoundAlert ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>

          {/* Expand/Collapse toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls: Timeframe Pills & Progress Bar */}
      {isExpanded && (
        <div className="px-2.5 pb-2 pt-1 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Timeframe แท่งเทียน:</span>
            <span className="text-slate-500">
              {Math.round(progress)}% ผ่านไป
            </span>
          </div>

          {/* Timeframe Buttons */}
          <div className="grid grid-cols-5 gap-1">
            {timeframes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleTfClick(item)}
                className={`py-0.5 rounded text-[10px] font-extrabold transition-all ${
                  tf === item
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full transition-all duration-300 ${
                isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-teal-500 to-emerald-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
