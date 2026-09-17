import React, { useState, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Terminal,
  ExternalLink,
  Play,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileText,
  Clock,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import tradingViewWebhookService from '../../services/tradingViewWebhookService'
import { TRADING_PAIRS } from '../../data/tradingData'

export default function TradingViewSignalModal({ isOpen, onClose, onFireSignal }) {
  const [activeTab, setActiveTab] = useState('credentials') // 'credentials' | 'simulator' | 'logs'
  const [secretKey, setSecretKey] = useState(tradingViewWebhookService.getSecret())
  const [webhookUrl, setWebhookUrl] = useState(tradingViewWebhookService.getWebhookUrl())
  const [logs, setLogs] = useState([])
  const [copiedField, setCopiedField] = useState(null) // 'url' | 'secret' | 'template'
  const [showSecret, setShowSecret] = useState(false)

  // Simulator Form State
  const [simSymbol, setSimSymbol] = useState('BTC/USDT')
  const [simAction, setSimAction] = useState('BUY')
  const [simLeverage, setSimLeverage] = useState(10)
  const [simAmount, setSimAmount] = useState(25000)
  const [simTP, setSimTP] = useState('')
  const [simSL, setSimSL] = useState('')
  const [simComment, setSimComment] = useState('RSI Bullish Crossover')
  const [fireFeedback, setFireFeedback] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setSecretKey(tradingViewWebhookService.getSecret())
      setWebhookUrl(tradingViewWebhookService.getWebhookUrl())
      setLogs(tradingViewWebhookService.getLogs())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2500)
  }

  const handleRegenerateSecret = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการสร้าง Secret Key ใหม่? (คำสั่งเก่าที่ตั้งไว้ใน TradingView จะต้องอัปเดต Key ใหม่)')) {
      const newSec = tradingViewWebhookService.regenerateSecret()
      setSecretKey(newSec)
    }
  }

  const handleClearLogs = () => {
    tradingViewWebhookService.clearLogs()
    setLogs([])
  }

  // Fire simulated signal
  const handleFireSimulatedSignal = (customPayload = null) => {
    const payload = customPayload || {
      secret: secretKey,
      symbol: simSymbol,
      action: simAction,
      leverage: simLeverage,
      amount: simAmount,
      tp: simTP ? parseFloat(simTP) : null,
      sl: simSL ? parseFloat(simSL) : null,
      comment: simComment || 'TradingView Manual Test'
    }

    const result = tradingViewWebhookService.processSignal(payload, true)
    setLogs(tradingViewWebhookService.getLogs())

    if (result.success) {
      setFireFeedback({
        type: 'success',
        text: `🚀 ยิงสัญญาณสำเร็จ! เปิดสัญญา ${result.data.side} ${result.data.symbol} (${result.data.leverage}x) ในพอร์ตเรียบร้อย`
      })
      if (onFireSignal) {
        onFireSignal(result.data)
      }
    } else {
      setFireFeedback({
        type: 'error',
        text: `❌ ไม่สามารถประมวลผลสัญญาณได้: ${result.message}`
      })
    }

    setTimeout(() => setFireFeedback(null), 4000)
  }

  const sampleTemplate = tradingViewWebhookService.generateAlertMessageTemplate(simSymbol, simAction)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#121721] border border-[#1e2638] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2638] bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  TradingView Auto-Signal Bridge
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MT5 ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                รับสัญญาณ Alert จาก TradingView แล้วเข้าออเดอร์ในพอร์ต FINNTECH อัตโนมัติ (ฟรี 100%)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#1e2638] px-5 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'credentials'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>ตั้งค่า Webhook (Setup)</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'simulator'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>ทดสอบยิงสัญญาณสด (Live Tester)</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'logs'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ประวัติสัญญาณ ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Feedback Banner */}
          {fireFeedback && (
            <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center space-x-2 animate-slide-up ${
              fireFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {fireFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{fireFeedback.text}</span>
            </div>
          )}

          {/* ================= TAB 1: WEBHOOK CREDENTIALS & TEMPLATE ================= */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              
              {/* How it works info box */}
              <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-start space-x-3 text-xs">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-white block">วิธีการทำงานเหมือน MT5:</span>
                  <p className="text-slate-400 leading-relaxed">
                    คุณสามารถสร้าง Alert บนกราฟ TradingView แล้วนำ <strong>Webhook URL</strong> และ <strong>ข้อความ JSON</strong> ด้านล่างไปใส่ เมื่อเงื่อนไขใน TradingView ทำงาน ระบบจะส่งคำสั่งและเปิดสัญญาในพอร์ตของคุณทันที
                  </p>
                </div>
              </div>

              {/* Webhook URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>1. Webhook URL (นำไปวางในช่อง Webhook URL ของ TradingView Alert):</span>
                  <span className="text-[11px] text-emerald-400 font-normal">พร้อมใช้งาน</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(webhookUrl, 'url')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center space-x-1 shrink-0"
                  >
                    {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'url' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>

              {/* Secret Key Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>2. Secret Key ประจำบัญชี (รหัสความปลอดภัย):</span>
                  <button
                    onClick={handleRegenerateSecret}
                    className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>สร้างคีย์ใหม่</span>
                  </button>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    readOnly
                    value={secretKey}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs border border-slate-800 shrink-0"
                  >
                    {showSecret ? 'ซ่อน' : 'แสดง'}
                  </button>
                  <button
                    onClick={() => handleCopy(secretKey, 'secret')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center space-x-1 shrink-0"
                  >
                    {copiedField === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'secret' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>

              {/* JSON Payload Template Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    3. ข้อความแจ้งเตือน (นำโค้ด JSON นี้ไปวางในช่อง Message ของ Alert):
                  </label>
                  <button
                    onClick={() => handleCopy(sampleTemplate, 'template')}
                    className="text-xs text-emerald-400 hover:underline font-bold flex items-center space-x-1"
                  >
                    {copiedField === 'template' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'template' ? 'คัดลอกเรียบร้อย!' : 'คัดลอก JSON ทั้งหมด'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {sampleTemplate}
                </pre>
              </div>

              {/* 3 Step Instruction */}
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                <span className="font-bold text-slate-300 block">ขั้นตอนการตั้งค่าบน TradingView:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                  <li>เปิดกราฟ TradingView แล้วกดปุ่ม <strong>Create Alert (ไอคอนนาฬิกาปลุก)</strong></li>
                  <li>ในแถบ <strong>Notifications</strong> ติ๊กถูกที่ <strong>Webhook URL</strong> แล้ววางลิงก์จากข้อ 1</li>
                  <li>ในแถบ <strong>Settings</strong> ช่อง <strong>Message</strong> ให้วางโค้ด JSON จากข้อ 3 แล้วกด Create</li>
                </ol>
              </div>

            </div>
          )}

          {/* ================= TAB 2: LIVE SIGNAL SIMULATOR (TESTER) ================= */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-xs text-emerald-400 flex items-center space-x-2">
                <Activity className="w-4 h-4 shrink-0" />
                <span>
                  <strong>ฟรี 100%:</strong> คุณสามารถทดสอบส่งสัญญาณเสมือนจริงเข้าพอร์ต FINNTECH ได้ทันที เพื่อดูการเปิดออเดอร์อัตโนมัติ
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">ทดสอบด่วนใน 1 คลิก (Quick Test Presets):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleFireSimulatedSignal({
                      symbol: 'BTC/USDT',
                      action: 'BUY',
                      leverage: 10,
                      amount: 25000,
                      comment: 'RSI Oversold Buy (Preset)'
                    })}
                    className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all active:scale-95 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-400 text-xs flex items-center space-x-1">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>BUY BTC/USDT</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">10x</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Margin ฿25,000</div>
                  </button>

                  <button
                    onClick={() => handleFireSimulatedSignal({
                      symbol: 'ETH/USDT',
                      action: 'SELL',
                      leverage: 5,
                      amount: 20000,
                      comment: 'MACD Bearish Cross (Preset)'
                    })}
                    className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all active:scale-95 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-400 text-xs flex items-center space-x-1">
                        <ArrowDownRight className="w-4 h-4" />
                        <span>SELL ETH/USDT</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">5x</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Margin ฿20,000</div>
                  </button>

                  <button
                    onClick={() => handleFireSimulatedSignal({
                      symbol: 'GOLD/USD',
                      action: 'BUY',
                      leverage: 20,
                      amount: 30000,
                      comment: 'EMA 200 Rebound (Preset)'
                    })}
                    className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all active:scale-95 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-400 text-xs flex items-center space-x-1">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>BUY GOLD/USD</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">20x</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Margin ฿30,000</div>
                  </button>

                  <button
                    onClick={() => handleFireSimulatedSignal({
                      symbol: 'EUR/USD',
                      action: 'BUY',
                      leverage: 50,
                      amount: 15000,
                      comment: 'ECB Rate Decision Long (Forex)'
                    })}
                    className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-left transition-all active:scale-95 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-400 text-xs flex items-center space-x-1">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>BUY EUR/USD</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">50x</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Forex • ฿15,000</div>
                  </button>
                </div>
              </div>

              {/* Custom Signal Form */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-200 block">กำหนดค่าสัญญาณจำลองเอง (Custom Parameters):</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">คู่สินทรัพย์ / คู่เงิน (Symbol):</label>
                    <select
                      value={simSymbol}
                      onChange={(e) => setSimSymbol(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    >
                      {TRADING_PAIRS.map((p) => (
                        <option key={p.symbol} value={p.symbol}>{p.symbol} ({p.name})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ทิศทาง (Action):</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSimAction('BUY')}
                        className={`py-1 rounded-lg font-bold text-xs transition-colors ${
                          simAction === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        BUY (Long)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimAction('SELL')}
                        className={`py-1 rounded-lg font-bold text-xs transition-colors ${
                          simAction === 'SELL' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        SELL (Short)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Leverage ({simLeverage}x):</label>
                    <div className="flex space-x-1">
                      {[1, 5, 10, 20, 50].map((lev) => (
                        <button
                          key={lev}
                          type="button"
                          onClick={() => setSimLeverage(lev)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            simLeverage === lev
                              ? 'bg-amber-400/20 text-amber-400 border-amber-400/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {lev}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Margin (บาท):</label>
                    <input
                      type="number"
                      value={simAmount}
                      onChange={(e) => setSimAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">หมายเหตุอินดิเคเตอร์ (Comment):</label>
                  <input
                    type="text"
                    value={simComment}
                    onChange={(e) => setSimComment(e.target.value)}
                    placeholder="เช่น RSI Overbought, Supertrend Buy, Candle Close"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleFireSimulatedSignal()}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer mt-2"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>⚡ ยิงสัญญาณเข้าพอร์ตทันที (Fire Signal)</span>
                </button>
              </div>

            </div>
          )}

          {/* ================= TAB 3: SIGNAL ACTIVITY LOGS ================= */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  ประวัติสัญญาณที่ยิงเข้ามาทั้งหมด ({logs.length})
                </span>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ล้างประวัติ</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Terminal className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                  <div className="text-sm font-semibold text-slate-300">ยังไม่มีประวัติสัญญาณ</div>
                  <p className="text-xs text-slate-500 mt-1">เมื่อ TradingView ยิงคำสั่งหรือทดสอบยิงสัญญาณ ประวัติจะแสดงที่นี่</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 max-h-[340px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-white font-mono">{log.symbol}</span>
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                            log.action === 'LONG' || log.action === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {log.action} {log.leverage}
                          </span>
                          <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {log.comment} • Margin {log.amount}
                        </div>
                      </div>

                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'EXECUTED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status === 'EXECUTED' ? '✓ สำเร็จ' : '✕ ปฏิเสธ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1e2638] bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Webhook Listener: พร้อมรับคำสั่ง</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  )
}
