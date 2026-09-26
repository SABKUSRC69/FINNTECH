import { TRADING_PAIRS } from '../data/tradingData.js'

// FINNTECH is currently a local DEMO Spot Trading app. Prices below are
// illustrative snapshots; this service deliberately opens no market sockets
// and makes no market-data requests.
class DemoMarketService {
  constructor() {
    this.subscribers = new Set()
    this.statusSubscribers = new Set()
    this.ws = null
    this.pollTimer = null
    this.demoTickTimer = null
    this.isConnected = false
    this.isDemoTicksEnabled = false
    this.latency = null
    this.activeSymbol = 'BTC/THB'
    this.unavailableSymbols = new Set()
    this.prices = Object.fromEntries(TRADING_PAIRS.map((pair) => [pair.symbol, pair.price]))
    this.symbolStatuses = Object.fromEntries(TRADING_PAIRS.map((pair) => [pair.symbol, {
      status: 'DEMO',
      source: 'Local demo price snapshot',
      lastUpdated: null,
    }]))
  }

  init() {
    // Demo simulation replaces external feeds in this phase. Switching pairs
    // changes the active simulated symbol and never opens a WebSocket.
    if (!this.isDemoTicksEnabled) this.setDemoTicksEnabled(true)
    this.notifyStatus()
  }

  setActiveSymbol(symbol) {
    if (symbol && Object.hasOwn(this.prices, symbol)) this.activeSymbol = symbol
  }

  getSymbolStatus(symbol) {
    return this.symbolStatuses[symbol] || {
      status: 'UNAVAILABLE',
      source: 'No demo snapshot for this pair',
      lastUpdated: null,
    }
  }

  getMarketStatus() {
    return {
      isConnected: false,
      latency: null,
      isDemoTicksEnabled: this.isDemoTicksEnabled,
      activeSymbol: this.activeSymbol,
      activeSymbolStatus: this.getSymbolStatus(this.activeSymbol),
      symbolStatuses: this.symbolStatuses,
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback)
    callback(this.prices, { symbol: null, direction: 'none' })
    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0 && this.demoTickTimer) {
        clearInterval(this.demoTickTimer)
        this.demoTickTimer = null
        this.isDemoTicksEnabled = false
        this.notifyStatus()
      }
    }
  }

  subscribeStatus(callback) {
    this.statusSubscribers.add(callback)
    callback(this.getMarketStatus())
    return () => this.statusSubscribers.delete(callback)
  }

  notifyPrices(symbol, direction) {
    this.subscribers.forEach((callback) => callback(this.prices, { symbol, direction }))
  }

  notifyStatus() {
    const status = this.getMarketStatus()
    this.statusSubscribers.forEach((callback) => callback(status))
  }

  setDemoTicksEnabled(enabled) {
    this.isDemoTicksEnabled = Boolean(enabled)
    if (this.demoTickTimer) {
      clearInterval(this.demoTickTimer)
      this.demoTickTimer = null
    }
    if (this.isDemoTicksEnabled) {
      this.demoTickTimer = setInterval(() => this.generateTickForSymbol(this.activeSymbol), 1000)
    }
    this.notifyStatus()
  }

  generateTickForSymbol(symbol) {
    if (!this.isDemoTicksEnabled) return
    if (this.unavailableSymbols.has(symbol)) return
    const current = Number(this.prices[symbol])
    if (!Number.isFinite(current) || current <= 0) return
    const precision = current >= 1000 ? 2 : current >= 1 ? 3 : 5
    const next = Number((current * (1 + (Math.random() - 0.5) * 0.001)).toFixed(precision))
    if (!Number.isFinite(next) || next <= 0) return
    this.prices[symbol] = next
    this.symbolStatuses[symbol] = {
      status: 'DEMO',
      source: 'Local demo price simulator',
      lastUpdated: Date.now(),
    }
    this.notifyPrices(symbol, next >= current ? 'up' : 'down')
    this.notifyStatus()
  }

  // Kept for callers from older builds. Demo mode does not fetch external prices.
  async fetchInitialPrices() {
    return false
  }

  markUnavailable(symbol, source = 'Demo feed unavailable') {
    this.unavailableSymbols.add(symbol)
    this.symbolStatuses[symbol] = { status: 'UNAVAILABLE', source, lastUpdated: null }
    this.notifyStatus()
  }

  destroy() {
    if (this.demoTickTimer) clearInterval(this.demoTickTimer)
    if (this.pollTimer) clearInterval(this.pollTimer)
    if (this.ws) this.ws.close()
    this.demoTickTimer = null
    this.pollTimer = null
    this.ws = null
    this.isDemoTicksEnabled = false
    this.activeSymbol = 'BTC/THB'
    this.unavailableSymbols.clear()
    this.prices = Object.fromEntries(TRADING_PAIRS.map((pair) => [pair.symbol, pair.price]))
    this.symbolStatuses = Object.fromEntries(TRADING_PAIRS.map((pair) => [pair.symbol, {
      status: 'DEMO',
      source: 'Local demo price snapshot',
      lastUpdated: null,
    }]))
    this.subscribers.clear()
    this.statusSubscribers.clear()
  }
}

export const SYMBOL_MAPPINGS = Object.fromEntries(TRADING_PAIRS.map((pair) => [pair.symbol, {
  tradingView: pair.tradingViewSymbol,
  name: pair.name,
  type: 'crypto',
  fallbackPrice: pair.price,
}]))

export const liveMarketService = new DemoMarketService()
export default liveMarketService
