import React from 'react'
import { Sun, Moon, RefreshCw, Bell, ShieldCheck, TrendingUp } from 'lucide-react'

export default function Navbar({
  darkMode,
  setDarkMode,
  onResetData,
  onLoadSampleData,
  currentUser,
  onOpenAuthModal,
  onOpenProfileModal,
}) {
  const initials = currentUser
    ? (currentUser.name || 'FT')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'FT'

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c1017]/85 backdrop-blur-xl transition-colors">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-slate-950 font-bold">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
              FINNTECH
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tracking-wider">
              PRO
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Reset / Clear Data Button */}
          <button
            onClick={() => {
              if (window.confirm('⚠️ คุณต้องการล้างข้อมูลทั้งหมดของบัญชีนี้ (รายรับ-รายจ่าย, พอร์ต, ประวัติการเทรด) ให้กลับเป็น 0 สะอาดหมดจดหรือไม่?')) {
                onResetData()
                alert('✅ ล้างข้อมูลทั้งหมดให้เป็น 0 เรียบร้อยแล้ว')
              }
            }}
            title="ล้างข้อมูลบัญชีนี้ให้เป็น 0"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Profile pill or Login button */}
          {currentUser ? (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center space-x-2.5 py-1 px-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800/80 cursor-pointer ml-1"
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${currentUser.avatarColor || 'from-emerald-500 to-teal-500'} text-white flex items-center justify-center font-bold text-xs shadow-sm`}>
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px] leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {currentUser.tier || 'PRO TIER'}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all ml-1 cursor-pointer"
            >
              เข้าสู่ระบบ / สมัคร
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
