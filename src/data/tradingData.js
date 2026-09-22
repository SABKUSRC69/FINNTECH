export const TRADING_PAIRS = [
  {
    symbol: 'BTC/THB',
    name: 'Bitcoin (บิตคอยน์)',
    category: 'crypto',
    baseAsset: 'BTC',
    quoteAsset: 'THB',
    price: 2682750.00,
    priceInTHB: 2682750.00,
    change24h: 3.42,
    high24h: 2715000.00,
    low24h: 2635000.00,
    volume24h: '฿425,180,000',
    precision: 2,
    minQty: 0.0001,
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
    change24h: -1.15,
    high24h: 90200.00,
    low24h: 87100.00,
    volume24h: '฿185,420,000',
    precision: 2,
    minQty: 0.001,
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
    change24h: 6.85,
    high24h: 5650.00,
    low24h: 5200.00,
    volume24h: '฿98,650,000',
    precision: 2,
    minQty: 0.01,
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
    change24h: 0.25,
    high24h: 35.95,
    low24h: 35.70,
    volume24h: '฿345,800,000',
    precision: 2,
    minQty: 1,
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
    change24h: 2.15,
    high24h: 25900.00,
    low24h: 25100.00,
    volume24h: '฿48,920,000',
    precision: 2,
    minQty: 0.01,
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
    change24h: 4.80,
    high24h: 47.20,
    low24h: 43.80,
    volume24h: '฿64,200,000',
    precision: 2,
    minQty: 1,
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
    change24h: -0.85,
    high24h: 3.02,
    low24h: 2.78,
    volume24h: '฿32,150,000',
    precision: 2,
    minQty: 10,
    tradingViewSymbol: 'BITKUB:DOGETHB',
  },
]

export const INITIAL_SPOT_BALANCES = {
  THB: 500000.0,
  BTC: 0.15,
  ETH: 1.25,
  SOL: 10.0,
  USDT: 1000.0,
  BNB: 2.5,
  XRP: 500.0,
  DOGE: 2500.0,
}

export const INITIAL_OPEN_ORDERS = [
  {
    id: 'order-sample-1',
    symbol: 'BTC/THB',
    side: 'BUY',
    orderType: 'LIMIT',
    targetPrice: 2600000.00,
    amount: 0.05,
    total: 130000.00,
    fee: 325.00,
    placedAt: '2026-09-22 10:30',
    status: 'OPEN',
  },
]

export const INITIAL_TRADE_HISTORY = [
  {
    id: 'trade-hist-1',
    symbol: 'BTC/THB',
    side: 'BUY',
    orderType: 'MARKET',
    price: 2650000.00,
    amount: 0.10,
    total: 265000.00,
    fee: 662.50,
    executedAt: '2026-09-21 15:45',
    status: 'FILLED',
  },
  {
    id: 'trade-hist-2',
    symbol: 'ETH/THB',
    side: 'BUY',
    orderType: 'LIMIT',
    price: 86500.00,
    amount: 1.0,
    total: 86500.00,
    fee: 216.25,
    executedAt: '2026-09-20 18:20',
    status: 'FILLED',
  },
]

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
