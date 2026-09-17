import React from 'react'
import {
  LayoutDashboard,
  ReceiptText,
  Calculator,
  PieChart,
  Wallet,
  ArrowUpRight,
  Sparkles,
  Activity,
  Flame,
  BarChart3
} from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab, onOpenQuickAdd }) {
  const navItems = [
    {
      id: 'trading',
      label: 'ห้องเทรดสด Pro Trade',
      sublabel: 'Live Terminal & Futures',
      icon: Activity,
      badge: 'LIVE',
    },
    {
      id: 'analytics',
      label: 'สถิติและผลงาน (Analytics)',
      sublabel: 'Win Rate & Equity Curve',
      icon: BarChart3,
      badge: 'PRO',
    },
    {
      id: 'dashboard',
      label: 'ภาพรวมการเงิน',
      sublabel: 'Overview & Net Worth',
      icon: LayoutDashboard,
    },
    {
      id: 'transactions',
      label: 'บันทึกรายรับ-รายจ่าย',
      sublabel: 'Transactions Tracker',
      icon: ReceiptText,
    },
    {
      id: 'calculators',
      label: 'เครื่องมือคำนวณการเงิน',
      sublabel: 'Smart Calculators',
      icon: Calculator,
    },
    {
      id: 'portfolio',
      label: 'พอร์ตจำลองการลงทุน',
      sublabel: 'Portfolio & Assets',
      icon: PieChart,
    },
  ]

  // Mobile Bottom Nav Items (5 compact icons)
  const mobileNavItems = [
    { id: 'trading', label: 'เทรดสด', icon: Activity },
    { id: 'analytics', label: 'สถิติ', icon: BarChart3 },
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'transactions', label: 'รายรับจ่าย', icon: ReceiptText },
    { id: 'calculators', label: 'คำนวณ', icon: Calculator },
  ]

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#1e2638] bg-[#121721] p-4 min-h-[calc(100vh-4rem)]">
        
        {/* Quick Add Button */}
        <div className="mb-5">
          <button
            onClick={onOpenQuickAdd}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-xs tracking-wide uppercase">บันทึกรายการด่วน</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 flex-1">
          <div className="px-3 pb-2 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
            เมนูแพลตฟอร์ม
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs truncate leading-snug">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{item.sublabel}</div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Pro Tip Card */}
        <div className="mt-auto pt-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-[#1e2638]">
            <div className="flex items-center space-x-2 text-emerald-400 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold">Pro Trading Tip</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              การบริหารความเสี่ยง (Risk Management) ด้วย Stop Loss ทุกครั้ง สำคัญกว่าการคาดเดาทิศทางตลาด
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0e14]/95 backdrop-blur-xl border-t border-[#1e2638] px-2 py-1.5 flex justify-around items-center">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-emerald-400 font-extrabold'
                  : 'text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
