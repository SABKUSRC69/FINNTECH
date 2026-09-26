import React, { useMemo } from 'react'
import { Activity, Award, BarChart3, Download, Layers, TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { buildSpotTradesCsv, getRealizedSpotPnl, summarizeSpotTrades } from '../../services/spotAnalyticsService'

function displayPnl(value) {
  if (value === null || !Number.isFinite(value)) return 'ยังคำนวณไม่ได้'
  return `${value > 0 ? '+' : ''}${formatCurrency(value, false)}`
}

function displayDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('th-TH')
}

export default function AnalyticsView({ tradingBalance = 0, tradeHistory = [] }) {
  const stats = useMemo(() => summarizeSpotTrades(tradeHistory), [tradeHistory])
  const realizedTrades = useMemo(
    () => tradeHistory.filter((trade) => getRealizedSpotPnl(trade) !== null).slice().reverse(),
    [tradeHistory],
  )
  const equityPoints = useMemo(() => {
    let runningPnl = 0
    const points = [{ label: 'เริ่มต้น', pnl: 0 }]
    realizedTrades.forEach((trade, index) => {
      runningPnl += getRealizedSpotPnl(trade)
      points.push({ label: trade.executedAt || `#${index + 1}`, pnl: runningPnl })
    })
    return points
  }, [realizedTrades])

  const handleExportCSV = () => {
    if (tradeHistory.length === 0) {
      alert('ยังไม่มีประวัติ Spot trade สำหรับส่งออกข้อมูล')
      return
    }
    const blob = new Blob([buildSpotTradesCsv(tradeHistory)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `FINNTECH_Spot_Trade_History_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const chartWidth = 800
  const chartHeight = 220
  const padding = 28
  const values = equityPoints.map((point) => point.pnl)
  const minValue = Math.min(0, ...values)
  const maxValue = Math.max(0, ...values)
  const range = maxValue - minValue || 1
  const pointString = equityPoints.map((point, index) => {
    const x = padding + (index / Math.max(1, equityPoints.length - 1)) * (chartWidth - padding * 2)
    const y = chartHeight - padding - ((point.pnl - minValue) / range) * (chartHeight - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const statsUnavailable = 'ยังคำนวณไม่ได้'
  const resolvedLabel = `คำนวณได้ ${stats.realizedTradeCount} จาก ${stats.totalTrades} รายการ`
  const summaryCards = [
    {
      label: 'อัตราการชนะ',
      value: stats.winRate === null ? 'N/A' : `${stats.winRate.toFixed(1)}%`,
      detail: `${stats.winCount} ชนะ · ${stats.lossCount} แพ้ · ${stats.breakEvenCount} เท่าทุน`,
      icon: Award,
      color: 'text-amber-400',
    },
    {
      label: 'กำไร/ขาดทุนที่รับรู้',
      value: displayPnl(stats.netPnL),
      detail: 'ต้องมี cost basis ของ Spot asset',
      icon: stats.netPnL !== null && stats.netPnL >= 0 ? TrendingUp : TrendingDown,
      color: 'text-cyan-400',
    },
    {
      label: 'Profit Factor',
      value: stats.profitFactor === null ? 'N/A' : stats.profitFactor.toFixed(2),
      detail: 'คำนวณจากรายการที่มี realized P&L',
      icon: Activity,
      color: 'text-violet-400',
    },
    {
      label: 'Spot trades',
      value: String(stats.totalTrades),
      detail: resolvedLabel,
      icon: Layers,
      color: 'text-slate-300',
    },
    {
      label: 'กำไรสูงสุด',
      value: displayPnl(stats.bestTrade),
      detail: 'จาก realized P&L ที่มีข้อมูล',
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'ขาดทุนสูงสุด',
      value: displayPnl(stats.worstTrade),
      detail: 'จาก realized P&L ที่มีข้อมูล',
      icon: TrendingDown,
      color: 'text-rose-400',
    },
  ]

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121721] border border-[#1e2638] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white">สถิติ Spot Trading</h1>
            <p className="text-xs text-slate-400 mt-0.5">สรุปจากประวัติคำสั่ง Spot DEMO ในบัญชีนี้</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>ดาวน์โหลด Spot trades เป็น CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {summaryCards.map(({ label, value, detail, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-2xl bg-[#121721] border border-[#1e2638] flex min-w-0 flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2 text-slate-400 text-xs font-semibold">
              <span>{label}</span>
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
            </div>
            <div className={`text-lg sm:text-xl font-mono font-black break-words ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-500">{detail}</div>
          </div>
        ))}
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-[#121721] border border-[#1e2638] shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> P&L สะสมจาก Spot trades
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">ยอด THB ที่ใช้ได้: {formatCurrency(tradingBalance, false)}</p>
          </div>
          <span className="text-xs text-slate-500">{resolvedLabel}</span>
        </div>
        <div className="w-full h-56 sm:h-64 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 sm:p-4 flex items-center justify-center">
          {equityPoints.length <= 1 ? (
            <div className="text-center text-slate-500 text-xs">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
              <p className="font-semibold text-slate-300">{statsUnavailable}</p>
              <p className="mt-1">ยังไม่มี cost basis เพียงพอสำหรับคำนวณ realized P&L</p>
            </div>
          ) : (
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" role="img" aria-label="กราฟ P&L สะสมจาก Spot trades">
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#334155" strokeDasharray="4 4" />
              <polyline points={pointString} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {equityPoints.map((point, index) => {
                const x = padding + (index / Math.max(1, equityPoints.length - 1)) * (chartWidth - padding * 2)
                const y = chartHeight - padding - ((point.pnl - minValue) / range) * (chartHeight - padding * 2)
                return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="4" fill="#10b981"><title>{`${point.label}: ${formatCurrency(point.pnl)}`}</title></circle>
              })}
            </svg>
          )}
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-[#121721] border border-[#1e2638] shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-white">ประวัติ Spot trades</h3>
            <p className="text-xs text-slate-400">ราคา จำนวน มูลค่ารวม และค่าธรรมเนียมตาม schema ของ Spot</p>
          </div>
          <span className="text-xs font-mono text-slate-400">ทั้งหมด {tradeHistory.length} รายการ</span>
        </div>

        {tradeHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-slate-400 font-semibold">ยังไม่มีประวัติ Spot trade</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e2638] text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">คู่เทรด / ด้าน</th>
                  <th className="py-3 px-3">ประเภท</th>
                  <th className="py-3 px-3 text-right">ราคา</th>
                  <th className="py-3 px-3 text-right">จำนวน</th>
                  <th className="py-3 px-3 text-right">มูลค่ารวม</th>
                  <th className="py-3 px-3 text-right">ค่าธรรมเนียม</th>
                  <th className="py-3 px-3 text-right">Realized P&L</th>
                  <th className="py-3 px-3 text-right">เวลาทำรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/60 text-[11px] font-mono">
                {tradeHistory.map((trade, index) => {
                  const pnl = getRealizedSpotPnl(trade)
                  const quoteAsset = trade.symbol?.split('/')?.[1] || ''
                  return (
                    <tr key={trade.id || trade.orderId || index} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-white">{trade.symbol || '—'}</span>
                        <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold ${trade.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {trade.side || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{trade.orderType || '—'}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{formatNumber(Number(trade.price) || 0, 8)} {quoteAsset}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{formatNumber(Number(trade.amount) || 0, 8)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{formatNumber(Number(trade.total) || 0, 2)} {quoteAsset}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{formatNumber(Number(trade.fee) || 0, 8)} {quoteAsset}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${pnl === null ? 'text-slate-500' : pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{displayPnl(pnl)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{displayDate(trade.executedAt)}</td>
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
