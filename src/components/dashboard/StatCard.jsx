import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({
  title,
  amount,
  subtitle,
  change,
  changeType = 'increase', // 'increase' | 'decrease' | 'neutral'
  icon: Icon,
  gradient = 'from-emerald-500 to-teal-600',
  badgeText,
}) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 group">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
          <Icon className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          {amount}
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          {change !== undefined && (
            <div
              className={`flex items-center space-x-1 font-semibold ${
                changeType === 'increase'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : changeType === 'decrease'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {changeType === 'increase' && <TrendingUp className="w-3.5 h-3.5" />}
              {changeType === 'decrease' && <TrendingDown className="w-3.5 h-3.5" />}
              {changeType === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span>{change}</span>
            </div>
          )}

          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </span>
          )}

          {badgeText && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {badgeText}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
