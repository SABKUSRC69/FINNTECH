import React from 'react'
import { ShieldCheck, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { formatCurrency, formatPercent } from '../../utils/formatters'

export default function FinancialHealthCard({ totalIncome, totalExpense, netWorth }) {
  // Calculate Savings Rate
  const savings = Math.max(0, totalIncome - totalExpense)
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0
  
  // Calculate Health Score (out of 100)
  let score = 50
  if (savingsRate >= 30) score += 30
  else if (savingsRate >= 20) score += 20
  else if (savingsRate >= 10) score += 10
  else score -= 10

  if (totalExpense < totalIncome * 0.7) score += 15
  if (netWorth > 100000) score += 5

  score = Math.min(100, Math.max(20, Math.round(score)))

  let statusText = 'ยอดเยี่ยม (Excellent)'
  let statusColor = 'text-emerald-500'
  let progressColor = 'bg-emerald-500'

  if (score < 50) {
    statusText = 'ควรระวัง (Needs Attention)'
    statusColor = 'text-rose-500'
    progressColor = 'bg-rose-500'
  } else if (score < 75) {
    statusText = 'อยู่ในเกณฑ์ดี (Good)'
    statusColor = 'text-amber-500'
    progressColor = 'bg-amber-500'
  }

  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              ดัชนีสุขภาพทางการเงิน (Financial Health)
            </h3>
          </div>
          <span className={`text-xs font-bold ${statusColor}`}>
            {statusText}
          </span>
        </div>

        {/* Progress Bar & Score */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {score}
              <span className="text-sm font-normal text-slate-400"> / 100</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              อัตราการออม: <strong className="text-emerald-500">{savingsRate.toFixed(1)}%</strong>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Key Health Insights */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>เงินออมสุทธิเดือนนี้:</span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(savings)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
              <span>เงินสำรองฉุกเฉินเป้าหมาย (6 เดือน):</span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatCurrency(totalExpense * 6)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
        💡 คำแนะนำ: อัตราการออมที่ดีควรอยู่ที่อย่างน้อย 20% ของรายได้ทั้งหมด เพื่อความมั่นคงระยะยาว
      </div>
    </div>
  )
}
