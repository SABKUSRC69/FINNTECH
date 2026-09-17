export const TRADING_PAIRS = [
  {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'crypto',
    price: 76650.00,
    priceInTHB: 2682750,
    change24h: 3.42,
    high24h: 77180.00,
    low24h: 75060.00,
    volume24h: '42,150 BTC',
    precision: 2,
    minQty: 0.001,
  },
  {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'crypto',
    price: 2461.50,
    priceInTHB: 86150,
    change24h: -1.15,
    high24h: 2520.00,
    low24h: 2430.00,
    volume24h: '198,200 ETH',
    precision: 2,
    minQty: 0.01,
  },
  {
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'crypto',
    price: 101.00,
    priceInTHB: 3535,
    change24h: 6.85,
    high24h: 105.00,
    low24h: 98.50,
    volume24h: '1.4M SOL',
    precision: 2,
    minQty: 0.1,
  },
  {
    symbol: 'BNB/USDT',
    name: 'BNB Binance',
    category: 'crypto',
    price: 727.50,
    priceInTHB: 25462,
    change24h: 2.15,
    high24h: 735.00,
    low24h: 715.00,
    volume24h: '420,000 BNB',
    precision: 2,
    minQty: 0.05,
  },
  {
    symbol: 'XRP/USDT',
    name: 'Ripple XRP',
    category: 'crypto',
    price: 1.3000,
    priceInTHB: 45.50,
    change24h: 4.80,
    high24h: 0.6120,
    low24h: 0.5620,
    volume24h: '124.5M XRP',
    precision: 4,
    minQty: 10,
  },
  {
    symbol: 'DOGE/USDT',
    name: 'Dogecoin',
    category: 'crypto',
    price: 0.0821,
    priceInTHB: 2.87,
    change24h: -0.85,
    high24h: 0.0850,
    low24h: 0.0790,
    volume24h: '380M DOGE',
    precision: 4,
    minQty: 50,
  },
  {
    symbol: 'GOLD/USD',
    name: 'ทองคำ (Gold Spot XAU/USD)',
    category: 'commodity',
    price: 4358.90,
    priceInTHB: 152560,
    change24h: 0.74,
    high24h: 4379.00,
    low24h: 4340.00,
    volume24h: '112,500 Oz',
    precision: 2,
    minQty: 0.1,
  },
  {
    symbol: 'NVDA/USD',
    name: 'NVIDIA Corp.',
    category: 'stock',
    price: 128.50,
    priceInTHB: 4497,
    change24h: 4.12,
    high24h: 130.20,
    low24h: 122.80,
    volume24h: '48.2M shares',
    precision: 2,
    minQty: 1,
  },
  {
    symbol: 'TSLA/USD',
    name: 'Tesla Inc.',
    category: 'stock',
    price: 242.80,
    priceInTHB: 8498,
    change24h: -2.30,
    high24h: 251.00,
    low24h: 239.50,
    volume24h: '32.1M shares',
    precision: 2,
    minQty: 1,
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'forex',
    price: 1.1485,
    priceInTHB: 40.20,
    change24h: 0.18,
    high24h: 1.1520,
    low24h: 1.1440,
    volume24h: '$4.8B',
    precision: 4,
    minQty: 100,
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    category: 'forex',
    price: 1.1800,
    priceInTHB: 41.30,
    change24h: 0.35,
    high24h: 1.1850,
    low24h: 1.1760,
    volume24h: '$3.8B',
    precision: 4,
    minQty: 100,
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    category: 'forex',
    price: 156.04,
    priceInTHB: 35.00,
    change24h: -0.22,
    high24h: 156.80,
    low24h: 155.40,
    volume24h: '$5.1B',
    precision: 2,
    minQty: 100,
  },
  {
    symbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    category: 'forex',
    price: 0.7252,
    priceInTHB: 25.38,
    change24h: 0.42,
    high24h: 0.7300,
    low24h: 0.7210,
    volume24h: '$2.4B',
    precision: 4,
    minQty: 100,
  },
  {
    symbol: 'USD/CHF',
    name: 'US Dollar / Swiss Franc',
    category: 'forex',
    price: 0.8248,
    priceInTHB: 35.00,
    change24h: -0.15,
    high24h: 0.8290,
    low24h: 0.8210,
    volume24h: '$1.9B',
    precision: 4,
    minQty: 100,
  },
  {
    symbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    category: 'forex',
    price: 1.3984,
    priceInTHB: 35.00,
    change24h: 0.12,
    high24h: 1.4030,
    low24h: 1.3940,
    volume24h: '$2.1B',
    precision: 4,
    minQty: 100,
  },
]

// Generate realistic candle chart data
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

// Generate realistic order book bids & asks
export function generateOrderBook(currentPrice) {
  const asks = []
  const bids = []
  const depth = 8

  // Asks (Sells above price)
  let askPrice = currentPrice
  let totalAskQty = 0
  for (let i = 0; i < depth; i++) {
    askPrice += currentPrice * (0.0003 + Math.random() * 0.0004)
    const size = parseFloat((Math.random() * 1.8 + 0.2).toFixed(3))
    totalAskQty += size
    asks.unshift({
      price: parseFloat(askPrice.toFixed(2)),
      size,
      total: parseFloat(totalAskQty.toFixed(3)),
    })
  }

  // Bids (Buys below price)
  let bidPrice = currentPrice
  let totalBidQty = 0
  for (let i = 0; i < depth; i++) {
    bidPrice -= currentPrice * (0.0003 + Math.random() * 0.0004)
    const size = parseFloat((Math.random() * 1.8 + 0.2).toFixed(3))
    totalBidQty += size
    bids.push({
      price: parseFloat(bidPrice.toFixed(2)),
      size,
      total: parseFloat(totalBidQty.toFixed(3)),
    })
  }

  return { asks, bids }
}

// Initial open demo positions
export const INITIAL_POSITIONS = [
  {
    id: 'pos-1',
    symbol: 'BTC/USDT',
    side: 'LONG', // 'LONG' | 'SHORT'
    entryPrice: 63500.00,
    markPrice: 64850.00,
    amount: 50000, // THB margin
    leverage: 10,
    size: 0.15,
    liquidationPrice: 57500.00,
    openedAt: '2026-09-17 14:30',
  },
  {
    id: 'pos-2',
    symbol: 'SOL/USDT',
    side: 'LONG',
    entryPrice: 145.00,
    markPrice: 154.20,
    amount: 25000,
    leverage: 5,
    size: 8.5,
    liquidationPrice: 118.00,
    openedAt: '2026-09-17 16:15',
  }
]
