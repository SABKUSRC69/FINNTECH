import React, { useState, useEffect, useRef } from 'react'
import TradingChart from './TradingChart'
import TradingViewWidget from './TradingViewWidget'
import OrderBook from './OrderBook'
import OrderForm from './OrderForm'
import PositionsTable from './PositionsTable'
import PriceAlertModal from './PriceAlertModal'
import TradingViewSignalModal from './TradingViewSignalModal'
import SpotDepositModal from './SpotDepositModal'
import SpotWithdrawModal from './SpotWithdrawModal'
import ToastContainer from '../common/ToastContainer'
import {
  TRADING_PAIRS,
  generateCandleData,
  generateOrderBook,
  INITIAL_SPOT_BALANCES,
  INITIAL_OPEN_ORDERS,
  INITIAL_TRADE_HISTORY,
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
  Sparkles,
  QrCode,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet
} from 'lucide-react'

export default function TradingTerminal({
  tradingBalance = 500000,
  spotBalances: propSpotBalances,
  openOrders: propOpenOrders,
  tradeHistory: propTradeHistory,
  onExecuteSpotOrder,
  onCancelOpenOrder,
  onDepositTHB,
  onWithdrawTHB,
  onTopUpBalance,
  onNavigateToNews,
  initialSymbol = 'BTC/THB',
  // Backwards compatibility props
  positions = [],
  onAddPosition,
  onClosePosition,
  onCloseAllPositions,
}) {
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    return TRADING_PAIRS.some((p) => p.symbol === initialSymbol) ? initialSymbol : 'BTC/THB'
  })

  useEffect(() => {
    if (initialSymbol && TRADING_PAIRS.some((p) => p.symbol === initialSymbol)) {
      setSelectedSymbol(initialSymbol)
    }
  }, [initialSymbol])

  useEffect(() => {
    if (selectedSymbol) {
      liveMarketService.setActiveSymbol(selectedSymbol)
    }
  }, [selectedSymbol])

  const [chartEngine, setChartEngine] = useState('canvas') // Fast Chart default
  const [watchlistCategory, setWatchlistCategory] = useState('crypto') // Default to crypto for Spot exchange
  const [soundEnabled, setSoundEnabled] = useState(() => soundEffects.isEnabled())
  const [toasts, setToasts] = useState([])

  // Local state fallbacks if not provided from App level
  const [localSpotBalances, setLocalSpotBalances] = useState(() => INITIAL_SPOT_BALANCES)
  const [localOpenOrders, setLocalOpenOrders] = useState(() => INITIAL_OPEN_ORDERS)
  const [localTradeHistory, setLocalTradeHistory] = useState(() => INITIAL_TRADE_HISTORY)

  const spotBalances = propSpotBalances || localSpotBalances
  const openOrders = propOpenOrders || localOpenOrders
  const tradeHistory = propTradeHistory || localTradeHistory

  // Price Alerts State
  const [priceAlerts, setPriceAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('finntech_price_alerts')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  // Modal Visibility States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [isSignalModalOpen, setIsSignalModalOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileOrderSide, setMobileOrderSide] = useState('BUY')

  // Synchronize Price Alerts to LocalStorage
  useEffect(() => {
    localStorage.setItem('finntech_price_alerts', JSON.stringify(priceAlerts))
  }, [priceAlerts])

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
  const [candles, setCandles] = useState(() => generateCandleData(2682750, 30))
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(2682750))
  const [recentTrades, setRecentTrades] = useState([
    { id: 1, price: 2682800.0, size: 0.05, time: '14:20:12', isBuy: true },
    { id: 2, price: 2682750.0, size: 0.12, time: '14:20:10', isBuy: false },
    { id: 3, price: 2682900.0, size: 0.03, time: '14:20:06', isBuy: true },
    { id: 4, price: 2682700.0, size: 0.25, time: '14:20:01', isBuy: false },
  ])

  const selectedPair = TRADING_PAIRS.find((p) => p.symbol === selectedSymbol) || TRADING_PAIRS[0]
  const currentPrice = pairPrices[selectedSymbol] || selectedPair.price

  // Calculate Net Worth & Available Balances in THB
  const availableTHB = spotBalances?.THB !== undefined ? spotBalances.THB : tradingBalance
  const totalPortfolioTHB = Object.keys(spotBalances || {}).reduce((sum, key) => {
    const qty = spotBalances[key] || 0
    if (key === 'THB') return sum + qty
    const p = pairPrices[`${key}/THB`] || (key === 'USDT' ? 35.80 : 0)
    return sum + (qty * p)
  }, 0)

  // Ref tracking for live subscriptions
  const openOrdersRef = useRef(openOrders)
  openOrdersRef.current = openOrders

  const priceAlertsRef = useRef(priceAlerts)
  priceAlertsRef.current = priceAlerts

  const pairPricesRef = useRef(pairPrices)
  pairPricesRef.current = pairPrices

  const availableTHBRef = useRef(availableTHB)
  availableTHBRef.current = availableTHB

  // Check Limit Orders matching against live tick
  const checkLimitOrders = (latestPrices) => {
    const currentOrders = openOrdersRef.current
    if (!currentOrders || currentOrders.length === 0) return

    currentOrders.forEach((ord) => {
      const liveP = latestPrices[ord.symbol]
      if (!liveP) return

      const isBuy = ord.side === 'BUY'
      // Buy limit matches when market drops <= targetPrice
      // Sell limit matches when market rises >= targetPrice
      const targetP = ord.targetPrice || ord.price
      const isFilled = isBuy ? liveP <= targetP : liveP >= targetP

      if (isFilled) {
        soundEffects.playOrderFilled()
        addToast(
          `🚀 คำสั่ง Limit ${isBuy ? 'ซื้อ' : 'ขาย'} จับคู่สำเร็จ!`,
          `${ord.symbol} ที่ราคา ฿${formatNumber(targetP, 2)} • จำนวน ${ord.amount} ${ord.baseAsset || ''}`,
          'success'
        )

        if (onExecuteSpotOrder) {
          onExecuteSpotOrder({
            ...ord,
            price: targetP,
            isLimitExecution: true,
          })
        } else {
          // Local fallback execution
          setLocalOpenOrders((prev) => prev.filter((o) => o.id !== ord.id))
          const historyEntry = {
            id: 'trade-' + Date.now(),
            symbol: ord.symbol,
            side: ord.side,
            orderType: 'LIMIT',
            price: targetP,
            amount: ord.amount,
            total: ord.total,
            fee: ord.fee || 0,
            executedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'FILLED',
          }
          setLocalTradeHistory((prev) => [historyEntry, ...prev])

          // Update balances
          const base = ord.baseAsset || ord.symbol.split('/')[0]
          setLocalSpotBalances((prev) => {
            const next = { ...prev }
            if (ord.side === 'BUY') {
              next[base] = (next[base] || 0) + ord.amount
            } else {
              next.THB = (next.THB || 0) + (ord.total - (ord.fee || 0))
            }
            return next
          })
        }
      }
    })
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
          `${alt.symbol} ${alt.condition === 'GTE' ? 'พุ่งขึ้นถึง' : 'ร่วงลงถึง'} ฿${formatNumber(liveP, 2)} (${alt.note || ''})`,
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

    // Register TradingView Webhook Signal Execution Listener (Signal Simulator for Spot)
    tradingViewWebhookService.onSignalReceived((signal) => {
      const curP = pairPricesRef.current[signal.symbol] || signal.price || 2682750
      const pairInfo = TRADING_PAIRS.find((p) => p.symbol === signal.symbol) || TRADING_PAIRS[0]
      const baseAsset = pairInfo.baseAsset || signal.symbol.split('/')[0]

      if (signal.action === 'CLOSE') {
        return {
          success: true,
          closedCount: 1,
          details: { symbol: signal.symbol, price: curP, note: 'Spot holding position closed' },
        }
      }

      // SPOT BUY SIGNAL
      if (signal.side === 'BUY' || signal.action === 'BUY') {
        const thbToSpend = signal.amount || 50000
        const currentBal = availableTHBRef.current

        if (thbToSpend > currentBal) {
          addToast(
            '⚠️ ยอดเงินบาทไม่เพียงพอ',
            `สัญญาณซื้อ ${signal.symbol} ต้องการ ฿${thbToSpend.toLocaleString()} แต่มียอดคงเหลือ ฿${currentBal.toLocaleString()}`,
            'error'
          )
          return {
            success: false,
            reason: `ยอดเงินบาทไม่เพียงพอ (ต้องการ ฿${thbToSpend.toLocaleString()} แต่มี ฿${currentBal.toLocaleString()})`,
          }
        }

        const cryptoQty = parseFloat((thbToSpend / curP).toFixed(6))
        const fee = thbToSpend * 0.0025

        const spotOrder = {
          id: 'spot-tv-' + Date.now(),
          symbol: signal.symbol,
          side: 'BUY',
          orderType: 'MARKET',
          price: curP,
          amount: cryptoQty,
          total: thbToSpend,
          fee,
          baseAsset,
          quoteAsset: 'THB',
        }

        if (onExecuteSpotOrder) {
          onExecuteSpotOrder(spotOrder)
        } else {
          handleOrderSubmit(spotOrder)
        }

        soundEffects.playOrderFilled()
        addToast(
          '⚡ [Signal Simulator] ซื้อ Spot สำเร็จ!',
          `ซื้อ ${cryptoQty} ${baseAsset} @ ฿${formatNumber(curP, 2)} • ยอดรวม ฿${thbToSpend.toLocaleString()}`,
          'success'
        )

        return {
          success: true,
          details: { symbol: signal.symbol, side: 'BUY', amount: cryptoQty, price: curP },
        }
      }

      // SPOT SELL SIGNAL
      if (signal.side === 'SELL' || signal.action === 'SELL') {
        const spotOrder = {
          id: 'spot-tv-' + Date.now(),
          symbol: signal.symbol,
          side: 'SELL',
          orderType: 'MARKET',
          price: curP,
          amount: signal.amount || 0.05,
          total: (signal.amount || 0.05) * curP,
          fee: (signal.amount || 0.05) * curP * 0.0025,
          baseAsset,
          quoteAsset: 'THB',
        }

        if (onExecuteSpotOrder) {
          onExecuteSpotOrder(spotOrder)
        } else {
          handleOrderSubmit(spotOrder)
        }

        soundEffects.playProfitClose()
        addToast(
          '⚡ [Signal Simulator] ขาย Spot สำเร็จ!',
          `ขาย ${signal.symbol} @ ฿${formatNumber(curP, 2)}`,
          'success'
        )

        return {
          success: true,
          details: { symbol: signal.symbol, side: 'SELL', price: curP },
        }
      }

      return { success: true }
    })

    const unsubscribePrices = liveMarketService.subscribe((newPrices, updateInfo) => {
      setPairPrices((prev) => {
        const next = { ...prev, ...newPrices }
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

            // Realtime Forming Candle Tick Engine
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
                size: parseFloat((Math.random() * 0.15 + 0.01).toFixed(4)),
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
    if (watchlistCategory === 'crypto') return p.category === 'crypto'
    if (watchlistCategory === 'forex') return p.category === 'forex'
    if (watchlistCategory === 'commodity') return p.category === 'commodity'
    if (watchlistCategory === 'stocks') return p.category === 'stock'
    return true
  })

  const tvSymbol = SYMBOL_MAPPINGS[selectedSymbol]?.tradingView || selectedPair.tradingViewSymbol || 'BITKUB:BTCTHB'

  // Wrapped Order Submission (Handles Spot Market & Limit execution)
  const handleOrderSubmit = (newOrder) => {
    const latency = Math.floor(12 + Math.random() * 8)

    if (onExecuteSpotOrder) {
      onExecuteSpotOrder(newOrder)
    } else {
      // Local fallback
      if (newOrder.orderType === 'LIMIT') {
        const orderEntry = {
          ...newOrder,
          status: 'OPEN',
          placedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }
        setLocalOpenOrders((prev) => [orderEntry, ...prev])
      } else {
        const historyEntry = {
          id: 'trade-' + Date.now(),
          symbol: newOrder.symbol,
          side: newOrder.side,
          orderType: 'MARKET',
          price: newOrder.price,
          amount: newOrder.amount,
          total: newOrder.total,
          fee: newOrder.fee,
          executedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'FILLED',
        }
        setLocalTradeHistory((prev) => [historyEntry, ...prev])

        const base = newOrder.baseAsset || newOrder.symbol.split('/')[0]
        setLocalSpotBalances((prev) => {
          const next = { ...prev }
          if (newOrder.side === 'BUY') {
            next.THB = Math.max(0, (next.THB || 0) - newOrder.total)
            next[base] = (next[base] || 0) + newOrder.amount
          } else {
            next[base] = Math.max(0, (next[base] || 0) - newOrder.amount)
            next.THB = (next.THB || 0) + (newOrder.total - newOrder.fee)
          }
          return next
        })
      }
    }

    soundEffects.playOrderFilled()
    if (newOrder.orderType === 'LIMIT') {
      addToast(
        `⏳ ตั้งคำสั่ง Limit ${newOrder.side === 'BUY' ? 'ซื้อ' : 'ขาย'} สำเร็จ`,
        `${newOrder.symbol} รอที่ราคา ฿${formatNumber(newOrder.price, 2)} • ยอด ฿${formatNumber(newOrder.total, 2)}`,
        'info'
      )
    } else {
      addToast(
        `🚀 จับคู่คำสั่ง ${newOrder.side === 'BUY' ? 'ซื้อ' : 'ขาย'} สำเร็จ`,
        `${newOrder.amount} ${newOrder.baseAsset} ที่ราคา ฿${formatNumber(newOrder.price, 2)} • ค่าธรรมเนียม 0.25% (฿${formatNumber(newOrder.fee, 2)})`,
        'success'
      )
    }
  }

  const handleCancelOpenOrder = (orderId) => {
    if (onCancelOpenOrder) {
      onCancelOpenOrder(orderId)
    } else {
      setLocalOpenOrders((prev) => prev.filter((o) => o.id !== orderId))
    }
    soundEffects.playTrade()
    addToast('🗑️ ยกเลิกคำสั่งสำเร็จ', 'ยกเลิกคำสั่งรอจับคู่เรียบร้อยแล้ว', 'info')
  }

  const handleAddPriceAlert = (newAlert) => {
    setPriceAlerts((prev) => [newAlert, ...prev])
    addToast('🔔 ตั้งเตือนราคาสำเร็จ', `${newAlert.symbol} ${newAlert.condition === 'GTE' ? '≥' : '≤'} ฿${formatNumber(newAlert.targetPrice, 2)}`, 'success')
  }

  const handleDeletePriceAlert = (alertId) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 relative pb-16 md:pb-0">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Ticker & Exchange Header Bar */}
      <div className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3 transition-colors">
        
        {/* Watchlist Filter Tabs & Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/70">
          {/* Segmented Category Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-none">
            {[
              { id: 'crypto', label: 'Spot คริปโต (THB)' },
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'forex', label: 'Forex' },
              { id: 'commodity', label: 'ทองคำ' },
            ].map((cat) => {
              const count = TRADING_PAIRS.filter((p) => {
                if (cat.id === 'all') return true
                if (cat.id === 'crypto') return p.category === 'crypto'
                if (cat.id === 'forex') return p.category === 'forex'
                if (cat.id === 'commodity') return p.category === 'commodity'
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
            {/* Spot Exchange Fee Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-500 dark:text-slate-400">ค่าธรรมเนียม Spot:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">0.25%</strong>
            </div>

            {/* TradingView Webhook Bot Button */}
            <button
              onClick={() => setIsSignalModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium transition-all text-xs cursor-pointer"
              title="ตั้งค่า TradingView Bot สำหรับ Spot"
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
              const isThb = item.symbol.endsWith('/THB')

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
                      {isThb ? '฿' : '$'}{formatNumber(livePrice, item.precision || 2)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Connection Status, Portfolio Valuation & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800/60">
            {/* Live / Demo feed badge */}
            {(() => {
              const currentSymStatus = liveMarketService.getSymbolStatus(selectedSymbol)
              const statusType = currentSymStatus.status || 'UNAVAILABLE'
              const isLive = statusType === 'LIVE'
              const isDemo = statusType === 'DEMO'
              const isStale = statusType === 'STALE'

              const badgeStyle = isLive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                : isDemo
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25'
                : isStale
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'

              const dotColor = isLive ? 'bg-emerald-500' : isDemo ? 'bg-cyan-500' : isStale ? 'bg-amber-500' : 'bg-rose-500'

              return (
                <div
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${badgeStyle}`}
                  title={`Source: ${currentSymStatus.source}${currentSymStatus.lastUpdated ? ` • อัปเดตล่าสุด: ${new Date(currentSymStatus.lastUpdated).toLocaleTimeString()}` : ''}`}
                >
                  <span className="relative flex h-2 w-2">
                    {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
                  </span>
                  <span className="text-[11px] font-semibold">
                    {statusType} {isLive ? `${marketStatus.latency || 24}ms` : ''}
                  </span>
                </div>
              )
            })()}

            {/* Total Portfolio Valuation (Bitkub Style) */}
            <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-3">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                มูลค่าพอร์ตรวม (THB)
              </div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-slate-900 dark:text-white leading-none mt-0.5">
                ฿{formatNumber(totalPortfolioTHB, 2)}
              </div>
            </div>

            {/* Available THB Cash */}
            <div className="text-right hidden sm:block">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                เงินบาทพร้อมใช้
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
                ฿{formatNumber(availableTHB, 2)}
              </div>
            </div>

            {/* Deposit PromptPay Button */}
            <button
              onClick={() => setIsDepositModalOpen(true)}
              title="ฝากเงินบาทผ่าน PromptPay QR (0% Fee)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>ฝากเงิน QR</span>
            </button>

            {/* Withdraw Bank Button */}
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              title="ถอนเงินเข้าบัญชีธนาคารไทย"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>ถอนเงิน</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Terminal Grid: Chart + Positions (Left), OrderBook + OrderForm (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Column: Chart & Spot Positions (8 cols) */}
        <div className="xl:col-span-8 space-y-4 flex flex-col">
          
          {/* Chart Container with Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
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
                  <span>Fast Chart (0ms)</span>
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
                คู่เทรด Spot: <strong className="text-emerald-500 dark:text-emerald-400">{tvSymbol}</strong>
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
                    addToast('⚡ สลับมาใช้ Fast Chart สำเร็จ', 'กราฟทำงานได้ทันที 100% ไม่ต้องรอเซิร์ฟเวอร์นอก', 'success')
                  }}
                />
              ) : (
                <TradingChart
                  pair={selectedPair}
                  candles={candles}
                  currentPrice={currentPrice}
                  priceChangePercent={selectedPair.change24h}
                  tickDirection={tickDirections[selectedSymbol] || 'none'}
                  positions={[]}
                  limitOrders={openOrders}
                  onCancelLimitOrder={handleCancelOpenOrder}
                />
              )}
            </div>
          </div>

          {/* Spot Orders & Asset Management Table */}
          <div>
            <PositionsTable
              spotBalances={spotBalances}
              openOrders={openOrders}
              tradeHistory={tradeHistory}
              currentPrices={pairPrices}
              onCancelOpenOrder={handleCancelOpenOrder}
              onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              positions={positions}
              onClosePosition={onClosePosition}
              onCloseAllPositions={onCloseAllPositions}
            />
          </div>
        </div>

        {/* Right Column: Order Book (top) & Spot Order Form (bottom) (4 cols) */}
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
              spotBalances={spotBalances}
              onSubmitOrder={handleOrderSubmit}
              onOpenDeposit={() => setIsDepositModalOpen(true)}
            />
          </div>
        </div>

      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 px-3 py-2 bg-[#0b0e14]/95 backdrop-blur-xl border-t border-[#1e2638] flex items-center space-x-2">
        <button
          onClick={() => {
            setMobileOrderSide('BUY')
            setMobileDrawerOpen(true)
          }}
          className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
        >
          <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
          <span>ซื้อ (Buy)</span>
        </button>

        <button
          onClick={() => {
            setMobileOrderSide('SELL')
            setMobileDrawerOpen(true)
          }}
          className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
        >
          <ArrowUpRight className="w-4 h-4 stroke-[3]" />
          <span>ขาย (Sell)</span>
        </button>

        <button
          onClick={() => setIsDepositModalOpen(true)}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 active:scale-95 transition-all shrink-0"
          title="ฝากเงิน QR"
        >
          <QrCode className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsAlertModalOpen(true)}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 active:scale-95 transition-all shrink-0"
          title="ตั้งเตือนราคา"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Order Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div className="w-full max-h-[85vh] overflow-y-auto bg-[#121721] rounded-t-3xl border-t border-[#1e2638] p-4 shadow-2xl animate-slide-up">
            <OrderForm
              pair={selectedPair}
              currentPrice={currentPrice}
              spotBalances={spotBalances}
              onSubmitOrder={(order) => {
                handleOrderSubmit(order)
                setMobileDrawerOpen(false)
              }}
              initialSide={mobileOrderSide}
              onOpenDeposit={() => {
                setMobileDrawerOpen(false)
                setIsDepositModalOpen(true)
              }}
              onClose={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* PromptPay QR Deposit Modal */}
      <SpotDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDeposit={(amount) => {
          if (onDepositTHB) {
            onDepositTHB(amount)
          } else if (onTopUpBalance) {
            onTopUpBalance(amount)
          } else {
            setLocalSpotBalances((prev) => ({
              ...prev,
              THB: (prev.THB || 0) + Number(amount),
            }))
          }
          soundEffects.playProfitClose()
          addToast('💵 ฝากเงินผ่าน PromptPay สำเร็จ', `+฿${formatNumber(amount, 2)} เข้ากระเป๋า Spot Wallet เรียบร้อยแล้ว`, 'success')
        }}
      />

      {/* Bank Withdrawal Modal */}
      <SpotWithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableTHB={availableTHB}
        onWithdraw={(data) => {
          if (onWithdrawTHB) {
            onWithdrawTHB(data)
          } else {
            setLocalSpotBalances((prev) => ({
              ...prev,
              THB: Math.max(0, (prev.THB || 0) - Number(data.amount)),
            }))
          }
          soundEffects.playProfitClose()
          addToast(
            '🏦 ถอนเงินเข้าบัญชีสำเร็จ',
            `ถอนสุทธิ ฿${formatNumber(data.netAmount, 2)} ไปยัง ${data.bank} (${data.accountNo}) เรียบร้อยแล้ว`,
            'info'
          )
        }}
      />

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

function ShieldCheckIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
