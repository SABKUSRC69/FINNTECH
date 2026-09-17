import React, { useState } from 'react'
import { Bell, BellRing, Plus, Trash2, X, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'
import { TRADING_PAIRS } from '../../data/tradingData'

export default function PriceAlertModal({
  isOpen,
  onClose,
  selectedSymbol,
  currentPrice,
  alerts = [],
  onAddAlert,
  onDeleteAlert,
}) {
  const [symbol, setSymbol] = useState(selectedSymbol || 'BTC/USDT')
  const [condition, setCondition] = useState('GTE') // 'GTE' (>=) or 'LTE' (<=)
  const [targetPrice, setTargetPrice] = useState(currentPrice ? currentPrice.toString() : '76500')
  const [note, setNote] = useState('')

  if (!isOpen) return null

  const handleAdd = (e) => {
    e.preventDefault()
    const p = parseFloat(targetPrice)
    if (!p || p <= 0) {
      alert('กรุณาระบุราคาเป้าหมายที่ถูกต้อง')
      return
    }

    onAddAlert({
      id: 'alert-' + Date.now(),
      symbol,
      condition,
      targetPrice: p,
      note: note.trim() || `${symbol} ${condition === 'GTE' ? '>= $' + p : '<= $' + p}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })

    setNote('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121721] border border-[#1e2638] rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e2638] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">ตั้งแจ้งเตือนราคา (Price Alerts)</h3>
              <p className="text-[11px] text-slate-400">ส่งเสียงเตือนเมื่อราคาวิ่งมาแตะเป้าหมาย</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Alert Form */}
        <form onSubmit={handleAdd} className="p-4 sm:p-5 space-y-3.5 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            {/* Symbol Selection */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">คู่เทรด (Pair)</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
              >
                {TRADING_PAIRS.map((p) => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.symbol}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">เงื่อนไข (Condition)</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="GTE">ราคาพุ่งขึ้นถึง (&gt;=)</option>
                <option value="LTE">ราคาร่วงลงถึง (&lt;=)</option>
              </select>
            </div>
          </div>

          {/* Target Price */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400 font-semibold">ราคาเป้าหมาย (Target Price USD)</label>
              <button
                type="button"
                onClick={() => setTargetPrice(currentPrice.toString())}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                ดึงราคาปัจจุบัน (${formatNumber(currentPrice, 2)})
              </button>
            </div>
            <input
              type="number"
              step="any"
              required
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="เช่น 78000"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold">บันทึกช่วยจำ (หมายเหตุ)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น จุดเบรคเอาท์แนวต้าน 78k"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างการแจ้งเตือนราคา</span>
          </button>
        </form>

        {/* Existing Alerts List */}
        <div className="p-4 sm:p-5 border-t border-[#1e2638] bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              รายการที่ตั้งไว้ ({alerts.length})
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="py-4 text-center text-slate-500 text-xs">
              ยังไม่มีการแจ้งเตือนราคาที่ตั้งไว้
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white">{alt.symbol}</span>
                      <span className={`text-[10px] font-mono font-bold ${alt.condition === 'GTE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {alt.condition === 'GTE' ? '≥' : '≤'} ${formatNumber(alt.targetPrice, 2)}
                      </span>
                    </div>
                    {alt.note && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {alt.note}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteAlert(alt.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
