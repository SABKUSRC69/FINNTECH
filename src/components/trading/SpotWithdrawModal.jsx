import React, { useState } from 'react'
import { Building2, X, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { soundEffects } from '../../utils/soundEffects'

export default function SpotWithdrawModal({ isOpen, onClose, availableTHB = 0, onWithdraw }) {
  const [bank, setBank] = useState('KBANK')
  const [accountNo, setAccountNo] = useState('123-4-56789-0')
  const [amount, setAmount] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const banks = [
    { code: 'KBANK', name: 'ธนาคารกสิกรไทย (KBANK)', color: '#138f2d' },
    { code: 'SCB', name: 'ธนาคารไทยพาณิชย์ (SCB)', color: '#4e2a84' },
    { code: 'BBL', name: 'ธนาคารกรุงเทพ (BBL)', color: '#1e4598' },
    { code: 'KTB', name: 'ธนาคารกรุงไทย (KTB)', color: '#00a5e5' },
    { code: 'TTB', name: 'ธนาคารทหารไทยธนชาต (TTB)', color: '#0050f0' },
  ]

  const numAmount = parseFloat(amount) || 0
  const fee = numAmount > 0 ? 20 : 0
  const netAmount = Math.max(0, numAmount - fee)

  const handleMax = () => {
    setAmount(availableTHB.toString())
  }

  const handleConfirm = () => {
    if (numAmount <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ต้องการถอน')
      return
    }
    if (numAmount > availableTHB) {
      alert('ยอดเงินคงเหลือไม่เพียงพอสำหรับการถอน')
      return
    }
    if (!accountNo.trim()) {
      alert('กรุณาระบุเลขที่บัญชีธนาคาร')
      return
    }

    soundEffects.playLossClose()
    setIsSuccess(true)
    setTimeout(() => {
      onWithdraw(numAmount)
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-orange-500/20 font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">ถอนเงินบาท (THB)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                โอนเข้าบัญชีธนาคาร
              </span>
            </div>
            <p className="text-xs text-slate-400">เงินบาทพร้อมใช้: ฿{formatNumber(availableTHB, 2)}</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-scaleUp text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ส่งคำสั่งถอนเงินสำเร็จ!</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                ยอดสุทธิ ฿{formatNumber(netAmount, 2)} THB เข้าบัญชี {bank} เรียบร้อย
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Bank Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                เลือกธนาคารปลายทาง
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full bg-[#141a26] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/80"
              >
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                เลขที่บัญชี
              </label>
              <input
                type="text"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder="xxx-x-xxxxx-x"
                className="w-full bg-[#141a26] border border-slate-700/80 focus:border-amber-500/80 rounded-2xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  จำนวนเงินที่ต้องการถอน (บาท)
                </label>
                <button
                  type="button"
                  onClick={handleMax}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  ถอนทั้งหมด (MAX)
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  max={availableTHB}
                  className="w-full bg-[#141a26] border border-slate-700/80 focus:border-amber-500/80 rounded-2xl px-4 py-3 text-lg font-bold font-mono text-white placeholder-slate-500 focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400 font-mono">
                  THB
                </span>
              </div>
            </div>

            {/* Breakdown box */}
            <div className="p-3.5 rounded-2xl bg-[#080c13] border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>ค่าธรรมเนียมการถอน:</span>
                <span className="font-mono text-slate-300">฿{formatNumber(fee, 2)} THB</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800">
                <span>ยอดเงินสุทธิที่จะได้รับ:</span>
                <span className="font-mono text-emerald-400">฿{formatNumber(netAmount, 2)} THB</span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>ยืนยันการถอนเงิน</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
