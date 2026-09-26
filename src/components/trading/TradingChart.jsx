import React, { useState, useEffect, useRef } from 'react'
import { createChart, CandlestickSeries, LineStyle, CrosshairMode } from 'lightweight-charts'
import { TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'
import useCandleCountdown from '../../hooks/useCandleCountdown'
import liveMarketService from '../../services/liveMarketService'

export default function TradingChart({
  pair,
  candles = [],
  currentPrice,
  priceChangePercent = null,
  tickDirection = 'none',
  limitOrders = [],
  onCancelLimitOrder,
}) {
  const [timeframe, setTimeframe] = useState('15m')
  const { formatted, isUrgent } = useCandleCountdown(timeframe)
  const chartContainerRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const lastBarRef = useRef(null)
  const priceLinesRef = useRef([])
  const [ohlc, setOhlc] = useState({ open: 0, high: 0, low: 0, close: 0, time: 0 })
  const [isLoadingCandles, setIsLoadingCandles] = useState(true)

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D']
  const hasPriceChange = priceChangePercent !== null && priceChangePercent !== undefined && Number.isFinite(Number(priceChangePercent))
  const isUp = hasPriceChange ? Number(priceChangePercent) >= 0 : true
  const quoteAsset = pair.quoteAsset || pair.symbol?.split('/')?.[1] || 'THB'
  const quotePrefix = quoteAsset === 'THB' ? '฿' : `${quoteAsset} `

  // Filter limit orders for current active symbol
  const activeLimitOrders = (limitOrders || []).filter((o) => o.symbol === pair.symbol)

  // Display-only demo spread; this is not an executable market quote.
  const spreadPct = 0.00012
  const halfSpread = currentPrice * (spreadPct / 2)
  const bidPrice = currentPrice - halfSpread
  const askPrice = currentPrice + halfSpread
  const spreadAmount = Math.max(0, askPrice - bidPrice)

  // 1. Initialize the local chart renderer.
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

  // 2. Generate demo candles in the same quote unit as the order form.
  useEffect(() => {
    if (!candleSeriesRef.current) return
    setIsLoadingCandles(true)
    lastBarRef.current = null
    setOhlc({ open: 0, high: 0, low: 0, close: 0, time: 0 })

    const stepSec = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : timeframe === '1D' ? 86400 : 900
    const nowSec = Math.floor(Date.now() / 1000)
    const currentBarTime = Math.floor(nowSec / stepSec) * stepSec
    const base = Number.isFinite(Number(currentPrice)) && Number(currentPrice) > 0 ? Number(currentPrice) : Number(pair.price)
    const precision = pair.precision || 2
    const volatility = 0.003
    const demoCandles = []
    let walkPrice = base * (1 - (Math.random() * 0.012 - 0.006))

    for (let i = 80; i >= 0; i -= 1) {
      const time = currentBarTime - i * stepSec
      const open = walkPrice
      const close = i === 0 ? base : open + (Math.random() - 0.49) * volatility * open
      const high = Math.max(open, close) + Math.random() * volatility * open * 0.7
      const low = Math.min(open, close) - Math.random() * volatility * open * 0.7
      demoCandles.push({
        time,
        open: Number(open.toFixed(precision)),
        high: Number(high.toFixed(precision)),
        low: Number(low.toFixed(precision)),
        close: Number(close.toFixed(precision)),
      })
      walkPrice = close
    }

    candleSeriesRef.current.setData(demoCandles)
    const last = demoCandles[demoCandles.length - 1]
    lastBarRef.current = { ...last }
    setOhlc({ ...last })
    setIsLoadingCandles(false)
    try {
      chartInstanceRef.current.timeScale().fitContent()
    } catch (e) {}

    return () => {
      lastBarRef.current = null
    }
  }, [pair.symbol, timeframe])
  // 4. Keep the active demo candle aligned with the trade panel price.
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

    // Show only Spot limit order lines.
    activeLimitOrders.forEach((order) => {
      const limPl = candleSeriesRef.current.createPriceLine({
        price: order.targetPrice,
        color: '#f59e0b',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `⏳ LIMIT ${order.side} @ ${quotePrefix}${formatNumber(order.targetPrice, pair.precision || 2)}`,
      })
      priceLinesRef.current.push(limPl)
    })

    // Illustrative demo Bid and Ask lines.
    if (currentPrice && currentPrice > 0) {
      const precision = pair.precision || 2

      // Ask Line (Rose dashed)
      const askPl = candleSeriesRef.current.createPriceLine({
        price: askPrice,
        color: '#f43f5e',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `ASK ${quotePrefix}${formatNumber(askPrice, precision)} (DEMO spread ${quotePrefix}${formatNumber(spreadAmount, precision)})`,
      })
      priceLinesRef.current.push(askPl)

      // Bid Line (Cyan dashed)
      const bidPl = candleSeriesRef.current.createPriceLine({
        price: bidPrice,
        color: '#06b6d4',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `BID ${quotePrefix}${formatNumber(bidPrice, precision)}`,
      })
      priceLinesRef.current.push(bidPl)
    }
  }, [activeLimitOrders, pair.precision, currentPrice, bidPrice, askPrice, spreadAmount])

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] border border-[#1e2638] rounded-3xl p-3.5 sm:p-5 shadow-2xl relative overflow-hidden font-sans">
      
      {/* Demo chart header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl mb-2 text-[11px] font-mono shadow-inner">
        <div className="flex items-center space-x-2.5 text-slate-300">
          <div className="flex items-center space-x-1 text-emerald-400 font-extrabold tracking-wide">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            <span>FINNTECH Spot DEMO</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">
            แหล่งข้อมูล: <strong className="text-cyan-300">ราคาจำลองในเครื่อง</strong>
          </span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="text-amber-300 font-bold">Spread DEMO:</span>
            <span className="text-amber-400 font-bold">
              {quotePrefix}{formatNumber(spreadAmount, pair.precision || 2)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold font-mono">
              BID {quotePrefix}{formatNumber(bidPrice, pair.precision || 2)}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold font-mono">
              ASK {quotePrefix}{formatNumber(askPrice, pair.precision || 2)}
            </span>
          </div>

        </div>
      </div>

      {/* Chart Toolbar & Symbol Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800/80 mb-2">
        {/* Pair, demo price and candle countdown */}
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                {pair.symbol}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {pair.name}
              </span>
              {pair.category === 'crypto' && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Spot
                </span>
              )}

              {/* Explicit Market Feed Status Badge */}
              {(() => {
                const symStatus = liveMarketService.getSymbolStatus(pair.symbol)
                const isDemo = symStatus.status === 'DEMO'
                const isStale = symStatus.status === 'STALE'
                return (
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border flex items-center space-x-1 ${
                      isDemo
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : isStale
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                    title={`Feed Source: ${symStatus.source}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-cyan-400' : isStale ? 'bg-amber-400' : 'bg-rose-400'}`} />
                    <span>{symStatus.status}</span>
                  </span>
                )
              })()}
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
                <span>{quotePrefix}{formatNumber(currentPrice, pair.precision || 2)}</span>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tickDirection === 'down' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${tickDirection === 'down' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                </span>
              </span>

              {hasPriceChange ? <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-0.5 ${
                  isUp
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isUp ? '+' : ''}{Number(priceChangePercent).toFixed(2)}%</span>
              </span> : <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">24h —</span>}
            </div>

            {/* Demo candle countdown and OHLC */}
            <div className="flex flex-wrap items-center gap-2 mt-1 font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  DEMO Bar:
                </span>
                <span
                  title="เวลานับถอยหลังปิดแท่งเทียนจำลอง"
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
                  <span>O: <strong className="text-slate-200">{pair.symbol.endsWith('/THB') ? '฿' : '$'}{formatNumber(ohlc.open, pair.precision || 2)}</strong></span>
                  <span>H: <strong className="text-emerald-400">{pair.symbol.endsWith('/THB') ? '฿' : '$'}{formatNumber(ohlc.high, pair.precision || 2)}</strong></span>
                  <span>L: <strong className="text-rose-400">{pair.symbol.endsWith('/THB') ? '฿' : '$'}{formatNumber(ohlc.low, pair.precision || 2)}</strong></span>
                  <span>C: <strong className="text-slate-200">{pair.symbol.endsWith('/THB') ? '฿' : '$'}{formatNumber(ohlc.close, pair.precision || 2)}</strong></span>
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
            <span>แท่งเทียน DEMO</span>
          </div>
        </div>
      </div>

      {/* Main Lightweight Charts Canvas Container with Order Badges Overlay */}
      <div className="flex-1 min-h-[340px] w-full relative">
        <div ref={chartContainerRef} className="w-full h-full rounded-2xl overflow-hidden" />

        {/* Floating Limit Orders Overlay with Cancel Button */}
        {activeLimitOrders.length > 0 && (
          <div className="absolute top-3 right-16 z-10 flex flex-col space-y-1.5 pointer-events-auto max-w-xs">
            {activeLimitOrders.map((order) => (
              <div
                key={`limit-${order.id}`}
                className="flex items-center justify-between space-x-2 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/80 text-amber-300 shadow-lg backdrop-blur-md font-mono text-[11px]"
              >
                <span>⏳ LIMIT {order.side} @ {quotePrefix}{formatNumber(order.targetPrice, pair.precision || 2)}</span>
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
          <span>กำลังเตรียมกราฟ DEMO...</span>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator Badges & OHLC */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span>O: <strong className="text-slate-200">{quotePrefix}{formatNumber(ohlc.open || currentPrice, pair.precision || 2)}</strong></span>
          <span>H: <strong className="text-emerald-400">{quotePrefix}{formatNumber(ohlc.high || currentPrice, pair.precision || 2)}</strong></span>
          <span>L: <strong className="text-rose-400">{quotePrefix}{formatNumber(ohlc.low || currentPrice, pair.precision || 2)}</strong></span>
          <span>C: <strong className="text-slate-200">{quotePrefix}{formatNumber(ohlc.close || currentPrice, pair.precision || 2)}</strong></span>
        </div>
        <div className="text-emerald-400 font-semibold flex items-center space-x-1.5 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>ข้อมูลแท่งเทียน DEMO • 24h —</span>
        </div>
      </div>
    </div>
  )
}
