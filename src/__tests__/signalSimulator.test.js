import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TradingViewSignalSimulatorService } from '../services/tradingViewWebhookService'

describe('Fintech Execution Integrity - TradingView Signal Simulator', () => {
  let service

  beforeEach(() => {
    service = new TradingViewSignalSimulatorService()
    service.clearLogs()
  })

  it('Requirement 4: Action CLOSE must NOT create a SHORT side order', () => {
    // Register execution listener
    let receivedSignal = null
    service.onSignalReceived((signal) => {
      receivedSignal = signal
      return { success: true, closedCount: 1 }
    })

    const payload = {
      symbol: 'BTC/USDT',
      action: 'CLOSE',
      comment: 'Close Position Test'
    }

    const result = service.processSignal(payload, true)

    expect(result.success).toBe(true)
    expect(receivedSignal).not.toBeNull()
    // Side must be 'CLOSE', NEVER 'SHORT'!
    expect(receivedSignal.action).toBe('CLOSE')
    expect(receivedSignal.side).toBe('CLOSE')
    expect(receivedSignal.side).not.toBe('SHORT')
  })

  it('Requirement 4b: Terminal execution must reject CLOSE if no matching position exists', () => {
    // Simulate terminal open positions
    const openPositions = [
      { id: 'pos-1', symbol: 'ETH/USDT', side: 'LONG', amount: 20000, entryPrice: 2500 }
    ]

    service.onSignalReceived((signal) => {
      if (signal.action === 'CLOSE') {
        const matches = openPositions.filter((p) => p.symbol === signal.symbol)
        if (matches.length === 0) {
          return { success: false, reason: `ไม่พบ Position ของ ${signal.symbol} ที่เปิดอยู่ในพอร์ต` }
        }
        return { success: true, closedCount: matches.length }
      }
      return { success: true }
    })

    // Attempt to close BTC/USDT (which has NO open position)
    const result = service.processSignal({ symbol: 'BTC/USDT', action: 'CLOSE' }, true)

    expect(result.success).toBe(false)
    expect(result.message).toContain('ไม่พบ Position')

    // Must NOT be logged as EXECUTED
    const logs = service.getLogs()
    expect(logs[0].status).toBe('REJECTED')
    expect(logs[0].status).not.toBe('EXECUTED')
  })

  it('Requirement 5: Simulator must reject invalid inputs (action, leverage, margin, symbol)', () => {
    service.onSignalReceived(() => ({ success: true }))

    // 1. Invalid Action
    const res1 = service.processSignal({ symbol: 'BTC/USDT', action: 'INVALID_ACTION' }, true)
    expect(res1.success).toBe(false)
    expect(res1.message).toContain('Invalid action')

    // 2. Invalid Leverage (> 100 or <= 0)
    const res2 = service.processSignal({ symbol: 'BTC/USDT', action: 'BUY', leverage: 200, amount: 10000 }, true)
    expect(res2.success).toBe(false)
    expect(res2.message).toContain('leverage')

    const res2b = service.processSignal({ symbol: 'BTC/USDT', action: 'BUY', leverage: 0, amount: 10000 }, true)
    expect(res2b.success).toBe(false)

    // 3. Invalid Margin (<= 0)
    const res3 = service.processSignal({ symbol: 'BTC/USDT', action: 'BUY', leverage: 10, amount: -500 }, true)
    expect(res3.success).toBe(false)
    expect(res3.message).toContain('amount')

    // 4. Missing Symbol
    const res4 = service.processSignal({ symbol: '', action: 'BUY' }, true)
    expect(res4.success).toBe(false)
    expect(res4.message).toContain('symbol')

    // All invalid requests must be logged as REJECTED, NEVER EXECUTED
    const logs = service.getLogs()
    logs.forEach((log) => {
      expect(log.status).toBe('REJECTED')
      expect(log.status).not.toBe('EXECUTED')
    })
  })

  it('Requirement 5b: Simulator must NOT record EXECUTED when execution callback is missing or fails', () => {
    // 1. No execution callback registered
    const serviceWithoutCallback = new TradingViewSignalSimulatorService()
    serviceWithoutCallback.clearLogs()

    const res = serviceWithoutCallback.processSignal({ symbol: 'BTC/USDT', action: 'BUY', amount: 10000, leverage: 10 }, true)
    expect(res.success).toBe(false)
    expect(serviceWithoutCallback.getLogs()[0].status).toBe('REJECTED')
    expect(serviceWithoutCallback.getLogs()[0].status).not.toBe('EXECUTED')

    // 2. Callback throws error
    service.onSignalReceived(() => {
      throw new Error('Database write error')
    })
    const resFailed = service.processSignal({ symbol: 'BTC/USDT', action: 'BUY', amount: 10000, leverage: 10 }, true)
    expect(resFailed.success).toBe(false)
    expect(service.getLogs()[0].status).toBe('FAILED')
    expect(service.getLogs()[0].status).not.toBe('EXECUTED')
  })
})
