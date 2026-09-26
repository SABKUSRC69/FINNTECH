import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TradingViewSignalSimulatorService } from '../services/tradingViewWebhookService'

describe('Spot DEMO Signal Simulator', () => {
  let service

  beforeEach(() => {
    service = new TradingViewSignalSimulatorService()
    service.clearLogs()
  })

  it('accepts Spot BUY and SELL only for supported THB pairs', () => {
    const received = []
    service.onSignalReceived((signal) => {
      received.push(signal)
      return { success: true }
    })

    expect(service.processSignal({ symbol: 'BTC/THB', action: 'BUY', amount: 1000 }, true).success).toBe(true)
    expect(service.processSignal({ symbol: 'BTC/THB', action: 'SELL', amount: 0.01 }, true).success).toBe(true)
    expect(received.map(({ side }) => side)).toEqual(['BUY', 'SELL'])
    expect(service.getLogs().map(({ status }) => status)).toEqual(['EXECUTED', 'EXECUTED'])
  })

  it('rejects unsupported pairs and non-Spot actions without executing them', () => {
    service.onSignalReceived(vi.fn(() => ({ success: true })))

    const unsupported = service.processSignal({ symbol: 'GOLD/USD', action: 'BUY', amount: 100 }, true)
    const close = service.processSignal({ symbol: 'BTC/THB', action: 'CLOSE', amount: 1 }, true)
    const invalid = service.processSignal({ symbol: 'BTC/THB', action: 'INVALID', amount: 1 }, true)

    expect(unsupported.success).toBe(false)
    expect(close.success).toBe(false)
    expect(invalid.success).toBe(false)
    expect(service.getLogs().every(({ status }) => status === 'REJECTED')).toBe(true)
  })

  it('rejects missing, non-finite, and non-positive amounts', () => {
    service.onSignalReceived(vi.fn(() => ({ success: true })))
    for (const amount of [undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(service.processSignal({ symbol: 'BTC/THB', action: 'BUY', amount }, true).success).toBe(false)
    }
    expect(service.getLogs().every(({ status }) => status === 'REJECTED')).toBe(true)
  })

  it('does not record execution when callback is absent, rejects, or throws', () => {
    const absent = service.processSignal({ symbol: 'BTC/THB', action: 'BUY', amount: 1000 }, true)
    expect(absent.success).toBe(false)
    expect(absent.log.status).toBe('REJECTED')

    service.onSignalReceived(() => ({ success: false, reason: 'Insufficient demo balance' }))
    const rejected = service.processSignal({ symbol: 'BTC/THB', action: 'BUY', amount: 1000 }, true)
    expect(rejected.success).toBe(false)
    expect(rejected.log.status).toBe('REJECTED')

    service.onSignalReceived(() => { throw new Error('Demo execution failed') })
    const failed = service.processSignal({ symbol: 'BTC/THB', action: 'BUY', amount: 1000 }, true)
    expect(failed.success).toBe(false)
    expect(failed.log.status).toBe('FAILED')
    expect(service.getLogs().some(({ status }) => status === 'EXECUTED')).toBe(false)
  })

  it('does not advertise a webhook endpoint', () => {
    expect(service.getWebhookUrl()).toContain('ไม่มี Webhook Endpoint')
    expect(service.getWebhookNotice()).toContain('Spot DEMO Simulator')
  })
})
