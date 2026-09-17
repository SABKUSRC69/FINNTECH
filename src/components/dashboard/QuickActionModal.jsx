import React, { useState } from 'react'
import { X, ArrowDownRight, ArrowUpRight, Check } from 'lucide-react'
import { DEFAULT_CATEGORIES } from '../../data/initialData'

export default function QuickActionModal({ isOpen, onClose, onAddTransaction }) {
  if (!isOpen) return null

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const filteredCategories = DEFAULT_CATEGORIES.filter((c) => c.type === type)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ถูกต้อง')
      return
    }

    const selectedCat = DEFAULT_CATEGORIES.find((c) => c.id === category) || filteredCategories[0]

    const newTx = {
      id: 'tx-' + Date.now(),
      date,
      type,
      category: selectedCat ? selectedCat.id : 'other',
      categoryName: selectedCat ? selectedCat.name : (type === 'income' ? 'รายรับอื่นๆ' : 'ค่าใช้จ่ายอื่นๆ'),
      amount: parseFloat(amount),
      note: note.trim() || selectedCat?.name || (type === 'income' ? 'รายรับ' : 'รายจ่าย'),
    }

    onAddTransaction(newTx)
    // reset form
    setAmount('')
    setNote('')
    setCategory('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            บันทึกรายการด่วน (Quick Record)
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('expense')
                setCategory('')
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>รายจ่าย (Expense)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income')
                setCategory('')
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>รายรับ (Income)</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              จำนวนเงิน (บาท) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                ฿
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              หมวดหมู่ *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Note input */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              บันทึกช่วยจำ (Note)
            </label>
            <input
              type="text"
              placeholder="เช่น กาแฟอเมซอน, ช้อปปิ้งของสด"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Date input */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              วันที่ทำรายการ
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
