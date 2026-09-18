import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import forexFactoryService from '../services/forexFactoryService'
import liveMarketService from '../services/liveMarketService'

describe('Fintech Integrity - News & Market Data Feeds', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    forexFactoryService.cache = []
    forexFactoryService.cacheTimestamp = null
    forexFactoryService.currentStatus = {
      status: 'UNAVAILABLE',
      source: 'ForexFactory JSON API (Pending)',
      lastUpdated: null
    }
  })

  afterEach(() => {
    global.fetch = originalFetch
    liveMarketService.destroy()
    vi.restoreAllMocks()
  })

  it('Requirement 1: News service must NEVER display LIVE status when API fails', async () => {
    // Simulate network / CORS failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch (CORS blocked)'))

    const events = await forexFactoryService.getCalendarEvents(false)
    const status = forexFactoryService.getStatus()

    expect(status.status).toBe('UNAVAILABLE')
    expect(status.status).not.toBe('LIVE')
    expect(events).toHaveLength(0)
  })

  it('Requirement 1b: Market service must NEVER mark status as LIVE when API fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'))

    await liveMarketService.fetchInitialPrices()
    const btcStatus = liveMarketService.getSymbolStatus('BTC/USDT')

    expect(btcStatus.status).toBe('UNAVAILABLE')
    expect(btcStatus.status).not.toBe('LIVE')
  })

  it('Requirement 2: Normal mode must NOT generate fake economic headlines or rolling dynamic events', async () => {
    // Normal mode without demo toggle: if network fails, cache must be empty (no fake event generator)
    global.fetch = vi.fn().mockRejectedValue(new Error('CORS blocked'))

    const events = await forexFactoryService.getCalendarEvents(false)
    expect(events).toEqual([])

    // Verify generateDynamicWeeklyEvents is deleted / not on service
    expect(forexFactoryService.generateDynamicWeeklyEvents).toBeUndefined()
  })

  it('Requirement 2b: Market service has synthetic random ticks disabled by default in production', () => {
    expect(liveMarketService.isDemoTicksEnabled).toBe(false)
  })

  it('Requirement 2c: If demo mode is explicitly enabled, data must be tagged as DEMO, NEVER LIVE', async () => {
    // Explicit demo request
    forexFactoryService.setDemoMode(true)
    const demoEvents = await forexFactoryService.getCalendarEvents(true)
    const demoStatus = forexFactoryService.getStatus()

    expect(demoStatus.status).toBe('DEMO')
    expect(demoStatus.status).not.toBe('LIVE')
    expect(demoEvents.length).toBeGreaterThan(0)
    expect(demoEvents[0].isDemo).toBe(true)

    // Demo ticks in market service
    liveMarketService.setDemoTicksEnabled(true)
    expect(liveMarketService.isDemoTicksEnabled).toBe(true)

    liveMarketService.generateTickForSymbol('BTC/USDT')
    const btcStatus = liveMarketService.getSymbolStatus('BTC/USDT')
    expect(btcStatus.status).toBe('DEMO')
    expect(btcStatus.status).not.toBe('LIVE')
    expect(btcStatus.source).toContain('Demo')
  })
})
