import React, { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight, Zap, ShieldAlert, CheckCircle2, Target, ShieldCheck, HelpCircle } from 'lucide-react'
import { formatCurrency, formatNumber, getPipSize, calculatePips, calculateSpreadPips, formatPips } from '../../utils/formatters'
import { soundEffects } from '../../utils/soundEffects'

export default function OrderForm({
  pair,
  currentPrice,
  tradingBalance,
  onSubmitOrder,
  initialSide,
  onClose,
}) {
  const [side, setSide] = useState(initialSide || 'LONG') // 'LONG' | 'SHORT'
  const [orderType, setOrderType] = useState('MARKET') // 'MARKET' | 'LIMIT'
  const [limitPrice, setLimitPrice] = useState(currentPrice)
  const [marginAmount, setMarginAmount] = useState('') // In THB
  const [leverage, setLeverage] = useState(10)
  
  // Dynamic ECN Pip & Bid/Ask Calculations
  const pipSize = getPipSize(pair.symbol)
  const isForex = pair.category === 'forex'
  const spreadPips = isForex ? (pair.symbol.includes('JPY') ? 1.8 : 1.2) : pair.category === 'commodity' ? 2.5 : 1.5
  const halfSpread = (spreadPips * pipSize) / 2
  const bidPrice = currentPrice - halfSpread
  const askPrice = currentPrice + halfSpread

  // When buying, entry is at ASK; when selling, entry is at BID
  const marketExecutionPrice = side === 'LONG' ? askPrice : bidPrice
  const executionPrice = orderType === 'MARKET' ? marketExecutionPrice : (parseFloat(limitPrice) || currentPrice)

  // Update side if initialSide prop changes
  useEffect(() => {
    if (initialSide) setSide(initialSide)
  }, [initialSide])
  
  // TP / SL state
  const [enableTPSL, setEnableTPSL] = useState(false)
  const [tpPrice, setTpPrice] = useState('')
  const [slPrice, setSlPrice] = useState('')

  const leverages = [1, 2, 5, 10, 20, 50]

  // Update suggested TP / SL when price or side changes
  useEffect(() => {
    if (executionPrice > 0) {
      const precision = pair.precision || (isForex ? 4 : 2)
      const defaultTpPips = isForex ? 30 : 50
      const defaultSlPips = isForex ? 15 : 25
      const tpDelta = defaultTpPips * pipSize
      const slDelta = defaultSlPips * pipSize

      if (side === 'LONG') {
        setTpPrice((executionPrice + tpDelta).toFixed(precision))
        setSlPrice((executionPrice - slDelta).toFixed(precision))
      } else {
        setTpPrice((executionPrice - tpDelta).toFixed(precision))
        setSlPrice((executionPrice + slDelta).toFixed(precision))
      }
    }
  }, [executionPrice, side, pair.precision, isForex, pipSize])

  const handleSetPipTP = (pips) => {
    const precision = pair.precision || (isForex ? 4 : 2)
    const delta = pips * pipSize
    const target = side === 'LONG' ? executionPrice + delta : executionPrice - delta
    setTpPrice(target.toFixed(precision))
  }

  const handleSetPipSL = (pips) => {
    const precision = pair.precision || (isForex ? 4 : 2)
    const delta = pips * pipSize
    const target = side === 'LONG' ? executionPrice - delta : executionPrice + delta
    setSlPrice(target.toFixed(precision))
  }

  // Calculate live TP/SL distance in pips
  const tpDistancePips = tpPrice ? calculatePips(executionPrice, parseFloat(tpPrice), side, pair.symbol) : null
  const slDistancePips = slPrice ? calculatePips(executionPrice, parseFloat(slPrice), side, pair.symbol) : null

  const marginNum = parseFloat(marginAmount) || 0
  const positionValueTHB = marginNum * leverage
  const approxUSDPrice = executionPrice
  const approxUSDRate = 35.0 // 1 USD ≈ 35 THB
  const contractsQty = approxUSDPrice > 0 ? (positionValueTHB / (approxUSDRate * approxUSDPrice)) : 0

  // Estimated liquidation price
  const liqDistance = (1 / leverage) * 0.85
  const estimatedLiqPrice = side === 'LONG'
    ? executionPrice * (1 - liqDistance)
    : executionPrice * (1 + liqDistance)

  const handleQuickPercent = (pct) => {
    const amount = Math.floor(tradingBalance * (pct / 100))
    setMarginAmount(amount.toString())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (marginNum <= 0) {
      alert('กรุณาระบุจำนวนเงินหลักประกัน (Margin)')
      return
    }
    if (marginNum > tradingBalance) {
      alert('ยอดเงินคงเหลือไม่เพียงพอ กรุณาปรับลดจำนวนเงิน หรือกดเติมเงินจำลอง')
      return
    }

    const finalTp = enableTPSL && tpPrice ? parseFloat(tpPrice) : null
    const finalSl = enableTPSL && slPrice ? parseFloat(slPrice) : null

    const order = {
      id: (orderType === 'LIMIT' ? 'limit-' : 'pos-') + Date.now(),
      symbol: pair.symbol,
      orderType,
      targetPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : null,
      side,
      entryPrice: executionPrice,
      markPrice: currentPrice,
      amount: marginNum,
      leverage,
      size: parseFloat(contractsQty.toFixed(4)),
      liquidationPrice: parseFloat(estimatedLiqPrice.toFixed(pair.precision || 2)),
      tpPrice: finalTp,
      slPrice: finalSl,
      openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }

    soundEffects.playOrderFilled()
    onSubmitOrder(order)
    setMarginAmount('')
    if (onClose) onClose()
  }

  return (
    <div className="flex flex-col h-full bg-[#121721] border border-[#1e2638] rounded-3xl p-4 sm:p-5 shadow-xl">
      
      {/* Mobile Close Bar if onClose is provided */}
      {onClose && (
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1e2638] md:hidden">
          <span className="font-extrabold text-sm text-white flex items-center space-x-1.5">
            <span>ส่งคำสั่ง {pair.symbol}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* ECN Spread & Pip Value Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 rounded-2xl mb-2.5 border border-[#1e2638] text-[11px] font-mono shadow-inner">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <span className="text-slate-400">Spread:</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-500/20 text-amber-400 font-extrabold">
            {spreadPips} pips
          </span>
          <span className="text-[10px] text-slate-500">
            (${formatNumber(spreadPips * pipSize, pair.precision || (isForex ? 4 : 2))})
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
          <span>1 Pip =</span>
          <strong className="text-slate-200 font-mono">{pipSize}</strong>
        </div>
      </div>

      {/* Side Tabs: Long vs Short with Live BID / ASK */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/90 rounded-2xl mb-3 border border-[#1e2638]">
        {/* SELL / SHORT Button (Bids at bidPrice) */}
        <button
          type="button"
          onClick={() => setSide('SHORT')}
          className={`py-2 px-3 rounded-xl font-extrabold transition-all flex flex-col items-center justify-center ${
            side === 'SHORT'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-transparent hover:border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-1 text-xs">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>SELL / Short</span>
          </div>
          <div className="text-[11px] font-mono font-bold mt-0.5">
            BID: ${formatNumber(bidPrice, pair.precision || (isForex ? 4 : 2))}
          </div>
        </button>

        {/* BUY / LONG Button (Asks at askPrice) */}
        <button
          type="button"
          onClick={() => setSide('LONG')}
          className={`py-2 px-3 rounded-xl font-extrabold transition-all flex flex-col items-center justify-center ${
            side === 'LONG'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-transparent hover:border-slate-700'
          }`}
        >
          <div className="flex items-center space-x-1 text-xs">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>BUY / Long</span>
          </div>
          <div className="text-[11px] font-mono font-bold mt-0.5">
            ASK: ${formatNumber(askPrice, pair.precision || (isForex ? 4 : 2))}
          </div>
        </button>
      </div>

      {/* Order Types */}
      <div className="flex items-center space-x-3 mb-3 text-xs">
        <button
          type="button"
          onClick={() => setOrderType('MARKET')}
          className={`font-bold transition-colors pb-1 border-b-2 ${
            orderType === 'MARKET'
              ? 'text-white border-emerald-500'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Market (ราคาตลาด)
        </button>
        <button
          type="button"
          onClick={() => {
            setOrderType('LIMIT')
            setLimitPrice(currentPrice)
          }}
          className={`font-bold transition-colors pb-1 border-b-2 ${
            orderType === 'LIMIT'
              ? 'text-white border-emerald-500'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}
        >
          Limit (ระบุราคา)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          
          {/* Limit Price Input if LIMIT */}
          {orderType === 'LIMIT' && (
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                ราคาที่ต้องการส่งคำสั่ง (USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                  USD
                </span>
              </div>
            </div>
          )}

          {/* Leverage Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400">อัตราทด (Leverage)</label>
              <span className="text-emerald-400 font-mono font-bold">{leverage}x</span>
            </div>
            <div className="grid grid-cols-6 gap-1 bg-slate-950/70 p-1 rounded-xl border border-[#1e2638]">
              {leverages.map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setLeverage(lev)}
                  className={`py-1 rounded-lg text-center font-mono text-[11px] font-bold transition-all ${
                    leverage === lev
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          {/* Margin Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400">หลักประกัน (Margin THB)</label>
              <span className="text-[10px] text-slate-400">
                คงเหลือ: <strong className="text-white">{formatCurrency(tradingBalance, false)}</strong>
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ฿
              </span>
              <input
                type="number"
                step="any"
                placeholder="ระบุจำนวนเงินที่ต้องการเทรด"
                value={marginAmount}
                onChange={(e) => setMarginAmount(e.target.value)}
                className="w-full pl-8 pr-12 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                THB
              </span>
            </div>

            {/* Quick % buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className="py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono font-semibold text-slate-300 transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* TP / SL Advanced Risk Settings with Pips */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTPSL}
                  onChange={(e) => setEnableTPSL(e.target.checked)}
                  className="rounded accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-300">
                  ตั้งจุดทำกำไร / ตัดขาดทุน (TP / SL ใน Pip)
                </span>
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">Auto ECN</span>
            </div>

            {enableTPSL && (
              <div className="space-y-2 pt-1">
                {/* Take Profit Input & Quick Pips */}
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <span>Take Profit</span>
                      {tpDistancePips !== null && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          +{tpDistancePips.toFixed(1)} pips
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-1">
                      {[20, 50, 100].map((p) => (
                        <button
                          key={`tp-${p}`}
                          type="button"
                          onClick={() => handleSetPipTP(p)}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold"
                        >
                          +{p}p
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder="ราคา TP"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800/80 border border-emerald-500/30 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Stop Loss Input & Quick Pips */}
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-rose-400 font-bold flex items-center space-x-1">
                      <span>Stop Loss</span>
                      {slDistancePips !== null && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                          {slDistancePips.toFixed(1)} pips
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-1">
                      {[15, 30, 50].map((p) => (
                        <button
                          key={`sl-${p}`}
                          type="button"
                          onClick={() => handleSetPipSL(p)}
                          className="px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[9px] font-mono font-bold"
                        >
                          -{p}p
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder="ราคา SL"
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800/80 border border-rose-500/30 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trade Metrics Breakdown */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-400">
              <span>มูลค่าสถานะ (Position):</span>
              <span className="text-slate-200 font-semibold">{formatCurrency(positionValueTHB, false)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ขนาดสัญญา (Qty):</span>
              <span className="text-slate-200 font-semibold">{contractsQty.toFixed(4)} {pair.symbol.split('/')[0]}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ราคาจับคู่ (Fill Price):</span>
              <span className="text-amber-400 font-bold">
                ${formatNumber(executionPrice, pair.precision || (isForex ? 4 : 2))} ({side === 'LONG' ? 'ASK' : 'BID'})
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ราคาบังคับตัดขาดทุน (Est. Liq):</span>
              <span className="text-rose-400 font-semibold">${formatNumber(estimatedLiqPrice, 2)}</span>
            </div>
          </div>

        </div>

        {/* Submit Execution Button */}
        <div className="pt-2">
          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-95 ${
              side === 'LONG'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>
              {side === 'LONG'
                ? `BUY (Ask @ $${formatNumber(askPrice, pair.precision || (isForex ? 4 : 2))}) • ${pair.symbol}`
                : `SELL (Bid @ $${formatNumber(bidPrice, pair.precision || (isForex ? 4 : 2))}) • ${pair.symbol}`}
            </span>
          </button>
        </div>
      </form>

    </div>
  )
}
