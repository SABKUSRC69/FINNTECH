import React, { useState } from 'react'
import { X, ShieldCheck, User, Mail, Calendar, Award, LogOut, Edit3, Check, Copy, Wallet, Layers, Trash2, RefreshCw, Sparkles, Receipt, PieChart } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

export default function UserProfileModal(props) {
  if (!props.isOpen || !props.currentUser) return null
  return <UserProfileModalContent {...props} />
}

function UserProfileModalContent({
  isOpen,
  onClose,
  currentUser,
  balance,
  positionsCount,
  tradesCount,
  transactionsCount = 0,
  portfolioCount = 0,
  onUpdateName,
  onClearAllData,
  onLoadSampleData,
  onLogout,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [nameInput, setNameInput] = useState(currentUser.name || '')
  const [copiedUID, setCopiedUID] = useState(false)

  const handleSaveName = (e) => {
    e.preventDefault()
    if (nameInput.trim()) {
      onUpdateName(nameInput.trim())
      setIsEditing(false)
    }
  }

  const handleCopyUID = () => {
    navigator.clipboard.writeText(currentUser.id)
    setCopiedUID(true)
    setTimeout(() => setCopiedUID(false), 2000)
  }

  const initials = (currentUser.name || 'FT')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-base tracking-tight text-white">
              ข้อมูลบัญชีผู้ใช้งาน (User Profile)
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-6 space-y-5">
          
          {/* Top Avatar & Name Info */}
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-emerald-500 to-teal-600'} text-white flex items-center justify-center font-extrabold text-xl shadow-lg shrink-0`}>
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <form onSubmit={handleSaveName} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button type="submit" className="p-1.5 rounded-lg bg-emerald-500 text-slate-950">
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-lg text-white truncate">
                    {currentUser.name}
                  </h3>
                  <button
                    onClick={() => { setIsEditing(true); setNameInput(currentUser.name) }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-400 truncate mt-0.5">
                {currentUser.email}
              </p>

              <div className="flex items-center space-x-2 mt-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{currentUser.tier || 'DEMO PROFILE'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Local Profile
                </span>
              </div>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <span>UID บัญชี:</span>
              </span>
              <button
                onClick={handleCopyUID}
                className="flex items-center space-x-1 text-slate-300 hover:text-white"
              >
                <span>{currentUser.id}</span>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                {copiedUID && <span className="text-[10px] text-emerald-400">คัดลอกแล้ว!</span>}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">วันที่ลงทะเบียน:</span>
              <span className="text-slate-300">{currentUser.createdAt || '2026-09-17'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">โหมดจัดเก็บ:</span>
              <span className="text-emerald-400 font-bold">🟢 LocalStorage (Demo Mode)</span>
            </div>
          </div>

          {/* Stats strip (4-Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400">รายรับ-รายจ่าย</div>
              <div className="font-bold text-emerald-400 mt-0.5">{transactionsCount} รายการ</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400">พอร์ตสินทรัพย์</div>
              <div className="font-bold text-cyan-400 mt-0.5">{portfolioCount} รายการ</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400">สัญญาเทรดเปิดอยู่</div>
              <div className="font-bold text-amber-400 mt-0.5">{positionsCount} สัญญา</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400">เงินเทรดจำลอง</div>
              <div className="font-bold text-white mt-0.5 truncate">฿{formatCurrency(balance, false)}</div>
            </div>
          </div>

          {/* Account Data Management Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (window.confirm('⚠️ คุณต้องการล้างข้อมูลทั้งหมดของบัญชีนี้ (รายรับ-รายจ่าย, สินทรัพย์พอร์ต, ประวัติการเทรด) ให้กลับเป็น 0 สะอาดหมดจดทันทีหรือไม่?')) {
                  if (onClearAllData) onClearAllData()
                  alert('✅ ล้างข้อมูลทั้งหมดของบัญชีเรียบร้อยแล้ว')
                  onClose()
                }
              }}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>ล้างข้อมูลบัญชีนี้ทั้งหมดให้เป็น 0 (Clear All Data)</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('คุณต้องการโหลดชุดข้อมูลตัวอย่าง (Sample Demo) เพื่อทดสอบระบบหรือไม่?')) {
                  if (onLoadSampleData) onLoadSampleData()
                  alert('✅ โหลดชุดข้อมูลตัวอย่างสำเร็จ')
                  onClose()
                }
              }}
              className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-700/60 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>โหลดข้อมูลตัวอย่างสำหรับทดลองระบบ (Load Demo)</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="pt-1">
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                  onLogout()
                  onClose()
                }
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ (Sign Out)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
