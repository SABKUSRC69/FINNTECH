import React, { useState, useMemo } from 'react'
import { Sun, Heart, Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function RetirementCalc() {
  const [currentAge, setCurrentAge] = useState(30)
  const [retirementAge, setRetirementAge] = useState(60)
  const [lifeExpectancy, setLifeExpectancy] = useState(85)
  const [monthlyExpenseToday, setMonthlyExpenseToday] = useState(30000)
  const [currentSavings, setCurrentSavings] = useState(250000)
  const [inflationRate, setInflationRate] = useState(3.0) // 3%
  const [returnRate, setReturnRate] = useState(7.0) // 7% annual return before retirement

  const {
    yearsToRetire,
    retirementYears,
    futureMonthlyExpense,
    totalCorpusNeeded,
    futureValueOfCurrentSavings,
    monthlySavingsNeeded
  } = useMemo(() => {
    const yToRetire = Math.max(1, retirementAge - currentAge)
    const yInRetire = Math.max(1, lifeExpectancy - retirementAge)

    // Future monthly expense at retirement age adjusted for inflation: FV = PV * (1 + inf)^years
    const inflationMultiplier = Math.pow(1 + inflationRate / 100, yToRetire)
    const futureMonthly = monthlyExpenseToday * inflationMultiplier

    // Total Corpus Needed = Future Annual Expense * Years in Retirement (conservative assumption)
    // To be realistic and resilient, corpus needed covers the retirement span assuming conservative post-retirement return matches inflation
    const totalCorpus = futureMonthly * 12 * yInRetire

    // Future Value of current savings at retirement
    const rPre = returnRate / 100
    const fvCurrentSavings = currentSavings * Math.pow(1 + rPre, yToRetire)

    // Shortfall
    const shortfall = Math.max(0, totalCorpus - fvCurrentSavings)

    // Monthly savings needed to accumulate shortfall: PMT formula
    const rMonthly = rPre / 12
    const totalMonths = yToRetire * 12

    let monthlySaving = 0
    if (rMonthly > 0) {
      monthlySaving = shortfall * (rMonthly / (Math.pow(1 + rMonthly, totalMonths) - 1))
    } else {
      monthlySaving = shortfall / totalMonths
    }

    return {
      yearsToRetire: yToRetire,
      retirementYears: yInRetire,
      futureMonthlyExpense: Math.round(futureMonthly),
      totalCorpusNeeded: Math.round(totalCorpus),
      futureValueOfCurrentSavings: Math.round(fvCurrentSavings),
      monthlySavingsNeeded: Math.round(monthlySaving),
    }
  }, [currentAge, retirementAge, lifeExpectancy, monthlyExpenseToday, currentSavings, inflationRate, returnRate])

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs sm:text-sm flex items-start space-x-3">
        <Sun className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="font-semibold">วางแผนการเงินเพื่อการเกษียณอย่างมั่นคง (Retirement Planning)</strong>
          : คำนวณเงินก้อนที่ต้องเตรียมไว้ใช้ชีวิตหลังเกษียณ พร้อมปรับอัตราเงินเฟ้อ เพื่อให้รู้ว่าควรเริ่มออมและลงทุนเดือนละเท่าใดตั้งแต่วันนี้
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Inputs (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            ข้อมูลส่วนบุคคลและเป้าหมาย
          </h3>

          {/* Age Sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <label className="text-slate-500">อายุปัจจุบัน</label>
                <span className="font-bold text-slate-900 dark:text-white">{currentAge} ปี</span>
              </div>
              <input
                type="range"
                min="18"
                max="65"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <label className="text-slate-500">อายุเกษียณ</label>
                <span className="font-bold text-slate-900 dark:text-white">{retirementAge} ปี</span>
              </div>
              <input
                type="range"
                min={currentAge + 1}
                max="75"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Life Expectancy */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <label className="text-slate-600 dark:text-slate-400">คาดว่าจะมีชีวิตอยู่ถึงอายุ (ปี)</label>
              <span className="font-bold text-cyan-500">{lifeExpectancy} ปี (ใช้ชีวิตหลังเกษียณ {retirementYears} ปี)</span>
            </div>
            <input
              type="range"
              min={retirementAge + 1}
              max="100"
              value={lifeExpectancy}
              onChange={(e) => setLifeExpectancy(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Monthly expense wanted */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <label className="text-slate-600 dark:text-slate-400">ค่าใช้จ่ายต่อเดือนที่ต้องการหลังเกษียณ (มูลค่าเงินวันนี้)</label>
              <span className="font-bold text-emerald-500">{formatCurrency(monthlyExpenseToday, false)}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="200000"
              step="2000"
              value={monthlyExpenseToday}
              onChange={(e) => setMonthlyExpenseToday(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Current savings */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <label className="text-slate-600 dark:text-slate-400">เงินเก็บเพื่อเกษียณที่มีอยู่แล้ว</label>
              <span className="font-bold text-violet-500">{formatCurrency(currentSavings, false)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3000000"
              step="25000"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          {/* Economic assumptions */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">อัตราเงินเฟ้อ (%/ปี)</label>
              <input
                type="number"
                step="0.1"
                value={inflationRate}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">ผลตอบแทนลงทุน (%/ปี)</label>
              <input
                type="number"
                step="0.5"
                value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

        </div>

        {/* Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Target Nest Egg Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl shadow-amber-600/20">
            <div className="text-xs font-semibold text-amber-100 uppercase tracking-wider">
              เป้าหมายเงินก้อนที่ต้องมี ณ วันเกษียณ (Total Corpus)
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold mt-1">
              {formatCurrency(totalCorpusNeeded, false)}
            </div>
            <div className="text-xs text-amber-100 mt-2">
              เพื่อรองรับค่าใช้จ่าย {formatCurrency(futureMonthlyExpense, false)} / เดือน (หลังคิดเงินเฟ้อ {inflationRate}%) นาน {retirementYears} ปี
            </div>
          </div>

          {/* Monthly Savings Required Highlight */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                จำนวนเงินที่ควรเริ่มออม/ลงทุนต่อเดือน (DCA)
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-0.5">
                {formatCurrency(monthlySavingsNeeded, false)}
                <span className="text-xs font-normal text-slate-400"> / เดือน</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                เริ่มออมตั้งแต่วันนี้ และสร้างผลตอบแทนเฉลี่ย {returnRate}% ต่อปี
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Target className="w-8 h-8" />
            </div>
          </div>

          {/* Detail Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-[11px] text-slate-400 font-medium">ระยะเวลาสะสมเงินที่เหลือ</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {yearsToRetire} ปี ({yearsToRetire * 12} เดือน)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                ยิ่งเริ่มเร็วยิ่งเหนื่อยน้อยลง
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="text-[11px] text-slate-400 font-medium">มูลค่าเงินเก็บเดิมเมื่อถึงวันเกษียณ</div>
              <div className="text-xl font-bold text-cyan-500 mt-1">
                {formatCurrency(futureValueOfCurrentSavings, false)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                โตจากเงินต้นเดิม {formatCurrency(currentSavings, false)}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
