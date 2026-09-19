import React from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('FINNTECH Uncaught Error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleClearCacheAndReload = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลและโหลดหน้าเว็บใหม่หรือไม่?')) {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        console.error('Failed to clear storage', e)
      }
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-slate-200 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#0d121d] border border-rose-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl text-center backdrop-blur-sm">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">
              เกิดข้อผิดพลาดที่ไม่คาดคิด
            </h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              ระบบตรวจพบข้อผิดพลาดขณะแสดงผลหน้าเว็บ ข้อมูลของคุณยังปลอดภัย สามารถกดปุ่มรีโหลดเพื่อเปิดใหม่อีกครั้ง
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                รีโหลดหน้าเว็บ (Reload)
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 text-xs font-medium rounded-xl flex items-center justify-center gap-2 border border-slate-700/50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                ล้างข้อมูลแคชและเริ่มใหม่
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
