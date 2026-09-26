export function getRealizedSpotPnl(trade) {
  if (trade?.realizedPnl === undefined || trade?.realizedPnl === null || trade.realizedPnl === '') return null
  const value = Number(trade.realizedPnl)
  return Number.isFinite(value) ? value : null
}

export function summarizeSpotTrades(tradeHistory = []) {
  const trades = Array.isArray(tradeHistory) ? tradeHistory : []
  const realizedValues = trades.map(getRealizedSpotPnl).filter((value) => value !== null)
  const winCount = realizedValues.filter((value) => value > 0).length
  const lossCount = realizedValues.filter((value) => value < 0).length
  const breakEvenCount = realizedValues.filter((value) => value === 0).length
  const grossProfit = realizedValues.filter((value) => value > 0).reduce((sum, value) => sum + value, 0)
  const grossLoss = realizedValues.filter((value) => value < 0).reduce((sum, value) => sum + Math.abs(value), 0)

  return {
    totalTrades: trades.length,
    realizedTradeCount: realizedValues.length,
    winCount,
    lossCount,
    breakEvenCount,
    winRate: realizedValues.length ? (winCount / realizedValues.length) * 100 : null,
    netPnL: realizedValues.length ? realizedValues.reduce((sum, value) => sum + value, 0) : null,
    profitFactor: realizedValues.length && grossLoss > 0 ? grossProfit / grossLoss : null,
    bestTrade: realizedValues.length ? Math.max(...realizedValues) : null,
    worstTrade: realizedValues.length ? Math.min(...realizedValues) : null,
    averageTrade: realizedValues.length ? realizedValues.reduce((sum, value) => sum + value, 0) / realizedValues.length : null,
  }
}

function csvCell(value) {
  const text = value === undefined || value === null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function buildSpotTradesCsv(tradeHistory = []) {
  const headers = ['Executed At', 'Symbol', 'Side', 'Order Type', 'Price', 'Amount', 'Total', 'Fee', 'Realized P&L', 'Status']
  const rows = (Array.isArray(tradeHistory) ? tradeHistory : []).map((trade) => {
    const realizedPnl = getRealizedSpotPnl(trade)
    return [
      trade.executedAt,
      trade.symbol,
      trade.side,
      trade.orderType,
      trade.price,
      trade.amount,
      trade.total,
      trade.fee,
      realizedPnl === null ? 'ยังคำนวณไม่ได้' : realizedPnl,
      trade.status,
    ].map(csvCell)
  })

  return '\uFEFF' + [headers.map(csvCell).join(','), ...rows.map((row) => row.join(','))].join('\r\n')
}
