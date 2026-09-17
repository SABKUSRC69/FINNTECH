import React from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Zap } from 'lucide-react'

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || toast.type === 'profit'
        const isError = toast.type === 'error' || toast.type === 'loss'
        const isWarning = toast.type === 'warning'

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-top-3 fade-in duration-300 transition-all ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                : isError
                ? 'bg-slate-900/95 border-rose-500/50 text-white ring-1 ring-rose-500/30'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                : 'bg-slate-900/95 border-slate-700 text-white'
            }`}
          >
            {/* Icon */}
            <div className={`p-1.5 rounded-xl shrink-0 ${
              isSuccess
                ? 'bg-emerald-500/20 text-emerald-400'
                : isError
                ? 'bg-rose-500/20 text-rose-400'
                : isWarning
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              {isSuccess && <CheckCircle2 className="w-5 h-5" />}
              {isError && <XCircle className="w-5 h-5" />}
              {isWarning && <AlertTriangle className="w-5 h-5" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight mb-0.5">
                {toast.title}
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                {toast.message}
              </div>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
