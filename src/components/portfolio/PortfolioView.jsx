import React, { useState, useEffect } from 'react'
import {
  PieChart as ChartIcon,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  DollarSign,
  Coins,
  Building,
  Shield,
  Layers,
  X,
  Check,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  Target
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { formatCurrency, formatPercent, formatNumber, calculatePips, formatPips } from '../../utils/formatters'
import liveMarketService from '../../services/liveMarketService'

export default function PortfolioView({
  portfolio = [],
  onAddAsset,
  onDeleteAsset,
  onClearAllPortfolio,
  tradingPositions = [],
  tradingBalance = 0,
  onCloseTradingPosition,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [viewTab, setViewTab] = useState('holdings') // 'holdings' | 'trading'
  const [livePrices, setLivePrices] = useState(() => ({ ...liveMarketService.prices }))
  const [priceFlashMap, setPriceFlashMap] = useState({})

  // Form State
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [type, setType] = useState('fund')
  const [shares, setShares] = useState('')
  const [avgBuyPrice, setAvgBuyPrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')

  // 1. Subscribe to Live Market WebSocket & Interbank Stream (0ms Real-Time Feed)
  useEffect(() => {
    const unsubscribe = liveMarketService.subscribe((prices, tickInfo) => {
      setLivePrices({ ...prices })
      if (tickInfo && tickInfo.symbol) {
        setPriceFlashMap((prev) => ({
          ...prev,
          [tickInfo.symbol]: tickInfo.direction,
        }))
        setTimeout(() => {
          setPriceFlashMap((prev) => ({
            ...prev,
            [tickInfo.symbol]: 'none',
          }))
        }, 600)
      }
    })
    return () => unsubscribe()
  }, [])

  // 2. Real-time Price Resolver for Portfolio Holdings in THB
  const THB_PER_USD = 35.0

  const getLiveAssetPrice = (item) => {
    const sym = (item.symbol || '').toUpperCase().trim()

    // Bitcoin
    if (sym === 'BTC' || sym.includes('BTC')) {
      const btcUsd = livePrices['BTC/USDT']
      if (btcUsd) {
        return {
          price: Math.round(btcUsd * THB_PER_USD),
          isLive: true,
          feed: `BTC/USDT ($${formatNumber(btcUsd, 2)})`,
          flashKey: 'BTC/USDT',
        }
      }
    }

    // Ethereum
    if (sym === 'ETH' || sym.includes('ETH')) {
      const ethUsd = livePrices['ETH/USDT']
      if (ethUsd) {
        return {
          price: Math.round(ethUsd * THB_PER_USD),
          isLive: true,
          feed: `ETH/USDT ($${formatNumber(ethUsd, 2)})`,
          flashKey: 'ETH/USDT',
        }
      }
    }

    // Gold (Gold Spot XAU/USD -> Thai Baht Weight: 15.244g @ 96.5% purity)
    if (sym === 'GOLD' || sym.includes('GOLD') || sym.includes('XAU')) {
      const goldUsd = livePrices['GOLD/USD']
      if (goldUsd) {
        const thaiBahtPrice = Math.round((goldUsd / 31.1035) * 15.244 * 0.965 * THB_PER_USD)
        return {
          price: thaiBahtPrice,
          isLive: true,
          feed: `XAU/USD ($${formatNumber(goldUsd, 2)})`,
          flashKey: 'GOLD/USD',
        }
      }
    }

    // US Stocks (NVDA, TSLA, etc.)
    if (sym === 'NVDA' || sym.includes('NVDA')) {
      const p = livePrices['NVDA/USD']
      if (p) {
        return {
          price: parseFloat((p * THB_PER_USD).toFixed(2)),
          isLive: true,
          feed: `NVDA ($${formatNumber(p, 2)})`,
          flashKey: 'NVDA/USD',
        }
      }
    }

    if (sym === 'TSLA' || sym.includes('TSLA')) {
      const p = livePrices['TSLA/USD']
      if (p) {
        return {
          price: parseFloat((p * THB_PER_USD).toFixed(2)),
          isLive: true,
          feed: `TSLA ($${formatNumber(p, 2)})`,
          flashKey: 'TSLA/USD',
        }
      }
    }

    // Default: use item's static stored currentPrice
    return {
      price: item.currentPrice,
      isLive: false,
      feed: null,
      flashKey: null,
    }
  }

  // 3. Map Holdings to Live Values
  const liveHoldings = portfolio.map((item) => {
    const { price: livePrice, isLive, feed, flashKey } = getLiveAssetPrice(item)
    const currentValue = item.shares * livePrice
    const costValue = item.shares * item.avgBuyPrice
    const pl = currentValue - costValue
    const plPercent = costValue > 0 ? (pl / costValue) * 100 : 0
    const flash = flashKey ? priceFlashMap[flashKey] : 'none'
    return {
      ...item,
      livePrice,
      isLive,
      feed,
      flash,
      currentValue,
      costValue,
      pl,
      plPercent,
      isProfit: pl >= 0,
    }
  })

  // 4. Map Active Paper Trading Positions to Live Values with Pips
  const liveTradingPositions = (tradingPositions || []).map((pos) => {
    const currentPrice = livePrices[pos.symbol] || pos.entryPrice
    const isLong = pos.side === 'LONG'
    const priceDiffRatio = isLong
      ? (currentPrice - pos.entryPrice) / pos.entryPrice
      : (pos.entryPrice - currentPrice) / pos.entryPrice
    const pnl = Math.round(priceDiffRatio * pos.leverage * pos.amount)
    const pnlPercent = (pnl / pos.amount) * 100
    const pips = calculatePips(pos.entryPrice, currentPrice, pos.side, pos.symbol)
    return {
      ...pos,
      currentPrice,
      pnl,
      pnlPercent,
      pips,
      isProfit: pnl >= 0,
    }
  })

  // Compute stats
  const holdingsValue = liveHoldings.reduce((sum, item) => sum + item.currentValue, 0)
  const holdingsCost = liveHoldings.reduce((sum, item) => sum + item.costValue, 0)
  const holdingsProfitLoss = holdingsValue - holdingsCost
  const holdingsProfitLossPercent = holdingsCost > 0 ? (holdingsProfitLoss / holdingsCost) * 100 : 0

  const tradingPositionsPnL = liveTradingPositions.reduce((sum, p) => sum + p.pnl, 0)
  const tradingMarginUsed = liveTradingPositions.reduce((sum, p) => sum + p.amount, 0)
  const tradingAccountEquity = tradingBalance + tradingMarginUsed + tradingPositionsPnL

  // Total Net Worth (Holdings + Trading Equity)
  const totalNetWorth = holdingsValue + tradingAccountEquity
  const totalCombinedPnL = holdingsProfitLoss + tradingPositionsPnL

  // Chart data
  const chartData = liveHoldings.map((item) => ({
    name: item.name,
    value: Math.round(item.currentValue),
    color: item.color || '#10b981',
  }))

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!name || !shares || !avgBuyPrice || !currentPrice) {
      alert('กรุณากรอกข้อมูลสินทรัพย์ให้ครบถ้วน')
      return
    }

    const typeNames = {
      fund: 'กองทุนรวม',
      stock: 'หุ้น / ETF',
      crypto: 'คริปโตเคอร์เรนซี',
      gold: 'ทองคำ',
      cash: 'เงินสด/เงินฝาก'
    }

    const colors = {
      fund: '#3b82f6',
      stock: '#10b981',
      crypto: '#f59e0b',
      gold: '#eab308',
      cash: '#06b6d4'
    }

    const newAsset = {
      id: 'port-' + Date.now(),
      name: name.trim(),
      symbol: (symbol.trim() || name.trim()).toUpperCase(),
      type,
      typeName: typeNames[type] || 'สินทรัพย์',
      shares: parseFloat(shares),
      avgBuyPrice: parseFloat(avgBuyPrice),
      currentPrice: parseFloat(currentPrice),
      color: colors[type] || '#8b5cf6',
    }

    onAddAsset(newAsset)
    setName('')
    setSymbol('')
    setShares('')
    setAvgBuyPrice('')
    setCurrentPrice('')
    setIsAddModalOpen(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Live Market Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <ChartIcon className="w-7 h-7 text-emerald-500" />
              <span>พอร์ตโฟลิโอเรียลไทม์ (Real-Time Portfolio)</span>
            </h1>
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE FEED 0ms</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            มูลค่าพอร์ตอัปเดตแบบเรียลไทม์เชื่อมต่อ WebSocket ตลาดโลก (Binance & Interbank) คำนวณ PnL และ Pips อัตโนมัติ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {portfolio.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการล้างสินทรัพย์ทั้งหมดในพอร์ต (${portfolio.length} รายการ)?\n\nการกระทำนี้จะลบรายการสินทรัพย์ทั้งหมดให้กลับเป็น 0 ทันที`)) {
                  if (onClearAllPortfolio) onClearAllPortfolio()
                }
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
              title="ล้างสินทรัพย์ในพอร์ตทั้งหมด"
            >
              <Trash2 className="w-4 h-4" />
              <span>ล้างพอร์ต ({portfolio.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสินทรัพย์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Real-time Rate Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>ราคาตลาดสด:</span>
          </span>
          <span className="text-slate-700 dark:text-slate-300">
            BTC: <strong className="text-amber-500">${formatNumber(livePrices['BTC/USDT'] || 0, 2)}</strong>
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-700 dark:text-slate-300">
            ทองคำ: <strong className="text-amber-400">${formatNumber(livePrices['GOLD/USD'] || 0, 2)}</strong> (~฿{formatNumber((livePrices['GOLD/USD'] || 0) / 31.1035 * 15.244 * 0.965 * 35.0, 0)}/บาท)
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-700 dark:text-slate-300">
            EUR/USD: <strong className="text-blue-400">${formatNumber(livePrices['EUR/USD'] || 1.1485, 4)}</strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          อ้างอิงอัตราแลกเปลี่ยน: <strong className="text-emerald-400 font-bold">1 USD = 35.00 THB</strong>
        </div>
      </div>

      {/* Portfolio Top Metrics (3 Primary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Net Worth */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 font-medium">มูลค่าสินทรัพย์สุทธิรวม (Total Net Worth)</div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
              เรียลไทม์
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalNetWorth, false)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>สินทรัพย์ Spot: {formatCurrency(holdingsValue, false)}</span>
            <span>พอร์ตเทรด: {formatCurrency(tradingAccountEquity, false)}</span>
          </div>
        </div>

        {/* Card 2: Unrealized P&L */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">กำไร / ขาดทุนรวม (Total Unrealized P&L)</div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1 flex items-baseline space-x-2 ${
            totalCombinedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            <span>{totalCombinedPnL >= 0 ? '+' : ''}{formatCurrency(totalCombinedPnL, false)}</span>
          </div>
          <div className={`text-xs font-semibold mt-1 flex items-center space-x-1 ${
            totalCombinedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {totalCombinedPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>Spot: {formatPercent(holdingsProfitLossPercent)} • เทรดดิ้ง: {tradingPositionsPnL >= 0 ? '+' : ''}฿{formatNumber(tradingPositionsPnL)}</span>
          </div>
        </div>

        {/* Card 3: Trading Account Equity */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">พอร์ตจำลองการเทรด (Trading Account)</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatCurrency(tradingAccountEquity, false)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span>เงินคงเหลือ: ฿{formatNumber(tradingBalance)}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">{liveTradingPositions.length} สัญญาเปิดอยู่</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setViewTab('holdings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === 'holdings'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>สินทรัพย์ที่ถือครอง Spot ({liveHoldings.length})</span>
        </button>

        <button
          onClick={() => setViewTab('trading')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewTab === 'trading'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>สัญญาพอร์ตเทรด Real-Time ({liveTradingPositions.length})</span>
          {liveTradingPositions.length > 0 && (
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-extrabold ${
              tradingPositionsPnL >= 0 ? 'bg-emerald-400 text-slate-950' : 'bg-rose-400 text-white'
            }`}>
              {tradingPositionsPnL >= 0 ? '+' : ''}฿{formatNumber(tradingPositionsPnL)}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SPOT HOLDINGS VIEW */}
      {viewTab === 'holdings' && (
        portfolio.length === 0 ? (
          <div className="py-20 text-center px-4 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-inner">
              <ChartIcon className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              ยังไม่มีสินทรัพย์ในพอร์ตโฟลิโอ
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              เริ่มต้นเพิ่มกองทุน หุ้น คริปโต หรือทองคำ เพื่อติดตามมูลค่ารวม กำไร/ขาดทุน และสัดส่วนพอร์ตแบบเรียลไทม์
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-5 inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสินทรัพย์แรกของคุณ</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut Chart (4 cols) */}
            <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col items-center justify-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 self-start">
                สัดส่วนการจัดสรรสินทรัพย์ (Asset Allocation)
              </h3>
            
            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'มูลค่า']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-1 mt-2 max-h-40 overflow-y-auto font-sans">
              {liveHoldings.map((item) => {
                const pct = holdingsValue > 0 ? ((item.currentValue / holdingsValue) * 100).toFixed(1) : 0
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Assets Table (8 cols) */}
          <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <span>รายการสินทรัพย์และผลตอบแทน</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ⚡ ซิงค์ราคาตลาดสด
                </span>
              </h3>
              <span className="text-xs text-slate-400">หน่วยเงินบาท (THB)</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-4">สินทรัพย์</th>
                    <th className="py-3 px-3 text-right">จำนวน</th>
                    <th className="py-3 px-3 text-right">ต้นทุนเฉลี่ย</th>
                    <th className="py-3 px-3 text-right">ราคาปัจจุบัน</th>
                    <th className="py-3 px-3 text-right">มูลค่ารวม</th>
                    <th className="py-3 px-3 text-right">กำไร/ขาดทุน</th>
                    <th className="py-3 px-3 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {liveHoldings.map((item) => {
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          item.flash === 'up'
                            ? 'bg-emerald-500/10'
                            : item.flash === 'down'
                            ? 'bg-rose-500/10'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5 font-mono">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                              {item.symbol}
                            </span>
                            <span>•</span>
                            <span>{item.typeName}</span>
                            {item.isLive && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                                {item.feed}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300 font-mono">
                          {formatNumber(item.shares, item.type === 'crypto' ? 4 : 2)}
                        </td>

                        <td className="py-3 px-3 text-right text-slate-500 font-mono">
                          ฿{formatNumber(item.avgBuyPrice, 2)}
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          <div className="flex items-center justify-end space-x-1">
                            {item.isLive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                            <span>฿{formatNumber(item.livePrice, 2)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                          {formatCurrency(item.currentValue, false)}
                        </td>

                        <td className={`py-3 px-3 text-right font-bold font-mono ${
                          item.isProfit ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          <div>{item.isProfit ? '+' : ''}{formatCurrency(item.pl, false)}</div>
                          <div className="text-[10px]">{formatPercent(item.plPercent)}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`ต้องการลบ ${item.name} ออกจากพอร์ตหรือไม่?`)) {
                                onDeleteAsset(item.id)
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )
      )}

      {/* TAB 2: ACTIVE TRADING POSITIONS VIEW (CONTRACTS & PIPS) */}
      {viewTab === 'trading' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <span>สัญญาพอร์ตเทรด Real-Time (Active Trading Positions)</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {liveTradingPositions.length} สัญญา
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                คำนวณกำไร/ขาดทุนเป็นเงินบาท (THB) และระยะการเคลื่อนที่ของราคาเป็น Pips แบบเรียลไทม์
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300">
                หลักประกันรวม: <strong className="text-white">฿{formatNumber(tradingMarginUsed)}</strong>
              </div>
              <div className={`px-3 py-1 rounded-xl border ${
                tradingPositionsPnL >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                PnL รวม: <strong>{tradingPositionsPnL >= 0 ? '+' : ''}฿{formatNumber(tradingPositionsPnL)}</strong>
              </div>
            </div>
          </div>

          {liveTradingPositions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Target className="w-12 h-12 text-slate-600 mb-3" />
              <div className="text-sm font-bold text-slate-300">ไม่มีสัญญาที่เปิดอยู่ในขณะนี้</div>
              <div className="text-xs text-slate-500 mt-1 max-w-sm">
                เข้าสู่หน้า <strong>"เทรดจำลอง (Paper Trading)"</strong> เพื่อเปิดออเดอร์ Long / Short พร้อมคำนวณ Pip และ Bid/Ask
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 font-bold uppercase font-mono">
                    <th className="py-3 px-4">คู่เหรียญ / คู่เงิน</th>
                    <th className="py-3 px-3">คำสั่ง</th>
                    <th className="py-3 px-3 text-right">หลักประกัน (Margin)</th>
                    <th className="py-3 px-3 text-right">ราคาเข้า (Entry)</th>
                    <th className="py-3 px-3 text-right">ราคาตลาด (Mark)</th>
                    <th className="py-3 px-3 text-right">ระยะ (Pips)</th>
                    <th className="py-3 px-3 text-right">กำไร/ขาดทุน (PnL)</th>
                    <th className="py-3 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-mono">
                  {liveTradingPositions.map((pos) => {
                    const isLong = pos.side === 'LONG'
                    return (
                      <tr key={pos.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {pos.symbol}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            เวลาเข้า: {pos.openedAt || 'เพิ่งเปิด'}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {pos.side} {pos.leverage}x
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-slate-300">
                          ฿{formatNumber(pos.amount)}
                        </td>

                        <td className="py-3 px-3 text-right text-slate-400">
                          ${formatNumber(pos.entryPrice, 2)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-white">
                          ${formatNumber(pos.currentPrice, 2)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold">
                          <span className={`px-2 py-0.5 rounded-lg text-xs ${
                            pos.pips >= 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {formatPips(pos.pips)}
                          </span>
                        </td>

                        <td className={`py-3 px-3 text-right font-bold ${
                          pos.isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <div className="text-sm">{pos.isProfit ? '+' : ''}฿{formatNumber(pos.pnl)}</div>
                          <div className="text-[10px]">{formatPercent(pos.pnlPercent)}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              if (onCloseTradingPosition) {
                                onCloseTradingPosition(pos.id, pos.pnl)
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-all active:scale-95 shadow-md cursor-pointer"
                          >
                            ปิดออเดอร์
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                เพิ่มสินทรัพย์ในพอร์ตการลงทุน
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">ประเภทสินทรัพย์</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="fund">กองทุนรวม (Mutual Fund)</option>
                  <option value="stock">หุ้น / ETF (Stock)</option>
                  <option value="crypto">คริปโตเคอร์เรนซี (Cryptocurrency)</option>
                  <option value="gold">ทองคำ (Gold)</option>
                  <option value="cash">เงินสด / เงินฝากดอกเบี้ยสูง</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">ชื่อสินทรัพย์ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Apple Inc., SET50, ทองคำแท่ง"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">สัญลักษณ์ย่อ (Symbol)</label>
                <input
                  type="text"
                  placeholder="เช่น AAPL, BTC, GOLD"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">จำนวนหน่วย *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="10"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">ต้นทุนเฉลี่ย *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="100"
                    value={avgBuyPrice}
                    onChange={(e) => setAvgBuyPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">ราคาปัจจุบัน *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="120"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-md flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกสินทรัพย์ลงพอร์ต</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
