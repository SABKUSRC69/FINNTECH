import React, { useState } from 'react'
import {
  PieChart as ChartIcon,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  X,
  Check,
  Activity,
  Wallet,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { formatCurrency, formatPercent, formatNumber } from '../../utils/formatters'
import {
  calculatePortfolioValuation,
  calculateSpotWalletValuation,
  getDemoSpotPriceTHB,
} from '../../utils/assetValuation'

export default function PortfolioView({
  portfolio = [],
  onAddAsset,
  onDeleteAsset,
  onClearAllPortfolio,
  spotBalances = {},
  openOrders = [],
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const viewTab = 'holdings'

  // Form State
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [type, setType] = useState('fund')
  const [shares, setShares] = useState('')
  const [avgBuyPrice, setAvgBuyPrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [currency, setCurrency] = useState('THB')

  const portfolioValuation = calculatePortfolioValuation(portfolio)
  const liveHoldings = portfolioValuation.assets.map((item) => {
    const valuation = item.valuation
    return {
      ...item,
      livePrice: valuation.unitPrice,
      currency: valuation.currency,
      isDemo: valuation.priceSource === 'DEMO',
      feed: valuation.priceSourceText,
      flash: 'none',
      currentValue: valuation.currentValueTHB,
      costValue: valuation.costValueTHB,
      pl: valuation.profitLossTHB,
      plPercent: valuation.profitLossPercent,
      isProfit: valuation.profitLossTHB !== null && valuation.profitLossTHB >= 0,
    }
  })
  const holdingsValue = portfolioValuation.totalValueTHB
  const holdingsProfitLoss = portfolioValuation.profitLossTHB
  const holdingsProfitLossPercent = portfolioValuation.profitLossPercent

  const spotValuation = calculateSpotWalletValuation(spotBalances, openOrders)
  const spotWalletRows = spotValuation.rows
  const spotAvailableValue = spotValuation.availableValueTHB
  const spotLockedValue = spotValuation.lockedValueTHB
  const spotWalletValue = spotValuation.totalValueTHB
  const totalNetWorth = holdingsValue !== null && spotWalletValue !== null
    ? holdingsValue + spotWalletValue
    : null
  const totalCombinedPnL = holdingsProfitLoss
  const displayTHB = (value) => value === null || !Number.isFinite(value)
    ? 'N/A'
    : formatCurrency(value, false)

  // Chart data
  const chartData = holdingsValue === null ? [] : liveHoldings.map((item) => ({
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
      currency,
      color: colors[type] || '#8b5cf6',
    }

    onAddAsset(newAsset)
    setName('')
    setSymbol('')
    setShares('')
    setAvgBuyPrice('')
    setCurrentPrice('')
    setCurrency('THB')
    setIsAddModalOpen(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Live Market Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <ChartIcon className="w-6 h-6 text-emerald-400" />
              <span>พอร์ตโฟลิโอ</span>
            </h1>
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>DEMO</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            สรุปสินทรัพย์ที่บันทึกและ Spot Wallet จากราคาอ้างอิง DEMO
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-xs font-medium shadow-sm transition-all cursor-pointer"
              title="ล้างสินทรัพย์ในพอร์ตทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างพอร์ต ({portfolio.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มสินทรัพย์</span>
          </button>
        </div>
      </div>

      {/* DEMO reference prices */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1 text-[11px]">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>ราคาอ้างอิง DEMO:</span>
          </span>
          <span className="text-slate-700 dark:text-slate-300">
            BTC/THB: <strong className="text-amber-400 font-medium">฿{formatNumber(getDemoSpotPriceTHB('BTC') || 0, 2)}</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-700 dark:text-slate-300">
            USDT/THB: <strong className="text-amber-400 font-medium">฿{formatNumber(getDemoSpotPriceTHB('USDT') || 0, 2)}</strong>
          </span>
        </div>
        <div className="text-[11px] text-cyan-400 font-mono">
          ไม่ใช่ราคาตลาด LIVE
        </div>
      </div>

      {/* Portfolio Top Metrics (3 Primary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Total Net Worth */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400 font-medium">มูลค่าสินทรัพย์สุทธิรวม</div>
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-medium">
              DEMO
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            {displayTHB(totalNetWorth)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
            <span>สินทรัพย์ที่บันทึก: {displayTHB(holdingsValue)}</span>
            <span>Spot Wallet: {displayTHB(spotWalletValue)}</span>
          </div>
        </div>

        {/* Card 2: Unrealized P&L */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">กำไร / ขาดทุนรวม</div>
          <div className={`text-2xl font-bold font-mono mt-1 flex items-baseline space-x-2 ${
            totalCombinedPnL === null ? 'text-slate-400' : totalCombinedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span>{totalCombinedPnL === null ? 'N/A' : `${totalCombinedPnL >= 0 ? '+' : ''}${formatCurrency(totalCombinedPnL, false)}`}</span>
          </div>
          <div className={`text-xs font-medium font-mono mt-1 flex items-center space-x-1 ${
            totalCombinedPnL === null ? 'text-slate-400' : totalCombinedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {totalCombinedPnL === null ? null : totalCombinedPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>บันทึก: {holdingsProfitLossPercent === null ? 'N/A' : formatPercent(holdingsProfitLossPercent)} • คำนวณจากสินทรัพย์ที่บันทึก</span>
          </div>
        </div>

        {/* Card 3: Spot Wallet including locked balances */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Spot Wallet รวมยอดล็อก (DEMO)</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">
              {displayTHB(spotWalletValue)}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-1 flex items-center space-x-2">
              <span>ใช้ได้: {displayTHB(spotAvailableValue)}</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">ล็อก: {displayTHB(spotLockedValue)}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      <section className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Spot Wallet (DEMO)</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">ยอดที่ใช้ได้และยอดที่ล็อกใน Limit order แสดงแยกกัน</p>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            รวมอ้างอิง: {displayTHB(spotWalletValue)}
          </div>
        </div>
        {spotWalletRows.length === 0 ? (
          <p className="p-5 text-center text-xs text-slate-500">Spot Wallet ว่าง</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2.5">สินทรัพย์</th>
                  <th className="text-right px-4 py-2.5">ใช้ได้</th>
                  <th className="text-right px-4 py-2.5">ล็อก</th>
                  <th className="text-right px-4 py-2.5">รวม</th>
                  <th className="text-right px-4 py-2.5">มูลค่า THB DEMO</th>
                </tr>
              </thead>
              <tbody>
                {spotWalletRows.map((row) => (
                  <tr key={row.asset} className="border-t border-slate-100 dark:border-slate-800/70">
                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">{row.asset}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNumber(row.available, 8)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-amber-400">{formatNumber(row.locked, 8)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNumber(row.total, 8)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{row.valueTHB === null ? 'N/A' : formatCurrency(row.valueTHB, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* TAB 1: SPOT HOLDINGS VIEW */}
      {viewTab === 'holdings' && (
        portfolio.length === 0 ? (
          <div className="py-16 text-center px-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <ChartIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              ยังไม่มีสินทรัพย์ในพอร์ตโฟลิโอ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              เพิ่มสินทรัพย์ที่ต้องการบันทึกด้วยตนเอง มูลค่าอ้างอิงจากราคา DEMO เฉพาะคู่ Spot ที่รองรับ
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มสินทรัพย์</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Donut Chart (4 cols) */}
            <div className="lg:col-span-4 p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col items-center justify-center">
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs mb-2 self-start">
                สัดส่วนการจัดสรรสินทรัพย์
              </h3>
            
            <div className="h-52 w-full relative flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'มูลค่า']}
                      contentStyle={{
                        backgroundColor: '#0c1017',
                        borderColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="px-4 text-center text-xs text-slate-500">ประเมินสัดส่วนไม่ได้จนกว่าจะมีสกุลเงินและอัตราแปลงที่รองรับครบ</p>
              )}
            </div>

            <div className="w-full space-y-1 mt-2 max-h-40 overflow-y-auto font-sans">
              {liveHoldings.map((item) => {
                const pct = holdingsValue > 0 && item.currentValue !== null
                  ? `${((item.currentValue / holdingsValue) * 100).toFixed(1)}%`
                  : 'N/A'
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate text-[11px]">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-slate-100 font-mono text-[11px]">{pct}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Assets Table (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs flex items-center space-x-2">
                <span>รายการสินทรัพย์</span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  ราคาอ้างอิง DEMO / ผู้ใช้กรอก
                </span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">THB</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 font-medium font-mono text-[11px]">
                    <th className="py-2.5 px-3.5">สินทรัพย์</th>
                    <th className="py-2.5 px-3 text-right">จำนวน</th>
                    <th className="py-2.5 px-3 text-right">ต้นทุนเฉลี่ย</th>
                    <th className="py-2.5 px-3 text-right">ราคาปัจจุบัน</th>
                    <th className="py-2.5 px-3 text-right">มูลค่ารวม THB</th>
                    <th className="py-2.5 px-3 text-right">กำไร/ขาดทุน THB</th>
                    <th className="py-2.5 px-3 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {liveHoldings.map((item) => {
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
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
                            <span>• {item.currency || 'ไม่ระบุสกุลเงิน'}</span>
                            {item.isDemo && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 font-bold">
                                {item.feed}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300 font-mono">
                          {formatNumber(item.shares, item.type === 'crypto' ? 4 : 2)}
                        </td>

                        <td className="py-3 px-3 text-right text-slate-500 font-mono">
                          {item.currency ? `${formatNumber(item.avgBuyPrice, 2)} ${item.currency}` : 'N/A'}
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          <div className="flex items-center justify-end space-x-1">
                            {item.isDemo && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                            <span>{item.currency && Number.isFinite(item.livePrice) ? `${formatNumber(item.livePrice, 2)} ${item.currency}` : 'N/A'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                          {displayTHB(item.currentValue)}
                        </td>

                        <td className={`py-3 px-3 text-right font-bold font-mono ${
                          item.pl === null ? 'text-slate-400' : item.isProfit ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          <div>{item.pl === null ? 'N/A' : `${item.isProfit ? '+' : ''}${formatCurrency(item.pl, false)}`}</div>
                          <div className="text-[10px]">{item.plPercent === null ? 'N/A' : formatPercent(item.plPercent)}</div>
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

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#0e131f] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                เพิ่มสินทรัพย์ในพอร์ต
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">ประเภทสินทรัพย์</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none"
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
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">สัญลักษณ์ย่อ (Symbol)</label>
                <input
                  type="text"
                  placeholder="เช่น AAPL, BTC, GOLD"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">สกุลเงินของต้นทุนและราคาปัจจุบัน *</label>
                <select
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="THB">THB</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="USDT">USDT</option>
                </select>
                <p className="mt-1 text-[10px] text-slate-500">ตอนนี้ประเมินเป็น THB ได้เฉพาะรายการ THB และ Spot DEMO ที่รองรับ</p>
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
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none placeholder-slate-500"
                  />
                </div>
                <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">ต้นทุนเฉลี่ย ({currency}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="100"
                    value={avgBuyPrice}
                    onChange={(e) => setAvgBuyPrice(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none placeholder-slate-500"
                  />
                </div>
                <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">ราคาปัจจุบัน ({currency}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="120"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกสินทรัพย์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
