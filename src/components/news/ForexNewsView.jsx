import React, { useState, useEffect, useRef } from 'react'
import {
  Newspaper,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Flame,
  Clock,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Radio
} from 'lucide-react'
import { forexFactoryService, IMPACT_CONFIG, CURRENCY_METADATA } from '../../services/forexFactoryService'
import { getThaiAnalysis } from '../../services/forexTranslationHelper'
import NewsDetailModal from './NewsDetailModal'

export default function ForexNewsView({ onSelectTradePair }) {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImpact, setSelectedImpact] = useState('All') // 'All' | 'High' | 'Medium' | 'Low'
  const [selectedCurrency, setSelectedCurrency] = useState('All')
  const [timeFilter, setTimeFilter] = useState('all') // 'all' | 'today' | 'upcoming'
  const [activeSubTab, setActiveSubTab] = useState('calendar') // 'calendar' | 'tradingview' | 'market_news'
  const [expandedEventId, setExpandedEventId] = useState(null)
  const [activeModalEvent, setActiveModalEvent] = useState(null)
  const tradingViewContainerRef = useRef(null)

  // Load calendar events
  const loadData = async (force = false) => {
    if (force) setIsRefreshing(true)
    try {
      const data = await forexFactoryService.getCalendarEvents(force)
      setEvents(data)
    } catch (e) {
      console.error('Error fetching calendar', e)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const unsubscribe = forexFactoryService.subscribe((updated) => {
      setEvents(updated)
    })

    // Real-time countdown ticker every 30s
    const ticker = setInterval(() => {
      setEvents((prev) => {
        if (!prev || prev.length === 0) return prev
        return forexFactoryService.processRawEvents(prev)
      })
    }, 30000)

    return () => {
      unsubscribe()
      clearInterval(ticker)
    }
  }, [])

  // Embed TradingView Economic Calendar Widget on tab switch
  useEffect(() => {
    if (activeSubTab === 'tradingview' && tradingViewContainerRef.current) {
      tradingViewContainerRef.current.innerHTML = ''

      const widgetContainer = document.createElement('div')
      widgetContainer.className = 'tradingview-widget-container'
      widgetContainer.style.height = '700px'
      widgetContainer.style.width = '100%'

      const widgetHolder = document.createElement('div')
      widgetHolder.className = 'tradingview-widget-container__widget'
      widgetHolder.style.height = '100%'
      widgetHolder.style.width = '100%'

      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
      script.async = true
      script.innerHTML = JSON.stringify({
        colorTheme: 'dark',
        isTransparent: true,
        width: '100%',
        height: '100%',
        locale: 'th_TH',
        importanceFilter: '0,1',
        currencyFilter: 'USD,EUR,GBP,JPY,CAD,AUD,CHF,CNY',
      })

      widgetContainer.appendChild(widgetHolder)
      widgetContainer.appendChild(script)
      tradingViewContainerRef.current.appendChild(widgetContainer)
    }
  }, [activeSubTab])

  // Filter events
  const filteredEvents = events.filter((ev) => {
    // Impact filter
    if (selectedImpact !== 'All' && ev.impact !== selectedImpact) return false

    // Currency filter
    if (selectedCurrency !== 'All' && ev.currency !== selectedCurrency) return false

    // Time filter
    if (timeFilter === 'today' && !ev.isToday) return false
    if (timeFilter === 'upcoming' && ev.isPast) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = ev.title.toLowerCase().includes(q)
      const matchCurrency = ev.currency.toLowerCase().includes(q)
      const matchCountry = (ev.countryName || '').toLowerCase().includes(q)
      if (!matchTitle && !matchCurrency && !matchCountry) return false
    }

    return true
  })

  // Upcoming High-Impact Event for Top Banner
  const nextHighImpact = events.find((e) => e.impact === 'High' && !e.isPast)

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  ปฏิทินข่าวเศรษฐกิจ
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-mono font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>สด</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ติดตามข่าวกล่องแดง อัตราดอกเบี้ย และตัวเลขเศรษฐกิจสำคัญ
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-500' : ''}`} />
            <span>{isRefreshing ? 'กำลังซิงค์...' : 'รีเฟรช'}</span>
          </button>

          <a
            href="https://www.forexfactory.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer"
          >
            <span>ForexFactory</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Next High Impact News Alert Banner */}
      {nextHighImpact && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-semibold font-mono">
                    ข่าวกล่องแดงถัดไป
                  </span>
                  <span className="text-xs font-mono font-medium text-amber-400">
                    ⏱️ {nextHighImpact.countdownText} ({nextHighImpact.timeStr} น.)
                  </span>
                </div>
                <div className="text-sm sm:text-base font-semibold text-white mt-1 flex items-center space-x-2">
                  <span>{nextHighImpact.flag}</span>
                  <span>{nextHighImpact.currency} - {nextHighImpact.title}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2 font-mono">
                  <span>คาดการณ์: <strong className="text-amber-400">{nextHighImpact.forecast}</strong></span>
                  <span>•</span>
                  <span>ก่อนหน้า: <strong className="text-slate-300">{nextHighImpact.previous}</strong></span>
                  {nextHighImpact.affectedPairs && nextHighImpact.affectedPairs.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-slate-400">
                        คู่เงินกระทบ: <strong className="text-slate-200">{nextHighImpact.affectedPairs.slice(0, 4).join(', ')}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start md:self-auto">
              {nextHighImpact.affectedPairs && nextHighImpact.affectedPairs[0] && onSelectTradePair && (
                <button
                  onClick={() => onSelectTradePair(nextHighImpact.affectedPairs[0])}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <span>กราฟ {nextHighImpact.affectedPairs[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setActiveModalEvent(nextHighImpact)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>วิเคราะห์ไทย</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 w-fit text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'calendar'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>ปฏิทินเศรษฐกิจ ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tradingview')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'tradingview'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>TradingView Calendar</span>
        </button>

        <button
          onClick={() => setActiveSubTab('market_news')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'market_news'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>วิเคราะห์ดอกเบี้ย & กล่องแดง</span>
        </button>
      </div>

      {/* SUB TAB 1: FOREX FACTORY TABLE */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Impact Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-slate-400 font-medium mr-1 text-[11px]">ระดับความสำคัญ:</span>
              <button
                onClick={() => setSelectedImpact('All')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedImpact === 'All'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setSelectedImpact('High')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1 transition-all cursor-pointer ${
                  selectedImpact === 'High'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <span>🔴 กล่องแดง</span>
              </button>
              <button
                onClick={() => setSelectedImpact('Medium')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1 transition-all cursor-pointer ${
                  selectedImpact === 'Medium'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                    : 'text-orange-400/80 hover:text-orange-300'
                }`}
              >
                <span>🟠 กล่องส้ม</span>
              </button>
              <button
                onClick={() => setSelectedImpact('Low')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1 transition-all cursor-pointer ${
                  selectedImpact === 'Low'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <span>🟡 กล่องเหลือง</span>
              </button>
            </div>

            {/* Currency Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium text-[11px]">สกุลเงิน:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none"
              >
                <option value="All">ทุกสกุลเงิน</option>
                <option value="USD">🇺🇸 USD</option>
                <option value="EUR">🇪🇺 EUR</option>
                <option value="GBP">🇬🇧 GBP</option>
                <option value="JPY">🇯🇵 JPY</option>
                <option value="AUD">🇦🇺 AUD</option>
                <option value="CAD">🇨🇦 CAD</option>
                <option value="CHF">🇨🇭 CHF</option>
                <option value="NZD">🇳🇿 NZD</option>
                <option value="CNY">🇨🇳 CNY</option>
              </select>
            </div>

            {/* Time Filter Buttons */}
            <div className="flex items-center bg-white dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  timeFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                สัปดาห์นี้
              </button>
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  timeFilter === 'today'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                วันนี้
              </button>
              <button
                onClick={() => setTimeFilter('upcoming')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  timeFilter === 'upcoming'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                รอประกาศ
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อข่าว..."
                className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Forex Factory Table Container */}
          <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 dark:text-white text-xs">
                  ตารางรายงานปฏิทินเศรษฐกิจ (เวลาไทย GMT+7)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({filteredEvents.length})
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span>กล่องแดง (ผันผวนสูง)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
                  <span>กล่องส้ม (ปานกลาง)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span>กล่องเหลือง (ต่ำ)</span>
                </span>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                ไม่พบข่าวเศรษฐกิจตามเงื่อนไขที่เลือก กรุณาลองปรับเปลี่ยนตัวกรอง
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 font-bold uppercase font-mono text-[11px]">
                      <th className="py-3 px-4">วัน / เวลา</th>
                      <th className="py-3 px-3">สกุลเงิน</th>
                      <th className="py-3 px-2 text-center">กล่องข่าว</th>
                      <th className="py-3 px-4">ชื่อข่าวเศรษฐกิจ</th>
                      <th className="py-3 px-3 text-right">ตัวเลขจริง (Actual)</th>
                      <th className="py-3 px-3 text-right">คาดการณ์ (Forecast)</th>
                      <th className="py-3 px-3 text-right">ครั้งก่อน (Previous)</th>
                      <th className="py-3 px-3 text-center">สถานะ / ลิงก์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {filteredEvents.map((ev) => {
                      const isExpanded = expandedEventId === ev.id
                      const isHigh = ev.impact === 'High'
                      const isMed = ev.impact === 'Medium'
                      const isLow = ev.impact === 'Low'
                      const thaiInfo = getThaiAnalysis(ev)

                      return (
                        <React.Fragment key={ev.id}>
                          <tr
                            onClick={() => setActiveModalEvent(ev)}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                              ev.isSoon ? 'bg-rose-500/10 dark:bg-rose-950/20' : ''
                            } ${isExpanded ? 'bg-slate-100 dark:bg-slate-800/80' : ''}`}
                          >
                            {/* Date & Time */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {ev.timeStr} น.
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {ev.dateStr}
                              </div>
                            </td>

                            {/* Currency */}
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-base">{ev.flag}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {ev.currency}
                                </span>
                              </div>
                            </td>

                            {/* Impact Box (Forex Factory Signature Folders) */}
                            <td className="py-3 px-2 text-center">
                              <span
                                title={ev.impactConfig.label}
                                className={`inline-block w-4 h-4 rounded shadow-sm ${
                                  isHigh
                                    ? 'bg-rose-600 border border-rose-400'
                                    : isMed
                                    ? 'bg-orange-500 border border-orange-300'
                                    : isLow
                                    ? 'bg-amber-400 border border-amber-200'
                                    : 'bg-slate-500'
                                }`}
                              />
                            </td>

                            {/* Title (Thai headline + original English) */}
                            <td className="py-3 px-4 font-sans text-slate-900 dark:text-slate-100">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-white group-hover:text-rose-400 transition-colors">
                                  {thaiInfo.titleThai}
                                </span>
                                {ev.isSoon && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-extrabold animate-pulse shrink-0">
                                    SOON
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center space-x-2">
                                <span>{ev.title}</span>
                                <span>•</span>
                                <span className="text-emerald-500/90 dark:text-emerald-400/90 font-sans font-medium">{thaiInfo.category}</span>
                              </div>
                            </td>

                            {/* Actual */}
                            <td className="py-3 px-3 text-right font-bold">
                              <span className={ev.actual !== '-' ? 'text-emerald-400' : 'text-slate-400'}>
                                {ev.actual}
                              </span>
                            </td>

                            {/* Forecast */}
                            <td className="py-3 px-3 text-right text-amber-400 font-medium">
                              {ev.forecast}
                            </td>

                            {/* Previous */}
                            <td className="py-3 px-3 text-right text-slate-400">
                              {ev.previous}
                            </td>

                            {/* Status & Actions */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveModalEvent(ev)
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-600/20 to-amber-600/20 hover:from-rose-600 hover:to-amber-600 text-rose-400 hover:text-white border border-rose-500/30 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm active:scale-95"
                                  title="เปิดอ่านข่าวฉบับเต็มและบทวิเคราะห์ภาษาไทย"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>อ่านข่าว (ไทย)</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedEventId(isExpanded ? null : ev.id)
                                  }}
                                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-400 transition-colors cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Quick Insights Panel */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
                              <td colSpan={8} className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                      ระดับผลกระทบและความผันผวน
                                    </div>
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                                      <span className={`w-3 h-3 rounded ${isHigh ? 'bg-rose-600' : isMed ? 'bg-orange-500' : 'bg-amber-400'}`} />
                                      <span>{ev.impactConfig.label}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                      ความผันผวนเฉลี่ย: <strong className="text-amber-400">{ev.impactConfig.volatility}</strong>
                                    </div>
                                  </div>

                                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                      คู่เงินที่ได้รับผลกระทบหลัก
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-1 font-mono">
                                      {(ev.affectedPairs || []).map((pairSym) => (
                                        <button
                                          key={pairSym}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (onSelectTradePair) onSelectTradePair(pairSym)
                                          }}
                                          className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
                                        >
                                          {pairSym} ↗
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                                    <div>
                                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                        เปิดอ่านข่าวฉบับเต็มภาษาไทย
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        วิเคราะห์ผลกระทบทองคำ คู่เงิน และกลยุทธ์เข้าเทรด
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => setActiveModalEvent(ev)}
                                      className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-rose-600/25 transition-all cursor-pointer active:scale-95"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>อ่านข่าวฉบับเต็ม & บทวิเคราะห์ไทย ⚡</span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: TRADINGVIEW ECONOMIC CALENDAR LIVE */}
      {activeSubTab === 'tradingview' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm min-h-[720px] flex flex-col">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              TradingView Economic Calendar Live Feed
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-medium flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>สด</span>
            </span>
          </div>
          <div ref={tradingViewContainerRef} className="flex-1 w-full rounded-xl overflow-hidden" />
        </div>
      )}

      {/* SUB TAB 3: BREAKING NEWS & CENTRAL BANK SENTIMENT */}
      {activeSubTab === 'market_news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Fed Interest Rate */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-semibold font-mono text-[10px]">
                  Federal Reserve (Fed)
                </span>
                <span className="text-slate-400 text-[10px]">อัปเดตล่าสุด</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                ทิศทางอัตราดอกเบี้ย Fed และเงินเฟ้อสหรัฐฯ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                การประชุม FOMC และตัวเลขเงินเฟ้อ CPI สหรัฐฯ เป็นปัจจัยชี้นำทิศทางค่าเงินดอลลาร์สหรัฐ (USD) และราคาทองคำโลก (XAU/USD) หากคงหรือปรับลดดอกเบี้ย มักจะหนุนราคาทองคำและสินทรัพย์เสี่ยง
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-medium font-mono">Federal Funds Rate: 4.00%</span>
              <button
                onClick={() => {
                  const target = events.find(e => e.country === 'USD' && (e.title.toLowerCase().includes('rate') || e.title.includes('FOMC') || e.impact === 'High')) || {
                    id: 'fed-spec',
                    title: 'Federal Funds Rate',
                    country: 'USD',
                    impact: 'High',
                    date: new Date().toISOString(),
                    forecast: '4.00%',
                    previous: '4.25%',
                    actual: '4.00%'
                  }
                  setActiveModalEvent(target)
                }}
                className="text-rose-400 hover:text-rose-300 font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>วิเคราะห์ไทย</span>
              </button>
            </div>
          </div>

          {/* Card 2: Bank of Japan (BOJ) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold font-mono text-[10px]">
                  Bank of Japan (BOJ)
                </span>
                <span className="text-slate-400 text-[10px]">เยนญี่ปุ่น</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                นโยบายดอกเบี้ย BOJ และค่าเงินเยน (USD/JPY)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                ธนาคารกลางญี่ปุ่นจับตาอัตราค่าจ้างและเงินเฟ้อในประเทศอย่างใกล้ชิด การส่งสัญญาณปรับขึ้นดอกเบี้ยจะส่งผลให้เงินเยนแข็งค่าขึ้นอย่างรวดเร็ว ส่งผลกระทบต่อคู่เงิน USD/JPY
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-blue-400 font-medium font-mono">BOJ Rate: &lt;1.25%</span>
              <button
                onClick={() => {
                  const target = events.find(e => e.country === 'JPY') || {
                    id: 'boj-spec',
                    title: 'BOJ Policy Rate & Statement',
                    country: 'JPY',
                    impact: 'High',
                    date: new Date().toISOString(),
                    forecast: '0.50%',
                    previous: '0.25%',
                    actual: '0.25%'
                  }
                  setActiveModalEvent(target)
                }}
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>วิเคราะห์ไทย</span>
              </button>
            </div>
          </div>

          {/* Card 3: Gold Drivers & Geopolitics */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-semibold font-mono text-[10px]">
                  Gold Spot (XAU/USD)
                </span>
                <span className="text-slate-400 text-[10px]">สินทรัพย์ปลอดภัย</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                ปัจจัยหนุนทองคำแท่งและ Gold Futures
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                ทองคำแท่งได้รับแรงหนุนต่อเนื่องจากแรงซื้อของธนาคารกลางทั่วโลกและความไม่แน่นอนทางภูมิรัฐศาสตร์ ในขณะที่ตัวเลขอัตราผลตอบแทนพันธบัตรสหรัฐฯ 10 ปี เป็นตัวแปรผกผันสำคัญ
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-medium font-mono">ทองคำไทย ~฿42,800+</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const target = events.find(e => e.title.toLowerCase().includes('cpi') || (e.country === 'USD' && e.impact === 'High')) || {
                      id: 'gold-cpi-spec',
                      title: 'CPI m/m (Consumer Price Index) - Gold Impact',
                      country: 'USD',
                      impact: 'High',
                      date: new Date().toISOString(),
                      forecast: '0.2%',
                      previous: '0.2%',
                      actual: '0.3%'
                    }
                    setActiveModalEvent(target)
                  }}
                  className="text-rose-400 hover:text-rose-300 font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>วิเคราะห์ทอง</span>
                </button>
                <button
                  onClick={() => onSelectTradePair && onSelectTradePair('GOLD/USD')}
                  className="text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <span>เทรด</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP REAL-TIME THAI NEWS MODAL */}
      <NewsDetailModal
        event={activeModalEvent}
        isOpen={!!activeModalEvent}
        onClose={() => setActiveModalEvent(null)}
        onSelectTradePair={onSelectTradePair}
      />
    </div>
  )
}
