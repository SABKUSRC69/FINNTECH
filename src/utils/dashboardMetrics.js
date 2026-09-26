import { calculatePortfolioValuation, calculateSpotWalletValuation } from './assetValuation.js'

function localMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseTransactionDate(value) {
  if (typeof value !== 'string' || !value) return null
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function summarizeTransactions(transactions, monthKey) {
  return transactions.reduce((summary, transaction) => {
    const date = parseTransactionDate(transaction?.date)
    const amount = Number(transaction?.amount)
    if (!date || localMonthKey(date) !== monthKey || !Number.isFinite(amount) || amount < 0) return summary
    if (transaction.type === 'income') summary.income += amount
    if (transaction.type === 'expense') summary.expense += amount
    return summary
  }, { income: 0, expense: 0 })
}

function getAccountNetWorth({ portfolio, spotBalances, openOrders }) {
  if (!spotBalances || typeof spotBalances !== 'object') return null
  const portfolioValue = calculatePortfolioValuation(portfolio)
  const spotValue = calculateSpotWalletValuation(spotBalances, openOrders)
  if (portfolioValue.totalValueTHB === null || spotValue.totalValueTHB === null) return null
  const total = portfolioValue.totalValueTHB + spotValue.totalValueTHB
  return Number.isFinite(total) ? total : null
}

export function calculateDashboardMetrics({
  transactions = [],
  portfolio = [],
  spotBalances,
  openOrders = [],
  now = new Date(),
} = {}) {
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  const currentMonthKey = localMonthKey(now)
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthKey = localMonthKey(previousMonth)
  const currentMonth = summarizeTransactions(safeTransactions, currentMonthKey)
  const previousMonthStats = summarizeTransactions(safeTransactions, previousMonthKey)
  const cashflow = []

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = localMonthKey(date)
    const month = summarizeTransactions(safeTransactions, key)
    cashflow.push({
      month: date.toLocaleDateString('th-TH', { month: 'short' }),
      monthKey: key,
      income: month.income,
      expense: month.expense,
      savings: month.income - month.expense,
    })
  }

  return {
    currentMonthKey,
    currentMonthLabel: now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
    totalIncome: currentMonth.income,
    totalExpense: currentMonth.expense,
    netSavings: currentMonth.income - currentMonth.expense,
    previousMonthIncome: previousMonthStats.income,
    previousMonthExpense: previousMonthStats.expense,
    currentMonthHasTransactions: safeTransactions.some((item) => {
      const date = parseTransactionDate(item?.date)
      return date && localMonthKey(date) === currentMonthKey &&
        (item?.type === 'income' || item?.type === 'expense') &&
        Number.isFinite(Number(item?.amount)) && Number(item.amount) >= 0
    }),
    cashflow,
    netWorth: getAccountNetWorth({ portfolio, spotBalances, openOrders }),
  }
}

export function formatMonthlyChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return 'N/A'
  const percentage = ((current - previous) / Math.abs(previous)) * 100
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}% จากเดือนก่อน`
}
