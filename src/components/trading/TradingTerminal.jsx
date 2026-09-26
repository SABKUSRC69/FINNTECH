import React, { useState, useEffect, useRef } from 'react'
import TradingChart from './TradingChart'
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
import {
  applyLimitPriceTick,
  applySpotDeposit,
  applySpotOrder,
  applySpotWithdrawal,
  createSpotAccount,
  calculateLockedBalances,
  isUsablePriceStatus,
  floorSpotAmount,
} from '../../services/spotTradingService'
import { liveMarketService } from '../../services/liveMarketService'
import tradingViewWebhookService from '../../services/tradingViewWebhookService'
import { soundEffects } from '../../utils/soundEffects'
import { formatNumber } from '../../utils/formatters'
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  PlusCircle,
  Activity,
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
  Wallet,
  X,
} from 'lucide-react'

export default function TradingTerminal({
  tradingBalance = 500000,
  spotBalances: propSpotBalances,
  openOrders: propOpenOrders,
  tradeHistory: propTradeHistory,
  priceAlerts: propPriceAlerts,
  onPriceAlertsChange,
  onExecuteSpotOrder,
  onLimitPriceTick,
  onCancelOpenOrder,
  onDepositTHB,
  onWithdrawTHB,
  onTopUpBalance,
  onNavigateToNews,
  initialSymbol = 'BTC/THB',
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

  const [watchlistCategory, setWatchlistCategory] = useState('crypto')
  const [soundEnabled, setSoundEnabled] = useState(() => soundEffects.isEnabled())
  const [toasts, setToasts] = useState([])

  // Local state fallbacks if not provided from App level
  const [localSpotBalances, setLocalSpotBalances] = useState(() => ({ ...INITIAL_SPOT_BALANCES }))
  const [localOpenOrders, setLocalOpenOrders] = useState(() => INITIAL_OPEN_ORDERS)
  const [localTradeHistory, setLocalTradeHistory] = useState(() => INITIAL_TRADE_HISTORY)

  const spotBalances = propSpotBalances || localSpotBalances
  const openOrders = propOpenOrders || localOpenOrders
  const tradeHistory = propTradeHistory || localTradeHistory
  const [localPriceAlerts, setLocalPriceAlerts] = useState(() => propPriceAlerts || [])
  const priceAlerts = propPriceAlerts ?? localPriceAlerts
  const setPriceAlerts = onPriceAlertsChange || setLocalPriceAlerts

  const localAccountRef = useRef(createSpotAccount({
    spotBalances,
    openOrders,
    tradeHistory,
  }))

  // Modal Visibility States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [isSignalModalOpen, setIsSignalModalOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileOrderSide, setMobileOrderSide] = useState('BUY')

  useEffect(() => {
    if (!propSpotBalances && !propOpenOrders && !propTradeHistory) {
      localAccountRef.current = createSpotAccount({
        spotBalances: localSpotBalances,
        openOrders: localOpenOrders,
        tradeHistory: localTradeHistory,
      })
    }
  }, [localSpotBalances, localOpenOrders, localTradeHistory, propSpotBalances, propOpenOrders, propTradeHistory])

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
  const [marketStatus, setMarketStatus] = useState({ isConnected: false, latency: null })
  const [candles, setCandles] = useState(() => generateCandleData(2682750, 30))
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(2682750))
  const [recentTrades, setRecentTrades] = useState([])

  const selectedPair = TRADING_PAIRS.find((p) => p.symbol === selectedSymbol) || TRADING_PAIRS[0]
  const selectedPriceStatus = marketStatus.symbolStatuses?.[selectedSymbol] || liveMarketService.getSymbolStatus(selectedSymbol)
  const currentPrice = pairPrices[selectedSymbol] ?? selectedPair.price
  const priceAvailable = isUsablePriceStatus(selectedPriceStatus) && Number.isFinite(Number(currentPrice)) && Number(currentPrice) > 0

  // Calculate Net Worth & Available Balances in THB
  const availableTHB = spotBalances?.THB !== undefined ? spotBalances.THB : tradingBalance
  const lockedBalances = calculateLockedBalances(openOrders)
  const totalPortfolioTHB = [...new Set([...Object.keys(spotBalances || {}), ...Object.keys(lockedBalances)])].reduce((sum, key) => {
    const qty = Number(spotBalances[key] || 0) + Number(lockedBalances[key] || 0)
    if (key === 'THB') return sum + qty
    const p = pairPrices[`${key}/THB`] || (key === 'USDT' ? pairPrices['USDT/THB'] : 0)
    return sum + (qty * p)
  }, 0)

  // Ref tracking for the local demo feed and user-scoped alerts
  const priceAlertsRef = useRef(priceAlerts)
  priceAlertsRef.current = priceAlerts

  const pairPricesRef = useRef(pairPrices)
  pairPricesRef.current = pairPrices

  const checkLimitOrders = (latestPrices, updateInfo) => {
    const symbol = updateInfo?.symbol
    const price = Number(latestPrices?.[symbol])
    if (!symbol || !Number.isFinite(price) || price <= 0) return
    const status = liveMarketService.getSymbolStatus(symbol)
    if (!isUsablePriceStatus(status)) return

    const result = onLimitPriceTick
      ? onLimitPriceTick(symbol, price, status)
      : applyLimitPriceTick(localAccountRef.current, symbol, price, status)

    if (!result?.success || result.filledOrders.length === 0) return
    if (!onLimitPriceTick) {
      localAccountRef.current = result.account
      setLocalSpotBalances(result.account.spotBalances)
      setLocalOpenOrders(result.account.openOrders)
      setLocalTradeHistory(result.account.tradeHistory)
    }

    result.filledOrders.forEach((order) => {
      soundEffects.playOrderFilled()
      addToast(
        `🚀 คำสั่ง Limit ${order.side === 'BUY' ? 'ซื้อ' : 'ขาย'} (จำลอง) จับคู่สำเร็จ`,
        `${order.symbol} ที่ราคา ${formatNumber(order.price, 2)} ${order.quoteAsset} • จำนวน ${order.amount} ${order.baseAsset}`,
        'success'
      )
    })
  }

  // Check Price Alerts
  const checkPriceAlerts = (latestPrices) => {
    const currentAlerts = priceAlertsRef.current
    if (!currentAlerts || currentAlerts.length === 0) return

    const remaining = []
    currentAlerts.forEach((alt) => {
      const priceStatus = liveMarketService.getSymbolStatus(alt.symbol)
      const liveP = latestPrices[alt.symbol]
      if (!isUsablePriceStatus(priceStatus) || !Number.isFinite(Number(liveP)) || Number(liveP) <= 0) {
        remaining.push(alt)
        return
      }

      const isHit = alt.condition === 'GTE' ? liveP >= alt.targetPrice : liveP <= alt.targetPrice
      if (isHit) {
        soundEffects.playAlertChime()
        addToast(
          `🔔 แจ้งเตือนราคาเป้าหมาย (DEMO)`,
          `${alt.symbol} ${alt.condition === 'GTE' ? 'ขึ้นถึง' : 'ลงถึง'} ${formatNumber(liveP, 2)} (${alt.note || ''})`,
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
      const action = signal.action
      if (action !== 'BUY' && action !== 'SELL') {
        return { success: false, reason: 'Spot Signal Simulator รองรับเฉพาะ BUY และ SELL' }
      }

      const pairInfo = TRADING_PAIRS.find((pair) => pair.symbol === signal.symbol)
      const curP = Number(pairPricesRef.current[signal.symbol])
      const priceStatus = liveMarketService.getSymbolStatus(signal.symbol)
      if (!pairInfo || !isUsablePriceStatus(priceStatus) || !Number.isFinite(curP) || curP <= 0) {
        return { success: false, reason: 'ราคา Spot DEMO ไม่พร้อมใช้งาน จึงไม่ส่งคำสั่ง' }
      }

      const requestedAmount = Number(signal.amount)
      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        return { success: false, reason: 'ระบุ amount ที่เป็นเลข finite และมากกว่า 0' }
      }
      const baseAsset = pairInfo.baseAsset
      const quoteAsset = pairInfo.quoteAsset
      const cryptoQty = action === 'BUY'
        ? floorSpotAmount(pairInfo, requestedAmount / (curP * (1 + 0.0025)))
        : requestedAmount
      const total = curP * cryptoQty
      const spotOrder = {
        id: `spot-tv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        symbol: signal.symbol,
        side: action,
        orderType: 'MARKET',
        price: curP,
        amount: cryptoQty,
        total,
        fee: total * 0.0025,
        baseAsset,
        quoteAsset,
        priceStatus: priceStatus.status,
      }

      const result = onExecuteSpotOrder
        ? onExecuteSpotOrder(spotOrder)
        : handleOrderSubmit(spotOrder)
      if (!result?.success) {
        const reason = result?.error || 'ยอดคงเหลือไม่พอหรือคำสั่งไม่ผ่านการตรวจสอบ'
        addToast('⚠️ Signal Simulator ปฏิเสธคำสั่ง (DEMO)', reason, 'error')
        return { success: false, reason }
      }

      soundEffects.playOrderFilled()
      addToast(
        `⚡ Signal Simulator ${action} สำเร็จ (DEMO)`,
        `${action === 'BUY' ? 'ซื้อ' : 'ขาย'} ${formatNumber(cryptoQty, 6)} ${baseAsset} @ ${formatNumber(curP, 2)} ${quoteAsset}`,
        'success'
      )
      return { success: true, details: { symbol: signal.symbol, side: action, amount: cryptoQty, price: curP } }
    })

    const unsubscribePrices = liveMarketService.subscribe((newPrices, updateInfo) => {
      const nextPrices = { ...pairPricesRef.current, ...newPrices }
      pairPricesRef.current = nextPrices
      setPairPrices(nextPrices)
      checkLimitOrders(nextPrices, updateInfo)
      checkPriceAlerts(nextPrices)

      if (updateInfo && updateInfo.symbol) {
        setTickDirections((prev) => ({
          ...prev,
          [updateInfo.symbol]: updateInfo.direction,
        }))

        // Sync orderbook, live candle ticks & matched trade stream for active pair
        if (updateInfo.symbol === selectedSymbol) {
            const demoPrice = nextPrices[selectedSymbol]
            if (demoPrice) {
            setOrderBook(generateOrderBook(demoPrice))

            // Realtime Forming Candle Tick Engine
            setCandles((prevCandles) => {
              if (!prevCandles || prevCandles.length === 0) return prevCandles
              const lastIdx = prevCandles.length - 1
              const last = { ...prevCandles[lastIdx] }
              last.close = demoPrice
              last.high = Math.max(last.high, demoPrice)
              last.low = Math.min(last.low, demoPrice)
              return [...prevCandles.slice(0, lastIdx), last]
            })

            const isBuy = updateInfo.direction === 'up'
            const now = new Date()
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            setRecentTrades((prevTrades) => [
              {
                id: Date.now(),
                price: demoPrice,
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
    return p.category === 'crypto' && p.quoteAsset === 'THB'
  })

  // Wrapped Order Submission (Handles Spot Market & Limit execution)
  const handleOrderSubmit = (newOrder) => {
    const priceStatus = newOrder.priceStatus || liveMarketService.getSymbolStatus(newOrder.symbol).status
    const result = onExecuteSpotOrder
      ? onExecuteSpotOrder(newOrder)
      : applySpotOrder(localAccountRef.current, newOrder, { priceStatus })
    if (!result?.success) {
      addToast('คำสั่งถูกปฏิเสธ (DEMO)', result?.error || 'คำสั่งไม่ผ่านการตรวจสอบ', 'error')
      return result || { success: false, error: 'คำสั่งไม่ผ่านการตรวจสอบ' }
    }
    if (!onExecuteSpotOrder) {
      localAccountRef.current = result.account
      setLocalSpotBalances(result.account.spotBalances)
      setLocalOpenOrders(result.account.openOrders)
      setLocalTradeHistory(result.account.tradeHistory)
    }

    soundEffects.playOrderFilled()
    if (newOrder.orderType === 'LIMIT') {
      addToast(
        `⏳ ตั้งคำสั่ง Limit ${newOrder.side === 'BUY' ? 'ซื้อ' : 'ขาย'} (DEMO) สำเร็จ`,
        `${newOrder.symbol} รอที่ราคา ${formatNumber(newOrder.price, 2)} ${newOrder.quoteAsset} • ล็อกยอดแล้ว`,
        'info'
      )
    } else {
      addToast(
        `🚀 จับคู่คำสั่ง ${newOrder.side === 'BUY' ? 'ซื้อ' : 'ขาย'} (DEMO) สำเร็จ`,
        `${newOrder.amount} ${newOrder.baseAsset} ที่ราคา ${formatNumber(newOrder.price, 2)} ${newOrder.quoteAsset} • ค่าธรรมเนียม 0.25% (${formatNumber(newOrder.fee, 2)} ${newOrder.quoteAsset})`,
        'success'
      )
    }
    return result
  }

  const handleCancelOpenOrder = (orderId) => {
    const result = onCancelOpenOrder
      ? onCancelOpenOrder(orderId)
      : cancelSpotLimitOrder(localAccountRef.current, orderId)
    if (!result?.success) {
      addToast('ยกเลิกคำสั่งไม่สำเร็จ (DEMO)', result?.error || 'ไม่พบยอดที่ล็อกไว้', 'error')
      return result
    }
    if (!onCancelOpenOrder) {
      localAccountRef.current = result.account
      setLocalSpotBalances(result.account.spotBalances)
      setLocalOpenOrders(result.account.openOrders)
      setLocalTradeHistory(result.account.tradeHistory)
    }
    soundEffects.playOrderFilled()
    addToast('🗑️ ยกเลิกคำสั่ง (DEMO) สำเร็จ', 'คืนเฉพาะยอดที่ล็อกไว้ในคำสั่งนี้', 'info')
    return result
  }

  const handleAddPriceAlert = (newAlert) => {
    setPriceAlerts((prev) => [newAlert, ...prev])
    addToast('🔔 ตั้งเตือนราคา DEMO สำเร็จ', `${newAlert.symbol} ${newAlert.condition === 'GTE' ? '≥' : '≤'} ${formatNumber(newAlert.targetPrice, 2)}`, 'success')
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
              { id: 'all', label: 'คู่เทรดทั้งหมด' },
            ].map((cat) => {
              const count = cat.id === 'all'
                ? TRADING_PAIRS.length
                : TRADING_PAIRS.filter((pair) => pair.category === 'crypto' && pair.quoteAsset === 'THB').length

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

            {/* In-app Spot Signal Simulator */}
            <button
              onClick={() => setIsSignalModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium transition-all text-xs cursor-pointer"
              title="เปิดตัวจำลองคำสั่ง Spot DEMO ในเครื่อง"
            >
              <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              <span>Signal DEMO</span>
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
              const demoPrice = pairPrices[item.symbol] ?? item.price
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
                      <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                        {Number.isFinite(item.change24h) ? `${item.change24h > 0 ? '+' : ''}${item.change24h}%` : '24h —'}
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono font-bold transition-colors ${
                      tick === 'up'
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : tick === 'down'
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {item.quoteAsset === 'THB' ? '฿' : item.quoteAsset}{formatNumber(demoPrice, item.precision || 2)}
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
              const isDemo = statusType === 'DEMO'
              const isStale = statusType === 'STALE'

              const badgeStyle = isDemo
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25'
                : isStale
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'

              const dotColor = isDemo ? 'bg-cyan-500' : isStale ? 'bg-amber-500' : 'bg-rose-500'

              return (
                <div
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${badgeStyle}`}
                  title={`Source: ${currentSymStatus.source}${currentSymStatus.lastUpdated ? ` • อัปเดตล่าสุด: ${new Date(currentSymStatus.lastUpdated).toLocaleTimeString()}` : ''}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
                  </span>
                  <span className="text-[11px] font-semibold">
                    {statusType}{isDemo ? ' • DEMO เท่านั้น' : ' • ใช้เทรดไม่ได้'}
                  </span>
                </div>
              )
            })()}

            {/* Total Portfolio Valuation (Bitkub Style) */}
            <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-3">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                มูลค่ากระเป๋า Spot รวม (DEMO)
              </div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-slate-900 dark:text-white leading-none mt-0.5">
                ฿{formatNumber(totalPortfolioTHB, 2)}
              </div>
            </div>

            {/* Available THB Cash */}
            <div className="text-right hidden sm:block">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                THB ที่ใช้ได้
              </div>
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
                ฿{formatNumber(availableTHB, 2)}
              </div>
            </div>

            {/* Demo deposit button */}
            <button
              onClick={() => setIsDepositModalOpen(true)}
              title="เพิ่มยอด THB จำลองผ่าน QR ตัวอย่าง (ไม่เชื่อมต่อธนาคาร)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>ฝาก QR จำลอง</span>
            </button>

            {/* Demo withdrawal button */}
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              title="จำลองการถอนเงิน (ไม่โอนเข้าบัญชีธนาคารจริง)"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer active:scale-95"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>ถอนจำลอง</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Terminal Grid: Chart + Positions (Left), OrderBook + OrderForm (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Column: Chart & Spot Positions (8 cols) */}
        <div className="xl:col-span-8 space-y-4 flex flex-col">
          
          {/* DEMO chart; external chart feeds are disabled in this phase. */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-500 font-semibold">กราฟ DEMO</span>
                <span className="text-slate-500 font-mono">{selectedSymbol} • {selectedPair.quoteAsset}</span>
              </div>
            </div>

            {/* Price scale and demo candles use the same pair quote unit as the order form. */}
            <div className="h-[460px] sm:h-[500px]">
              <TradingChart
                pair={selectedPair}
                candles={candles}
                currentPrice={currentPrice}
                priceChangePercent={null}
                tickDirection={tickDirections[selectedSymbol] || 'none'}
                limitOrders={openOrders}
                onCancelLimitOrder={handleCancelOpenOrder}
              />
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
              dataStatus="DEMO"
            />
          </div>

          <div className="flex-1 hidden md:block">
            <OrderForm
              pair={selectedPair}
              currentPrice={currentPrice}
              spotBalances={spotBalances}
              onSubmitOrder={handleOrderSubmit}
              priceStatus={selectedPriceStatus}
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
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-300">คำสั่ง Spot DEMO</span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="ปิดแผงคำสั่ง"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <OrderForm
              pair={selectedPair}
              currentPrice={currentPrice}
              spotBalances={spotBalances}
              priceStatus={selectedPriceStatus}
              onSubmitOrder={(order) => {
                const result = handleOrderSubmit(order)
                if (result?.success) setMobileDrawerOpen(false)
                return result
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
          const result = onDepositTHB
            ? onDepositTHB(amount)
            : applySpotDeposit(localAccountRef.current, amount)
          if (!result?.success) {
            addToast('เพิ่มยอดจำลองไม่สำเร็จ', result?.error || 'ยอดจำลองไม่ถูกต้อง', 'error')
            return result
          }
          if (!onDepositTHB) {
            localAccountRef.current = result.account
            setLocalSpotBalances(result.account.spotBalances)
          }
          soundEffects.playProfitClose()
          addToast('เพิ่มยอด THB จำลองสำเร็จ', `+฿${formatNumber(amount, 2)} ใน Spot Wallet DEMO • ไม่มีการรับเงินจริง`, 'success')
          return result
        }}
      />

      {/* Bank Withdrawal Modal */}
      <SpotWithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableTHB={availableTHB}
        onWithdraw={(data) => {
          const result = onWithdrawTHB
            ? onWithdrawTHB(data)
            : applySpotWithdrawal(localAccountRef.current, data)
          if (!result?.success) {
            addToast('ถอนจำลองไม่สำเร็จ', result?.error || 'รายการไม่ผ่านการตรวจสอบ', 'error')
            return result
          }
          if (!onWithdrawTHB) {
            localAccountRef.current = result.account
            setLocalSpotBalances(result.account.spotBalances)
          }
          soundEffects.playProfitClose()
          addToast(
            'ถอนเงินบาทจำลองสำเร็จ',
            `หัก ฿${formatNumber(data.amount, 2)} • fee ฿${formatNumber(data.fee, 2)} • net จำลอง ฿${formatNumber(data.netAmount, 2)} • ${data.bank} (${data.accountNo}) • ไม่มีการโอนเงินจริง`,
            'info'
          )
          return result
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
