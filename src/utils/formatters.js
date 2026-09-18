/**
 * Format number into Thai Baht currency (e.g. ฿125,400.00)
 */
export function formatCurrency(amount, includeDecimals = true) {
  if (amount === undefined || amount === null || isNaN(amount)) return '฿0'
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount)
}

/**
 * Format raw number with comma separators (e.g. 1,234,567)
 */
export function formatNumber(num, decimals = 0) {
  if (num === undefined || num === null || isNaN(num)) return '0'
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format percentage (e.g. +12.45%)
 */
export function formatPercent(value, showPlus = true) {
  if (value === undefined || value === null || isNaN(value)) return '0%'
  const formatted = value.toFixed(2)
  if (showPlus && value > 0) {
    return `+${formatted}%`
  }
  return `${formatted}%`
}

/**
 * Format standard date string (YYYY-MM-DD) to friendly Thai format (17 ก.ย. 2026)
 */
export function formatDateThai(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch (e) {
    return dateString
  }
}

/**
 * Get pip size for a given financial symbol
 * Forex standard: 0.0001 (4th decimal)
 * JPY pairs: 0.01 (2nd decimal)
 * Gold (XAU): 0.10 (10 cents)
 * Crypto/Stock: 0.01
 */
export function getPipSize(symbol = '') {
  const sym = (symbol || '').toUpperCase()
  if (sym.includes('JPY')) return 0.01
  if (sym.includes('GOLD') || sym.includes('XAU') || sym.includes('PAXG')) return 0.10
  if (
    sym.includes('EUR') ||
    sym.includes('GBP') ||
    sym.includes('AUD') ||
    sym.includes('CAD') ||
    sym.includes('CHF') ||
    sym.includes('NZD')
  ) {
    return 0.0001
  }
  return 0.01
}

/**
 * Calculate pips gained/lost between entry and current price
 */
export function calculatePips(entryPrice, currentPrice, side = 'LONG', symbol = '') {
  if (!entryPrice || !currentPrice) return 0
  const pipSize = getPipSize(symbol)
  const isLong = side === 'LONG' || side === 'BUY'
  const diff = isLong ? currentPrice - entryPrice : entryPrice - currentPrice
  return parseFloat((diff / pipSize).toFixed(1))
}

/**
 * Calculate spread in pips between Ask and Bid
 */
export function calculateSpreadPips(bidPrice, askPrice, symbol = '') {
  if (!bidPrice || !askPrice) return 0
  const pipSize = getPipSize(symbol)
  const spread = Math.abs(askPrice - bidPrice)
  return parseFloat((spread / pipSize).toFixed(1))
}

/**
 * Format pip value with +/- and label (e.g. +24.5 pips)
 */
export function formatPips(pips, showPlus = true) {
  if (pips === undefined || pips === null || isNaN(pips)) return '0.0 pips'
  const formatted = pips.toFixed(1)
  if (showPlus && pips > 0) {
    return `+${formatted} pips`
  }
  return `${formatted} pips`
}
