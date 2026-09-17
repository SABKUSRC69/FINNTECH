import React, { useState } from 'react'
import { X, Lock, Mail, User, Eye, EyeOff, CheckCircle2, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react'
import { soundEffects } from '../../utils/soundEffects'

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null

  const [tab, setTab] = useState('login') // 'login' | 'register'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: '' }
    let score = 0
    if (pwd.length >= 6) score++
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 2) return { score: 30, text: 'รหัสผ่านระดับง่าย (Weak)', color: 'bg-rose-500' }
    if (score <= 3) return { score: 65, text: 'รหัสผ่านระดับปานกลาง (Medium)', color: 'bg-amber-500' }
    return { score: 100, text: 'รหัสผ่านระดับปลอดภัยสูง (Strong)', color: 'bg-emerald-500' }
  }

  const pwdStrength = getPasswordStrength(regPassword)

  // Submit Login
  const handleLoginSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    try {
      if (!loginEmail || !loginPassword) {
        setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน')
        return
      }
      onAuthSuccess('login', { email: loginEmail, password: loginPassword })
      soundEffects.playProfitClose()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'เข้าสู่ระบบไม่สำเร็จ')
    }
  }

  // Submit Register
  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    try {
      if (!regName.trim()) {
        setErrorMsg('กรุณาระบุชื่อของคุณ')
        return
      }
      if (!regEmail.trim()) {
        setErrorMsg('กรุณาระบุอีเมล')
        return
      }
      if (regPassword.length < 4) {
        setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร')
        return
      }
      if (regPassword !== regConfirmPassword) {
        setErrorMsg('รหัสผ่านยืนยันไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง')
        return
      }

      onAuthSuccess('register', { name: regName, email: regEmail, password: regPassword })
      soundEffects.playProfitClose()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'สมัครสมาชิกไม่สำเร็จ')
    }
  }

  // 1-Click Demo Login
  const handleDemoLogin = () => {
    setErrorMsg('')
    onAuthSuccess('demo')
    soundEffects.playProfitClose()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100">
        
        {/* Decorative ambient light */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              FINNTECH ID
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 m-5 mb-0 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg('') }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>

          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg('') }}
            className={`py-2.5 rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            สมัครสมาชิกใหม่ (Register)
          </button>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-5 space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">อีเมล (Email)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">รหัสผ่าน (Password)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="ระบุรหัสผ่านของคุณ"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="p-1 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 1-Click Demo Shortcut */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center justify-center space-x-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>ทดลองใช้งานด่วน (One-Click Demo User)</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-5 space-y-3.5 text-xs">
            {/* Welcome Bonus Notice */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>สมัครวันนี้ รับฟรีวงเงินเทรดจำลอง <strong>฿500,000</strong> เข้าพอร์ตทันที!</span>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">ชื่อผู้ใช้งาน (Display Name) *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="เช่น Satoshi Trader"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">อีเมล (Email) *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">ตั้งรหัสผ่าน (Password) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="อย่างน้อย 4 ตัวอักษร"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="p-1 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {regPassword && (
                <div className="mt-2 space-y-1">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${pwdStrength.color}`} style={{ width: `${pwdStrength.score}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-400">{pwdStrength.text}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">ยืนยันรหัสผ่าน (Confirm Password) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95 mt-2"
            >
              <span>ยืนยันการสมัครสมาชิก</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
