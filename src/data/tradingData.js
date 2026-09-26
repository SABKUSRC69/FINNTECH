export const TRADING_PAIRS = [
  {
    symbol: 'BTC/THB',
    name: 'Bitcoin (บิตคอยน์)',
    category: 'crypto',
    baseAsset: 'BTC',
    quoteAsset: 'THB',
    price: 2682750.00,
    priceInTHB: 2682750.00,
    change24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    precision: 2,
    minQty: 0.0001,
    amountPrecision: 4,
    tradingViewSymbol: 'BITKUB:BTCTHB',
  },
  {
    symbol: 'ETH/THB',
    name: 'Ethereum (อีเธอเรียม)',
    category: 'crypto',
    baseAsset: 'ETH',
    quoteAsset: 'THB',
    price: 88450.00,
    priceInTHB: 88450.00,
    change24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    precision: 2,
    minQty: 0.001,
    amountPrecision: 3,
    tradingViewSymbol: 'BITKUB:ETHTHB',
  },
  {
    symbol: 'SOL/THB',
    name: 'Solana (โซลานา)',
    category: 'crypto',
    baseAsset: 'SOL',
    quoteAsset: 'THB',
    price: 5450.00,
    priceInTHB: 5450.00,
    change24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    precision: 2,
    minQty: 0.01,
    amountPrecision: 2,
    tradingViewSymbol: 'BITKUB:SOLTHB',
  },
  {
    symbol: 'USDT/THB',
    name: 'Tether (เทเธอร์)',
    category: 'crypto',
    baseAsset: 'USDT',
    quoteAsset: 'THB',
    price: 35.80,
    priceInTHB: 35.80,
    change24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    precision: 3,
    minQty: 1,
    amountPrecision: 0,
    tradingViewSymbol: 'BITKUB:USDTTHB',
  },
  {
    symbol: 'BNB/THB',
    name: 'BNB (บีเอ็นบี)',
    category: 'crypto',
    baseAsset: 'BNB',
    quoteAsset: 'THB',
    price: 25460.00,
    priceInTHB: 25460.00,
    change24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    precision: 2,
    minQty: 0.01,
    amountPrecision: 2,
    tradingViewSymbol: 'BITKUB:BNBTHB',
  },
  {
    symbol: 'XRP/THB',
    name: 'Ripple (ริปเปิล)',
    category: 'crypto',
    baseAsset: 'XRP',
    quoteAsset: 'THB',
    price: 45.50,
    priceInTHB: 45.50,
    change24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    precision: 3,
    minQty: 1,
    amountPrecision: 0,
    tradingViewSymbol: 'BITKUB:XRPTHB',
  },
  {
    symbol: 'DOGE/THB',
    name: 'Dogecoin (โดชคอยน์)',
    category: 'crypto',
    baseAsset: 'DOGE',
    quoteAsset: 'THB',
    price: 2.87,
    priceInTHB: 2.87,
    change24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    precision: 3,
    minQty: 10,
    amountPrecision: 0,
    tradingViewSymbol: 'BITKUB:DOGETHB',
  },
]

export const INITIAL_SPOT_BALANCES = {
  THB: 500000.0,
  BTC: 0,
  ETH: 0,
  SOL: 0,
  USDT: 0,
  BNB: 0,
  XRP: 0,
  DOGE: 0,
}

// A new account starts with demo THB only. Sample open orders must never create
// an unbacked reserve or refund when the user cancels them.
export const INITIAL_OPEN_ORDERS = []

export const INITIAL_TRADE_HISTORY = []

// Legacy compatibility alias
export const INITIAL_POSITIONS = []

export function generateCandleData(basePrice, count = 40, volatility = 0.008) {
  const candles = []
  let current = basePrice * (1 - count * 0.002) // slight trend
  const now = new Date()

  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000 * 5)
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const change = (Math.random() - 0.48) * volatility * current
    const open = current
    const close = current + change
    const high = Math.max(open, close) + Math.random() * volatility * current * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * current * 0.5
    const volume = Math.round(Math.random() * 50 + 10)

    candles.push({
      time: timeStr,
      open: parseFloat(open.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume,
      isGreen: close >= open,
    })

    current = close
  }

  return candles
}

// Generate realistic order book bids & asks in THB
export function generateOrderBook(currentPrice) {
  const asks = []
  const bids = []
  const depth = 8

  // Asks (Sells above price)
  let askPrice = currentPrice
  let totalAskQty = 0
  for (let i = 0; i < depth; i++) {
    askPrice += currentPrice * (0.0003 + Math.random() * 0.0004)
    const size = parseFloat((Math.random() * 0.5 + 0.05).toFixed(4))
    totalAskQty += size
    asks.unshift({
      price: parseFloat(askPrice.toFixed(2)),
      size,
      total: parseFloat(totalAskQty.toFixed(4)),
    })
  }

  // Bids (Buys below price)
  let bidPrice = currentPrice
  let totalBidQty = 0
  for (let i = 0; i < depth; i++) {
    bidPrice -= currentPrice * (0.0003 + Math.random() * 0.0004)
    const size = parseFloat((Math.random() * 0.5 + 0.05).toFixed(4))
    totalBidQty += size
    bids.push({
      price: parseFloat(bidPrice.toFixed(2)),
      size,
      total: parseFloat(totalBidQty.toFixed(4)),
    })
  }

  return { asks, bids }
}
