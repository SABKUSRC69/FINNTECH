import React, { useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Award,
  Download,
  Percent,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function AnalyticsView({
  tradingBalance = 500000,
  tradeHistory = [],
  positions = [],
}) {
  // Compute Key Analytics Metrics
  const stats = useMemo(() => {
    const totalTrades = tradeHistory.length
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        netPnL: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgTrade: 0,
        grossProfit: 0,
        grossLoss: 0,
      }
    }

    let winCount = 0
    let lossCount = 0
    let grossProfit = 0
    let grossLoss = 0
    let bestTrade = -Infinity
    let worstTrade = Infinity

    tradeHistory.forEach((t) => {
      const pnl = Number(t.pnl) || 0
      if (pnl >= 0) {
        winCount++
        grossProfit += pnl
      } else {
        lossCount++
        grossLoss += Math.abs(pnl)
      }
      if (pnl > bestTrade) bestTrade = pnl
      if (pnl < worstTrade) worstTrade = pnl
    })

    const netPnL = grossProfit - grossLoss
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0
    const avgTrade = totalTrades > 0 ? netPnL / totalTrades : 0

    return {
      totalTrades,
      winCount,
      lossCount,
      winRate: Math.round(winRate * 10) / 10,
      netPnL,
      profitFactor: Math.round(profitFactor * 100) / 100,
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade,
      avgTrade: Math.round(avgTrade),
      grossProfit,
      grossLoss,
    }
  }, [tradeHistory])

  // Equity Curve Data Points
  const equityPoints = useMemo(() => {
    // Starting balance approx
    const initialBalance = 500000
    let running = initialBalance
    const points = [{ label: 'เริ่มต้น', balance: initialBalance }]

    // tradeHistory is ordered newest-first, so reverse to plot chronologically
    const chronological = [...tradeHistory].reverse()
    chronological.forEach((t, idx) => {
      running += (Number(t.pnl) || 0)
      points.push({
        label: t.closedAt || `#${idx + 1}`,
        balance: running,
        pnl: Number(t.pnl) || 0,
      })
    })

    return points
  }, [tradeHistory])

  // CSV Export Handler
  const handleExportCSV = () => {
    if (tradeHistory.length === 0) {
      alert('ยังไม่มีประวัติการเทรดสำหรับส่งออกข้อมูล')
      return
    }

    const headers = ['ลำดับ', 'วันเวลาที่ปิด', 'คู่เทรด', 'ฝั่งสัญญา', 'เลเวอเรจ', 'หลักประกัน (บาท)', 'กำไร/ขาดทุนสุทธิ (บาท)', 'สถานะ']
    const rows = tradeHistory.map((t, idx) => [
      idx + 1,
      `"${t.closedAt || '-'}"`,
      `"${t.symbol || '-'}"`,
      t.side || '-',
      `${t.leverage || 1}x`,
      t.amount || 0,
      t.pnl || 0,
      (Number(t.pnl) >= 0 ? 'กำไร (Win)' : 'ขาดทุน (Loss)')
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `FINNTECH_Trade_History_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate SVG Graph Coordinates
  const svgWidth = 800
  const svgHeight = 220
  const paddingX = 40
  const paddingY = 25

  const minVal = Math.min(...equityPoints.map(p => p.balance)) * 0.98
  const maxVal = Math.max(...equityPoints.map(p => p.balance)) * 1.02
  const range = maxVal - minVal || 1

  const pointsString = equityPoints.map((p, i) => {
    const x = paddingX + (i / Math.max(1, equityPoints.length - 1)) * (svgWidth - paddingX * 2)
    const y = svgHeight - paddingY - ((p.balance - minVal) / range) * (svgHeight - paddingY * 2)
    return `${x},${y}`
  }).join(' ')

  const isProfitableTotal = stats.netPnL >= 0

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121721] border border-[#1e2638] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                สถิติและประสิทธิภาพการเทรด (Performance Analytics)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO INTEL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              วิเคราะห์อัตราการชนะ (Win Rate), Profit Factor, และกราฟการเติบโตของเงินทุนจำลอง
            </p>
          </div>
        </div>

        {/* Export CSV Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>ดาวน์โหลดประวัติเป็น CSV (Excel)</span>
        </button>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        
        {/* 1. Win Rate */}
        <div className="p-4 rounded-2xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>อัตราการชนะ (Win Rate)</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
              {stats.winRate}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span className="text-emerald-400 font-bold">{stats.winCount} ชนะ</span>
              <span>/</span>
              <span className="text-rose-400 font-bold">{stats.lossCount} แพ้</span>
            </div>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${stats.winRate}%` }} />
            <div className="bg-rose-500 h-full" style={{ width: `${100 - stats.winRate}%` }} />
          </div>
        </div>

        {/* 2. Total Realized PnL */}
        <div className="p-4 rounded-2xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>กำไรสุทธิสะสม (Net PnL)</span>
            {isProfitableTotal ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-mono font-black ${isProfitableTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitableTotal ? '+' : ''}{formatCurrency(stats.netPnL, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              เงินในพอร์ตปัจจุบัน: <strong className="text-white">{formatCurrency(tradingBalance, false)}</strong>
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            คำนวณจากออเดอร์ที่ปิดแล้วทั้งหมด
          </div>
        </div>

        {/* 3. Profit Factor */}
        <div className="p-4 rounded-2xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Profit Factor</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-400">
              {stats.profitFactor}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              กำไรรวม / ขาดทุนรวม
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            เกณฑ์ดี: &gt; 1.50
          </div>
        </div>

        {/* 4. Total Closed Trades */}
        <div className="p-4 rounded-2xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>จำนวนไม้ทั้งหมด (Trades)</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
              {stats.totalTrades}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              เปิดอยู่ขณะนี้: <strong className="text-emerald-400">{positions.length} ไม้</strong>
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            เฉลี่ย: {formatCurrency(stats.avgTrade, false)} / ไม้
          </div>
        </div>

        {/* 5. Best Trade */}
        <div className="p-4 rounded-2xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>ไม้กำไรสูงสุด (Best Trade)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
              +{formatCurrency(stats.bestTrade, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              สถิติกำไรสูงสุดในรอบนี้
            </div>
          </div>
          <div className="text-[10px] text-emerald-500/80 font-semibold">
            Great Execution!
          </div>
        </div>

        {/* 6. Worst Trade */}
        <div className="p-4 rounded-2xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>ไม้ขาดทุนสูงสุด (Max Drawdown)</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-mono font-black text-rose-400">
              {formatCurrency(stats.worstTrade, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              จุดตัดขาดทุนสูงสุด
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            บริหาร Stop Loss สม่ำเสมอ
          </div>
        </div>

      </div>

      {/* Equity Curve Chart Section */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#121721] border border-[#1e2638] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>กราฟแสดงการเติบโตของเงินทุน (Portfolio Equity Curve)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ติดตามเส้นทางการเติบโตของพอร์ตลงทุนตั้งแต่เริ่มต้น ฿500,000 จนถึงปัจจุบัน
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">มูลค่าพอร์ตปัจจุบัน</span>
            <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
              {formatCurrency(tradingBalance, false)}
            </div>
          </div>
        </div>

        {/* Interactive SVG Equity Curve */}
        <div className="w-full h-64 sm:h-72 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 sm:p-4 relative overflow-hidden flex items-center justify-center">
          {equityPoints.length <= 1 ? (
            <div className="text-center text-slate-500 text-xs">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
              <p className="font-semibold text-slate-400">ยังไม่มีข้อมูลการปิดออเดอร์เพื่อวาดกราฟ</p>
              <p className="text-[11px] text-slate-500 mt-1">ส่งคำสั่งเทรดและปิดสัญญาเพื่อดูเส้นทางการเติบโตของพอร์ต</p>
            </div>
          ) : (
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
              <defs>
                <linearGradient id="equityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Grid lines */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1={paddingX}
                  y1={paddingY + ratio * (svgHeight - paddingY * 2)}
                  x2={svgWidth - paddingX}
                  y2={paddingY + ratio * (svgHeight - paddingY * 2)}
                  stroke="#1e2638"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Area fill */}
              <polygon
                points={`${paddingX},${svgHeight - paddingY} ${pointsString} ${svgWidth - paddingX},${svgHeight - paddingY}`}
                fill="url(#equityGrad)"
              />

              {/* Line path */}
              <polyline
                points={pointsString}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {equityPoints.map((p, i) => {
                const x = paddingX + (i / Math.max(1, equityPoints.length - 1)) * (svgWidth - paddingX * 2)
                const y = svgHeight - paddingY - ((p.balance - minVal) / range) * (svgHeight - paddingY * 2)
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-slate-950 stroke-emerald-400 stroke-2 hover:r-6 transition-all cursor-pointer"
                  >
                    <title>{`${p.label}: ฿${formatNumber(p.balance)}`}</title>
                  </circle>
                )
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Closed Orders History Table */}
      <div className="p-5 rounded-3xl bg-[#121721] border border-[#1e2638] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">บันทึกประวัติการเทรดที่ปิดแล้ว (Trade History)</h3>
            <p className="text-xs text-slate-400">รายการออเดอร์ทั้งหมดที่เสร็จสิ้น พร้อมผลตอบแทนสุทธิ</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            ทั้งหมด {tradeHistory.length} รายการ
          </span>
        </div>

        {tradeHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-slate-400 font-semibold">ยังไม่มีประวัติการเทรดที่ปิดแล้ว</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2638] text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">คู่เทรด / ด้าน</th>
                  <th className="py-3 px-3">เลเวอเรจ</th>
                  <th className="py-3 px-3 text-right">หลักประกัน (Margin)</th>
                  <th className="py-3 px-3 text-right">กำไร / ขาดทุนสุทธิ</th>
                  <th className="py-3 px-3 text-right">เวลาปิดสัญญา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/60 text-[11px] font-mono">
                {tradeHistory.map((t, idx) => {
                  const isProfit = Number(t.pnl) >= 0
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-white">{t.symbol}</span>
                        <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          t.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{t.leverage}x</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrency(t.amount || 0, false)}</td>
                      <td className={`py-2.5 px-3 text-right font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(t.pnl, false)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{t.closedAt || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
