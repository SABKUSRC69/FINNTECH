import React, { useEffect } from 'react'
import {
  X,
  Flame,
  Clock,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2,
  Radio
} from 'lucide-react'
import { getThaiAnalysis } from '../../services/forexTranslationHelper'
import { liveMarketService } from '../../services/liveMarketService'
import { formatNumber } from '../../utils/formatters'

export default function NewsDetailModal({
  event,
  isOpen,
  onClose,
  onSelectTradePair,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const thaiAnalysis = getThaiAnalysis(event)
  const isHigh = event.impact === 'High'
  const isMed = event.impact === 'Medium'
  const isLow = event.impact === 'Low'
  const livePrices = liveMarketService.prices || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#0e131f] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden font-sans text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">{event.flag}</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-extrabold text-sm text-slate-800 dark:text-slate-200">
                {event.currency} ({event.countryName})
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {thaiAnalysis.category}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono flex items-center space-x-1 ${
                isHigh
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                  : isMed
                  ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
              }`}
            >
              <span>{isHigh ? '🔴' : isMed ? '🟠' : '🟡'}</span>
              <span>{event.impactConfig?.label || event.impact}</span>
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Main Title & Release Schedule */}
          <div>
            <div className="flex items-center space-x-2 text-xs text-rose-500 dark:text-rose-400 font-bold mb-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>รายงานข่าวเศรษฐกิจสด (FINNTECH Live Intelligence)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {thaiAnalysis.titleThai}
            </h2>
            <div className="text-xs text-slate-400 font-mono mt-1.5 flex flex-wrap items-center gap-3">
              <span>{event.title}</span>
              <span>•</span>
              <span className="text-slate-300 font-bold">
                🗓️ {event.dayName} {event.dateStr} เวลา {event.timeStr} น. (เวลาไทย GMT+7)
              </span>
              <span>•</span>
              <span className={`font-bold ${event.isPast ? 'text-slate-400' : 'text-amber-400'}`}>
                ⏱️ {event.countdownText}
              </span>
            </div>
          </div>

          {/* Actual vs Forecast vs Previous Trio Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Actual */}
            <div className={`p-4 rounded-2xl border text-center transition-all ${
              thaiAnalysis.outcomeType === 'beat'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : thaiAnalysis.outcomeType === 'miss'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                : 'bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
            }`}>
              <div className="text-[11px] uppercase font-bold text-slate-400 font-mono">
                ตัวเลขจริง (Actual)
              </div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold mt-1">
                {event.actual || '-'}
              </div>
              <div className="text-[10px] mt-0.5 font-medium opacity-80">
                {event.isPast ? 'ประกาศผลแล้ว' : 'กำลังรอตัวเลข'}
              </div>
            </div>

            {/* Forecast */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-center">
              <div className="text-[11px] uppercase font-bold text-slate-400 font-mono">
                คาดการณ์ (Forecast)
              </div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-500 dark:text-amber-400 mt-1">
                {event.forecast || '-'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                ประมาณการตลาด
              </div>
            </div>

            {/* Previous */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-center">
              <div className="text-[11px] uppercase font-bold text-slate-400 font-mono">
                ครั้งก่อน (Previous)
              </div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-slate-500 dark:text-slate-400 mt-1">
                {event.previous || '-'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                รอบที่ผ่านมา
              </div>
            </div>
          </div>

          {/* Outcome Verdict Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5 text-xs">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              สถานะ: <strong className="text-amber-400">{thaiAnalysis.outcomeSummaryThai}</strong>
            </div>
          </div>

          {/* Thai Financial Analysis & Description */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-rose-500" />
              <span>ความสำคัญและคำอธิบายข่าว (Indicator Overview)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60">
              {thaiAnalysis.description}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>ทำไมเทรดเดอร์ต้องจับตาดู:</strong> {thaiAnalysis.whyItMatters}
            </div>
          </div>

          {/* Market Reaction Scenarios (Bullish vs Bearish) */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>บทวิเคราะห์ผลกระทบต่อกราฟและคู่เงิน (Trading Scenarios)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Bullish / Hawkish Scenario */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-slate-800 dark:text-slate-200">
                <div className="font-bold text-emerald-500 dark:text-emerald-400 flex items-center space-x-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>กรณีตัวเลขออกมาสูงกว่าคาด (Hawkish)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {thaiAnalysis.bullishImpact}
                </p>
              </div>

              {/* Bearish / Dovish Scenario */}
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-slate-800 dark:text-slate-200">
                <div className="font-bold text-rose-500 dark:text-rose-400 flex items-center space-x-1.5 mb-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>กรณีตัวเลขออกมาต่ำกว่าคาด (Dovish)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {thaiAnalysis.bearishImpact}
                </p>
              </div>
            </div>

            {/* Direct Gold Impact */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
              <div className="font-bold text-amber-500 dark:text-amber-400 flex items-center space-x-1.5 mb-1">
                <span>🥇 ผลกระทบต่อราคาทองคำโลก (XAU/USD):</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                {thaiAnalysis.goldImpact} (ระยะการแกว่งตัวโดยประมาณ: <strong className="text-amber-400">{thaiAnalysis.volatilityRange}</strong>)
              </p>
            </div>
          </div>

          {/* Affected Pairs with 1-Click Trade Quick Action */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">
                คู่เงินในห้องเทรดสดที่ได้รับผลกระทบ (คลิกเพื่อเปิดกราฟเทรดทันที)
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono">0ms Live ECN</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(event.affectedPairs || []).map((pairSym) => {
                const liveP = livePrices[pairSym]
                return (
                  <button
                    key={pairSym}
                    onClick={() => {
                      onClose()
                      if (onSelectTradePair) onSelectTradePair(pairSym)
                    }}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-emerald-500 hover:text-slate-950 dark:hover:bg-emerald-500 dark:hover:text-slate-950 border border-slate-200 dark:border-slate-700/80 transition-all font-mono text-xs font-bold group cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>{pairSym}</span>
                    {liveP && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-950">
                        ${formatNumber(liveP, pairSym.includes('EUR') || pairSym.includes('GBP') ? 4 : 2)}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Strategic Advice Warning */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 leading-relaxed font-mono">
            {thaiAnalysis.strategicTip}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/60">
          <a
            href={event.ffDetailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <span>เปิดดูต้นฉบับภาษาอังกฤษบน ForexFactory.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            {event.affectedPairs && event.affectedPairs[0] && (
              <button
                onClick={() => {
                  onClose()
                  if (onSelectTradePair) onSelectTradePair(event.affectedPairs[0])
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>เทรด {event.affectedPairs[0]} ทันที</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
