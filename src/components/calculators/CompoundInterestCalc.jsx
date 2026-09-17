import React, { useState, useMemo } from 'react'
import { Sparkles, TrendingUp, PiggyBank, DollarSign } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function CompoundInterestCalc() {
  const [initialAmount, setInitialAmount] = useState(50000)
  const [monthlyDeposit, setMonthlyDeposit] = useState(5000)
  const [annualRate, setAnnualRate] = useState(8) // 8% per year
  const [years, setYears] = useState(10)

  // Calculate year-by-year compounding growth
  const { chartData, totalPrincipal, totalInterest, finalAmount } = useMemo(() => {
    const r = annualRate / 100 / 12 // monthly rate
    let currentBalance = initialAmount
    let currentPrincipal = initialAmount
    const data = []

    data.push({
      year: 'ปีที่ 0',
      principal: Math.round(currentPrincipal),
      interest: 0,
      total: Math.round(currentBalance),
    })

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        currentBalance = (currentBalance + monthlyDeposit) * (1 + r)
        currentPrincipal += monthlyDeposit
      }
      const interestEarned = Math.max(0, currentBalance - currentPrincipal)
      data.push({
        year: `ปีที่ ${y}`,
        principal: Math.round(currentPrincipal),
        interest: Math.round(interestEarned),
        total: Math.round(currentBalance),
      })
    }

    const totalInt = Math.max(0, currentBalance - currentPrincipal)

    return {
      chartData: data,
      totalPrincipal: Math.round(currentPrincipal),
      totalInterest: Math.round(totalInt),
      finalAmount: Math.round(currentBalance),
    }
  }, [initialAmount, monthlyDeposit, annualRate, years])

  return (
    <div className="space-y-6">
      
      {/* Title & info banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm leading-relaxed flex items-start space-x-3">
        <Sparkles className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
        <div>
          <strong className="font-semibold">พลังของดอกเบี้ยทบต้น (Compound Interest)</strong>:
          "ดอกเบี้ยทบต้นคือสิ่งมหัศจรรย์อันดับ 8 ของโลก ผู้ที่เข้าใจจะได้รับมัน ผู้ที่ไม่เข้าใจจะต้องจ่ายมัน"
          ดูพลังของการลงทุนสม่ำเสมอในระยะยาว
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Parameters Form (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            กำหนดแผนการออมและการลงทุน
          </h3>

          {/* Initial Deposit */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <label className="text-slate-600 dark:text-slate-400">เงินลงทุนเริ่มต้น (บาท)</label>
              <span className="font-bold text-emerald-500">{formatCurrency(initialAmount, false)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="mt-1">
              <input
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Monthly Contribution */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <label className="text-slate-600 dark:text-slate-400">เงินออมเพิ่มต่อเดือน (DCA)</label>
              <span className="font-bold text-emerald-500">{formatCurrency(monthlyDeposit, false)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={monthlyDeposit}
              onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="mt-1">
              <input
                type="number"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Annual Return Rate */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <label className="text-slate-600 dark:text-slate-400">อัตราผลตอบแทนคาดหวังต่อปี (% ต่อปี)</label>
              <span className="font-bold text-cyan-500">{annualRate}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>ฝากประจำ ~2%</span>
              <span>กองทุนรวม ~7-8%</span>
              <span>หุ้น ~10-12%</span>
            </div>
          </div>

          {/* Investment Horizon Years */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <label className="text-slate-600 dark:text-slate-400">ระยะเวลาลงทุน (ปี)</label>
              <span className="font-bold text-violet-500">{years} ปี</span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
          </div>

        </div>

        {/* Results & Chart (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-[11px] text-slate-400 font-medium">เงินลงทุนทั้งหมด (เงินต้น)</div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                {formatCurrency(totalPrincipal, false)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-[11px] text-emerald-500 font-medium">ดอกเบี้ย/กำไรสะสม</div>
              <div className="text-lg font-bold text-emerald-500 mt-1">
                +{formatCurrency(totalInterest, false)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20">
              <div className="text-[11px] text-emerald-100 font-medium">มูลค่ารวมเมื่อครบกำหนด</div>
              <div className="text-xl font-extrabold mt-1">
                {formatCurrency(finalAmount, false)}
              </div>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              กราฟการเติบโตของพอร์ตสะสม (Growth Chart)
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `฿${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val, name) => [
                      formatCurrency(val),
                      name === 'principal' ? 'เงินต้นสะสม' : name === 'interest' ? 'ผลตอบแทนกำไรสะสม' : 'มูลค่ารวม'
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    formatter={(value) => value === 'principal' ? 'เงินต้นสะสม' : 'กำไรสะสม (ดอกเบี้ยทบต้น)'}
                  />
                  <Area type="monotone" dataKey="principal" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="interest" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
