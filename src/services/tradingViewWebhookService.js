/**
 * FINNTECH Signal Simulator (TradingView Alert & Pine Script JSON Tester)
 * 
 * IMPORTANT ARCHITECTURE NOTE:
 * FINNTECH is a static client-side web application hosted on GitHub Pages without a backend server.
 * A static frontend cannot directly receive inbound HTTP POST webhooks from external services.
 * This service acts as an In-App Signal Simulator allowing traders to test Pine Script alert payloads,
 * simulate incoming webhook JSON executions, or connect with a local webhook proxy relay.
 */

const STORAGE_KEY_SECRET = 'finntech_tv_webhook_secret'
const STORAGE_KEY_LOGS = 'finntech_tv_signal_logs'

const VALID_ACTIONS = ['BUY', 'SELL', 'LONG', 'SHORT', 'CLOSE']

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
    return 'Static client-side app (GitHub Pages) ไม่มี Backend Server สำหรับรับ inbound HTTP POST Webhook จาก TradingView ภายนอกได้โดยตรง หน้าต่างนี้ทำหน้าที่เป็น In-App Signal Simulator เพื่อทดสอบการทำงานของ JSON Alert'
  }

  getWebhookUrl() {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3000'
    return `${origin}/api/webhook/tradingview (Requires Local Relay Proxy)`
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
   *   "action": "BUY" | "SELL" | "LONG" | "SHORT" | "CLOSE",
   *   "price": 76320 (optional),
   *   "leverage": 10 (optional, 1-100),
   *   "amount": 25000 (optional margin THB, > 0),
   *   "tp": 79000 (optional),
   *   "sl": 74000 (optional),
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

    // 3. Action validation: Must be BUY, SELL, LONG, SHORT, or CLOSE
    const rawAction = String(payload.action || '').toUpperCase().trim()
    if (!VALID_ACTIONS.includes(rawAction)) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol,
        action: rawAction || 'EMPTY',
        status: 'REJECTED',
        reason: `คำสั่ง '${rawAction}' ไม่ถูกต้อง (ต้องเป็น BUY, SELL, LONG, SHORT หรือ CLOSE)`,
        comment: payload.comment || 'Invalid action',
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: `Invalid action: must be one of ${VALID_ACTIONS.join(', ')}`, log: rejectedLog }
    }

    const isCloseAction = rawAction === 'CLOSE'
    const side = isCloseAction ? 'CLOSE' : ((rawAction === 'BUY' || rawAction === 'LONG') ? 'LONG' : 'SHORT')

    // 4. Leverage and Margin validation (for open actions)
    let leverage = 10
    let amount = 25000

    if (!isCloseAction) {
      const levInput = payload.leverage !== undefined ? Number(payload.leverage) : 10
      if (isNaN(levInput) || levInput < 1 || levInput > 100) {
        const rejectedLog = {
          id: 'sig-' + Date.now(),
          timestamp: `${dateStr} ${timestamp}`,
          symbol,
          action: rawAction,
          status: 'REJECTED',
          reason: `ค่า Leverage (${payload.leverage}) ไม่ถูกต้อง ต้องอยู่ระหว่าง 1 - 100`,
          comment: payload.comment || 'Invalid leverage',
          isSimulation
        }
        this.logs.unshift(rejectedLog)
        this.saveLogs()
        return { success: false, message: 'Invalid leverage: must be between 1 and 100', log: rejectedLog }
      }
      leverage = Math.round(levInput)

      const amtInput = payload.amount !== undefined ? Number(payload.amount) : 25000
      if (isNaN(amtInput) || amtInput <= 0) {
        const rejectedLog = {
          id: 'sig-' + Date.now(),
          timestamp: `${dateStr} ${timestamp}`,
          symbol,
          action: rawAction,
          status: 'REJECTED',
          reason: `จำนวนเงิน Margin (${payload.amount}) ต้องมากกว่า 0`,
          comment: payload.comment || 'Invalid amount',
          isSimulation
        }
        this.logs.unshift(rejectedLog)
        this.saveLogs()
        return { success: false, message: 'Invalid amount: must be greater than 0', log: rejectedLog }
      }
      amount = amtInput
    }

    // 5. TP / SL Validation
    const tpPrice = payload.tp ? Number(payload.tp) : null
    if (tpPrice !== null && (isNaN(tpPrice) || tpPrice <= 0)) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol,
        action: rawAction,
        status: 'REJECTED',
        reason: 'ราคา Take Profit (tp) ต้องเป็นตัวเลขมากกว่า 0',
        comment: payload.comment || 'Invalid TP price',
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: 'Invalid TP price', log: rejectedLog }
    }

    const slPrice = payload.sl ? Number(payload.sl) : null
    if (slPrice !== null && (isNaN(slPrice) || slPrice <= 0)) {
      const rejectedLog = {
        id: 'sig-' + Date.now(),
        timestamp: `${dateStr} ${timestamp}`,
        symbol,
        action: rawAction,
        status: 'REJECTED',
        reason: 'ราคา Stop Loss (sl) ต้องเป็นตัวเลขมากกว่า 0',
        comment: payload.comment || 'Invalid SL price',
        isSimulation
      }
      this.logs.unshift(rejectedLog)
      this.saveLogs()
      return { success: false, message: 'Invalid SL price', log: rejectedLog }
    }

    const comment = payload.comment || (isSimulation ? 'Signal Simulator Test' : 'TradingView Alert')

    const signalData = {
      id: 'sig-' + Date.now(),
      symbol,
      side,
      action: rawAction,
      leverage: isCloseAction ? null : leverage,
      amount: isCloseAction ? null : amount,
      tpPrice,
      slPrice,
      comment,
      price: payload.price ? Number(payload.price) : null,
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
      leverage: isCloseAction ? '-' : `${leverage}x`,
      amount: isCloseAction ? '-' : `฿${amount.toLocaleString()}`,
      status: 'EXECUTED',
      comment,
      isSimulation,
      details: executionResult.details || null
    }

    this.logs.unshift(logEntry)
    this.saveLogs()

    return {
      success: true,
      message: isCloseAction
        ? `ปิดสัญญา ${symbol} สำเร็จ (${executionResult.closedCount || 1} รายการ)`
        : `สัญญาณ ${side} ${symbol} (${leverage}x) ประมวลผลสำเร็จ`,
      data: signalData,
      result: executionResult,
      log: logEntry
    }
  }

  // Generate example JSON payload for user to copy to TradingView
  generateAlertMessageTemplate(symbol = 'BINANCE:BTCUSDT', action = 'BUY') {
    if (action === 'CLOSE') {
      return JSON.stringify({
        secret: this.secretKey,
        symbol: "{{ticker}}",
        action: "CLOSE",
        comment: "TradingView Alert Close Position"
      }, null, 2)
    }

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

export const tradingViewWebhookService = new TradingViewSignalSimulatorService()
export default tradingViewWebhookService
