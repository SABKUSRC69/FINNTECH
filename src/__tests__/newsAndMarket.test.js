import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import ForexNewsView from '../components/news/ForexNewsView'
import forexFactoryService from '../services/forexFactoryService'
import liveMarketService from '../services/liveMarketService'

describe('Fintech Integrity - News & Market Data Feeds', () => {
  const originalFetch = global.fetch
  const originalWindowFetch = window.fetch

  beforeEach(() => {
    const blockedFetch = vi.fn().mockRejectedValue(new Error('Network offline'))
    global.fetch = blockedFetch
    window.fetch = blockedFetch
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
    window.fetch = originalWindowFetch
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

  it('Requirement 1b: market snapshots and generated ticks are labeled DEMO, never LIVE', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'))

    await liveMarketService.fetchInitialPrices()
    expect(global.fetch).not.toHaveBeenCalled()
    expect(liveMarketService.getSymbolStatus('BTC/THB').status).toBe('DEMO')
    expect(liveMarketService.getSymbolStatus('BTC/USDT').status).toBe('UNAVAILABLE')
  })

  it('Requirement 2: Normal mode must NOT generate fake economic headlines or rolling dynamic events', async () => {
    // Normal mode without demo toggle: if network fails, cache must be empty (no fake event generator)
    global.fetch = vi.fn().mockRejectedValue(new Error('CORS blocked'))

    const events = await forexFactoryService.getCalendarEvents(false)
    expect(events).toEqual([])

    // Verify generateDynamicWeeklyEvents is deleted / not on service
    expect(forexFactoryService.generateDynamicWeeklyEvents).toBeUndefined()
  })

  it('Requirement 2b: DEMO ticks start only when the trading terminal initializes', () => {
    expect(liveMarketService.isDemoTicksEnabled).toBe(false)
    liveMarketService.init()
    expect(liveMarketService.isDemoTicksEnabled).toBe(true)
    expect(liveMarketService.getSymbolStatus('BTC/THB').status).toBe('DEMO')
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

    liveMarketService.generateTickForSymbol('BTC/THB')
    const btcStatus = liveMarketService.getSymbolStatus('BTC/THB')
    expect(btcStatus.status).toBe('DEMO')
    expect(btcStatus.status).not.toBe('LIVE')
    expect(btcStatus.source).toMatch(/demo/i)
  })

  it('shows the economic calendar widget loading/failure state instead of a live label', async () => {
    vi.spyOn(forexFactoryService, 'getCalendarEvents').mockResolvedValue([])
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = createElement(tagName, options)
      if (String(tagName).toLowerCase() === 'script') {
        Object.defineProperty(element, 'src', { configurable: true, get: () => '', set: () => {} })
      }
      return element
    })
    render(React.createElement(ForexNewsView))
    fireEvent.click(screen.getByRole('button', { name: /TradingView Calendar \(ตลาดโลก\)/ }))

    expect(await screen.findByText('กำลังโหลด widget')).toBeTruthy()
    expect(screen.queryByText('สด')).toBeNull()
    fireEvent.error(document.querySelector('.tradingview-widget-container script'))
    expect(screen.getByText('widget ไม่พร้อมใช้งาน')).toBeTruthy()
  })
})
