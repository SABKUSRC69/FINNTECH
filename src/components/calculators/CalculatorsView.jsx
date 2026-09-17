import React, { useState } from 'react'
import { Calculator, TrendingUp, Home, Sun } from 'lucide-react'
import CompoundInterestCalc from './CompoundInterestCalc'
import LoanCalc from './LoanCalc'
import RetirementCalc from './RetirementCalc'

export default function CalculatorsView() {
  const [activeCalc, setActiveCalc] = useState('compound') // 'compound' | 'loan' | 'retirement'

  const calcTabs = [
    {
      id: 'compound',
      label: 'ดอกเบี้ยทบต้น (Compound Interest)',
      sub: 'วางแผนออมเงินและสร้างพอร์ต',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      id: 'loan',
      label: 'คำนวณสินเชื่อ / ผ่อนบ้าน-รถ (Loan EMI)',
      sub: 'วางแผนค่างวดและตัดดอกเบี้ย',
      icon: Home,
      color: 'cyan',
    },
    {
      id: 'retirement',
      label: 'วางแผนเกษียณอายุ (Retirement)',
      sub: 'เป้าหมายเงินก้อนเพื่ออิสรภาพ',
      icon: Sun,
      color: 'amber',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
          <Calculator className="w-7 h-7 text-emerald-500" />
          <span>ศูนย์รวมเครื่องมือคำนวณการเงิน (Smart Financial Calculators)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          วางแผนการเงินรอบด้านด้วยแบบจำลองมาตรฐาน คำนวณผลตอบแทน ดอกเบี้ย และแผนเกษียณอายุ
        </p>
      </div>

      {/* Calculator Tab Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {calcTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeCalc === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCalc(tab.id)}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 flex items-center space-x-3.5 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                  : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {tab.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {tab.sub}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Render selected calculator */}
      <div className="pt-2">
        {activeCalc === 'compound' && <CompoundInterestCalc />}
        {activeCalc === 'loan' && <LoanCalc />}
        {activeCalc === 'retirement' && <RetirementCalc />}
      </div>

    </div>
  )
}
