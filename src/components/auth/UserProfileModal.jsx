import React, { useState } from 'react'
import { X, ShieldCheck, User, Mail, Calendar, Award, LogOut, Edit3, Check, Copy, Wallet, Layers } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  balance,
  positionsCount,
  tradesCount,
  onUpdateName,
  onLogout,
}) {
  if (!isOpen || !currentUser) return null

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
                  <span>{currentUser.tier || 'VIP PRO'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  KYC Verified
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
              <span className="text-slate-400">สถานะระบบ:</span>
              <span className="text-emerald-400 font-bold">🟢 Active & Secured</span>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="text-[10px] text-slate-400">ยอดเงินคงเหลือ</div>
              <div className="font-bold text-emerald-400 mt-0.5 truncate">{formatCurrency(balance, false)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="text-[10px] text-slate-400">สถานะที่เปิด</div>
              <div className="font-bold text-white mt-0.5">{positionsCount} สัญญา</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="text-[10px] text-slate-400">เทรดที่ปิดแล้ว</div>
              <div className="font-bold text-white mt-0.5">{tradesCount} รายการ</div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                  onLogout()
                  onClose()
                }
              }}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center justify-center space-x-2 transition-colors"
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
