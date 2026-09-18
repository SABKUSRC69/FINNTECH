import React, { useState, useEffect, useRef } from 'react'
import TradingChart from './TradingChart'
import TradingViewWidget from './TradingViewWidget'
import OrderBook from './OrderBook'
import OrderForm from './OrderForm'
import PositionsTable from './PositionsTable'
import PriceAlertModal from './PriceAlertModal'
import TradingViewSignalModal from './TradingViewSignalModal'
import ToastContainer from '../common/ToastContainer'
import {
  TRADING_PAIRS,
  generateCandleData,
  generateOrderBook,
} from '../../data/tradingData'
import { liveMarketService, SYMBOL_MAPPINGS } from '../../services/liveMarketService'
import tradingViewWebhookService from '../../services/tradingViewWebhookService'
import { soundEffects } from '../../utils/soundEffects'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  PlusCircle,
  Activity,
  Globe,
  Radio,
  Volume2,
  VolumeX,
  Target,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles
} from 'lucide-react'

export default function TradingTerminal({
  tradingBalance,
  positions,
  tradeHistory,
  onAddPosition,
  onClosePosition,
  onCloseAllPositions,
  onTopUpBalance,
  onNavigateToNews,
  initialSymbol = 'BTC/USDT',
}) {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol)

  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol)
    }
  }, [initialSymbol])
  const [chartEngine, setChartEngine] = useState('canvas') // Default to 'canvas' (FINNTECH Fast Chart) so user never gets a black screen
  const [watchlistCategory, setWatchlistCategory] = useState('all') // 'all' | 'crypto' | 'commodity' | 'stock' | 'forex'
  const [soundEnabled, setSoundEnabled] = useState(() => soundEffects.isEnabled())
  const [toasts, setToasts] = useState([])

  // Limit Orders & Price Alerts State
  const [limitOrders, setLimitOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('finntech_limit_orders')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  const [priceAlerts, setPriceAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('finntech_price_alerts')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [isSignalModalOpen, setIsSignalModalOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileOrderSide, setMobileOrderSide] = useState('LONG')

  // Synchronize Limit Orders & Price Alerts to LocalStorage
  useEffect(() => {
    localStorage.setItem('finntech_limit_orders', JSON.stringify(limitOrders))
  }, [limitOrders])

  useEffect(() => {
    localStorage.setItem('finntech_price_alerts', JSON.stringify(priceAlerts))
  }, [priceAlerts])

  // Funding countdown state
  const [fundingTimer, setFundingTimer] = useState('03:48:22')

  // Toast Helper
  const addToast = (title, message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5)
    setToasts((prev) => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const [pairPrices, setPairPrices] = useState(() => {
    const initial = {}
    TRADING_PAIRS.forEach((p) => {
      initial[p.symbol] = p.price
    })
    return initial
  })

  const [tickDirections, setTickDirections] = useState({})
  const [marketStatus, setMarketStatus] = useState({ isConnected: true, latency: 24 })
  const [candles, setCandles] = useState(() => generateCandleData(76320, 30))
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(76320))
  const [recentTrades, setRecentTrades] = useState([
    { id: 1, price: 76325.5, size: 0.15, time: '20:58:12', isBuy: true },
    { id: 2, price: 76320.1, size: 0.42, time: '20:58:10', isBuy: false },
    { id: 3, price: 76328.0, size: 0.09, time: '20:58:06', isBuy: true },
    { id: 4, price: 76319.4, size: 0.81, time: '20:58:01', isBuy: false },
  ])

  const selectedPair = TRADING_PAIRS.find((p) => p.symbol === selectedSymbol) || TRADING_PAIRS[0]
  const currentPrice = pairPrices[selectedSymbol] || selectedPair.price

  // Funding countdown tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const hours = 7 - (now.getHours() % 8)
      const minutes = 59 - now.getMinutes()
      const seconds = 59 - now.getSeconds()
      const pad = (n) => n.toString().padStart(2, '0')
      setFundingTimer(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto TP / SL / Liquidation Engine
  // Checks open positions on each live price update
  const positionsRef = useRef(positions)
  positionsRef.current = positions

  const pairPricesRef = useRef(pairPrices)
  pairPricesRef.current = pairPrices

  const tradingBalanceRef = useRef(tradingBalance)
  tradingBalanceRef.current = tradingBalance

  const checkTPSLLiquidation = (latestPrices) => {
    const currentPositions = positionsRef.current
    if (!currentPositions || currentPositions.length === 0) return

    currentPositions.forEach((pos) => {
      const liveP = latestPrices[pos.symbol]
      if (!liveP) return

      const isLong = pos.side === 'LONG'
      const priceDiffRatio = isLong
        ? (liveP - pos.entryPrice) / pos.entryPrice
        : (pos.entryPrice - liveP) / pos.entryPrice
      const pnl = Math.round(priceDiffRatio * pos.leverage * pos.amount)

      // 1. Check Take Profit
      if (pos.tpPrice) {
        const hitTP = isLong ? liveP >= pos.tpPrice : liveP <= pos.tpPrice
        if (hitTP) {
          soundEffects.playTPHit()
          addToast(
            '🎯 Take Profit สำเร็จ!',
            `ปิดสัญญา ${pos.side} ${pos.symbol} อัตโนมัติที่ราคา $${formatNumber(liveP, 2)} (+${formatCurrency(pnl, false)})`,
            'profit'
          )
          onClosePosition(pos.id, pnl)
          return
        }
      }

      // 2. Check Stop Loss
      if (pos.slPrice) {
        const hitSL = isLong ? liveP <= pos.slPrice : liveP >= pos.slPrice
        if (hitSL) {
          soundEffects.playLossClose()
          addToast(
            '🛡️ Stop Loss ทำงาน',
            `ตัดขาดทุน ${pos.side} ${pos.symbol} อัตโนมัติที่ราคา $${formatNumber(liveP, 2)} (${formatCurrency(pnl, false)})`,
            'loss'
          )
          onClosePosition(pos.id, pnl)
          return
        }
      }

      // 3. Check Liquidation Price
      if (pos.liquidationPrice) {
        const isLiquidated = isLong ? liveP <= pos.liquidationPrice : liveP >= pos.liquidationPrice
        if (isLiquidated) {
          soundEffects.playLossClose()
          addToast(
            '⚠️ ถูกบังคับปิดสัญญา (Liquidated)',
            `ราคา ${pos.symbol} แตะจุดตัดขาดทุนวิกฤต $${formatNumber(pos.liquidationPrice, 2)}`,
            'error'
          )
          onClosePosition(pos.id, -pos.amount)
          return
        }
      }
    })
  }

  // Ref tracking for Limit Orders & Price Alerts
  const limitOrdersRef = useRef(limitOrders)
  limitOrdersRef.current = limitOrders

  const priceAlertsRef = useRef(priceAlerts)
  priceAlertsRef.current = priceAlerts

  // Match Limit Orders against incoming price ticks
  const checkLimitOrders = (latestPrices) => {
    const currentLimits = limitOrdersRef.current
    if (!currentLimits || currentLimits.length === 0) return

    const remaining = []
    currentLimits.forEach((ord) => {
      const liveP = latestPrices[ord.symbol]
      if (!liveP) {
        remaining.push(ord)
        return
      }

      const isLong = ord.side === 'LONG'
      // Long limit matches when market drops <= target price
      // Short limit matches when market rises >= target price
      const isFilled = isLong ? liveP <= ord.targetPrice : liveP >= ord.targetPrice

      if (isFilled) {
        // Limit order filled! Convert to active position
        const newPos = {
          ...ord,
          id: 'pos-' + Date.now(),
          entryPrice: ord.targetPrice,
          markPrice: liveP,
          openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }
        delete newPos.targetPrice
        delete newPos.orderType

        onAddPosition(newPos)
        soundEffects.playOrderFilled()
        addToast(
          `🚀 คำสั่ง Limit ${ord.side} จับคู่สำเร็จ!`,
          `${ord.symbol} ที่ราคา $${formatNumber(ord.targetPrice, 2)} • Margin ${formatCurrency(ord.amount, false)}`,
          'success'
        )
      } else {
        remaining.push(ord)
      }
    })

    if (remaining.length !== currentLimits.length) {
      setLimitOrders(remaining)
    }
  }

  // Check Price Alerts
  const checkPriceAlerts = (latestPrices) => {
    const currentAlerts = priceAlertsRef.current
    if (!currentAlerts || currentAlerts.length === 0) return

    const remaining = []
    currentAlerts.forEach((alt) => {
      const liveP = latestPrices[alt.symbol]
      if (!liveP) {
        remaining.push(alt)
        return
      }

      const isHit = alt.condition === 'GTE' ? liveP >= alt.targetPrice : liveP <= alt.targetPrice
      if (isHit) {
        soundEffects.playAlertChime()
        addToast(
          `🔔 แจ้งเตือนราคาเป้าหมาย!`,
          `${alt.symbol} ${alt.condition === 'GTE' ? 'พุ่งขึ้นถึง' : 'ร่วงลงถึง'} $${formatNumber(liveP, 2)} (${alt.note})`,
          'info'
        )
      } else {
        remaining.push(alt)
      }
    })

    if (remaining.length !== currentAlerts.length) {
      setPriceAlerts(remaining)
    }
  }

  // Initialize and subscribe to Live Market Service
  useEffect(() => {
    liveMarketService.init()

    // Register TradingView Webhook Signal Execution Listener (เหมือน MT5 Terminal)
    tradingViewWebhookService.onSignalReceived((signal) => {
      const curP = pairPricesRef.current[signal.symbol] || signal.price || 76320
      const margin = signal.amount || 25000
      const lev = signal.leverage || 10
      const currentBal = tradingBalanceRef.current

      if (margin > currentBal) {
        addToast(
          '⚠️ ยอดเงินจำลองไม่เพียงพอ',
          `สัญญาณ ${signal.side} ${signal.symbol} ต้องการ Margin ฿${margin.toLocaleString()} แต่มียอดคงเหลือ ฿${currentBal.toLocaleString()}`,
          'error'
        )
        return
      }

      setTradingBalance((prev) => Math.max(0, prev - margin))

      const ticketId = 'FT-TV-' + Math.floor(10000 + Math.random() * 90000)
      const newPos = {
        id: 'pos-tv-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        ticketId,
        symbol: signal.symbol,
        side: signal.side,
        entryPrice: curP,
        amount: margin,
        leverage: lev,
        tpPrice: signal.tpPrice || null,
        slPrice: signal.slPrice || null,
        openedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source: 'TradingView Webhook'
      }

      setPositions((prev) => [newPos, ...prev])
      soundEffects.playOrderFilled()
      addToast(
        '⚡ [TradingView Alert] เปิดสัญญาสำเร็จ!',
        `${signal.symbol} ${signal.side} (${lev}x) @ $${formatNumber(curP, 2)} • Margin ฿${margin.toLocaleString()} (${signal.comment})`,
        'success'
      )
    })

    const unsubscribePrices = liveMarketService.subscribe((newPrices, updateInfo) => {
      setPairPrices((prev) => {
        const next = { ...prev, ...newPrices }
        checkTPSLLiquidation(next)
        checkLimitOrders(next)
        checkPriceAlerts(next)
        return next
      })

      if (updateInfo && updateInfo.symbol) {
        setTickDirections((prev) => ({
          ...prev,
          [updateInfo.symbol]: updateInfo.direction,
        }))

        // Sync orderbook, live candle ticks & matched trade stream for active pair
        if (updateInfo.symbol === selectedSymbol) {
          const liveP = newPrices[selectedSymbol]
          if (liveP) {
            setOrderBook(generateOrderBook(liveP))

            // Realtime Forming Candle Tick Engine (แท่งเทียนขยับสดตามตลาดจริง)
            setCandles((prevCandles) => {
              if (!prevCandles || prevCandles.length === 0) return prevCandles
              const lastIdx = prevCandles.length - 1
              const last = { ...prevCandles[lastIdx] }
              last.close = liveP
              last.high = Math.max(last.high, liveP)
              last.low = Math.min(last.low, liveP)
              return [...prevCandles.slice(0, lastIdx), last]
            })

            const isBuy = updateInfo.direction === 'up'
            const now = new Date()
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            setRecentTrades((prevTrades) => [
              {
                id: Date.now(),
                price: liveP,
                size: parseFloat((Math.random() * 0.4 + 0.05).toFixed(3)),
                time: timeStr,
                isBuy,
              },
              ...prevTrades.slice(0, 15),
            ])
          }
        }
      }
    })

    const unsubscribeStatus = liveMarketService.subscribeStatus((status) => {
      setMarketStatus(status)
    })

    return () => {
      unsubscribePrices()
      unsubscribeStatus()
    }
  }, [selectedSymbol])

  // When switching pairs, regenerate initial candle set & orderbook
  useEffect(() => {
    const p = pairPrices[selectedSymbol] || selectedPair.price
    setCandles(generateCandleData(p, 30))
    setOrderBook(generateOrderBook(p))
  }, [selectedSymbol])

  // Sound toggle handler
  const handleSoundToggle = () => {
    const newState = soundEffects.toggleSound()
    setSoundEnabled(newState)
    addToast(
      newState ? '🔊 เปิดเสียงเอฟเฟกต์' : '🔇 ปิดเสียงเอฟเฟกต์',
      newState ? 'เปิดระบบเสียงการเทรดและแจ้งเตือน' : 'ปิดเสียงเตือนทั้งหมด',
      'info'
    )
  }

  // Filter pairs by category
  const filteredPairs = TRADING_PAIRS.filter((p) => {
    if (watchlistCategory === 'all') return true
    if (watchlistCategory === 'forex') return p.category === 'forex'
    if (watchlistCategory === 'commodity') return p.category === 'commodity'
    if (watchlistCategory === 'crypto') return p.category === 'crypto'
    if (watchlistCategory === 'stocks') return p.category === 'stock'
    return true
  })

  const tvSymbol = SYMBOL_MAPPINGS[selectedSymbol]?.tradingView || 'BINANCE:BTCUSDT'

  // Wrapped Order Submission (Handles both Market and Limit with Broker Execution Feedback)
  const handleOrderSubmit = (newOrder) => {
    const ticketId = 'FT-' + Math.floor(10000 + Math.random() * 90000)
    const latency = Math.floor(12 + Math.random() * 8)

    if (newOrder.orderType === 'LIMIT') {
      setLimitOrders((prev) => [{ ...newOrder, ticketId }, ...prev])
      soundEffects.playOrderFilled()
      addToast(
        `⏳ ตั้งคำสั่ง Limit ${newOrder.side} สำเร็จ [Ticket #${ticketId}]`,
        `${newOrder.symbol} (${newOrder.leverage}x) รอที่ราคา $${formatNumber(newOrder.targetPrice, 2)} • ส่งคำสั่งใน ${latency}ms`,
        'info'
      )
    } else {
      onAddPosition({ ...newOrder, ticketId })
      addToast(
        `🚀 [ECN Broker] จับคู่สัญญา ${newOrder.side} สำเร็จ [Ticket #${ticketId}]`,
        `${newOrder.symbol} (${newOrder.leverage}x) ที่ราคา $${formatNumber(newOrder.entryPrice, 2)} • Margin ฿${formatNumber(newOrder.amount)} • จับคู่ใน ${latency}ms (ค่าคอม ฿0)`,
        'success'
      )
    }
  }

  const handleCancelLimitOrder = (orderId) => {
    setLimitOrders((prev) => prev.filter((o) => o.id !== orderId))
    addToast('🗑️ ยกเลิกคำสั่งสำเร็จ', 'ยกเลิกคำสั่ง Limit Order เรียบร้อยแล้ว', 'info')
  }

  const handleAddPriceAlert = (newAlert) => {
    setPriceAlerts((prev) => [newAlert, ...prev])
    addToast('🔔 ตั้งเตือนราคาสำเร็จ', `${newAlert.symbol} ${newAlert.condition === 'GTE' ? '≥' : '≤'} $${formatNumber(newAlert.targetPrice, 2)}`, 'success')
  }

  const handleDeletePriceAlert = (alertId) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  // Wrapped Top Up with Toast
  const handleTopUpWrapper = () => {
    onTopUpBalance()
    soundEffects.playProfitClose()
    addToast('💵 เติมเงินจำลองสำเร็จ', '+฿100,000 เข้าสู่บัญชี Paper Trading เรียบร้อยแล้ว', 'info')
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 relative pb-16 md:pb-0">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Ticker & Market Intelligence Bar */}
      <div className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3 transition-colors">
        
        {/* Watchlist Filter Tabs & Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/70">
          {/* Minimal Segmented Category Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'forex', label: 'Forex' },
              { id: 'commodity', label: 'ทองคำ' },
              { id: 'crypto', label: 'คริปโต' },
              { id: 'stocks', label: 'หุ้นสหรัฐฯ' },
            ].map((cat) => {
              const count = TRADING_PAIRS.filter((p) => {
                if (cat.id === 'all') return true
                if (cat.id === 'forex') return p.category === 'forex'
                if (cat.id === 'commodity') return p.category === 'commodity'
                if (cat.id === 'crypto') return p.category === 'crypto'
                if (cat.id === 'stocks') return p.category === 'stock'
                return true
              }).length

              return (
                <button
                  key={cat.id}
                  onClick={() => setWatchlistCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    watchlistCategory === cat.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Clean Action Toolbar */}
          <div className="flex items-center space-x-1.5 text-xs">
            {/* Market Mood Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[11px]">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-slate-500 dark:text-slate-400">อารมณ์ตลาด:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-medium">Greed (74)</strong>
            </div>

            {/* Funding Timer */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[11px] font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-slate-400">Funding:</span>
              <strong className="text-slate-700 dark:text-slate-200 font-bold">{fundingTimer}</strong>
            </div>

            {/* TradingView Webhook Bot Button */}
            <button
              onClick={() => setIsSignalModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium transition-all text-xs cursor-pointer"
              title="ตั้งค่า TradingView Bot"
            >
              <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              <span>TV Bot</span>
            </button>

            {/* Price Alert Button */}
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-300 font-medium transition-all text-xs cursor-pointer"
              title="ตั้งเตือนราคา"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>แจ้งเตือน{priceAlerts.length > 0 ? ` (${priceAlerts.length})` : ''}</span>
            </button>

            {/* Forex News Quick Button */}
            {onNavigateToNews && (
              <button
                onClick={onNavigateToNews}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-medium transition-all text-xs cursor-pointer"
                title="ดูปฏิทินข่าวเศรษฐกิจ Forex Factory"
              >
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>ข่าวเศรษฐกิจ</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={handleSoundToggle}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Ticker Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Scrollable Watchlist Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {filteredPairs.map((item) => {
              const isSelected = item.symbol === selectedSymbol
              const livePrice = pairPrices[item.symbol] || item.price
              const isUp = item.change24h >= 0
              const tick = tickDirections[item.symbol]

              return (
                <button
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800/90 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.symbol}
                      </span>
                      <span className={`text-[10px] font-semibold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {isUp ? '+' : ''}{item.change24h}%
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono font-bold transition-colors ${
                      tick === 'up'
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : tick === 'down'
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      ${formatNumber(livePrice, item.precision || 2)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Connection Status & Account Balance */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/60">
            {/* Live latency badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold">LIVE {marketStatus.latency}ms</span>
            </div>

            {/* Account Balance */}
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                ยอดเงินจำลอง
              </div>
              <div className="text-base font-mono font-extrabold text-slate-900 dark:text-white leading-none mt-0.5">
                {formatCurrency(tradingBalance, false)}
              </div>
            </div>

            <button
              onClick={handleTopUpWrapper}
              title="เติมเงินจำลอง ฿100,000"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>เติมเงิน</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Terminal Grid: Chart + Positions (Left), OrderBook + OrderForm (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Column: Chart & Positions (8 cols) */}
        <div className="xl:col-span-8 space-y-4 flex flex-col">
          
          {/* Chart Container with Sleek Engine Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              {/* Minimal Chart Engine Toggle */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs">
                <button
                  onClick={() => setChartEngine('canvas')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    chartEngine === 'canvas'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Fast Chart</span>
                </button>
                <button
                  onClick={() => setChartEngine('tradingview')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    chartEngine === 'tradingview'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>TradingView</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 hidden sm:block font-mono">
                คู่เทรด: <strong className="text-emerald-500 dark:text-emerald-400">{tvSymbol}</strong>
              </div>
            </div>

            {/* Active Chart View */}
            <div className="h-[460px] sm:h-[500px]">
              {chartEngine === 'tradingview' ? (
                <TradingViewWidget
                  symbol={tvSymbol}
                  height="100%"
                  onFallbackToFastChart={() => {
                    setChartEngine('canvas')
                    addToast('⚡ สลับมาใช้ FINNTECH Fast Chart สำเร็จ', 'กราฟทำงานได้ทันที 100% ไม่ต้องรอเซิร์ฟเวอร์นอก', 'success')
                  }}
                />
              ) : (
                <TradingChart
                  pair={selectedPair}
                  candles={candles}
                  currentPrice={currentPrice}
                  priceChangePercent={selectedPair.change24h}
                  tickDirection={tickDirections[selectedSymbol] || 'none'}
                  positions={positions}
                  limitOrders={limitOrders}
                  onClosePosition={(posId, pnl) => {
                    onClosePosition(posId, pnl)
                    addToast(
                      '💼 ปิดสัญญาจากกราฟสำเร็จ',
                      `ปิดออเดอร์เรียบร้อยแล้ว กำไร/ขาดทุนสุทธิ: ${pnl >= 0 ? '+' : ''}฿${pnl.toLocaleString()}`,
                      pnl >= 0 ? 'success' : 'info'
                    )
                  }}
                  onCancelLimitOrder={handleCancelLimitOrder}
                />
              )}
            </div>
          </div>

          <div>
            <PositionsTable
              positions={positions}
              limitOrders={limitOrders}
              tradeHistory={tradeHistory}
              currentPrices={pairPrices}
              onClosePosition={onClosePosition}
              onCloseAllPositions={onCloseAllPositions}
              onCancelLimitOrder={handleCancelLimitOrder}
            />
          </div>
        </div>

        {/* Right Column: Order Book (top) & Order Execution Form (bottom) (4 cols) */}
        <div className="xl:col-span-4 space-y-4 flex flex-col">
          <div className="h-[360px]">
            <OrderBook
              currentPrice={currentPrice}
              orderBook={orderBook}
              recentTrades={recentTrades}
              pair={selectedPair}
            />
          </div>

          <div className="flex-1 hidden md:block">
            <OrderForm
              pair={selectedPair}
              currentPrice={currentPrice}
              tradingBalance={tradingBalance}
              onSubmitOrder={handleOrderSubmit}
            />
          </div>
        </div>

      </div>

      {/* Mobile Floating Action Bar (Sticky at bottom on phone screens) */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 px-3 py-2 bg-[#0b0e14]/95 backdrop-blur-xl border-t border-[#1e2638] flex items-center space-x-2">
        <button
          onClick={() => {
            setMobileOrderSide('LONG')
            setMobileDrawerOpen(true)
          }}
          className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
        >
          <TrendingUp className="w-4 h-4 stroke-[3]" />
          <span>Buy / Long</span>
        </button>

        <button
          onClick={() => {
            setMobileOrderSide('SHORT')
            setMobileDrawerOpen(true)
          }}
          className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
        >
          <TrendingDown className="w-4 h-4 stroke-[3]" />
          <span>Sell / Short</span>
        </button>

        <button
          onClick={() => setIsAlertModalOpen(true)}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 active:scale-95 transition-all shrink-0"
          title="ตั้งเตือนราคา"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Order Drawer (Slide-up sheet) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div className="w-full max-h-[85vh] overflow-y-auto bg-[#121721] rounded-t-3xl border-t border-[#1e2638] p-4 shadow-2xl animate-slide-up">
            <OrderForm
              pair={selectedPair}
              currentPrice={currentPrice}
              tradingBalance={tradingBalance}
              onSubmitOrder={handleOrderSubmit}
              initialSide={mobileOrderSide}
              onClose={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        selectedSymbol={selectedSymbol}
        currentPrice={currentPrice}
        alerts={priceAlerts}
        onAddAlert={handleAddPriceAlert}
        onDeleteAlert={handleDeletePriceAlert}
      />

      {/* TradingView Signal Gateway Modal */}
      <TradingViewSignalModal
        isOpen={isSignalModalOpen}
        onClose={() => setIsSignalModalOpen(false)}
      />

    </div>
  )
}
