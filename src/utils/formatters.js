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
