import React from 'react'
import { Sun, Moon, RefreshCw, Bell, ShieldCheck, TrendingUp } from 'lucide-react'

export default function Navbar({
  darkMode,
  setDarkMode,
  onResetData,
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
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-[#1e2638] bg-white/90 dark:bg-[#121721]/90 backdrop-blur-xl transition-colors">
      <div className="max-w-[1680px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl tracking-wider">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                FINNTECH
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Smart Financial Intelligence Platform
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Security badge */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ระบบเก็บข้อมูลปลอดภัย (Local Secured)</span>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างหรือไม่?')) {
                onResetData()
              }
            }}
            title="รีเซ็ตข้อมูลตัวอย่าง"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Profile pill or Login button */}
          {currentUser ? (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-85 transition-opacity"
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentUser.avatarColor || 'from-emerald-500 to-cyan-500'} text-white flex items-center justify-center font-bold text-xs shadow-sm`}>
                {initials}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {currentUser.tier || 'PRO TIER'}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-600 transition-all ml-2"
            >
              เข้าสู่ระบบ / สมัคร
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
