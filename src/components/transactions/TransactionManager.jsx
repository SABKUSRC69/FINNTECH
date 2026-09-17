import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Tag,
  Receipt,
  FileSpreadsheet
} from 'lucide-react'
import { formatCurrency, formatDateThai } from '../../utils/formatters'
import { DEFAULT_CATEGORIES } from '../../data/initialData'

export default function TransactionManager({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onOpenQuickAdd
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all') // 'all' | 'income' | 'expense'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateRange, setDateRange] = useState('all') // 'all' | 'this_month' | 'last_month'

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      if (selectedType !== 'all' && tx.type !== selectedType) return false

      // Category match
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false

      // Date match
      if (dateRange === 'this_month') {
        const nowMonth = '2026-09'
        if (!tx.date.startsWith(nowMonth)) return false
      } else if (dateRange === 'last_month') {
        const lastMonth = '2026-08'
        if (!tx.date.startsWith(lastMonth)) return false
      }

      // Search match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchNote = tx.note?.toLowerCase().includes(term)
        const matchCat = tx.categoryName?.toLowerCase().includes(term)
        const matchAmount = tx.amount.toString().includes(term)
        if (!matchNote && !matchCat && !matchAmount) return false
      }

      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, searchTerm, selectedType, selectedCategory, dateRange])

  // Calculations for filtered items
  const filteredIncome = filteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const filteredExpense = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Export to CSV Function (with UTF-8 BOM so Thai characters open correctly in Excel)
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก')
      return
    }

    const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'บันทึกช่วยจำ']
    const rows = filteredTransactions.map((tx) => [
      tx.date,
      tx.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      tx.categoryName,
      tx.amount,
      `"${(tx.note || '').replace(/"/g, '""')}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `finntech-transactions-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Receipt className="w-7 h-7 text-emerald-500" />
            <span>บันทึกรายรับ - รายจ่าย</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            จัดการและตรวจสอบประวัติการเงินของคุณ สามารถกรอง ค้นหา และส่งออกรายงาน CSV ได้
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-semibold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>ส่งออก Excel/CSV</span>
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการใหม่</span>
          </button>
        </div>
      </div>

      {/* Summary strip of filtered view */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">รายการที่พบ</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {filteredTransactions.length} รายการ
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-500 font-medium">รายรับรวม (ที่เลือก)</div>
            <div className="text-xl font-bold text-emerald-500 mt-0.5">
              +{formatCurrency(filteredIncome, false)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-500 font-medium">รายจ่ายรวม (ที่เลือก)</div>
            <div className="text-xl font-bold text-rose-500 mt-0.5">
              -{formatCurrency(filteredExpense, false)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อรายการ, จำนวนเงิน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกประเภท (รายรับ & รายจ่าย)</option>
              <option value="income">เฉพาะรายรับ (+)</option>
              <option value="expense">เฉพาะรายจ่าย (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกหมวดหมู่ (All Categories)</option>
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'income' ? 'รับ' : 'จ่าย'})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกช่วงเวลา (All Time)</option>
              <option value="this_month">เดือนปัจจุบัน (ก.ย. 2026)</option>
              <option value="last_month">เดือนก่อนหน้า (ส.ค. 2026)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">วันที่</th>
                  <th className="py-3.5 px-4">รายการ / บันทึก</th>
                  <th className="py-3.5 px-4">หมวดหมู่</th>
                  <th className="py-3.5 px-4 text-right">จำนวนเงิน</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs sm:text-sm">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income'
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDateThai(tx.date)}
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <span>{tx.note}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          isIncome
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {tx.categoryName}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                        isIncome ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (window.confirm(`ต้องการลบรายการ "${tx.note}" หรือไม่?`)) {
                              onDeleteTransaction(tx.id)
                            }
                          }}
                          title="ลบรายการนี้"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
            <div className="text-base font-semibold text-slate-600 dark:text-slate-300">
              ไม่พบข้อมูลรายการที่ตรงกับเงื่อนไข
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มรายการใหม่" เพื่อเริ่มต้นบันทึก
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
