/**
 * Forex Factory & Economic Calendar Service
 * Connects to Fair Economy Media (Forex Factory) real-time economic calendar feed
 * and provides formatted news, impact levels, countdowns, and currency correlations.
 */

// Currency to Flag and affected trading pairs mapping
export const CURRENCY_METADATA = {
  USD: {
    flag: '🇺🇸',
    name: 'US Dollar',
    pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'GOLD/USD', 'BTC/USDT'],
    centralBank: 'Federal Reserve (Fed)',
  },
  EUR: {
    flag: '🇪🇺',
    name: 'Euro',
    pairs: ['EUR/USD'],
    centralBank: 'European Central Bank (ECB)',
  },
  GBP: {
    flag: '🇬🇧',
    name: 'British Pound',
    pairs: ['GBP/USD'],
    centralBank: 'Bank of England (BOE)',
  },
  JPY: {
    flag: '🇯🇵',
    name: 'Japanese Yen',
    pairs: ['USD/JPY'],
    centralBank: 'Bank of Japan (BOJ)',
  },
  AUD: {
    flag: '🇦🇺',
    name: 'Australian Dollar',
    pairs: ['AUD/USD'],
    centralBank: 'Reserve Bank of Australia (RBA)',
  },
  CAD: {
    flag: '🇨🇦',
    name: 'Canadian Dollar',
    pairs: ['USD/CAD'],
    centralBank: 'Bank of Canada (BOC)',
  },
  CHF: {
    flag: '🇨🇭',
    name: 'Swiss Franc',
    pairs: ['USD/CHF'],
    centralBank: 'Swiss National Bank (SNB)',
  },
  NZD: {
    flag: '🇳🇿',
    name: 'New Zealand Dollar',
    pairs: ['AUD/USD'],
    centralBank: 'Reserve Bank of New Zealand (RBNZ)',
  },
  CNY: {
    flag: '🇨🇳',
    name: 'Chinese Yuan',
    pairs: ['GOLD/USD', 'AUD/USD'],
    centralBank: 'People\'s Bank of China (PBOC)',
  },
  All: {
    flag: '🌐',
    name: 'Global / Multi-currency',
    pairs: ['GOLD/USD', 'BTC/USDT', 'EUR/USD'],
    centralBank: 'International',
  },
}

// Impact styling definitions matching Forex Factory
export const IMPACT_CONFIG = {
  High: {
    label: 'กล่องแดง (High Impact)',
    shortLabel: 'High',
    color: '#ef4444',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-500/40',
    textColor: 'text-rose-400',
    badgeColor: 'bg-rose-600 text-white',
    dotColor: 'bg-rose-500',
    volatility: 'ผันผวนรุนแรง (50 - 150+ pips)',
  },
  Medium: {
    label: 'กล่องส้ม (Medium Impact)',
    shortLabel: 'Med',
    color: '#f97316',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    badgeColor: 'bg-orange-600 text-white',
    dotColor: 'bg-orange-500',
    volatility: 'ผันผวนปานกลาง (20 - 50 pips)',
  },
  Low: {
    label: 'กล่องเหลือง (Low Impact)',
    shortLabel: 'Low',
    color: '#eab308',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    badgeColor: 'bg-amber-600 text-slate-950',
    dotColor: 'bg-amber-500',
    volatility: 'ผันผวนต่ำ (5 - 20 pips)',
  },
  Holiday: {
    label: 'วันหยุดธนาคาร (Holiday)',
    shortLabel: 'Holiday',
    color: '#94a3b8',
    bgColor: 'bg-slate-500/15',
    borderColor: 'border-slate-500/40',
    textColor: 'text-slate-400',
    badgeColor: 'bg-slate-600 text-white',
    dotColor: 'bg-slate-400',
    volatility: 'สภาพคล่องต่ำ / ตลาดปิดทำการ',
  },
}

/**
 * Authentic Static Snapshot for Demo Mode Only.
 * Labeled explicitly as Demo Data (ข้อมูลตัวอย่าง) and NEVER displayed as LIVE.
 */
export const DEMO_CALENDAR_EVENTS = [
  {
    id: 'demo-ff-1',
    title: 'Federal Funds Rate',
    country: 'USD',
    date: '2026-09-16T18:00:00.000Z',
    impact: 'High',
    forecast: '4.00%',
    previous: '3.75%',
    actual: '4.00%',
  },
  {
    id: 'demo-ff-2',
    title: 'FOMC Statement & Press Conference',
    country: 'USD',
    date: '2026-09-16T18:30:00.000Z',
    impact: 'High',
    forecast: '',
    previous: '',
    actual: 'แถลงเสร็จสิ้น',
  },
  {
    id: 'demo-ff-3',
    title: 'Official Bank Rate',
    country: 'GBP',
    date: '2026-09-17T11:00:00.000Z',
    impact: 'High',
    forecast: '3.75%',
    previous: '3.75%',
    actual: '3.75%',
  },
  {
    id: 'demo-ff-4',
    title: 'BOJ Policy Rate',
    country: 'JPY',
    date: '2026-09-18T03:00:00.000Z',
    impact: 'High',
    forecast: '<1.25%',
    previous: '<1.00%',
    actual: '<1.00%',
  },
  {
    id: 'demo-ff-5',
    title: 'Unemployment Claims',
    country: 'USD',
    date: '2026-09-17T12:30:00.000Z',
    impact: 'Medium',
    forecast: '207K',
    previous: '206K',
    actual: '204K',
  },
  {
    id: 'demo-ff-6',
    title: 'Philly Fed Manufacturing Index',
    country: 'USD',
    date: '2026-09-17T12:30:00.000Z',
    impact: 'Medium',
    forecast: '31.3',
    previous: '47.4',
    actual: '34.2',
  },
  {
    id: 'demo-ff-7',
    title: 'Retail Sales m/m',
    country: 'GBP',
    date: '2026-09-18T06:00:00.000Z',
    impact: 'Medium',
    forecast: '-0.2%',
    previous: '-0.5%',
    actual: '0.1%',
  },
  {
    id: 'demo-ff-8',
    title: 'Industrial Production m/m',
    country: 'USD',
    date: '2026-09-18T13:15:00.000Z',
    impact: 'Low',
    forecast: '0.3%',
    previous: '0.2%',
    actual: '0.2%',
  },
]

class ForexFactoryService {
  constructor() {
    this.rawEvents = []
    this.events = []
    this.lastFetched = 0
    this.isFetching = false
    this.status = 'UNAVAILABLE' // 'LIVE' | 'STALE' | 'DEMO' | 'UNAVAILABLE'
    this.source = 'ยังไม่มีการเชื่อมต่อ'
    this.lastUpdated = null
    this.demoMode = false
    try {
      this.demoMode = localStorage.getItem('finntech_calendar_demo_mode') === 'true'
    } catch {}

    this.listeners = new Set()
    this.statusListeners = new Set()
    this.timer = null

    // Real-time ticker: updates countdowns without fabricating data
    this.startTicker()
  }

  setDemoMode(enabled) {
    this.demoMode = !!enabled
    try {
      localStorage.setItem('finntech_calendar_demo_mode', String(this.demoMode))
    } catch {}

    if (this.status !== 'LIVE') {
      if (this.demoMode) {
        this.status = 'DEMO'
        this.source = 'ข้อมูลตัวอย่างในเครื่อง (Sample Demo Data)'
        this.rawEvents = DEMO_CALENDAR_EVENTS
        this.events = this.processRawEvents(this.rawEvents)
      } else {
        this.status = 'UNAVAILABLE'
        this.source = 'ไม่พร้อมใช้งาน (API ถูกจำกัดโดย CORS ในบราวเซอร์)'
        this.rawEvents = []
        this.events = []
      }
      this.notify()
      this.notifyStatus()
    }
  }

  getStatus() {
    // Check if live data has become stale (>1 hour)
    if (this.status === 'LIVE' && this.lastUpdated && Date.now() - this.lastUpdated > 3600000) {
      this.status = 'STALE'
    }
    return {
      status: this.status,
      source: this.source,
      lastUpdated: this.lastUpdated,
      demoMode: this.demoMode,
    }
  }

  subscribe(callback) {
    this.listeners.add(callback)
    callback(this.events, this.getStatus())
    return () => this.listeners.delete(callback)
  }

  subscribeStatus(callback) {
    this.statusListeners.add(callback)
    callback(this.getStatus())
    return () => this.statusListeners.delete(callback)
  }

  notify() {
    const statusObj = this.getStatus()
    this.listeners.forEach((cb) => {
      try {
        cb(this.events, statusObj)
      } catch (e) {
        console.error('ForexFactoryService listener error', e)
      }
    })
  }

  notifyStatus() {
    const statusObj = this.getStatus()
    this.statusListeners.forEach((cb) => {
      try {
        cb(statusObj)
      } catch (e) {
        console.error('ForexFactoryService status listener error', e)
      }
    })
  }

  // Updates time countdowns for genuine events (strictly no randomized values)
  startTicker() {
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      if (this.rawEvents.length > 0) {
        const now = new Date()
        this.events = this.processRawEvents(this.rawEvents, now)
        this.notify()
      }
    }, 1000)
  }

  // Fetch live economic calendar from external feed without fabricating fake data
  async getCalendarEvents(forceRefresh = false, enableDemo = null) {
    if (enableDemo !== null) {
      this.setDemoMode(enableDemo)
    }
    const now = Date.now()

    // 2-minute cache if already live and not forced
    if (!forceRefresh && this.status === 'LIVE' && this.rawEvents.length > 0 && now - this.lastFetched < 120000) {
      return this.events
    }

    const PRIMARY_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'

    try {
      this.isFetching = true
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const res = await fetch(PRIMARY_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          this.rawEvents = data
          this.events = this.processRawEvents(data)
          this.lastFetched = now
          this.lastUpdated = now
          this.status = 'LIVE'
          this.source = 'Fair Economy Official JSON Feed'
          this.isFetching = false
          this.notify()
          this.notifyStatus()
          return this.events
        }
      }
    } catch (err) {
      // Direct browser fetch failed (e.g. CORS block / rate limit)
    }

    // When external API fails: NEVER pretend it's LIVE!
    this.lastFetched = now
    this.isFetching = false

    if (this.demoMode) {
      this.status = 'DEMO'
      this.source = 'ข้อมูลตัวอย่างในเครื่อง (Sample Demo Data)'
      this.lastUpdated = null
      this.rawEvents = DEMO_CALENDAR_EVENTS
      this.events = this.processRawEvents(this.rawEvents)
    } else {
      this.status = 'UNAVAILABLE'
      this.source = 'ไม่พร้อมใช้งาน (API ถูกจำกัดโดย CORS ในบราวเซอร์)'
      this.lastUpdated = null
      this.rawEvents = []
      this.events = []
    }

    this.notify()
    this.notifyStatus()
    return this.events
  }

  // Formats raw event objects with authentic metadata (no random actual/forecast synthesis)
  processRawEvents(rawList, now = new Date()) {
    return rawList.map((item, index) => {
      const eventDate = new Date(item.date)
      const diffMs = eventDate.getTime() - now.getTime()
      const totalSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffMs / 60000)
      const isPast = diffMs <= 0
      const isSoon = !isPast && diffMinutes <= 120
      const isUrgent = !isPast && diffMinutes <= 15
      const isToday = eventDate.toDateString() === now.toDateString()

      // Format time in Thai locale (HH:mm)
      const timeStr = eventDate.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })

      // Format date in Thai locale
      const dateStr = eventDate.toLocaleDateString('th-TH', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })

      const dayName = eventDate.toLocaleDateString('th-TH', { weekday: 'long' })
      const country = item.country || 'USD'
      const meta = CURRENCY_METADATA[country] || CURRENCY_METADATA.USD
      const impact = item.impact || 'Low'
      const impactConfig = IMPACT_CONFIG[impact] || IMPACT_CONFIG.Low

      let countdownText = ''
      let countdownClock = ''
      if (isPast) {
        countdownText = 'รายงานแล้ว'
        countdownClock = '00:00:00'
      } else {
        const hrs = Math.floor(totalSeconds / 3600)
        const mins = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60
        countdownClock = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

        if (hrs > 0) {
          countdownText = `อีก ${hrs} ชม. ${mins} นาที`
        } else if (mins > 0) {
          countdownText = `อีก ${mins} นาที ${secs} วินาที`
        } else {
          countdownText = `อีก ${secs} วินาที`
        }
      }

      // Compute actual deviation only if real actual and forecast values exist
      let actualOutcome = 'neutral'
      if (isPast && item.actual && item.forecast) {
        const actNum = parseFloat(item.actual)
        const foreNum = parseFloat(item.forecast)
        if (!isNaN(actNum) && !isNaN(foreNum)) {
          if (actNum > foreNum) actualOutcome = 'bullish'
          else if (actNum < foreNum) actualOutcome = 'bearish'
        }
      }

      return {
        id: item.id || `ff-${index}-${country}-${(item.title || '').replace(/\s+/g, '')}`,
        title: item.title,
        country,
        currency: country,
        flag: meta.flag,
        countryName: meta.name,
        affectedPairs: meta.pairs,
        date: eventDate,
        dateStr,
        timeStr,
        dayName,
        diffMs,
        diffMinutes,
        totalSeconds,
        isPast,
        isSoon,
        isUrgent,
        isToday,
        countdownText,
        countdownClock,
        actualOutcome,
        impact,
        impactConfig,
        forecast: item.forecast || '-',
        previous: item.previous || '-',
        actual: item.actual || '-',
        isDemo: this.demoMode || Boolean(item.id && item.id.startsWith('demo-')),
        ffDetailUrl: `https://www.forexfactory.com/#detail=${item.id || encodeURIComponent(item.title || '')}`,
      }
    }).sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  getUpcomingHighImpactEvents() {
    return this.events.filter((e) => e.impact === 'High' && !e.isPast)
  }

  destroy() {
    if (this.timer) clearInterval(this.timer)
    this.listeners.clear()
    this.statusListeners.clear()
  }
}

export const forexFactoryService = new ForexFactoryService()
export default forexFactoryService
