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
      label: 'ห้องเทรดสด',
      icon: Activity,
      isLive: true,
    },
    {
      id: 'news',
      label: 'ปฏิทินข่าวเศรษฐกิจ',
      icon: Flame,
    },
    {
      id: 'analytics',
      label: 'สถิติ & ประวัติเทรด',
      icon: BarChart3,
    },
    {
      id: 'dashboard',
      label: 'ภาพรวมการเงิน',
      icon: LayoutDashboard,
    },
    {
      id: 'transactions',
      label: 'บันทึกรายรับ-รายจ่าย',
      icon: ReceiptText,
    },
    {
      id: 'calculators',
      label: 'เครื่องมือคำนวณ',
      icon: Calculator,
    },
    {
      id: 'portfolio',
      label: 'พอร์ตการลงทุน',
      icon: PieChart,
    },
  ]

  // Mobile Bottom Nav Items
  const mobileNavItems = [
    { id: 'trading', label: 'เทรดสด', icon: Activity },
    { id: 'news', label: 'ข่าว', icon: Flame },
    { id: 'analytics', label: 'สถิติ', icon: BarChart3 },
    { id: 'portfolio', label: 'พอร์ต', icon: PieChart },
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  ]

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-[#0c1017] p-3.5 min-h-[calc(100vh-4rem)] transition-colors">
        
        {/* Quick Add Button */}
        <div className="mb-4">
          <button
            onClick={onOpenQuickAdd}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer active:scale-98"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>บันทึกรายการด่วน</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 flex-1">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            เมนูหลัก
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-bold border border-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500 dark:text-emerald-400 stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-xs truncate flex-1">{item.label}</span>
                {item.isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom Security / Tip Note */}
        <div className="mt-auto pt-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>ระบบความปลอดภัย ECN</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              ข้อมูลของคุณได้รับการปกป้องด้วยการเข้ารหัสภายในเครื่อง (100% Local Encrypted)
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 px-2 py-1.5 flex justify-around items-center">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] transition-colors cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
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
