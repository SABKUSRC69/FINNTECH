import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import OrderForm from '../components/trading/OrderForm'
import SpotWithdrawModal from '../components/trading/SpotWithdrawModal'
import DashboardView from '../components/dashboard/DashboardView'
import PositionsTable from '../components/trading/PositionsTable'
import PortfolioView from '../components/portfolio/PortfolioView'
import authService from '../services/authService'
import { TradingViewSignalSimulatorService } from '../services/tradingViewWebhookService'
import { TRADING_PAIRS } from '../data/tradingData'
import { buildSpotTradesCsv, summarizeSpotTrades } from '../services/spotAnalyticsService'
import { calculateDashboardMetrics, formatMonthlyChange } from '../utils/dashboardMetrics'
import {
  calculatePortfolioValuation,
  calculateSpotWalletValuation,
  getDemoSpotPriceTHB,
} from '../utils/assetValuation'
import {
  SPOT_FEE_RATE,
  applyLimitPriceTick,
  applySpotOrder,
  applySpotWithdrawal,
  cancelSpotLimitOrder,
  createSpotAccount,
  floorSpotAmount,
  validateSpotOrder,
} from '../services/spotTradingService'

function makeOrder({ id = 'order-1', side = 'BUY', orderType = 'MARKET', price = 100, amount = 1, ...extra } = {}) {
  const total = price * amount
  return {
    id,
    symbol: 'BTC/THB',
    side,
    orderType,
    price,
    amount,
    total,
    fee: total * SPOT_FEE_RATE,
    baseAsset: 'BTC',
    quoteAsset: 'THB',
    ...(orderType === 'LIMIT' ? { targetPrice: price } : {}),
    ...extra,
  }
}

describe('Spot trading integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('recalculates Limit total when its price changes after entering amount', () => {
    render(
      <OrderForm
        pair={{ symbol: 'BTC/THB', baseAsset: 'BTC', quoteAsset: 'THB', precision: 2 }}
        currentPrice={100}
        spotBalances={{ THB: 1000, BTC: 0 }}
        onSubmitOrder={vi.fn()}
        priceStatus="DEMO"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'ลิมิต (Limit)' }))
    const [priceInput, amountInput, totalInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(amountInput, { target: { value: '2' } })
    fireEvent.change(priceInput, { target: { value: '120' } })
    expect(totalInput.value).toBe('240.6')
  })

  it('keeps the THB budget unchanged when the coin amount is floored to pair precision', () => {
    render(
      <OrderForm
        pair={{ symbol: 'BTC/THB', baseAsset: 'BTC', quoteAsset: 'THB', precision: 2, amountPrecision: 4, minQty: 0.0001 }}
        currentPrice={1234567}
        spotBalances={{ THB: 10000, BTC: 0 }}
        onSubmitOrder={vi.fn()}
        priceStatus="DEMO"
      />,
    )

    const [priceInput, amountInput, totalInput] = screen.getAllByRole('spinbutton')
    fireEvent.click(screen.getByRole('button', { name: 'ลิมิต (Limit)' }))
    fireEvent.change(totalInput, { target: { value: '1000' } })
    expect(amountInput.value).toBe('0.0008')
    expect(totalInput.value).toBe('1000')
    expect(priceInput.value).toBe('1234567')
    expect(screen.getByText(/ยอดเหลือจาก precision ของเหรียญ/)).toBeTruthy()
  })

  it('includes BUY fees in an entered full THB budget and matches the 100% button', () => {
    const pair = { symbol: 'BTC/THB', baseAsset: 'BTC', quoteAsset: 'THB', precision: 2, amountPrecision: 4, minQty: 0.0001 }
    const manualSubmit = vi.fn(() => ({ success: true }))
    const alertMock = vi.fn()
    vi.stubGlobal('alert', alertMock)
    const manual = render(
      <OrderForm pair={pair} currentPrice={100} spotBalances={{ THB: 500, BTC: 0 }} onSubmitOrder={manualSubmit} priceStatus="DEMO" />,
    )
    let [, , manualBudget] = screen.getAllByRole('spinbutton')
    fireEvent.change(manualBudget, { target: { value: '500' } })
    const manualAmount = Number(screen.getAllByRole('spinbutton')[1].value)
    expect(manualAmount).toBe(4.9875)
    expect(screen.getAllByRole('spinbutton')[2].value).toBe('500')
    fireEvent.submit(screen.getByRole('button', { name: /ซื้อ BTC.*มาร์เก็ต/ }).closest('form'))
    expect(alertMock).not.toHaveBeenCalled()
    expect(manualSubmit).toHaveBeenCalledTimes(1)
    const manualOrder = manualSubmit.mock.calls[0][0]
    expect(manualOrder.amount).toBe(manualAmount)
    expect(manualOrder.total + manualOrder.fee).toBeLessThanOrEqual(500)
    manual.unmount()

    const quickSubmit = vi.fn(() => ({ success: true }))
    render(
      <OrderForm pair={pair} currentPrice={100} spotBalances={{ THB: 500, BTC: 0 }} onSubmitOrder={quickSubmit} priceStatus="DEMO" />,
    )
    fireEvent.click(screen.getByRole('button', { name: '100%' }))
    expect(screen.getAllByRole('spinbutton')[2].value).toBe('500')
    expect(screen.getAllByRole('spinbutton')[1].value).toBe(String(manualAmount))
    fireEvent.submit(screen.getByRole('button', { name: /ซื้อ BTC.*มาร์เก็ต/ }).closest('form'))
    expect(quickSubmit).toHaveBeenCalledTimes(1)
    const quickOrder = quickSubmit.mock.calls[0][0]
    expect(quickOrder.total + quickOrder.fee).toBeLessThanOrEqual(500)
  })

  it('rejects BUY without quote funds for principal plus fee and leaves balances unchanged', () => {
    const account = createSpotAccount({ spotBalances: { THB: 100, BTC: 0 } })
    const result = applySpotOrder(account, makeOrder(), { priceStatus: 'DEMO' })
    expect(result.success).toBe(false)
    expect(result.account.spotBalances).toEqual({ THB: 100, BTC: 0 })
    expect(result.account.tradeHistory).toHaveLength(0)
  })

  it('rejects SELL without enough base asset and leaves balances unchanged', () => {
    const account = createSpotAccount({ spotBalances: { THB: 0, BTC: 0.5 } })
    const result = applySpotOrder(account, makeOrder({ side: 'SELL', id: 'sell-low', amount: 1 }), { priceStatus: 'DEMO' })
    expect(result.success).toBe(false)
    expect(result.account.spotBalances).toEqual({ THB: 0, BTC: 0.5 })
    expect(result.account.tradeHistory).toHaveLength(0)
  })

  it('validates finite positive values and requires total to equal price times amount', () => {
    for (const price of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(validateSpotOrder(makeOrder({ price })).success).toBe(false)
    }
    expect(validateSpotOrder(makeOrder({ total: 99 })).success).toBe(false)
    expect(validateSpotOrder(makeOrder({ fee: 5 })).success).toBe(false)
  })

  it('rejects an under-locked Limit target at placement when its target differs from the priced reserve', () => {
    const account = createSpotAccount({ spotBalances: { THB: 1000, BTC: 0 } })
    const underLocked = makeOrder({ id: 'under-locked-limit', orderType: 'LIMIT', price: 100, targetPrice: 101 })
    const result = applySpotOrder(account, underLocked)
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/ราคา Limit ต้องตรงกับราคาที่ใช้คำนวณยอดล็อก/)
    expect(result.account.spotBalances.THB).toBe(1000)
    expect(result.account.openOrders).toHaveLength(0)

    const excessiveTargetPrecision = makeOrder({ id: 'limit-extra-precision', orderType: 'LIMIT', price: 100, targetPrice: 100.001 })
    expect(validateSpotOrder(excessiveTargetPrecision).success).toBe(false)
  })

  it('enforces the configured minimum amount and price/amount precision for every Spot pair', () => {
    for (const pair of TRADING_PAIRS) {
      const buildPairOrder = (amount) => {
        const price = pair.priceInTHB
        const total = price * amount
        return {
          id: `precision-${pair.symbol}`,
          symbol: pair.symbol,
          side: 'BUY',
          orderType: 'MARKET',
          price,
          amount,
          total,
          fee: total * SPOT_FEE_RATE,
        }
      }

      expect(validateSpotOrder(buildPairOrder(pair.minQty)).success).toBe(true)
      expect(validateSpotOrder(buildPairOrder(pair.minQty / 10)).success).toBe(false)
      const extraDecimal = pair.minQty + 10 ** -(pair.amountPrecision + 1)
      expect(validateSpotOrder(buildPairOrder(extraDecimal)).success).toBe(false)
      const invalidPrice = pair.priceInTHB + 10 ** -(pair.precision + 1)
      const invalidPriceOrder = buildPairOrder(pair.minQty)
      invalidPriceOrder.price = invalidPrice
      invalidPriceOrder.total = invalidPrice * invalidPriceOrder.amount
      invalidPriceOrder.fee = invalidPriceOrder.total * SPOT_FEE_RATE
      expect(validateSpotOrder(invalidPriceOrder).success).toBe(false)
    }
  })

  it('migrates and cancels an old open order without refunding an unproven THB reserve', () => {
    const user = authService.register('Legacy Account', 'legacy-order@example.test', 'demo-pass')
    const legacyOrder = {
      id: 'legacy-sample-130k',
      symbol: 'BTC/THB',
      side: 'BUY',
      orderType: 'LIMIT',
      status: 'OPEN',
      price: 130000,
      targetPrice: 130000,
      amount: 1,
      total: 130000,
      lockedAsset: 'THB',
      lockedAmount: 130000,
    }
    localStorage.setItem(`finntech_user_${user.id}_data`, JSON.stringify({
      balance: 500000,
      spotBalances: { THB: 500000, BTC: 0 },
      openOrders: [legacyOrder],
      transactions: [],
      portfolio: [],
      tradeHistory: [],
    }))

    const oldAccount = authService.getUserData(user.id)
    expect(oldAccount.openOrders[0].lockedAmount).toBeUndefined()
    const attemptedTick = applyLimitPriceTick(oldAccount, 'BTC/THB', 100000, 'DEMO')
    expect(attemptedTick.filledOrders).toHaveLength(0)
    expect(attemptedTick.account.openOrders).toHaveLength(1)
    expect(attemptedTick.account.spotBalances.THB).toBe(500000)
    const cancelled = cancelSpotLimitOrder(oldAccount, legacyOrder.id)
    expect(cancelled.success).toBe(true)
    expect(cancelled.account.spotBalances.THB).toBe(500000)
    expect(cancelled.account.openOrders).toHaveLength(0)
    expect(cancelSpotLimitOrder(cancelled.account, legacyOrder.id).success).toBe(false)
  })

  it('shows unverified legacy orders as review-only, cancellable, and without a fabricated time', () => {
    const onCancelOpenOrder = vi.fn()
    const legacyOrder = {
      id: 'legacy-ui-order', symbol: 'BTC/THB', side: 'BUY', orderType: 'LIMIT',
      status: 'OPEN', price: 100, targetPrice: 100, amount: 1, total: 100,
      legacyLockUnverified: true,
    }
    render(<PositionsTable openOrders={[legacyOrder]} onCancelOpenOrder={onCancelOpenOrder} />)
    expect(screen.getByText('ไม่สามารถจับคู่ได้/รอตรวจสอบ')).toBeTruthy()
    expect(screen.queryByText('10:30:00')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก (ไม่คืนยอด)' }))
    expect(onCancelOpenOrder).toHaveBeenCalledWith('legacy-ui-order')
  })

  it('charges BUY and SELL fees that match the wallet movements and trade history', () => {
    let account = createSpotAccount({ spotBalances: { THB: 500, BTC: 1 } })
    const buy = applySpotOrder(account, makeOrder({ id: 'buy-1' }), { priceStatus: 'DEMO' })
    expect(buy.success).toBe(true)
    expect(buy.account.spotBalances).toEqual({ THB: 399.75, BTC: 2 })
    expect(buy.account.tradeHistory[0].fee).toBe(0.25)

    account = buy.account
    const sell = applySpotOrder(account, makeOrder({ id: 'sell-1', side: 'SELL', price: 120, amount: 0.5 }), { priceStatus: 'DEMO' })
    expect(sell.success).toBe(true)
    expect(sell.account.spotBalances).toEqual({ THB: 459.6, BTC: 1.5 })
    expect(sell.account.tradeHistory[0].fee).toBe(0.15)
    expect(sell.account.tradeHistory[1].fee).toBe(0.25)
  })

  it('locks a Limit BUY and cancellation returns only its one recorded reserve', () => {
    const placed = applySpotOrder(
      createSpotAccount({ spotBalances: { THB: 500, BTC: 0 } }),
      makeOrder({ id: 'limit-cancel', orderType: 'LIMIT' }),
    )
    expect(placed.success).toBe(true)
    expect(placed.account.spotBalances.THB).toBe(399.75)
    expect(placed.account.openOrders[0].lockedAsset).toBe('THB')
    expect(placed.account.openOrders[0].lockedAmount).toBe(100.25)

    const cancelled = cancelSpotLimitOrder(placed.account, 'limit-cancel')
    expect(cancelled.success).toBe(true)
    expect(cancelled.account.spotBalances.THB).toBe(500)
    const duplicateCancel = cancelSpotLimitOrder(cancelled.account, 'limit-cancel')
    expect(duplicateCancel.success).toBe(false)
    expect(duplicateCancel.account.spotBalances.THB).toBe(500)
  })

  it('fills a Limit order once and ignores a duplicate price tick for its order ID', () => {
    const placed = applySpotOrder(
      createSpotAccount({ spotBalances: { THB: 500, BTC: 0 } }),
      makeOrder({ id: 'limit-fill', orderType: 'LIMIT' }),
    )
    const firstTick = applyLimitPriceTick(placed.account, 'BTC/THB', 99, 'DEMO')
    expect(firstTick.filledOrders).toHaveLength(1)
    expect(firstTick.account.spotBalances).toEqual({ THB: 399.75, BTC: 1 })
    expect(firstTick.account.tradeHistory).toHaveLength(1)

    const duplicateTick = applyLimitPriceTick(firstTick.account, 'BTC/THB', 99, 'DEMO')
    expect(duplicateTick.filledOrders).toHaveLength(0)
    expect(duplicateTick.account.spotBalances).toEqual(firstTick.account.spotBalances)
    expect(duplicateTick.account.tradeHistory).toHaveLength(1)
  })

  it('does not fill an order or execute Market trades when the price feed is unavailable', () => {
    const placed = applySpotOrder(
      createSpotAccount({ spotBalances: { THB: 500, BTC: 0 } }),
      makeOrder({ id: 'limit-unavailable', orderType: 'LIMIT' }),
    )
    const tick = applyLimitPriceTick(placed.account, 'BTC/THB', 99, 'UNAVAILABLE')
    expect(tick.success).toBe(false)
    expect(tick.filledOrders).toHaveLength(0)
    expect(tick.account.openOrders).toHaveLength(1)
    expect(tick.account.spotBalances.THB).toBe(399.75)

    const market = applySpotOrder(tick.account, makeOrder({ id: 'market-unavailable' }), { priceStatus: 'UNAVAILABLE' })
    expect(market.success).toBe(false)
    expect(market.account.spotBalances).toEqual(tick.account.spotBalances)
  })

  it('withdraws simulated ฿100 from ฿500, leaving ฿400 and reporting a simulated ฿80 net', () => {
    const account = createSpotAccount({ spotBalances: { THB: 500 } })
    const callbackData = { amount: 100, fee: 20, netAmount: 80, bank: 'Demo Bank', accountNo: '123-456' }
    const result = applySpotWithdrawal(account, callbackData)
    expect(result.success).toBe(true)
    expect(result.account.spotBalances.THB).toBe(400)
    expect(result.withdrawal).toEqual(callbackData)
    const wrongFee = applySpotWithdrawal(account, { ...callbackData, fee: 0, netAmount: 100 })
    expect(wrongFee.success).toBe(false)
    expect(wrongFee.account.spotBalances.THB).toBe(500)
  })

  it('routes Spot Signal Simulator BUY through the same fee and balance checks', () => {
    const signalService = new TradingViewSignalSimulatorService()
    let account = createSpotAccount({ spotBalances: { THB: 500, BTC: 0 } })
    signalService.onSignalReceived((signal) => {
      const price = 100
      const amount = floorSpotAmount(TRADING_PAIRS.find((pair) => pair.symbol === signal.symbol), signal.amount / (price * (1 + SPOT_FEE_RATE)))
      const total = price * amount
      const result = applySpotOrder(account, makeOrder({
        id: signal.id,
        price,
        amount,
        total,
        fee: total * SPOT_FEE_RATE,
      }), { priceStatus: 'DEMO' })
      if (result.success) account = result.account
      return result.success ? { success: true } : { success: false, reason: result.error }
    })

    const result = signalService.processSignal({ symbol: 'BTC/THB', action: 'BUY', amount: 100 }, true)
    expect(result.success).toBe(true)
    expect(account.spotBalances.THB).toBeGreaterThanOrEqual(400)
    expect(account.tradeHistory[0].fee).toBeCloseTo(account.tradeHistory[0].total * SPOT_FEE_RATE, 10)

    const unsupported = signalService.processSignal({ symbol: 'GOLD/USD', action: 'BUY', amount: 100 }, true)
    expect(unsupported.success).toBe(false)
  })

  it('passes matching amount, fee, net, bank, and account to the withdrawal callback', () => {
    vi.useFakeTimers()
    const account = createSpotAccount({ spotBalances: { THB: 500 } })
    let callbackResult
    const onWithdraw = vi.fn((data) => {
      callbackResult = applySpotWithdrawal(account, data)
      return callbackResult
    })
    render(<SpotWithdrawModal isOpen availableTHB={500} onWithdraw={onWithdraw} onClose={vi.fn()} />)

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการถอนจำลอง' }))

    expect(onWithdraw).toHaveBeenCalledWith({
      amount: 100,
      fee: 20,
      netAmount: 80,
      bank: 'KBANK',
      accountNo: '123-4-56789-0',
    })
    expect(callbackResult.account.spotBalances.THB).toBe(400)
    expect(callbackResult.withdrawal.netAmount).toBe(80)
  })

  it('reset clears earned coins and stays clear after reloading the account data', () => {
    const user = authService.register('Reset Test', 'reset@example.test', 'demo-pass')
    const bought = applySpotOrder(
      authService.getUserData(user.id),
      makeOrder({ id: 'earned-btc', price: 1000 }),
      { priceStatus: 'DEMO' },
    )
    expect(bought.success).toBe(true)
    expect(bought.account.spotBalances.BTC).toBe(1)
    authService.saveUserData(user.id, { spotBalances: bought.account.spotBalances, tradeHistory: bought.account.tradeHistory })

    authService.clearUserData(user.id)
    const reloaded = authService.getUserData(user.id)
    expect(reloaded.spotBalances).toEqual({ THB: 0, BTC: 0, ETH: 0, SOL: 0, USDT: 0, BNB: 0, XRP: 0, DOGE: 0 })
    expect(reloaded.openOrders).toEqual([])
    expect(reloaded.tradeHistory).toEqual([])

    render(
      <DashboardView
        transactions={reloaded.transactions}
        portfolio={reloaded.portfolio}
        spotBalances={reloaded.spotBalances}
        openOrders={reloaded.openOrders}
      />,
    )
    expect(within(screen.getByTestId('dashboard-net-worth')).getByText('฿0')).toBeTruthy()
  })

  it('does not infer Spot wins or zero P&L and exports Spot schema only', () => {
    const history = [{
      id: 'spot-trade', orderId: 'spot-order', symbol: 'BTC/THB', side: 'BUY', orderType: 'MARKET',
      price: 100, amount: 1, total: 100, fee: 0.25, executedAt: '2026-09-01T12:00:00.000Z', status: 'FILLED',
      pnl: 999,
    }]
    const stats = summarizeSpotTrades(history)
    expect(stats.totalTrades).toBe(1)
    expect(stats.realizedTradeCount).toBe(0)
    expect(stats.winRate).toBeNull()
    expect(stats.netPnL).toBeNull()
    const csv = buildSpotTradesCsv(history)
    expect(csv).toContain('Executed At')
    expect(csv).toContain('"ยังคำนวณไม่ได้","FILLED"')
    expect(csv).not.toContain('Leverage')
    expect(csv).not.toContain('Margin')
    expect(csv).not.toContain('closedAt')
  })

  it('builds Dashboard months, cashflow, and changes from account transactions only', () => {
    const metrics = calculateDashboardMetrics({
      now: new Date(2026, 8, 15, 12),
      transactions: [
        { id: 'aug-income', date: '2026-08-12', type: 'income', amount: 400 },
        { id: 'sep-income', date: '2026-09-01', type: 'income', amount: 100 },
        { id: 'sep-expense', date: '2026-09-05', type: 'expense', amount: 25 },
      ],
      portfolio: [],
      spotBalances: { THB: 300, BTC: 0 },
      openOrders: [],
    })

    expect(metrics.currentMonthKey).toBe('2026-09')
    expect(metrics.totalIncome).toBe(100)
    expect(metrics.totalExpense).toBe(25)
    expect(metrics.netSavings).toBe(75)
    expect(metrics.cashflow).toHaveLength(6)
    expect(metrics.cashflow[4]).toMatchObject({ monthKey: '2026-08', income: 400, expense: 0 })
    expect(metrics.cashflow[5]).toMatchObject({ monthKey: '2026-09', income: 100, expense: 25, savings: 75 })
    expect(metrics.netWorth).toBe(300)
    expect(formatMonthlyChange(100, 400)).toBe('-75.0% จากเดือนก่อน')
    expect(formatMonthlyChange(0, 0)).toBe('N/A')
  })

  it('uses the same THB DEMO portfolio and Spot prices for Dashboard and Portfolio totals', () => {
    const portfolio = [{
      id: 'btc-holding', symbol: 'BTC', currency: 'THB', shares: 0.001,
      avgBuyPrice: 2000000, currentPrice: 1,
    }]
    const balances = { THB: 100, BTC: 0.001 }
    const holdings = calculatePortfolioValuation(portfolio)
    const wallet = calculateSpotWalletValuation(balances, [])
    const dashboard = calculateDashboardMetrics({
      transactions: [], portfolio, spotBalances: balances, openOrders: [],
    })
    expect(getDemoSpotPriceTHB('BTC')).toBe(TRADING_PAIRS.find((pair) => pair.symbol === 'BTC/THB').priceInTHB)
    expect(holdings.assets[0].valuation.currentValueTHB).toBe(holdings.assets[0].shares * getDemoSpotPriceTHB('BTC'))
    expect(wallet.rows.find((row) => row.asset === 'BTC').valueTHB).toBe(0.001 * getDemoSpotPriceTHB('BTC'))
    expect(dashboard.netWorth).toBe(holdings.totalValueTHB + wallet.totalValueTHB)
  })

  it('returns N/A valuation when an asset currency is missing or has no THB conversion', () => {
    for (const asset of [
      { id: 'missing-currency', symbol: 'MYSTERY', shares: 1, avgBuyPrice: 5, currentPrice: 10 },
      { id: 'usd-currency', symbol: 'AAPL', currency: 'USD', shares: 1, avgBuyPrice: 5, currentPrice: 10 },
    ]) {
      expect(calculatePortfolioValuation([asset]).totalValueTHB).toBeNull()
      expect(calculateDashboardMetrics({
        portfolio: [asset], spotBalances: { THB: 100 }, openOrders: [],
      }).netWorth).toBeNull()

      const portfolioView = render(<PortfolioView portfolio={[asset]} spotBalances={{ THB: 100 }} openOrders={[]} />)
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
      portfolioView.unmount()

      const dashboardView = render(
        <DashboardView transactions={[]} portfolio={[asset]} spotBalances={{ THB: 100 }} openOrders={[]} />,
      )
      expect(within(screen.getByTestId('dashboard-net-worth')).getAllByText('N/A').length).toBeGreaterThan(0)
      dashboardView.unmount()
    }
  })

  it('guest reset remains at zero after reading data again', () => {
    const clearData = authService.clearUserData(null)
    expect(clearData.spotBalances.THB).toBe(0)
    expect(authService.getUserData(null).spotBalances).toEqual(clearData.spotBalances)
  })
})
