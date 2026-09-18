import React from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  TrendingUp,
  ReceiptText,
  Calendar,
  Layers,
  ChevronRight,
  Plus
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import StatCard from './StatCard'
import FinancialHealthCard from './FinancialHealthCard'
import { formatCurrency, formatDateThai } from '../../utils/formatters'
import { MONTHLY_CASHFLOW_DATA } from '../../data/initialData'

export default function DashboardView({
  transactions,
  portfolio,
  onNavigateToTransactions,
  onOpenQuickAdd
}) {
  // Compute Current Month Stats
  const currentMonth = '2026-09'
  const currentMonthTx = transactions.filter((tx) => tx.date.startsWith(currentMonth))

  const totalIncome = currentMonthTx
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalExpense = currentMonthTx
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const netSavings = totalIncome - totalExpense

  // Compute Portfolio Total
  const portfolioTotal = portfolio.reduce((sum, item) => {
    return sum + (item.shares * item.currentPrice)
  }, 0)

  const totalNetWorth = portfolioTotal + netSavings + 250000 // Sample base bank deposits

  // Compute Expense by Category for Pie Chart
  const expenseByCategoryMap = {}
  currentMonthTx
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const cat = tx.categoryName || 'อื่นๆ'
      expenseByCategoryMap[cat] = (expenseByCategoryMap[cat] || 0) + tx.amount
    })

  const pieColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#ef4444', '#06b6d4', '#64748b']
  const pieChartData = Object.keys(expenseByCategoryMap).map((catName, index) => ({
    name: catName,
    value: expenseByCategoryMap[catName],
    color: pieColors[index % pieColors.length],
  }))

  // Recent 5 transactions
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800/80 shadow-sm transition-colors">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>FINNTECH Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ภาพรวมการเงินส่วนบุคคล
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ติดตามสถานะกระแสเงินสด ค่าใช้จ่าย และมูลค่าความมั่งคั่งสุทธิของคุณ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>บันทึกรายการ</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ความมั่งคั่งสุทธิ (Net Worth)"
          amount={formatCurrency(totalNetWorth, false)}
          subtitle="สินทรัพย์รวมทุกบัญชี"
          change="+8.4%"
          changeType="increase"
          icon={Wallet}
          gradient="from-emerald-500 to-teal-600"
        />

        <StatCard
          title="รายรับประจำเดือนนี้"
          amount={formatCurrency(totalIncome, false)}
          subtitle="เงินเดือน + งานเสริม + ปันผล"
          change="+12.5%"
          changeType="increase"
          icon={ArrowUpRight}
          gradient="from-cyan-500 to-blue-600"
        />

        <StatCard
          title="รายจ่ายประจำเดือนนี้"
          amount={formatCurrency(totalExpense, false)}
          subtitle="งบประมาณใช้ไป 40.5%"
          change="-4.2%"
          changeType="decrease"
          icon={ArrowDownRight}
          gradient="from-rose-500 to-amber-600"
        />

        <StatCard
          title="เงินออมสุทธิ (Cash Flow)"
          amount={formatCurrency(netSavings, false)}
          subtitle={netSavings >= 0 ? 'กระแสเงินสดเป็นบวก' : 'กระแสเงินสดติดลบ'}
          change={totalIncome > 0 ? `${((netSavings / totalIncome) * 100).toFixed(0)}% ของรายได้` : '0%'}
          changeType={netSavings >= 0 ? 'increase' : 'decrease'}
          icon={PiggyBank}
          gradient="from-violet-500 to-purple-600"
        />
      </div>

      {/* Charts Section: Cash Flow Trend & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Cash Flow Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl p-5 sm:p-6 bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span>แนวโน้มกระแสเงินสด 6 เดือนย้อนหลัง (Cash Flow Trend)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                เปรียบเทียบรายรับ รายจ่าย และยอดเงินออมสุทธิ
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">รายรับ</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">รายจ่าย</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">เงินออม</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_CASHFLOW_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `฿${v/1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="income" name="รายรับ" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="รายจ่าย" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Donut Breakdown (1 col) */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              สัดส่วนค่าใช้จ่ายแยกหมวดหมู่
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ประจำเดือนกันยายน 2026
            </p>
          </div>

          {pieChartData.length > 0 ? (
            <>
              <div className="h-52 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in donut */}
                <div className="absolute text-center pointer-events-none">
                  <div className="text-[11px] text-slate-400 font-medium">รวมรายจ่าย</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(totalExpense, false)}
                  </div>
                </div>
              </div>

              {/* Legend List */}
              <div className="mt-4 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {pieChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0 ml-2">
                      {formatCurrency(item.value, false)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center py-8">
              <Layers className="w-8 h-8 mb-2 opacity-50" />
              ยังไม่มีข้อมูลรายจ่ายในเดือนนี้
            </div>
          )}
        </div>

      </div>

      {/* Lower Row: Financial Health & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Health Score (1 col) */}
        <div className="lg:col-span-1">
          <FinancialHealthCard
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netWorth={totalNetWorth}
          />
        </div>

        {/* Recent Transactions Widget (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl p-5 sm:p-6 bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
                  <ReceiptText className="w-5 h-5 text-teal-500" />
                  <span>รายการธุรกรรมล่าสุด</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  รายการรายรับ-รายจ่ายที่บันทึกไว้ในระบบ
                </p>
              </div>

              <button
                onClick={onNavigateToTransactions}
                className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income'
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {isIncome ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {tx.note}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span>{tx.categoryName}</span>
                          <span>•</span>
                          <span>{formatDateThai(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`text-sm font-bold shrink-0 ml-4 ${
                      isIncome ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onNavigateToTransactions}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
            >
              จัดการและกรองรายการธุรกรรมทั้งหมด →
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
