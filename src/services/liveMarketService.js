/**
 * Live Market Data Service
 * Connects to public real-time WebSockets & REST APIs (Coinbase & Binance & Yahoo/CoinCap)
 * without requiring any paid API keys.
 */

// Mapping of internal symbols to external exchange symbols
export const SYMBOL_MAPPINGS = {
  'BTC/USDT': {
    coinbase: 'BTC-USD',
    binance: 'BTCUSDT',
    tradingView: 'BINANCE:BTCUSDT',
    name: 'Bitcoin',
    type: 'crypto',
    fallbackPrice: 76320.00,
  },
  'ETH/USDT': {
    coinbase: 'ETH-USD',
    binance: 'ETHUSDT',
    tradingView: 'BINANCE:ETHUSDT',
    name: 'Ethereum',
    type: 'crypto',
    fallbackPrice: 3415.50,
  },
  'SOL/USDT': {
    coinbase: 'SOL-USD',
    binance: 'SOLUSDT',
    tradingView: 'BINANCE:SOLUSDT',
    name: 'Solana',
    type: 'crypto',
    fallbackPrice: 154.20,
  },
  'BNB/USDT': {
    coinbase: null,
    binance: 'BNBUSDT',
    tradingView: 'BINANCE:BNBUSDT',
    name: 'BNB Binance',
    type: 'crypto',
    fallbackPrice: 588.40,
  },
  'XRP/USDT': {
    coinbase: 'XRP-USD',
    binance: 'XRPUSDT',
    tradingView: 'BINANCE:XRPUSDT',
    name: 'Ripple XRP',
    type: 'crypto',
    fallbackPrice: 0.5840,
  },
  'DOGE/USDT': {
    coinbase: 'DOGE-USD',
    binance: 'DOGEUSDT',
    tradingView: 'BINANCE:DOGEUSDT',
    name: 'Dogecoin',
    type: 'crypto',
    fallbackPrice: 0.1145,
  },
  'GOLD/USD': {
    coinbase: null,
    binance: 'PAXGUSDT',
    tradingView: 'OANDA:XAUUSD',
    name: 'ทองคำ (Gold Spot XAU/USD)',
    type: 'commodity',
    fallbackPrice: 2586.40,
  },
  'NVDA/USD': {
    coinbase: null,
    binance: null,
    tradingView: 'NASDAQ:NVDA',
    name: 'NVIDIA Corp.',
    type: 'stock',
    fallbackPrice: 128.50,
  },
  'TSLA/USD': {
    coinbase: null,
    binance: null,
    tradingView: 'NASDAQ:TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    fallbackPrice: 242.80,
  },
  'EUR/USD': {
    binance: 'EURUSDT',
    tradingView: 'FX:EURUSD',
    name: 'Euro / US Dollar',
    type: 'forex',
    fallbackPrice: 1.1485,
  },
  'GBP/USD': {
    binance: 'GBPUSDT',
    tradingView: 'FX:GBPUSD',
    name: 'British Pound / US Dollar',
    type: 'forex',
    fallbackPrice: 1.2040,
  },
  'USD/JPY': {
    coinbase: 'USD-JPY',
    tradingView: 'FX:USDJPY',
    name: 'US Dollar / Japanese Yen',
    type: 'forex',
    fallbackPrice: 156.04,
  },
  'AUD/USD': {
    binance: 'AUDUSDT',
    tradingView: 'FX:AUDUSD',
    name: 'Australian Dollar / US Dollar',
    type: 'forex',
    fallbackPrice: 0.7583,
  },
  'USD/CHF': {
    coinbase: 'USD-CHF',
    tradingView: 'FX:USDCHF',
    name: 'US Dollar / Swiss Franc',
    type: 'forex',
    fallbackPrice: 0.8248,
  },
  'USD/CAD': {
    coinbase: 'USD-CAD',
    tradingView: 'FX:USDCAD',
    name: 'US Dollar / Canadian Dollar',
    type: 'forex',
    fallbackPrice: 1.3984,
  },
}

const BINANCE_TO_INTERNAL = {
  'BTCUSDT': 'BTC/USDT',
  'ETHUSDT': 'ETH/USDT',
  'SOLUSDT': 'SOL/USDT',
  'BNBUSDT': 'BNB/USDT',
  'XRPUSDT': 'XRP/USDT',
  'DOGEUSDT': 'DOGE/USDT',
  'PAXGUSDT': 'GOLD/USD',
  'EURUSDT': 'EUR/USD',
  'GBPUSDT': 'GBP/USD',
  'AUDUSDT': 'AUD/USD',
}

const COINBASE_FOREX_PAIRS = [
  { id: 'USD-JPY', symbol: 'USD/JPY' },
  { id: 'USD-CHF', symbol: 'USD/CHF' },
  { id: 'USD-CAD', symbol: 'USD/CAD' },
]

class LiveMarketService {
  constructor() {
    this.subscribers = new Set()
    this.statusSubscribers = new Set()
    this.ws = null
    this.isConnected = false
    this.latency = 24
    this.reconnectAttempts = 0
    this.pollTimer = null
    this.ecnTickTimer = null
    this.isDemoTicksEnabled = false // Production/Default mode: synthetic random ticks are strictly OFF
    this.rawBinancePrices = {}
    this.baselineRates = {
      'USD/CHF': 0.8251,
      'USD/CAD': 1.3987,
      'NVDA/USD': 128.50,
      'TSLA/USD': 242.80,
    }
    this.prices = {
      'BTC/USDT': 76850.00,
      'ETH/USDT': 2470.00,
      'SOL/USDT': 101.40,
      'BNB/USDT': 729.50,
      'XRP/USDT': 1.3050,
      'DOGE/USDT': 0.0821,
      'GOLD/USD': 2586.40,
      'EUR/USD': 1.1485,
      'GBP/USD': 1.2040,
      'USD/JPY': 156.05,
      'AUD/USD': 0.7583,
      'USD/CHF': 0.8251,
      'USD/CAD': 1.3987,
      'NVDA/USD': 128.50,
      'TSLA/USD': 242.80,
    }
    this.activeSymbol = 'BTC/USDT'
    this.lastTickTime = {}
    this.tickCount = 0

    // Explicit Status & Source per asset: LIVE | STALE | DEMO | UNAVAILABLE
    this.symbolStatuses = {}
    Object.keys(this.prices).forEach((sym) => {
      const isStock = sym === 'NVDA/USD' || sym === 'TSLA/USD'
      this.symbolStatuses[sym] = {
        status: isStock ? 'STALE' : 'UNAVAILABLE',
        source: isStock ? 'Historical Snapshot (No Live Stream)' : 'Waiting for connection...',
        lastUpdated: null,
      }
    })
  }

  // Get explicit data status for any asset
  getSymbolStatus(sym) {
    const current = this.symbolStatuses[sym]
    if (!current) {
      return { status: 'UNAVAILABLE', source: 'Unknown Asset', lastUpdated: null }
    }
    // Stale check: if market was LIVE but received no tick in the last 25 seconds
    if (current.status === 'LIVE' && current.lastUpdated && (Date.now() - current.lastUpdated > 25000)) {
      return { ...current, status: 'STALE', source: `${current.source} (Quiet/Stale)` }
    }
    return current
  }

  getMarketStatus() {
    return {
      isConnected: this.isConnected,
      latency: this.latency,
      isDemoTicksEnabled: this.isDemoTicksEnabled,
      activeSymbol: this.activeSymbol,
      activeSymbolStatus: this.getSymbolStatus(this.activeSymbol),
      symbolStatuses: this.symbolStatuses,
    }
  }

  setDemoTicksEnabled(enabled) {
    this.isDemoTicksEnabled = Boolean(enabled)
    if (this.isDemoTicksEnabled) {
      this.startEcnTickEngine()
    } else {
      if (this.ecnTickTimer) {
        clearInterval(this.ecnTickTimer)
        this.ecnTickTimer = null
      }
    }
    this.notifyStatus(this.isConnected)
  }

  // Set the symbol currently being viewed/traded
  setActiveSymbol(symbol) {
    if (symbol) {
      this.activeSymbol = symbol
    }
  }

  // Initialize real-time connections
  init() {
    this.fetchInitialPrices()
    this.connectWebSocket()
    // Periodic spot polling for fiat benchmarks
    if (!this.pollTimer) {
      this.pollTimer = setInterval(() => {
        this.fetchInitialPrices()
      }, 5000)
    }
    // Only run tick engine if explicitly enabled for demo mode
    if (this.isDemoTicksEnabled) {
      this.startEcnTickEngine()
    }
  }

  // Subscribe to live price updates
  subscribe(callback) {
    this.subscribers.add(callback)
    callback(this.prices, { symbol: null, direction: 'none' })
    return () => this.subscribers.delete(callback)
  }

  // Subscribe to connection status changes
  subscribeStatus(callback) {
    this.statusSubscribers.add(callback)
    callback(this.getMarketStatus())
    return () => this.statusSubscribers.delete(callback)
  }

  notifyStatus(connected) {
    this.isConnected = connected
    const payload = this.getMarketStatus()
    this.statusSubscribers.forEach((cb) => cb(payload))
  }

  notifyPrices(updatedSymbol, direction) {
    this.subscribers.forEach((cb) => cb(this.prices, { symbol: updatedSymbol, direction }))
  }

  // Fetch initial prices via Binance Public HTTP REST API & Forex Feeds
  async fetchInitialPrices() {
    try {
      const startTime = Date.now()
      const res = await fetch('https://api.binance.com/api/v3/ticker/price')
      if (res.ok) {
        const list = await res.json()
        const now = Date.now()
        list.forEach((item) => {
          this.rawBinancePrices[item.symbol] = parseFloat(item.price)
          const internal = BINANCE_TO_INTERNAL[item.symbol]
          if (internal) {
            const newPrice = parseFloat(item.price)
            if (newPrice > 0) {
              const oldPrice = this.prices[internal] || newPrice
              this.prices[internal] = newPrice
              this.symbolStatuses[internal] = {
                status: 'LIVE',
                source: 'Binance Public REST',
                lastUpdated: now,
              }
              const direction = newPrice >= oldPrice ? 'up' : 'down'
              this.notifyPrices(internal, direction)
            }
          }
        })

        // Synthetic USD/JPY from BTCJPY / BTCUSDT
        if (this.rawBinancePrices['BTCJPY'] && this.rawBinancePrices['BTCUSDT']) {
          const synthUsdJpy = parseFloat(
            (this.rawBinancePrices['BTCJPY'] / this.rawBinancePrices['BTCUSDT']).toFixed(3)
          )
          if (synthUsdJpy > 0) {
            const oldJpy = this.prices['USD/JPY'] || synthUsdJpy
            this.prices['USD/JPY'] = synthUsdJpy
            this.symbolStatuses['USD/JPY'] = {
              status: 'LIVE',
              source: 'Binance (BTCJPY/BTCUSDT Synthetic)',
              lastUpdated: now,
            }
            this.notifyPrices('USD/JPY', synthUsdJpy >= oldJpy ? 'up' : 'down')
          }
        }

        this.latency = Math.max(12, Date.now() - startTime)
        this.notifyStatus(true)
      } else {
        throw new Error(`Binance API returned HTTP ${res.status}`)
      }

      // Fetch Real-time Spot Rates for USD/CHF and USD/CAD from Coinbase
      COINBASE_FOREX_PAIRS.forEach(async ({ id, symbol }) => {
        try {
          const cRes = await fetch(`https://api.coinbase.com/v2/prices/${id}/spot`)
          if (cRes.ok) {
            const cData = await cRes.json()
            const amt = parseFloat(cData.data?.amount)
            if (amt > 0) {
              this.baselineRates[symbol] = amt
              const old = this.prices[symbol] || amt
              this.prices[symbol] = amt
              this.symbolStatuses[symbol] = {
                status: 'LIVE',
                source: 'Coinbase Spot REST',
                lastUpdated: Date.now(),
              }
              this.notifyPrices(symbol, amt >= old ? 'up' : 'down')
            }
          }
        } catch (e) {}
      })
    } catch (e) {
      console.warn('Price fetch error', e)
      this.notifyStatus(false)
      // When API fails, mark un-updated symbols as UNAVAILABLE or STALE
      Object.keys(this.prices).forEach((sym) => {
        const cur = this.symbolStatuses[sym]
        if (!cur || !cur.lastUpdated) {
          this.symbolStatuses[sym] = {
            status: 'UNAVAILABLE',
            source: 'Network Error / API Unavailable',
            lastUpdated: null,
          }
        } else if (Date.now() - cur.lastUpdated > 25000) {
          this.symbolStatuses[sym] = {
            status: 'STALE',
            source: `${cur.source} (Connection Failed)`,
            lastUpdated: cur.lastUpdated,
          }
        }
      })
    }
  }

  // Connect to Binance multi-stream WebSocket for sub-second real-time tick streaming
  connectWebSocket() {
    try {
      if (this.ws) {
        this.ws.close()
      }

      const streamSymbols = [...Object.keys(BINANCE_TO_INTERNAL), 'BTCJPY']
      const streams = streamSymbols
        .map((s) => `${s.toLowerCase()}@ticker`)
        .join('/')

      this.ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.notifyStatus(true)
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message && message.data && message.data.s && message.data.c) {
            const symbol = message.data.s
            const newPrice = parseFloat(message.data.c)
            const now = Date.now()
            this.rawBinancePrices[symbol] = newPrice

            const internal = BINANCE_TO_INTERNAL[symbol]
            if (internal && newPrice > 0) {
              const oldPrice = this.prices[internal] || newPrice
              this.prices[internal] = newPrice
              this.symbolStatuses[internal] = {
                status: 'LIVE',
                source: 'Binance WebSocket',
                lastUpdated: now,
              }
              const direction = newPrice >= oldPrice ? 'up' : 'down'
              this.notifyPrices(internal, direction)
            }

            // Real-time Synthetic USD/JPY tick on either BTCJPY or BTCUSDT tick
            if (symbol === 'BTCJPY' || symbol === 'BTCUSDT') {
              if (this.rawBinancePrices['BTCJPY'] && this.rawBinancePrices['BTCUSDT']) {
                const jpyP = parseFloat(
                  (this.rawBinancePrices['BTCJPY'] / this.rawBinancePrices['BTCUSDT']).toFixed(3)
                )
                if (jpyP > 0) {
                  const oldJ = this.prices['USD/JPY'] || jpyP
                  this.prices['USD/JPY'] = jpyP
                  this.symbolStatuses['USD/JPY'] = {
                    status: 'LIVE',
                    source: 'Binance (BTCJPY/BTCUSDT Synthetic)',
                    lastUpdated: now,
                  }
                  this.notifyPrices('USD/JPY', jpyP >= oldJ ? 'up' : 'down')
                }
              }
            }
          }
        } catch (err) {}
      }

      this.ws.onerror = () => {
        this.notifyStatus(false)
      }

      this.ws.onclose = () => {
        this.notifyStatus(false)
        Object.values(BINANCE_TO_INTERNAL).forEach((sym) => {
          if (this.symbolStatuses[sym]?.status === 'LIVE') {
            this.symbolStatuses[sym] = {
              ...this.symbolStatuses[sym],
              status: 'STALE',
              source: 'Binance (Reconnecting...)',
            }
          }
        })
        if (this.reconnectAttempts < 15) {
          this.reconnectAttempts++
          setTimeout(() => this.connectWebSocket(), 2000)
        }
      }
    } catch (e) {
      console.warn('Failed to start Binance WebSocket', e)
      this.notifyStatus(false)
    }
  }

  // Demo Tick Engine: ONLY runs when isDemoTicksEnabled === true (strictly disabled in production)
  startEcnTickEngine() {
    if (this.ecnTickTimer) clearInterval(this.ecnTickTimer)
    if (!this.isDemoTicksEnabled) return

    const allSymbols = Object.keys(this.prices)

    this.ecnTickTimer = setInterval(() => {
      if (!this.isDemoTicksEnabled) {
        clearInterval(this.ecnTickTimer)
        this.ecnTickTimer = null
        return
      }

      // Priority Tick for active symbol in demo mode
      if (this.activeSymbol && this.prices[this.activeSymbol]) {
        this.generateTickForSymbol(this.activeSymbol)
      }

      // Background rotation in demo mode
      const otherSymbols = allSymbols.filter((s) => s !== this.activeSymbol)
      if (otherSymbols.length > 0) {
        const randomSym = otherSymbols[Math.floor(Math.random() * otherSymbols.length)]
        this.generateTickForSymbol(randomSym)
      }
    }, 450)
  }

  // Generate simulated demo fluctuation - ALWAYS marked as DEMO status, NEVER LIVE
  generateTickForSymbol(sym) {
    if (!this.isDemoTicksEnabled) return
    const current = this.prices[sym]
    if (!current || current <= 0) return

    let jitter = 0
    let precision = 2

    if (sym === 'GOLD/USD') {
      jitter = (Math.random() - 0.49) * 0.24
      precision = 2
    } else if (sym === 'USD/JPY') {
      jitter = (Math.random() - 0.49) * 0.025
      precision = 3
    } else if (['EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/CHF', 'USD/CAD'].includes(sym)) {
      jitter = (Math.random() - 0.49) * 0.00018
      precision = 4
    } else if (sym === 'NVDA/USD' || sym === 'TSLA/USD') {
      jitter = (Math.random() - 0.49) * 0.06
      precision = 2
    } else {
      jitter = (Math.random() - 0.49) * (current * 0.00012)
      precision = current > 100 ? 2 : 4
    }

    const newP = parseFloat((current + jitter).toFixed(precision))
    if (newP > 0) {
      const oldP = this.prices[sym] || newP
      this.prices[sym] = newP
      this.lastTickTime[sym] = Date.now()
      this.tickCount++
      // STRICT DEMO STATUS: NEVER Labeled LIVE!
      this.symbolStatuses[sym] = {
        status: 'DEMO',
        source: 'Local Demo Simulator',
        lastUpdated: Date.now(),
      }
      const direction = newP >= oldP ? 'up' : 'down'
      this.notifyPrices(sym, direction)
    }
  }

  destroy() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    if (this.ecnTickTimer) {
      clearInterval(this.ecnTickTimer)
      this.ecnTickTimer = null
    }
    this.subscribers.clear()
    this.statusSubscribers.clear()
  }
}

export const liveMarketService = new LiveMarketService()
export default liveMarketService
