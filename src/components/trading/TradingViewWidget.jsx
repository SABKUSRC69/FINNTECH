import React, { useEffect, useRef, memo, useState } from 'react'
import { Activity, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react'

function TradingViewWidget({ symbol = 'BINANCE:BTCUSDT', height = '100%', onFallbackToFastChart }) {
  const containerRef = useRef(null)
  const containerId = useRef(`tradingview_${Math.random().toString(36).substring(2, 9)}`)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    setIsError(false)
    let tvWidget = null
    const currentContainerId = containerId.current

    const initWidget = () => {
      if (window.TradingView && containerRef.current) {
        try {
          containerRef.current.innerHTML = `<div id="${currentContainerId}" style="height: 100%; width: 100%;"></div>`

          tvWidget = new window.TradingView.widget({
            autosize: true,
            symbol: symbol,
            interval: '15',
            timezone: 'Asia/Bangkok',
            theme: 'dark',
            style: '1',
            locale: 'th_TH',
            toolbar_bg: '#0f172a',
            enable_publishing: false,
            allow_symbol_change: false,
            container_id: currentContainerId,
            hide_side_toolbar: false,
            withdateranges: true,
            save_image: false,
            studies: [
              'RSI@tv-basicstudies',
              'MASimple@tv-basicstudies'
            ],
            overrides: {
              'mainSeriesProperties.showCountdown': true,
              'scalesProperties.showSymbolLabels': true,
              'scalesProperties.showPriceScale': true,
              'paneProperties.background': '#0b0e14',
              'paneProperties.vertGridProperties.color': '#1e2638',
              'paneProperties.horzGridProperties.color': '#1e2638',
            }
          })

          setTimeout(() => {
            setIsLoading(false)
          }, 1500)
        } catch (e) {
          console.warn('Error initializing TradingView widget', e)
          setIsError(true)
          setIsLoading(false)
        }
      }
    }

    if (!window.TradingView) {
      const existingScript = document.getElementById('tradingview-widget-script')
      if (!existingScript) {
        const script = document.createElement('script')
        script.id = 'tradingview-widget-script'
        script.src = 'https://s3.tradingview.com/tv.js'
        script.type = 'text/javascript'
        script.async = true
        script.onload = initWidget
        script.onerror = () => {
          setIsError(true)
          setIsLoading(false)
        }
        document.head.appendChild(script)
      } else {
        existingScript.addEventListener('load', initWidget)
      }
    } else {
      initWidget()
    }

    // Safety timeout: If still loading after 2.5 seconds (e.g. s.tradingview.com DNS blocked), show fallback button
    const timeout = setTimeout(() => {
      setIsLoading(false)
      const iframe = containerRef.current?.querySelector('iframe')
      if (!iframe) {
        setIsError(true)
      }
    }, 2500)

    return () => {
      clearTimeout(timeout)
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, retryKey])

  return (
    <div className="tradingview-widget-container w-full h-full rounded-3xl overflow-hidden bg-[#0b0e14] border border-[#1e2638] shadow-xl relative" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0b0e14]/90 z-10 flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs font-mono text-slate-400">กำลังเชื่อมต่อ TradingView...</span>
        </div>
      )}

      {/* Fallback Banner if DNS / Network blocks TradingView */}
      {isError && (
        <div className="absolute inset-0 bg-[#0b0e14]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400">
            <AlertTriangle className="w-7 h-7 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 font-sans">
            ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์กราฟ TradingView ได้
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed font-sans">
            สัญญาณอินเทอร์เน็ตหรือ DNS ในเครื่องบล็อกการเชื่อมต่อกับเซิร์ฟเวอร์ TradingView (s.tradingview.com) ชั่วคราว ท่านสามารถคลิกสลับไปใช้งานกราฟสำรอง <strong>FINNTECH Fast Chart</strong> ที่ทำงานได้ทันที 100%
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onFallbackToFastChart && (
              <button
                type="button"
                onClick={onFallbackToFastChart}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>สลับใช้ FINNTECH Fast Chart ทันที</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ลองใหม่อีกครั้ง</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(TradingViewWidget)
