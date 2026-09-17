import React, { useState } from 'react'
import { Clock } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'
import useCandleCountdown from '../../hooks/useCandleCountdown'

export default function OrderBook({ currentPrice, orderBook, recentTrades, pair }) {
  const [activeTab, setActiveTab] = useState('book') // 'book' | 'trades'
  const { formatted, isUrgent } = useCandleCountdown('1m')

  const maxTotal = Math.max(
    ...orderBook.asks.map((a) => a.total),
    ...orderBook.bids.map((b) => b.total),
    1
  )

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-lg text-xs font-mono">
      {/* Header Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 mb-3">
        <button
          onClick={() => setActiveTab('book')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
            activeTab === 'book'
              ? 'bg-slate-800 text-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
            activeTab === 'trades'
              ? 'bg-slate-800 text-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Market Trades
        </button>
      </div>

      {activeTab === 'book' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-3 text-[10px] text-slate-500 font-semibold mb-1 px-1">
            <span>ราคา (USD)</span>
            <span className="text-right">จำนวน</span>
            <span className="text-right">สะสม</span>
          </div>

          {/* Asks (Sells - Red) */}
          <div className="space-y-0.5 overflow-hidden">
            {orderBook.asks.slice(-6).map((ask, idx) => {
              const depthPercent = (ask.total / maxTotal) * 100
              return (
                <div
                  key={`ask-${idx}`}
                  className="grid grid-cols-3 py-0.5 px-1 relative text-[11px] items-center hover:bg-slate-800/40 rounded transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none rounded"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <span className="text-rose-400 font-semibold relative z-10">
                    {formatNumber(ask.price, pair.precision || 2)}
                  </span>
                  <span className="text-right text-slate-300 relative z-10">
                    {ask.size}
                  </span>
                  <span className="text-right text-slate-500 relative z-10">
                    {ask.total}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Middle Price with MT5 Candle Countdown directly underneath */}
          <div className="py-2.5 my-1 border-y border-slate-800/80 px-3 flex items-center justify-between bg-slate-950/70 rounded-xl">
            {/* Price on top, MT5 Countdown directly underneath */}
            <div className="flex flex-col">
              <div className="flex items-baseline space-x-2">
                <span className="text-base font-black font-mono tracking-tight text-white">
                  ${formatNumber(currentPrice, pair.precision || 2)}
                </span>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                  ≈ ฿{formatNumber(currentPrice * 35, 0)}
                </span>
              </div>

              {/* MT5 Countdown directly underneath the price */}
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
                  MT5:
                </span>
                <span
                  title="เวลานับถอยหลังปิดแท่งเทียน MT5 (Candle Countdown)"
                  className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1 transition-colors ${
                    isUrgent
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : 'bg-amber-400/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatted}</span>
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  (1m)
                </span>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-500 block">Spread</span>
              <span className="text-[11px] text-slate-300 font-semibold">0.01%</span>
            </div>
          </div>

          {/* Bids (Buys - Green) */}
          <div className="space-y-0.5 overflow-hidden">
            {orderBook.bids.slice(0, 6).map((bid, idx) => {
              const depthPercent = (bid.total / maxTotal) * 100
              return (
                <div
                  key={`bid-${idx}`}
                  className="grid grid-cols-3 py-0.5 px-1 relative text-[11px] items-center hover:bg-slate-800/40 rounded transition-colors"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none rounded"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <span className="text-emerald-400 font-semibold relative z-10">
                    {formatNumber(bid.price, pair.precision || 2)}
                  </span>
                  <span className="text-right text-slate-300 relative z-10">
                    {bid.size}
                  </span>
                  <span className="text-right text-slate-500 relative z-10">
                    {bid.total}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Recent Trades Stream */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-3 text-[10px] text-slate-500 font-semibold mb-2 px-1">
            <span>ราคา</span>
            <span className="text-right">ขนาด</span>
            <span className="text-right">เวลา</span>
          </div>

          <div className="space-y-1 overflow-y-auto pr-1">
            {recentTrades.map((trade, idx) => (
              <div
                key={trade.id || idx}
                className="grid grid-cols-3 py-1 px-1 text-[11px] items-center hover:bg-slate-800/30 rounded"
              >
                <span className={`font-semibold ${trade.isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${formatNumber(trade.price, pair.precision || 2)}
                </span>
                <span className="text-right text-slate-300 font-medium">
                  {trade.size}
                </span>
                <span className="text-right text-slate-500">
                  {trade.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
