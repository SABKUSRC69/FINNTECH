/**
 * FINNTECH TradingView Webhook & Signal Service
 * Acts as an Execution Terminal Bridge (similar to MT5 / PineConnector)
 * Allows TradingView Alerts and Strategies to trigger automated order execution
 */

const STORAGE_KEY_SECRET = 'finntech_tv_webhook_secret'
const STORAGE_KEY_LOGS = 'finntech_tv_signal_logs'

class TradingViewWebhookService {
  constructor() {
    this.secretKey = this.loadOrGenerateSecret()
    this.logs = this.loadLogs()
    this.executionCallback = null
  }

  // Load or generate a persistent Secret Key
  loadOrGenerateSecret() {
    let secret = localStorage.getItem(STORAGE_KEY_SECRET)
    if (!secret) {
      secret = 'ft_sec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
      localStorage.setItem(STORAGE_KEY_SECRET, secret)
    }
    return secret
  }

  regenerateSecret() {
    this.secretKey = 'ft_sec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    localStorage.setItem(STORAGE_KEY_SECRET, this.secretKey)
    return this.secretKey
  }

  getSecret() {
    return this.secretKey
  }

  getWebhookUrl() {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3000'
    return `${origin}/api/webhook/tradingview`
  }

  loadLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs.slice(0, 50)))
    } catch (e) {
      console.warn('Failed to save signal logs', e)
    }
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    this.saveLogs()
    return this.logs
  }

  // Register execution handler (called from TradingTerminal)
  onSignalReceived(callback) {
    this.executionCallback = callback
  }

  // Normalize incoming symbol from various formats (e.g. BINANCE:BTCUSDT -> BTC/USDT)
  normalizeSymbol(inputSym) {
    if (!inputSym) return 'BTC/USDT'
    let sym = String(inputSym).toUpperCase().trim()
    
    // Strip exchange prefixes
    if (sym.includes(':')) {
      sym = sym.split(':')[1]
    }
    // Remove USDT suffix for standard pairing
    if (sym.endsWith('USDT') && !sym.includes('/')) {
      sym = sym.replace('USDT', '') + '/USDT'
    } else if (sym.endsWith('USD') && !sym.includes('/')) {
      sym = sym.replace('USD', '') + '/USD'
    }

    return sym
  }

  /**
   * Process an incoming TradingView signal payload
   * Payload schema:
   * {
   *   "secret": "ft_sec_...",
   *   "symbol": "BTC/USDT" or "BINANCE:BTCUSDT",
   *   "action": "BUY" | "SELL" | "LONG" | "SHORT" | "CLOSE",
   *   "price": 76320 (optional),
   *   "leverage": 10 (optional),
   *   "amount": 25000 (optional margin THB),
   *   "tp": 79000 (optional),
   *   "sl": 74000 (optional),
   *   "comment": "RSI Oversold" (optional)
   * }
   */
  processSignal(payload, isSimulation = false) {
    const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = new Date().toISOString().slice(0, 10)

    // Security validation (Bypassed if directly fired via in-app simulation)
    if (!isSimulation && payload.secret !== this.secretKey) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol: payload.symbol || 'UNKNOWN',
        action: payload.action || 'UNKNOWN',
        status: 'REJECTED',
        reason: 'Secret Key ไม่ถูกต้อง (Invalid Secret)',
        comment: payload.comment || 'External Unauthenticated Request'
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: 'Invalid Secret Key', log: rejectedLog }
    }

    // Parse parameters
    const symbol = this.normalizeSymbol(payload.symbol)
    const rawAction = String(payload.action || 'BUY').toUpperCase()
    const side = (rawAction === 'BUY' || rawAction === 'LONG') ? 'LONG' : 'SHORT'
    const leverage = Number(payload.leverage) || 10
    const amount = Number(payload.amount) || 25000
    const tpPrice = payload.tp ? Number(payload.tp) : null
    const slPrice = payload.sl ? Number(payload.sl) : null
    const comment = payload.comment || (isSimulation ? 'TradingView Simulator Test' : 'TradingView Live Webhook')

    const signalData = {
      id: 'sig-' + Date.now(),
      symbol,
      side,
      action: rawAction,
      leverage,
      amount,
      tpPrice,
      slPrice,
      comment,
      price: payload.price ? Number(payload.price) : null,
      timestamp: `${dateStr} ${timestamp}`,
      isSimulation
    }

    // Execute order if callback registered
    let executionResult = null
    if (this.executionCallback) {
      try {
        executionResult = this.executionCallback(signalData)
      } catch (err) {
        console.error('Execution callback error:', err)
      }
    }

    // Save successful log
    const logEntry = {
      id: signalData.id,
      timestamp: signalData.timestamp,
      symbol,
      action: side,
      leverage: `${leverage}x`,
      amount: `฿${amount.toLocaleString()}`,
      status: 'EXECUTED',
      comment,
      isSimulation
    }

    this.logs.unshift(logEntry)
    this.saveLogs()

    return {
      success: true,
      message: `สัญญาณ ${side} ${symbol} (${leverage}x) ประมวลผลสำเร็จ`,
      data: signalData,
      log: logEntry
    }
  }

  // Generate example JSON payload for user to copy to TradingView
  generateAlertMessageTemplate(symbol = 'BINANCE:BTCUSDT', action = 'BUY') {
    return JSON.stringify({
      secret: this.secretKey,
      symbol: "{{ticker}}",
      action: action,
      price: "{{close}}",
      leverage: 10,
      amount: 25000,
      tp: 0,
      sl: 0,
      comment: "TradingView Alert Triggered"
    }, null, 2)
  }
}

export const tradingViewWebhookService = new TradingViewWebhookService()
export default tradingViewWebhookService
