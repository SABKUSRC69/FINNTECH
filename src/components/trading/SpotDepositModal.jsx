import React, { useState } from 'react'
import { QrCode, X, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Copy, Check } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { soundEffects } from '../../utils/soundEffects'

export default function SpotDepositModal({ isOpen, onClose, onDeposit }) {
  const [amount, setAmount] = useState('50000')
  const [isCopied, setIsCopied] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const presetAmounts = [10000, 50000, 100000, 300000]

  const handleCopyRef = () => {
    navigator.clipboard?.writeText('0891234567-FT')
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleConfirm = () => {
    const num = parseFloat(amount) || 0
    if (num <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ต้องการฝาก')
      return
    }

    soundEffects.playTrade()
    setIsSuccess(true)
    setTimeout(() => {
      onDeposit(num)
      setIsSuccess(false)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="bg-[#0e131d] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">ฝากเงินบาท (THB)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Thai QR / PromptPay
              </span>
            </div>
            <p className="text-xs text-slate-400">ฝากเงินทันใจ ไร้ค่าธรรมเนียม 24 ชั่วโมง</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-scaleUp text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">จำลองการชำระเงินสำเร็จ!</h3>
              <p className="text-xs text-emerald-400 font-mono mt-1">
                +฿{formatNumber(parseFloat(amount), 2)} THB เข้ากระเป๋าเรียบร้อย
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                ระบุจำนวนเงินที่ต้องการฝาก (บาท)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#141a26] border border-slate-700/80 focus:border-emerald-500/80 rounded-2xl px-4 py-3 text-lg font-bold font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400 font-mono">
                  THB
                </span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                      amount === amt.toString()
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    ฿{formatNumber(amt, 0)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mock Thai QR Box */}
            <div className="p-4 rounded-2xl bg-[#080c13] border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-3">
              {/* PromptPay banner */}
              <div className="w-full py-1.5 px-3 rounded-lg bg-blue-900/40 border border-blue-600/30 text-blue-300 text-[11px] font-bold flex items-center justify-center space-x-1.5">
                <span>🏦 พร้อมเพย์ (PromptPay) • ยอดชำระ:</span>
                <span className="font-mono text-white text-xs">฿{formatNumber(parseFloat(amount) || 0, 2)}</span>
              </div>

              {/* QR Code graphic */}
              <div className="w-36 h-36 bg-white p-2.5 rounded-xl shadow-lg flex items-center justify-center relative group">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950">
                  <rect width="100" height="100" fill="white" />
                  {/* Outer corners */}
                  <rect x="10" y="10" width="25" height="25" fill="black" />
                  <rect x="14" y="14" width="17" height="17" fill="white" />
                  <rect x="17" y="17" width="11" height="11" fill="black" />

                  <rect x="65" y="10" width="25" height="25" fill="black" />
                  <rect x="69" y="14" width="17" height="17" fill="white" />
                  <rect x="72" y="17" width="11" height="11" fill="black" />

                  <rect x="10" y="65" width="25" height="25" fill="black" />
                  <rect x="14" y="69" width="17" height="17" fill="white" />
                  <rect x="17" y="72" width="11" height="11" fill="black" />

                  {/* Inner simulated data dots */}
                  <circle cx="50" cy="20" r="3" fill="black" />
                  <circle cx="42" cy="30" r="2.5" fill="black" />
                  <circle cx="58" cy="32" r="3" fill="black" />
                  <circle cx="48" cy="50" r="5" fill="#1d4ed8" />
                  <circle cx="35" cy="50" r="2" fill="black" />
                  <circle cx="65" cy="52" r="3" fill="black" />
                  <circle cx="50" cy="68" r="2.5" fill="black" />
                  <circle cx="40" cy="75" r="3" fill="black" />
                  <circle cx="70" cy="70" r="4" fill="black" />
                  <circle cx="80" cy="50" r="3" fill="black" />
                  <circle cx="20" cy="48" r="2.5" fill="black" />
                </svg>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>รหัสอ้างอิง: <strong className="font-mono text-slate-300">089-123-4567</strong></span>
                <button
                  onClick={handleCopyRef}
                  type="button"
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  title="คัดลอกหมายเลขพร้อมเพย์"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Fee note */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>ค่าธรรมเนียมการฝาก:</span>
              <span className="text-emerald-400 font-bold">ฟรี (0 THB)</span>
            </div>

            {/* Action button */}
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>ยืนยันการโอนเงิน (จำลองการชำระเงิน)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
