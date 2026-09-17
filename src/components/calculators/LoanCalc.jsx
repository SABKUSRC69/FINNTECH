import React, { useState, useMemo } from 'react'
import { Home, Landmark, Calculator, Percent } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function LoanCalc() {
  const [loanAmount, setLoanAmount] = useState(2500000)
  const [interestRate, setInterestRate] = useState(4.25)
  const [loanYears, setLoanYears] = useState(30)

  // Calculate Loan EMI & Amortization
  const { monthlyPayment, totalPayment, totalInterest, schedule } = useMemo(() => {
    const P = loanAmount
    const r = interestRate / 100 / 12
    const n = loanYears * 12

    let monthly = 0
    if (r === 0) {
      monthly = P / n
    } else {
      monthly = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    }

    const totalPay = monthly * n
    const totalInt = totalPay - P

    // Generate yearly breakdown schedule
    let remainingBalance = P
    const yearlySchedule = []

    for (let y = 1; y <= loanYears; y++) {
      let yearlyPrincipal = 0
      let yearlyInterest = 0

      for (let m = 1; m <= 12; m++) {
        if (remainingBalance <= 0) break
        const interestForMonth = remainingBalance * r
        const principalForMonth = Math.min(remainingBalance, monthly - interestForMonth)
        yearlyInterest += interestForMonth
        yearlyPrincipal += principalForMonth
        remainingBalance -= principalForMonth
      }

      yearlySchedule.push({
        year: y,
        principalPaid: Math.round(yearlyPrincipal),
        interestPaid: Math.round(yearlyInterest),
        remainingBalance: Math.max(0, Math.round(remainingBalance)),
      })
    }

    return {
      monthlyPayment: Math.round(monthly),
      totalPayment: Math.round(totalPay),
      totalInterest: Math.round(totalInt),
      schedule: yearlySchedule,
    }
  }, [loanAmount, interestRate, loanYears])

  const principalPercent = totalPayment > 0 ? ((loanAmount / totalPayment) * 100).toFixed(1) : 0
  const interestPercent = totalPayment > 0 ? ((totalInterest / totalPayment) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs sm:text-sm flex items-start space-x-3">
        <Home className="w-5 h-5 shrink-0 text-cyan-500 mt-0.5" />
        <div>
          <strong className="font-semibold">เครื่องมือคำนวณสินเชื่อบ้าน สินเชื่อรถ และเงินกู้ (Loan EMI Calculator)</strong>
          : ช่วยคำนวณค่างวดผ่อนชำระต่อเดือน พร้อมตารางตัดเงินต้นและดอกเบี้ย ช่วยวางแผนโปะหนี้เพื่อประหยัดดอกเบี้ย
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Inputs (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            ข้อมูลสินเชื่อและเงินกู้
          </h3>

          {/* Loan Amount */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <label className="text-slate-600 dark:text-slate-400">วงเงินกู้ (บาท)</label>
              <span className="font-bold text-cyan-500">{formatCurrency(loanAmount, false)}</span>
            </div>
            <input
              type="range"
              min="100000"
              max="20000000"
              step="50000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="mt-1">
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Math.max(1000, Number(e.target.value)))}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <label className="text-slate-600 dark:text-slate-400">อัตราดอกเบี้ยต่อปี (% ต่อปี)</label>
              <span className="font-bold text-rose-500">{interestRate}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="18"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Loan Duration */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <label className="text-slate-600 dark:text-slate-400">ระยะเวลากู้ (ปี)</label>
              <span className="font-bold text-indigo-500">{loanYears} ปี ({loanYears * 12} งวด)</span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              step="1"
              value={loanYears}
              onChange={(e) => setLoanYears(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Loan type presets */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              ตัวอย่างสินเชื่อทั่วไป:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setLoanAmount(3000000); setInterestRate(4.2); setLoanYears(30); }}
                className="p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                🏠 สินเชื่อบ้าน 3M
              </button>
              <button
                onClick={() => { setLoanAmount(800000); setInterestRate(3.0); setLoanYears(5); }}
                className="p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                🚗 สินเชื่อรถ 800k
              </button>
              <button
                onClick={() => { setLoanAmount(150000); setInterestRate(9.5); setLoanYears(3); }}
                className="p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                💼 สินเชื่อบุคคล
              </button>
            </div>
          </div>
        </div>

        {/* Results & Amortization (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Monthly Payment Hero Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-xl shadow-cyan-500/20">
            <div className="text-xs font-semibold text-cyan-100 uppercase tracking-wider">
              ค่างวดที่ต้องผ่อนชำระต่อเดือน (EMI)
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold mt-1">
              {formatCurrency(monthlyPayment, false)}
              <span className="text-base font-normal text-cyan-100"> / เดือน</span>
            </div>
            <div className="text-xs text-cyan-100 mt-2 flex items-center space-x-2">
              <span>รวมระยะเวลาผ่อน {loanYears * 12} เดือน</span>
              <span>•</span>
              <span>เงินต้น {formatCurrency(loanAmount, false)}</span>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-[11px] text-rose-500 font-medium">ดอกเบี้ยจ่ายรวมทั้งหมด</div>
              <div className="text-xl font-bold text-rose-500 mt-1">
                {formatCurrency(totalInterest, false)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                คิดเป็น {interestPercent}% ของยอดชำระทั้งหมด
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-[11px] text-slate-400 font-medium">ยอดชำระรวม (เงินต้น + ดอกเบี้ย)</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {formatCurrency(totalPayment, false)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                เงินต้น {principalPercent}%
              </div>
            </div>
          </div>

          {/* Visual Percentage Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-cyan-500">เงินต้น: {principalPercent}%</span>
              <span className="text-rose-500">ดอกเบี้ย: {interestPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
              <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${principalPercent}%` }} />
              <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${interestPercent}%` }} />
            </div>
          </div>

          {/* Amortization Table Summary (First 5 years & 10, 20, 30) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                ตารางตัดเงินต้นและดอกเบี้ยรายปี (Amortization)
              </h4>
              <span className="text-[11px] text-slate-400">หน่วย: บาท</span>
            </div>

            <div className="max-h-56 overflow-y-auto pr-1">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="py-2">ปีที่</th>
                    <th className="py-2 text-right">ตัดเงินต้น</th>
                    <th className="py-2 text-right">ตัดดอกเบี้ย</th>
                    <th className="py-2 text-right">เงินต้นคงเหลือ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {schedule.slice(0, 10).map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2 font-medium text-slate-700 dark:text-slate-300">
                        ปีที่ {row.year}
                      </td>
                      <td className="py-2 text-right text-emerald-500 font-semibold">
                        {formatNumber(row.principalPaid)}
                      </td>
                      <td className="py-2 text-right text-rose-500 font-semibold">
                        {formatNumber(row.interestPaid)}
                      </td>
                      <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                        {formatNumber(row.remainingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
