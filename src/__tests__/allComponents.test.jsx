import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// Mock ResizeObserver for happy-dom
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Mock lightweight-charts to prevent canvas/DOM parser errors in happy-dom
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    applyOptions: vi.fn(),
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
      update: vi.fn(),
      createPriceLine: vi.fn(() => ({ applyOptions: vi.fn() })),
      removePriceLine: vi.fn(),
    })),
    removeSeries: vi.fn(),
    timeScale: vi.fn(() => ({ fitContent: vi.fn() })),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    remove: vi.fn(),
  })),
  CandlestickSeries: 'CandlestickSeries',
  LineStyle: { Dashed: 1, Solid: 0 },
  CrosshairMode: { Normal: 0 },
}))

// Mock recharts ResponsiveContainer
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div style={{ width: 500, height: 300 }}>{children}</div>,
  }
})

import App from '../App'
import DashboardView from '../components/dashboard/DashboardView'
import TradingTerminal from '../components/trading/TradingTerminal'
import TransactionManager from '../components/transactions/TransactionManager'
import CalculatorsView from '../components/calculators/CalculatorsView'
import PortfolioView from '../components/portfolio/PortfolioView'
import ForexNewsView from '../components/news/ForexNewsView'
import TradingChart from '../components/trading/TradingChart'
import TradingViewSignalModal from '../components/trading/TradingViewSignalModal'
import PriceAlertModal from '../components/trading/PriceAlertModal'
import ErrorBoundary from '../components/common/ErrorBoundary'

describe('All Components Smoke & Render Test', () => {
  it('Root App renders successfully', () => {
    expect(() => {
      render(<App />)
    }).not.toThrow()
  })

  it('DashboardView renders without error', () => {
    expect(() => {
      render(
        <DashboardView
          transactions={[]}
          portfolio={[]}
          tradingBalance={500000}
          tradingPositions={[]}
          onOpenQuickAdd={vi.fn()}
        />
      )
    }).not.toThrow()
  })

  it('TradingTerminal renders without error', () => {
    expect(() => {
      render(
        <TradingTerminal
          positions={[]}
          tradingBalance={500000}
          onAddPosition={vi.fn()}
          onClosePosition={vi.fn()}
          onCloseAllPositions={vi.fn()}
          onTopUpBalance={vi.fn()}
        />
      )
    }).not.toThrow()
  })

  it('TradingChart renders without ReferenceError', () => {
    expect(() => {
      render(
        <TradingChart
          pair={{ symbol: 'BTC/USDT', name: 'Bitcoin', price: 76320, category: 'crypto' }}
          currentPrice={76320}
          positions={[]}
          limitOrders={[]}
        />
      )
    }).not.toThrow()
  })

  it('TransactionManager renders without error', () => {
    expect(() => {
      render(
        <TransactionManager
          transactions={[]}
          onAddTransaction={vi.fn()}
          onDeleteTransaction={vi.fn()}
          onClearAllTransactions={vi.fn()}
          onOpenQuickAdd={vi.fn()}
        />
      )
    }).not.toThrow()
  })

  it('CalculatorsView renders without error', () => {
    expect(() => {
      render(<CalculatorsView />)
    }).not.toThrow()
  })

  it('PortfolioView renders without error', () => {
    expect(() => {
      render(
        <PortfolioView
          portfolio={[]}
          onAddAsset={vi.fn()}
          onDeleteAsset={vi.fn()}
          onClearAllPortfolio={vi.fn()}
          tradingPositions={[]}
          tradingBalance={500000}
          onCloseTradingPosition={vi.fn()}
        />
      )
    }).not.toThrow()
  })

  it('ForexNewsView renders without error', () => {
    expect(() => {
      render(<ForexNewsView onSelectTradePair={vi.fn()} />)
    }).not.toThrow()
  })

  it('TradingViewSignalModal renders without error', () => {
    expect(() => {
      render(<TradingViewSignalModal isOpen={true} onClose={vi.fn()} onFireSignal={vi.fn()} />)
    }).not.toThrow()
  })

  it('PriceAlertModal renders without error', () => {
    expect(() => {
      render(<PriceAlertModal isOpen={true} onClose={vi.fn()} onAddAlert={vi.fn()} />)
    }).not.toThrow()
  })

  it('ErrorBoundary gracefully catches child errors and displays fallback UI', () => {
    const ProblemChild = () => {
      throw new Error('Test intentional crash')
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { getByText } = render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    )

    expect(getByText(/เกิดข้อผิดพลาดที่ไม่คาดคิด/i)).toBeDefined()
    expect(getByText(/รีโหลดหน้าเว็บ/i)).toBeDefined()
    consoleSpy.mockRestore()
  })
})

