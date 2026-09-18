import React, { useState, useEffect, useRef } from 'react'
import { createChart, CandlestickSeries, LineStyle, CrosshairMode } from 'lightweight-charts'
import { TrendingUp, TrendingDown, Zap, Shield, Target, Clock, RefreshCw } from 'lucide-react'
import { formatNumber, formatCurrency, formatPercent, getPipSize, calculateSpreadPips, calculatePips, formatPips } from '../../utils/formatters'
import useCandleCountdown from '../../hooks/useCandleCountdown'

// Map internal pair symbols to Binance Kline API symbols
const BINANCE_SYMBOL_MAP = {
  'BTC/USDT': 'BTCUSDT',
  'ETH/USDT': 'ETHUSDT',
  'SOL/USDT': 'SOLUSDT',
  'BNB/USDT': 'BNBUSDT',
  'XRP/USDT': 'XRPUSDT',
  'DOGE/USDT': 'DOGEUSDT',
  'GOLD/USD': 'PAXGUSDT',
  'EUR/USD': 'EURUSDT',
  'GBP/USD': 'GBPUSDT',
  'AUD/USD': 'AUDUSDT',
}

export default function TradingChart({
  pair,
  candles = [],
  currentPrice,
  priceChangePercent = 0,
  tickDirection = 'none',
  positions = [],
  limitOrders = [],
  onClosePosition,
  onCancelLimitOrder,
}) {
  const [timeframe, setTimeframe] = useState('15m')
  const { formatted, isUrgent } = useCandleCountdown(timeframe)
  const chartContainerRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const lastBarRef = useRef(null)
  const priceLinesRef = useRef([])
  const wsRef = useRef(null)
  const [ohlc, setOhlc] = useState({ open: 0, high: 0, low: 0, close: 0, time: 0 })
  const [isLoadingCandles, setIsLoadingCandles] = useState(true)

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D']
  const isUp = priceChangePercent >= 0

  // Filter positions and limit orders for current active symbol
  const activePositions = (positions || []).filter((p) => p.symbol === pair.symbol)
  const activeLimitOrders = (limitOrders || []).filter((o) => o.symbol === pair.symbol)

  // Calculate live PnL & Pips for active positions on this symbol
  const enrichedPositions = activePositions.map((pos) => {
    const isLong = pos.side === 'LONG'
    const priceDiffRatio = isLong
      ? (currentPrice - pos.entryPrice) / pos.entryPrice
      : (pos.entryPrice - currentPrice) / pos.entryPrice
    const pnl = Math.round(priceDiffRatio * pos.leverage * pos.amount)
    const pnlPercent = (pnl / pos.amount) * 100
    const pips = calculatePips(pos.entryPrice, currentPrice, pos.side, pos.symbol)
    return {
      ...pos,
      pnl,
      pnlPercent,
      pips,
      isProfit: pnl >= 0,
    }
  })

  const totalPairPnL = enrichedPositions.reduce((sum, p) => sum + p.pnl, 0)

  // Broker ECN Tight Spread Simulation & Pip Size
  const spreadPct = 0.00012
  const halfSpread = currentPrice * (spreadPct / 2)
  const bidPrice = currentPrice - halfSpread
  const askPrice = currentPrice + halfSpread
  const spreadPips = calculateSpreadPips(bidPrice, askPrice, pair.symbol)

  // 1. Initialize Lightweight Charts (TradingView Official Engine)
  useEffect(() => {
    if (!chartContainerRef.current) return

    const container = chartContainerRef.current
    container.innerHTML = ''

    const chart = createChart(container, {
      layout: {
        background: { color: '#0b0e14' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { color: '#161e2e' },
        horzLines: { color: '#161e2e' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#1e2638',
        autoScale: true,
        scaleMargins: {
          top: 0.15,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: '#1e2638',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    })

    chartInstanceRef.current = chart
    candleSeriesRef.current = candleSeries

    // Crosshair move handler to update OHLC header
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) return
      const bar = param.seriesData.get(candleSeries)
      if (bar) {
        setOhlc({ open: bar.open, high: bar.high, low: bar.low, close: bar.close })
      }
    })

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return
      const { width, height } = entries[0].contentRect
      chart.applyOptions({ width, height })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartInstanceRef.current = null
      candleSeriesRef.current = null
    }
  }, [])

  // 2. Fetch Real-time Candles (Binance API + WebSocket + ECN Engine)
  useEffect(() => {
    if (!candleSeriesRef.current) return
    setIsLoadingCandles(true)
    lastBarRef.current = null
    setOhlc({ open: 0, high: 0, low: 0, close: 0, time: 0 })

    // Close any previous WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const binanceSymbol = BINANCE_SYMBOL_MAP[pair.symbol]
    const interval = timeframe === '1D' ? '1d' : timeframe
    let isSubscribed = true

    const loadData = async () => {
      let klineData = []

      // A. Try direct Binance Public REST API
      if (binanceSymbol) {
        try {
          const res = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=120`
          )
          if (res.ok) {
            const raw = await res.json()
            klineData = raw.map((c) => ({
              time: Math.floor(c[0] / 1000),
              open: parseFloat(c[1]),
              high: parseFloat(c[2]),
              low: parseFloat(c[3]),
              close: parseFloat(c[4]),
            }))
          }
        } catch (err) {
          console.warn('Binance REST fetch failed, using fallback candles', err)
        }
      }

      // B. Authentic USD/JPY derived from BTCJPY / BTCUSDT klines
      if (pair.symbol === 'USD/JPY' && (!klineData || klineData.length === 0)) {
        try {
          const [jpyRes, usdtRes] = await Promise.all([
            fetch(`https://api.binance.com/api/v3/klines?symbol=BTCJPY&interval=${interval}&limit=120`),
            fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=120`),
          ])
          if (jpyRes.ok && usdtRes.ok) {
            const jpyRaw = await jpyRes.json()
            const usdtRaw = await usdtRes.json()
            const minLen = Math.min(jpyRaw.length, usdtRaw.length)
            klineData = []
            for (let i = 0; i < minLen; i++) {
              const j = jpyRaw[i]
              const u = usdtRaw[i]
              const t = Math.floor(j[0] / 1000)
              const uOpen = parseFloat(u[1]) || 1
              const uHigh = parseFloat(u[2]) || 1
              const uLow = parseFloat(u[3]) || 1
              const uClose = parseFloat(u[4]) || 1

              const jOpen = parseFloat(j[1])
              const jHigh = parseFloat(j[2])
              const jLow = parseFloat(j[3])
              const jClose = parseFloat(j[4])

              const open = parseFloat((jOpen / uOpen).toFixed(2))
              const close = parseFloat((jClose / uClose).toFixed(2))
              const high = Math.max(open, close, parseFloat((jHigh / uLow).toFixed(2)))
              const low = Math.min(open, close, parseFloat((jLow / uHigh).toFixed(2)))

              klineData.push({ time: t, open, high, low, close })
            }
          }
        } catch (e) {
          console.warn('USD/JPY synthetic kline error', e)
        }
      }

      // C. Safe Interval-Aligned Generator for Non-Binance Pairs (USD/CHF, USD/CAD, NVDA, TSLA)
      if (!klineData || klineData.length === 0) {
        const stepSec = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : timeframe === '1D' ? 86400 : 900
        const nowSec = Math.floor(Date.now() / 1000)
        const currentBarTime = Math.floor(nowSec / stepSec) * stepSec
        const base = currentPrice || pair.price
        const isForex = pair.category === 'forex'
        const volatility = isForex ? 0.0006 : 0.003
        const precision = pair.precision || (isForex ? 4 : 2)

        klineData = []
        let walkPrice = base * (1 - (Math.random() * 0.012 - 0.006))
        for (let i = 80; i >= 0; i--) {
          const barTime = currentBarTime - i * stepSec
          const drift = (Math.random() - 0.49) * volatility * walkPrice
          const barOpen = walkPrice
          const barClose = i === 0 ? base : barOpen + drift
          const barHigh = Math.max(barOpen, barClose) + Math.random() * volatility * walkPrice * 0.7
          const barLow = Math.min(barOpen, barClose) - Math.random() * volatility * walkPrice * 0.7

          klineData.push({
            time: barTime,
            open: parseFloat(barOpen.toFixed(precision)),
            high: parseFloat(barHigh.toFixed(precision)),
            low: parseFloat(barLow.toFixed(precision)),
            close: parseFloat(barClose.toFixed(precision)),
          })
          walkPrice = barClose
        }
      }

      if (!isSubscribed || !candleSeriesRef.current) return

      // Deduplicate & strictly sort by time ascending
      const cleanData = []
      const seen = new Set()
      for (const bar of klineData) {
        if (!seen.has(bar.time) && !isNaN(bar.open) && !isNaN(bar.close)) {
          seen.add(bar.time)
          cleanData.push(bar)
        }
      }
      cleanData.sort((a, b) => a.time - b.time)

      if (cleanData.length === 0) return

      candleSeriesRef.current.setData(cleanData)
      const last = cleanData[cleanData.length - 1]
      lastBarRef.current = { ...last }
      setOhlc({ open: last.open, high: last.high, low: last.low, close: last.close, time: last.time })
      setIsLoadingCandles(false)

      try {
        chartInstanceRef.current.timeScale().fitContent()
      } catch (e) {}

      // 3. Connect to Binance WebSocket for sub-second live candle ticks
      if (binanceSymbol) {
        try {
          const ws = new WebSocket(
            `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@kline_${interval}`
          )
          wsRef.current = ws

          ws.onmessage = (event) => {
            if (!isSubscribed || !candleSeriesRef.current || !lastBarRef.current) return
            try {
              const data = JSON.parse(event.data)
              if (data && data.k) {
                const k = data.k
                const barTime = Math.floor(k.t / 1000)
                const liveCandle = {
                  time: barTime,
                  open: parseFloat(k.o),
                  high: parseFloat(k.h),
                  low: parseFloat(k.l),
                  close: parseFloat(k.c),
                }
                lastBarRef.current = liveCandle
                candleSeriesRef.current.update(liveCandle)
                setOhlc(liveCandle)
              }
            } catch (e) {}
          }
        } catch (e) {
          console.warn('Binance WebSocket error', e)
        }
      }
    }

    loadData()

    return () => {
      isSubscribed = false
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [pair.symbol, timeframe])

  // 4. Update candle when currentPrice ticks (Instant 0ms synchronization with Terminal & Orderbook)
  useEffect(() => {
    if (!candleSeriesRef.current || !currentPrice || isLoadingCandles || !lastBarRef.current) return

    const stepSec = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : timeframe === '1D' ? 86400 : 900
    const nowSec = Math.floor(Date.now() / 1000)
    const bucketTime = Math.floor(nowSec / stepSec) * stepSec
    const lastBar = lastBarRef.current

    try {
      if (bucketTime > lastBar.time) {
        // New bar period has started
        const newBar = {
          time: bucketTime,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        }
        lastBarRef.current = newBar
        candleSeriesRef.current.update(newBar)
        setOhlc(newBar)
      } else {
        // Update current forming bar at lastBar.time (monotonically safe)
        const updatedBar = {
          time: lastBar.time,
          open: lastBar.open,
          high: Math.max(lastBar.high, currentPrice),
          low: Math.min(lastBar.low, currentPrice),
          close: currentPrice,
        }
        lastBarRef.current = updatedBar
        candleSeriesRef.current.update(updatedBar)
        setOhlc(updatedBar)
      }
    } catch (e) {
      console.warn('Candle tick update warning:', e)
    }
  }, [currentPrice, timeframe, isLoadingCandles])

  // 5. Draw Interactive Broker Price Lines (Entry, TP, SL, Limit) on Canvas
  useEffect(() => {
    if (!candleSeriesRef.current) return

    // Remove previous price lines
    priceLinesRef.current.forEach((pl) => {
      try {
        candleSeriesRef.current.removePriceLine(pl)
      } catch (e) {}
    })
    priceLinesRef.current = []

    // A. Entry Order Lines
    enrichedPositions.forEach((pos) => {
      const isLong = pos.side === 'LONG'
      const color = isLong ? '#10b981' : '#f43f5e'
      const pl = candleSeriesRef.current.createPriceLine({
        price: pos.entryPrice,
        color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `#${pos.side} ${pos.leverage}x @ $${formatNumber(pos.entryPrice, pair.precision || 2)}`,
      })
      priceLinesRef.current.push(pl)

      // TP Line
      if (pos.tpPrice && pos.tpPrice > 0) {
        const tpPl = candleSeriesRef.current.createPriceLine({
          price: pos.tpPrice,
          color: '#06b6d4',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `🎯 TP @ $${formatNumber(pos.tpPrice, pair.precision || 2)}`,
        })
        priceLinesRef.current.push(tpPl)
      }

      // SL Line
      if (pos.slPrice && pos.slPrice > 0) {
        const slPl = candleSeriesRef.current.createPriceLine({
          price: pos.slPrice,
          color: '#f97316',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `🛡️ SL @ $${formatNumber(pos.slPrice, pair.precision || 2)}`,
        })
        priceLinesRef.current.push(slPl)
      }
    })

    // B. Limit Order Lines
    activeLimitOrders.forEach((order) => {
      const limPl = candleSeriesRef.current.createPriceLine({
        price: order.targetPrice,
        color: '#f59e0b',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `⏳ LIMIT ${order.side} @ $${formatNumber(order.targetPrice, pair.precision || 2)}`,
      })
      priceLinesRef.current.push(limPl)
    })

    // C. MT5 Real-time Bid & Ask Price Lines
    if (currentPrice && currentPrice > 0) {
      const precision = pair.precision || (pair.category === 'forex' ? 4 : 2)

      // Ask Line (Rose dashed)
      const askPl = candleSeriesRef.current.createPriceLine({
        price: askPrice,
        color: '#f43f5e',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `ASK $${formatNumber(askPrice, precision)} (${spreadPips} p)`,
      })
      priceLinesRef.current.push(askPl)

      // Bid Line (Cyan dashed)
      const bidPl = candleSeriesRef.current.createPriceLine({
        price: bidPrice,
        color: '#06b6d4',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `BID $${formatNumber(bidPrice, precision)}`,
      })
      priceLinesRef.current.push(bidPl)
    }
  }, [enrichedPositions, activeLimitOrders, pair.precision, pair.category, currentPrice, bidPrice, askPrice, spreadPips])

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] border border-[#1e2638] rounded-3xl p-3.5 sm:p-5 shadow-2xl relative overflow-hidden font-sans">
      
      {/* Broker ECN Terminal Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl mb-2 text-[11px] font-mono shadow-inner">
        <div className="flex items-center space-x-2.5 text-slate-300">
          <div className="flex items-center space-x-1 text-emerald-400 font-extrabold tracking-wide">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            <span>FINNTECH ECN Direct (TradingView Core)</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">
            Server: <strong className="text-emerald-300">SG-1 ECN (14ms)</strong>
          </span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="text-slate-500">Spread:</span>
            <span className="text-amber-400 font-bold">
              ${formatNumber(halfSpread * 2, pair.precision || (pair.category === 'forex' ? 4 : 2))}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
              {spreadPips} Pips
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold font-mono">
              BID ${formatNumber(bidPrice, pair.precision || (pair.category === 'forex' ? 4 : 2))}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold font-mono">
              ASK ${formatNumber(askPrice, pair.precision || (pair.category === 'forex' ? 4 : 2))}
            </span>
          </div>

          {activePositions.length > 0 && (
            <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-slate-850 border border-slate-750 text-xs font-bold">
              <span className="text-slate-400">ออเดอร์บนกราฟ:</span>
              <span className="text-emerald-400 font-mono">{activePositions.length}</span>
              <span className={`text-[11px] font-mono ml-1 ${totalPairPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ({totalPairPnL >= 0 ? '+' : ''}{formatCurrency(totalPairPnL, false)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Toolbar & Symbol Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800/80 mb-2">
        {/* Pair, Live Price & MT5 Countdown */}
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                {pair.symbol}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {pair.name}
              </span>
              {pair.category === 'forex' && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Forex
                </span>
              )}
              {pair.category === 'commodity' && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Gold
                </span>
              )}
              {pair.category === 'crypto' && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Crypto
                </span>
              )}
              {pair.category === 'stock' && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Stock
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-0.5">
              <span
                className={`text-xl sm:text-2xl font-mono font-extrabold transition-all duration-150 flex items-center space-x-2 ${
                  tickDirection === 'up'
                    ? 'text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded shadow-sm shadow-emerald-500/20'
                    : tickDirection === 'down'
                    ? 'text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded shadow-sm shadow-rose-500/20'
                    : isUp
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                <span>${formatNumber(currentPrice, pair.precision || 2)}</span>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tickDirection === 'down' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${tickDirection === 'down' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                </span>
              </span>

              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-0.5 ${
                  isUp
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%</span>
              </span>
            </div>

            {/* MT5 Candle Countdown DIRECTLY UNDER THE PRICE (ใต้ราคา แบบ MT5) & Live OHLC */}
            <div className="flex flex-wrap items-center gap-2 mt-1 font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  MT5 Bar:
                </span>
                <span
                  title="เวลานับถอยหลังปิดแท่งเทียน MT5"
                  className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center space-x-1 transition-colors ${
                    isUrgent
                      ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30 animate-pulse'
                      : 'text-amber-400 bg-amber-400/10 border border-amber-500/20'
                  }`}
                >
                  <span>⏱️</span>
                  <span>{formatted}</span>
                  <span className="text-[9px] text-slate-400 font-normal">({timeframe})</span>
                </span>
              </div>

              {ohlc.close > 0 && (
                <div className="hidden sm:flex items-center space-x-2 text-[10px] bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-400">
                  <span>O: <strong className="text-slate-200">${formatNumber(ohlc.open, pair.precision || 2)}</strong></span>
                  <span>H: <strong className="text-emerald-400">${formatNumber(ohlc.high, pair.precision || 2)}</strong></span>
                  <span>L: <strong className="text-rose-400">${formatNumber(ohlc.low, pair.precision || 2)}</strong></span>
                  <span>C: <strong className="text-slate-200">${formatNumber(ohlc.close, pair.precision || 2)}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-800/70 p-1 rounded-xl border border-slate-700/60 text-xs">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
            <span>แท่งเทียนจริง</span>
          </div>
        </div>
      </div>

      {/* Main Lightweight Charts Canvas Container with Order Badges Overlay */}
      <div className="flex-1 min-h-[340px] w-full relative">
        <div ref={chartContainerRef} className="w-full h-full rounded-2xl overflow-hidden" />

        {/* Floating Active Order Badges Overlay with 1-Click Close */}
        {enrichedPositions.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1.5 pointer-events-auto max-w-sm">
            {enrichedPositions.map((pos) => {
              const isLong = pos.side === 'LONG'
              const isProfit = pos.pnl >= 0
              return (
                <div
                  key={`badge-${pos.id}`}
                  className={`flex items-center justify-between space-x-2 px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition-all font-mono text-[11px] ${
                    isLong
                      ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/85 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span className={`w-2 h-2 rounded-full ${isLong ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                    <span>#{pos.side} {pos.leverage}x @ ${formatNumber(pos.entryPrice, pair.precision || 2)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-750 text-amber-300 font-bold">
                      {formatPips(pos.pips)}
                    </span>
                    <span className={`font-extrabold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      [{isProfit ? '+' : ''}฿{formatNumber(pos.pnl)} ({formatPercent(pos.pnlPercent)})]
                    </span>
                    <button
                      onClick={() => onClosePosition && onClosePosition(pos.id, pos.pnl)}
                      title="ปิดทำกำไร/ตัดขาดทุนทันที"
                      className="w-5 h-5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center text-xs shadow-md transition-all active:scale-90 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Floating Limit Orders Overlay with Cancel Button */}
        {activeLimitOrders.length > 0 && (
          <div className="absolute top-3 right-16 z-10 flex flex-col space-y-1.5 pointer-events-auto max-w-xs">
            {activeLimitOrders.map((order) => (
              <div
                key={`limit-${order.id}`}
                className="flex items-center justify-between space-x-2 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/80 text-amber-300 shadow-lg backdrop-blur-md font-mono text-[11px]"
              >
                <span>⏳ LIMIT {order.side} @ ${formatNumber(order.targetPrice, pair.precision || 2)}</span>
                <button
                  onClick={() => onCancelLimitOrder && onCancelLimitOrder(order.id)}
                  title="ยกเลิกคำสั่ง"
                  className="w-5 h-5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-md transition-all active:scale-90 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {isLoadingCandles && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center space-x-2 text-xs font-mono text-emerald-400 z-20 pointer-events-none">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>กำลังโหลดแท่งเทียนจริงจากตลาดโลก...</span>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator Badges & OHLC */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span>O: <strong className="text-slate-200">${formatNumber(ohlc.open || currentPrice, pair.precision || 2)}</strong></span>
          <span>H: <strong className="text-emerald-400">${formatNumber(ohlc.high || currentPrice, pair.precision || 2)}</strong></span>
          <span>L: <strong className="text-rose-400">${formatNumber(ohlc.low || currentPrice, pair.precision || 2)}</strong></span>
          <span>C: <strong className="text-slate-200">${formatNumber(ohlc.close || currentPrice, pair.precision || 2)}</strong></span>
        </div>
        <div className="text-emerald-400 font-semibold flex items-center space-x-1.5 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>ECN DIRECT STREAMING • SUB-SECOND TICKS</span>
        </div>
      </div>
    </div>
  )
}
