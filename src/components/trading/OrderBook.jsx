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
    <div className="flex flex-col h-full bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm text-xs font-mono transition-colors">
      {/* Header Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 mb-2.5">
        <button
          onClick={() => setActiveTab('book')}
          className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'book'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'trades'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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

          {/* Middle Price with MT5 Countdown */}
          <div className="py-2 my-1 px-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
            <div className="flex flex-col">
              <div className="flex items-baseline space-x-2">
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  ${formatNumber(currentPrice, pair.precision || 2)}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  ≈ ฿{formatNumber(currentPrice * 35, 0)}
                </span>
              </div>

              {/* MT5 Countdown */}
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  MT5:
                </span>
                <span
                  title="เวลานับถอยหลังปิดแท่งเทียน MT5"
                  className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center space-x-1 transition-colors ${
                    isUrgent
                      ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatted}</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  (1m)
                </span>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[9px] text-slate-400 block">Spread</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">0.01%</span>
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
