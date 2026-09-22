import React, { useState, useEffect } from 'react'
import { ArrowDownLeft, ArrowUpRight, Zap, CheckCircle2, QrCode, PlusCircle, AlertCircle } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { soundEffects } from '../../utils/soundEffects'

export default function OrderForm({
  pair,
  currentPrice,
  spotBalances = {},
  onSubmitOrder,
  initialSide = 'BUY',
  onOpenDeposit,
}) {
  const [side, setSide] = useState(initialSide) // 'BUY' | 'SELL'
  const [orderType, setOrderType] = useState('MARKET') // 'MARKET' | 'LIMIT'
  const [limitPrice, setLimitPrice] = useState(currentPrice)
  const [cryptoAmount, setCryptoAmount] = useState('')
  const [totalTHB, setTotalTHB] = useState('')

  const baseAsset = pair.baseAsset || pair.symbol.split('/')[0] || 'BTC'
  const quoteAsset = pair.quoteAsset || pair.symbol.split('/')[1] || 'THB'
  const precision = pair.precision || 2
  const executionPrice = orderType === 'MARKET' ? currentPrice : (parseFloat(limitPrice) || currentPrice)

  const availableTHB = spotBalances.THB || 0
  const availableCrypto = spotBalances[baseAsset] || 0

  // Update limitPrice when currentPrice changes if user hasn't typed a custom limit
  useEffect(() => {
    if (orderType === 'MARKET' || !limitPrice) {
      setLimitPrice(currentPrice)
    }
  }, [currentPrice, orderType])

  // Sync initialSide
  useEffect(() => {
    if (initialSide) setSide(initialSide)
  }, [initialSide])

  // Recalculate total when cryptoAmount changes
  const handleAmountChange = (val) => {
    setCryptoAmount(val)
    const num = parseFloat(val)
    if (num > 0 && executionPrice > 0) {
      setTotalTHB((num * executionPrice).toFixed(2))
    } else {
      setTotalTHB('')
    }
  }

  // Recalculate cryptoAmount when totalTHB changes
  const handleTotalChange = (val) => {
    setTotalTHB(val)
    const num = parseFloat(val)
    if (num > 0 && executionPrice > 0) {
      setCryptoAmount((num / executionPrice).toFixed(6))
    } else {
      setCryptoAmount('')
    }
  }

  // Quick percentage buttons
  const handleQuickPercent = (pct) => {
    if (side === 'BUY') {
      const maxSpend = availableTHB * (pct / 100)
      setTotalTHB(maxSpend.toFixed(2))
      if (executionPrice > 0) {
        setCryptoAmount((maxSpend / executionPrice).toFixed(6))
      }
    } else {
      const maxCrypto = availableCrypto * (pct / 100)
      setCryptoAmount(maxCrypto.toFixed(6))
      if (executionPrice > 0) {
        setTotalTHB((maxCrypto * executionPrice).toFixed(2))
      }
    }
  }

  // Fee calculation (0.25% standard spot exchange fee)
  const feeRate = 0.0025
  const rawTotal = parseFloat(totalTHB) || 0
  const estimatedFee = rawTotal * feeRate
  const netTHBReceived = side === 'SELL' ? Math.max(0, rawTotal - estimatedFee) : rawTotal
  const netCryptoReceived = side === 'BUY' ? (parseFloat(cryptoAmount) || 0) : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    const numCrypto = parseFloat(cryptoAmount) || 0
    const numTotal = parseFloat(totalTHB) || 0

    if (numCrypto <= 0 || numTotal <= 0) {
      alert(`กรุณาระบุจำนวน ${baseAsset} หรือยอดเงินบาทที่ต้องการเทรด`)
      return
    }

    if (side === 'BUY') {
      if (numTotal > availableTHB) {
        alert(`ยอดเงินบาทคงเหลือไม่เพียงพอ (ต้องการ ฿${formatNumber(numTotal, 2)} แต่มี ฿${formatNumber(availableTHB, 2)}) กรุณากดปุ่มฝากเงินผ่าน PromptPay`)
        return
      }
    } else {
      if (numCrypto > availableCrypto) {
        alert(`ยอดเหรียญ ${baseAsset} ในกระเป๋าไม่เพียงพอสำหรับการขาย (มี ${formatNumber(availableCrypto, 4)} ${baseAsset})`)
        return
      }
    }

    const orderPayload = {
      id: (orderType === 'LIMIT' ? 'limit-' : 'trade-') + Date.now(),
      symbol: pair.symbol,
      side,
      orderType,
      price: executionPrice,
      amount: numCrypto,
      total: numTotal,
      fee: estimatedFee,
      baseAsset,
      quoteAsset,
    }

    soundEffects.playTrade()
    onSubmitOrder(orderPayload)

    // Clear form inputs
    setCryptoAmount('')
    setTotalTHB('')
  }

  return (
    <div className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col font-sans transition-colors">
      
      {/* 2-Tab Spot Switcher: ซื้อ (Buy) vs ขาย (Sell) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#141a24] border border-slate-200/60 dark:border-slate-800/80 mb-4">
        <button
          type="button"
          onClick={() => {
            setSide('BUY')
            setCryptoAmount('')
            setTotalTHB('')
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            side === 'BUY'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>ซื้อ (Buy)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSide('SELL')
            setCryptoAmount('')
            setTotalTHB('')
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            side === 'SELL'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>ขาย (Sell)</span>
        </button>
      </div>

      {/* Available Balance Header */}
      <div className="flex items-center justify-between px-1 mb-3 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
          <span>{side === 'BUY' ? 'เงินบาทที่ใช้ได้:' : `เหรียญ ${baseAsset} ที่มี:`}</span>
        </div>
        <div className="flex items-center space-x-2 font-mono">
          <span className="font-bold text-slate-900 dark:text-white">
            {side === 'BUY'
              ? `฿${formatNumber(availableTHB, 2)}`
              : `${formatNumber(availableCrypto, 4)} ${baseAsset}`}
          </span>
          {side === 'BUY' && onOpenDeposit && (
            <button
              type="button"
              onClick={onOpenDeposit}
              className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold flex items-center space-x-0.5 cursor-pointer"
              title="ฝากเงินบาททันใจผ่าน PromptPay"
            >
              <PlusCircle className="w-3 h-3" />
              <span>ฝาก</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {/* Order Type Selector: Limit vs Market */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            onClick={() => setOrderType('LIMIT')}
            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              orderType === 'LIMIT'
                ? 'bg-slate-200 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            ลิมิต (Limit)
          </button>
          <button
            type="button"
            onClick={() => setOrderType('MARKET')}
            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              orderType === 'MARKET'
                ? 'bg-slate-200 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            ราคาตลาด (Market)
          </button>
        </div>

        {/* Price Input */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            ราคาเสนอซื้อ/ขาย ({quoteAsset})
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              disabled={orderType === 'MARKET'}
              value={orderType === 'MARKET' ? currentPrice : limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="0.00"
              className={`w-full bg-slate-50 dark:bg-[#111622] border rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none transition-all ${
                orderType === 'MARKET'
                  ? 'border-slate-200 dark:border-slate-800/80 text-slate-400 cursor-not-allowed'
                  : 'border-slate-300 dark:border-slate-700/80 focus:border-emerald-500'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
              {quoteAsset}
            </span>
          </div>
        </div>

        {/* Crypto Amount Input */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            จำนวน ({baseAsset})
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={cryptoAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={`0.0000`}
              className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-300 dark:border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
              {baseAsset}
            </span>
          </div>
        </div>

        {/* Quick Percent Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handleQuickPercent(pct)}
              className="py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#161c28] hover:bg-slate-200 dark:hover:bg-[#1e2638] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/80 transition-all cursor-pointer active:scale-95"
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Total Value Input */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            มูลค่ารวม ({quoteAsset})
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={totalTHB}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-300 dark:border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
              ฿ {quoteAsset}
            </span>
          </div>
        </div>

        {/* Summary Info */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e131d] border border-slate-200/70 dark:border-slate-800/80 space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>ค่าธรรมเนียม (0.25%):</span>
            <span className="text-slate-700 dark:text-slate-300">
              ≈ ฿{formatNumber(estimatedFee, 2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
            <span>{side === 'BUY' ? `เหรียญที่จะได้รับ:` : `เงินบาทสุทธิ:`}</span>
            <span className={side === 'BUY' ? 'text-emerald-500 dark:text-emerald-400' : 'text-emerald-500 dark:text-emerald-400'}>
              {side === 'BUY'
                ? `${formatNumber(netCryptoReceived, 6)} ${baseAsset}`
                : `฿${formatNumber(netTHBReceived, 2)} THB`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98] ${
            side === 'BUY'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/20'
          }`}
        >
          <span>{side === 'BUY' ? `ซื้อ ${baseAsset}` : `ขาย ${baseAsset}`}</span>
          <span className="text-[10px] opacity-80">({orderType === 'MARKET' ? 'มาร์เก็ต' : 'ลิมิต'})</span>
        </button>

      </form>
    </div>
  )
}
