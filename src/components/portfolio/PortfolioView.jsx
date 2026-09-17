import React, { useState } from 'react'
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
  Check
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { formatCurrency, formatPercent, formatNumber } from '../../utils/formatters'

export default function PortfolioView({ portfolio, onAddAsset, onDeleteAsset }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [type, setType] = useState('fund')
  const [shares, setShares] = useState('')
  const [avgBuyPrice, setAvgBuyPrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')

  // Compute stats
  const totalValue = portfolio.reduce((sum, item) => sum + (item.shares * item.currentPrice), 0)
  const totalCost = portfolio.reduce((sum, item) => sum + (item.shares * item.avgBuyPrice), 0)
  const totalProfitLoss = totalValue - totalCost
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0

  // Chart data
  const chartData = portfolio.map((item) => ({
    name: item.name,
    value: Math.round(item.shares * item.currentPrice),
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
    // reset form
    setName('')
    setSymbol('')
    setShares('')
    setAvgBuyPrice('')
    setCurrentPrice('')
    setIsAddModalOpen(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <ChartIcon className="w-7 h-7 text-emerald-500" />
            <span>พอร์ตจำลองการลงทุน (Portfolio Tracker)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ติดตามมูลค่าสินทรัพย์ หุ้น กองทุนรวม ทองคำ และคริปโต พร้อมวิเคราะห์สัดส่วนและกำไร-ขาดทุน
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสินทรัพย์ใหม่</span>
        </button>
      </div>

      {/* Portfolio Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">มูลค่าพอร์ตปัจจุบัน (Total Value)</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalValue, false)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            ต้นทุนรวม: {formatCurrency(totalCost, false)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">กำไร / ขาดทุนรวม (Unrealized P&L)</div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1 flex items-baseline space-x-2 ${
            totalProfitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            <span>{totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss, false)}</span>
          </div>
          <div className={`text-xs font-semibold mt-1 flex items-center space-x-1 ${
            totalProfitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {totalProfitLoss >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{formatPercent(totalProfitLossPercent)} ตลอดการถือครอง</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">จำนวนสินทรัพย์ในพอร์ต</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {portfolio.length} รายการ
            </div>
            <div className="text-xs text-emerald-500 font-semibold mt-1">
              กระจายความเสี่ยงหลากหลาย
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Layers className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Allocation Chart & Details */}
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

          <div className="w-full space-y-1 mt-2 max-h-40 overflow-y-auto">
            {portfolio.map((item) => {
              const val = item.shares * item.currentPrice
              const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : 0
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
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              รายการสินทรัพย์และผลตอบแทน
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
                {portfolio.map((item) => {
                  const currentValue = item.shares * item.currentPrice
                  const costValue = item.shares * item.avgBuyPrice
                  const pl = currentValue - costValue
                  const plPercent = costValue > 0 ? (pl / costValue) * 100 : 0
                  const isProfit = pl >= 0

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold">
                            {item.symbol}
                          </span>
                          <span>•</span>
                          <span>{item.typeName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                        {formatNumber(item.shares, item.type === 'crypto' ? 4 : 2)}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-500">
                        ฿{formatNumber(item.avgBuyPrice, 2)}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                        ฿{formatNumber(item.currentPrice, 2)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(currentValue, false)}
                      </td>

                      <td className={`py-3 px-3 text-right font-bold ${
                        isProfit ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        <div>{isProfit ? '+' : ''}{formatCurrency(pl, false)}</div>
                        <div className="text-[10px]">{formatPercent(plPercent)}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`ต้องการลบ ${item.name} ออกจากพอร์ตหรือไม่?`)) {
                              onDeleteAsset(item.id)
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
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
