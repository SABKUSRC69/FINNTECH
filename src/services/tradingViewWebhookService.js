/**
 * FINNTECH Signal Simulator (TradingView Alert & Pine Script JSON Tester)
 * 
 * IMPORTANT ARCHITECTURE NOTE:
 * FINNTECH is a static client-side web application hosted on GitHub Pages without a backend server.
 * A static frontend cannot directly receive inbound HTTP POST webhooks from external services.
 * This service acts as an In-App Signal Simulator allowing traders to test Pine Script alert payloads,
 * simulate incoming webhook JSON executions, or connect with a local webhook proxy relay.
 */

import { TRADING_PAIRS } from '../data/tradingData.js'

const STORAGE_KEY_SECRET = 'finntech_tv_webhook_secret'
const STORAGE_KEY_LOGS = 'finntech_tv_signal_logs'

const VALID_ACTIONS = ['BUY', 'SELL']

export class TradingViewSignalSimulatorService {
  constructor() {
    this.secretKey = this.loadOrGenerateSecret()
    this.logs = this.loadLogs()
    this.executionCallback = null
  }

  // Load or generate a persistent Secret Key for simulator validation
  loadOrGenerateSecret() {
    try {
      let secret = localStorage.getItem(STORAGE_KEY_SECRET)
      if (!secret) {
        secret = 'ft_sec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
        localStorage.setItem(STORAGE_KEY_SECRET, secret)
      }
      return secret
    } catch {
      return 'ft_sec_demo_key'
    }
  }

  regenerateSecret() {
    this.secretKey = 'ft_sec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    try {
      localStorage.setItem(STORAGE_KEY_SECRET, this.secretKey)
    } catch {}
    return this.secretKey
  }

  getSecret() {
    return this.secretKey
  }

  getWebhookNotice() {
    return 'แอปนี้ไม่มี Webhook Endpoint; ทดสอบคำสั่งได้เฉพาะ Spot DEMO Simulator ในหน้าแอป'
  }

  getWebhookUrl() {
    return 'ไม่มี Webhook Endpoint ในแอปนี้'
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
    if (!inputSym) return ''
    let sym = String(inputSym).toUpperCase().trim()
    
    // Strip exchange prefixes (e.g. BINANCE:BTCUSDT -> BTCUSDT)
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
   * Process a TradingView signal payload
   * Payload schema:
   * {
   *   "secret": "ft_sec_...",
   *   "symbol": "BTC/USDT" or "BINANCE:BTCUSDT",
   *   "action": "BUY" | "SELL",
   *   "price": 76320 (optional),
   *   "amount": 25000 (required; BUY uses quote THB budget, SELL uses base asset quantity),
   *   "comment": "RSI Oversold" (optional)
   * }
   */
  processSignal(payload, isSimulation = false) {
    const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = new Date().toISOString().slice(0, 10)

    if (!payload || typeof payload !== 'object') {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol: 'UNKNOWN',
        action: 'UNKNOWN',
        status: 'REJECTED',
        reason: 'Payload ว่างเปล่าหรือไม่ถูกต้อง (Invalid payload object)',
        comment: 'Malformed Request',
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: 'Invalid payload object', log: rejectedLog }
    }

    // 1. Secret Key validation (bypassed only when tested via in-app UI simulator)
    if (!isSimulation && payload.secret !== this.secretKey) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol: payload.symbol || 'UNKNOWN',
        action: payload.action || 'UNKNOWN',
        status: 'REJECTED',
        reason: 'Secret Key ไม่ถูกต้อง (Invalid Secret Key)',
        comment: payload.comment || 'External Unauthenticated Request',
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: 'Invalid Secret Key', log: rejectedLog }
    }

    // 2. Symbol validation
    const rawSymbol = payload.symbol
    const symbol = this.normalizeSymbol(rawSymbol)
    if (!symbol) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol: 'UNKNOWN',
        action: payload.action || 'UNKNOWN',
        status: 'REJECTED',
        reason: 'ระบุคู่เหรียญไม่ถูกต้อง (Invalid or missing symbol)',
        comment: payload.comment || 'Missing symbol',
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: 'Invalid or missing symbol', log: rejectedLog }
    }
    if (!TRADING_PAIRS.some((pair) => pair.symbol === symbol)) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol,
        action: String(payload.action || '').toUpperCase().trim() || 'EMPTY',
        status: 'REJECTED',
        reason: 'รองรับเฉพาะคู่ Spot DEMO ในระบบ',
        comment: payload.comment || 'Unsupported Spot pair',
        isSimulation,
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: rejectedLog.reason, log: rejectedLog }
    }

    // 3. This simulator accepts Spot BUY and SELL only.
    const rawAction = String(payload.action || '').toUpperCase().trim()
    if (!VALID_ACTIONS.includes(rawAction)) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol,
        action: rawAction || 'EMPTY',
        status: 'REJECTED',
        reason: `คำสั่ง '${rawAction}' ไม่รองรับ (รับเฉพาะ Spot BUY หรือ SELL)`,
        comment: payload.comment || 'Invalid action',
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: `รองรับเฉพาะ Spot ${VALID_ACTIONS.join(' และ ')}`, log: rejectedLog }
    }

    const amount = Number(payload.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol,
        action: rawAction,
        status: 'REJECTED',
        reason: 'ระบุ amount ของคำสั่ง Spot เป็นเลข finite และมากกว่า 0',
        comment: payload.comment || 'Invalid amount',
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: 'amount ต้องเป็นเลข finite และมากกว่า 0', log: rejectedLog }
    }

    const comment = payload.comment || (isSimulation ? 'Signal Simulator Test' : 'TradingView Alert')

    const signalData = {
      id: 'sig-' + Date.now(),
      symbol,
      side: rawAction,
      action: rawAction,
      amount,
      comment,
      price: Number.isFinite(Number(payload.price)) ? Number(payload.price) : null,
      timestamp: `${dateStr} ${timestamp}`,
      isSimulation
    }

    // 6. Verify that an execution callback is registered
    if (!this.executionCallback) {
      const rejectedLog = {
        id: signalData.id,
        timestamp: signalData.timestamp,
        symbol,
        action: rawAction,
        status: 'REJECTED',
        reason: 'ไม่มี Trading Terminal Listener เชื่อมต่ออยู่ (No active execution handler)',
        comment,
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: 'ไม่มี Terminal Callback รองรับการส่งคำสั่ง', log: rejectedLog }
    }

    // 7. Execute order through callback
    let executionResult = null
    try {
      executionResult = this.executionCallback(signalData)
    } catch (err) {
      const failedLog = {
        id: signalData.id,
        timestamp: signalData.timestamp,
        symbol,
        action: rawAction,
        status: 'FAILED',
        reason: err.message || 'Execution error in terminal callback',
        comment,
        isSimulation
      }
      this.logs.unshift(failedLog)
      this.saveLogs()
      return { success: false, message: err.message || 'Execution failed', log: failedLog }
    }

    // 8. Inspect callback result: Must return success: true to be logged as EXECUTED
    if (!executionResult || executionResult.success === false) {
      const failureReason = executionResult?.reason || 'คำสั่งถูกปฏิเสธโดยระบบจัดการคำสั่ง (Rejected by terminal)'
      const rejectedLog = {
        id: signalData.id,
        timestamp: signalData.timestamp,
        symbol,
        action: rawAction,
        status: 'REJECTED',
        reason: failureReason,
        comment,
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: failureReason, log: rejectedLog }
    }

    // 9. Successfully executed
    const logEntry = {
      id: signalData.id,
      timestamp: signalData.timestamp,
      symbol,
      action: rawAction,
      amount: `${amount} ${rawAction === 'BUY' ? symbol.split('/')[1] : symbol.split('/')[0]}`,
      status: 'EXECUTED',
      comment,
      isSimulation,
      details: executionResult.details || null
    }

    this.logs.unshift(logEntry)
    this.saveLogs()

    return {
      success: true,
      message: `จำลองคำสั่ง Spot ${rawAction} ${symbol} สำเร็จ`,
      data: signalData,
      result: executionResult,
      log: logEntry
    }
  }

  // Generate example JSON payload for user to copy to TradingView
  generateAlertMessageTemplate(symbol = 'BTC/THB', action = 'BUY') {
    return JSON.stringify({
      secret: this.secretKey,
      symbol,
      action: action,
      amount: action === 'BUY' ? 25000 : 0.001,
      comment: "TradingView Alert Triggered"
    }, null, 2)
  }
}

export const tradingViewWebhookService = new TradingViewSignalSimulatorService()
export default tradingViewWebhookService
