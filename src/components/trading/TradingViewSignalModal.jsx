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
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import tradingViewWebhookService from '../../services/tradingViewWebhookService'
import { TRADING_PAIRS } from '../../data/tradingData'

export default function TradingViewSignalModal({ isOpen, onClose, onFireSignal }) {
  const [activeTab, setActiveTab] = useState('simulator') // 'credentials' | 'simulator' | 'logs'
  const [secretKey, setSecretKey] = useState(tradingViewWebhookService.getSecret())
  const [logs, setLogs] = useState([])
  const [copiedField, setCopiedField] = useState(null) // 'url' | 'secret' | 'template'
  const [showSecret, setShowSecret] = useState(false)

  // Simulator Form State
  const [simSymbol, setSimSymbol] = useState('BTC/THB')
  const [simAction, setSimAction] = useState('BUY')
  const [simAmount, setSimAmount] = useState(25000)
  const [simComment, setSimComment] = useState('RSI Bullish Crossover')
  const [fireFeedback, setFireFeedback] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setSecretKey(tradingViewWebhookService.getSecret())
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
      amount: simAmount,
      comment: simComment || 'TradingView Manual Test'
    }

    const result = tradingViewWebhookService.processSignal(payload, true)
    setLogs(tradingViewWebhookService.getLogs())

    if (result.success) {
      setFireFeedback({
        type: 'success',
        text: `จำลองคำสั่ง Spot ${result.data.action} ${result.data.symbol} สำเร็จ`
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
                  Spot Signal Simulator
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DEMO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                  ทดสอบคำสั่ง Spot ในเครื่องเท่านั้น ไม่มีการรับ Webhook ภายนอกหรือส่งคำสั่งตลาดจริง
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
            <span>ข้อจำกัด Webhook</span>
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
            <span>ตัวจำลอง Spot</span>
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

          {/* ================= TAB 1: WEBHOOK LIMITATIONS & EXAMPLE ================= */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              
              {/* Static Frontend Architecture Notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-start space-x-3 text-xs">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-amber-200 block">ตัวจำลอง Spot DEMO ในเบราว์เซอร์:</span>
                  <p className="text-amber-300/90 leading-relaxed">
                    แอปนี้ไม่มี Webhook Endpoint และไม่รับสัญญาณจาก TradingView ภายนอก แท็บตัวจำลองจะส่ง Spot DEMO ภายในหน้านี้เท่านั้น JSON ด้านล่างเป็นตัวอย่างสำหรับผู้ที่มี Relay แยกเอง
                  </p>
                </div>
              </div>

              {/* Webhook URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Webhook Endpoint:</span>
                </label>
                <p className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300">ไม่มี Webhook Endpoint ในแอปนี้</p>
              </div>

              {/* Secret Key Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Secret ตัวอย่างสำหรับ Relay ที่คุณจัดเตรียมเอง:</span>
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
                <span className="font-bold text-slate-300 block">ข้อจำกัด:</span>
                <p>ข้อความ JSON และ Secret เก็บใน LocalStorage แบบไม่เข้ารหัส แอปนี้ไม่มีบริการรับ Webhook หรือยืนยันตัวตนจากภายนอก</p>
              </div>

            </div>
          )}

          {/* ================= TAB 2: DEMO SPOT SIGNAL SIMULATOR ================= */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-xs text-emerald-400 flex items-center space-x-2">
                <Activity className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Spot DEMO:</strong> ตัวจำลองนี้ใช้ยอด Spot จำลองในเครื่อง ไม่รับ Webhook ภายนอกหรือส่งคำสั่งตลาดจริง
                </span>
              </div>

              {/* Spot DEMO presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">ตัวอย่างคำสั่ง Spot DEMO:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleFireSimulatedSignal({ symbol: 'BTC/THB', action: 'BUY', amount: 25000, comment: 'DEMO Spot BUY preset' })}
                    className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all active:scale-95"
                  >
                    <span className="font-extrabold text-emerald-400 text-xs">BUY BTC/THB (DEMO)</span>
                    <div className="text-[11px] text-slate-400 mt-1">ใช้งบจำลอง ฿25,000 รวมค่าธรรมเนียม</div>
                  </button>
                  <button
                    onClick={() => handleFireSimulatedSignal({ symbol: 'USDT/THB', action: 'BUY', amount: 5000, comment: 'DEMO Spot BUY preset' })}
                    className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all active:scale-95"
                  >
                    <span className="font-extrabold text-emerald-400 text-xs">BUY USDT/THB (DEMO)</span>
                    <div className="text-[11px] text-slate-400 mt-1">ใช้งบจำลอง ฿5,000 รวมค่าธรรมเนียม</div>
                  </button>
                  <button
                    onClick={() => handleFireSimulatedSignal({ symbol: 'BTC/THB', action: 'SELL', amount: 0.001, comment: 'DEMO Spot SELL preset' })}
                    className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all active:scale-95"
                  >
                    <span className="font-extrabold text-rose-400 text-xs">SELL BTC/THB (DEMO)</span>
                    <div className="text-[11px] text-slate-400 mt-1">ขาย 0.001 BTC จาก Spot Wallet</div>
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
                        onClick={() => { setSimAction('BUY'); setSimAmount(25000) }}
                        className={`py-1 rounded-lg font-bold text-xs transition-colors ${
                          simAction === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSimAction('SELL'); setSimAmount(0.001) }}
                        className={`py-1 rounded-lg font-bold text-xs transition-colors ${
                          simAction === 'SELL' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        SELL
                      </button>

                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">งบซื้อ (THB) / จำนวนเหรียญสำหรับ SELL:</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      BUY ใช้งบ THB รวมค่าธรรมเนียม 0.25%; SELL ระบุจำนวนเหรียญที่มีใน Spot Wallet
                    </p>
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
                  <span>ส่งคำสั่งซื้อขาย Spot DEMO</span>
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
                            log.action === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {log.action} • DEMO
                          </span>
                          <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {log.comment} • {log.amount}
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
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>ตัวจำลองในเครื่อง • ไม่มี Webhook Endpoint</span>
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
