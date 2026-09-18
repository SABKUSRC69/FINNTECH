import React, { useState } from 'react'
import { formatCurrency, formatPercent, formatNumber, calculatePips, formatPips } from '../../utils/formatters'
import { soundEffects } from '../../utils/soundEffects'
import { Layers, History, XCircle, CheckCircle2, TrendingUp, TrendingDown, Target, ShieldCheck } from 'lucide-react'

export default function PositionsTable({
  positions,
  limitOrders = [],
  tradeHistory = [],
  currentPrices,
  onClosePosition,
  onCloseAllPositions,
  onCancelLimitOrder,
}) {
  const [activeTab, setActiveTab] = useState('positions') // 'positions' | 'limit' | 'history'

  // Calculate dynamic PnL and Pips based on live prices
  const enrichedPositions = positions.map((pos) => {
    const livePrice = currentPrices[pos.symbol] || pos.markPrice
    const isLong = pos.side === 'LONG'
    
    // Price ratio difference
    const priceDiffRatio = isLong
      ? (livePrice - pos.entryPrice) / pos.entryPrice
      : (pos.entryPrice - livePrice) / pos.entryPrice

    const pnl = priceDiffRatio * pos.leverage * pos.amount
    const pnlPercent = (pnl / pos.amount) * 100
    const pips = calculatePips(pos.entryPrice, livePrice, pos.side, pos.symbol)

    return {
      ...pos,
      markPrice: livePrice,
      pnl: Math.round(pnl),
      pnlPercent,
      pips,
      isProfit: pnl >= 0,
    }
  })

  const totalUnrealizedPnL = enrichedPositions.reduce((sum, p) => sum + p.pnl, 0)

  const handleManualClose = (posId, pnl) => {
    if (pnl >= 0) {
      soundEffects.playProfitClose()
    } else {
      soundEffects.playLossClose()
    }
    onClosePosition(posId, pnl)
  }

  return (
    <div className="bg-[#121721] border border-[#1e2638] rounded-3xl p-4 sm:p-5 shadow-xl overflow-hidden flex flex-col font-mono text-xs">
      
      {/* Tab Switcher & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1e2638] mb-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'positions'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>สัญญาเปิด ({positions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('limit')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'limit'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>คำสั่งรอเปิด ({limitOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติ ({tradeHistory.length})</span>
          </button>
        </div>

        {activeTab === 'positions' && positions.length > 0 && (
          <div className="flex items-center space-x-3">
            <div className="text-xs hidden sm:block">
              <span className="text-slate-400">กำไร/ขาดทุนรวม: </span>
              <span className={`font-bold ${totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalUnrealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnL, false)}
              </span>
            </div>

            <button
              onClick={() => {
                if (window.confirm('คุณต้องการปิดทุกสถานะที่เปิดอยู่พร้อมกันหรือไม่?')) {
                  soundEffects.playProfitClose()
                  onCloseAllPositions()
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 transition-colors text-[11px]"
            >
              ปิดทุกออเดอร์ (Close All)
            </button>
          </div>
        )}
      </div>

      {/* Positions Tab Table */}
      {activeTab === 'positions' && (
        positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2638] text-slate-400 text-[10px] uppercase font-bold">
                  <th className="py-2.5 px-3">คู่เทรด / ด้าน</th>
                  <th className="py-2.5 px-3">ขนาด (Size)</th>
                  <th className="py-2.5 px-3 text-right">ราคาเข้า (Entry)</th>
                  <th className="py-2.5 px-3 text-right">ราคาตลาด (Mark)</th>
                  <th className="py-2.5 px-3 text-center">TP / SL</th>
                  <th className="py-2.5 px-3 text-right">หลักประกัน (Margin)</th>
                  <th className="py-2.5 px-3 text-right">กำไร/ขาดทุน (P&L)</th>
                  <th className="py-2.5 px-3 text-center">ปิดออเดอร์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/60 text-[11px]">
                {enrichedPositions.map((pos) => {
                  const isLong = pos.side === 'LONG'
                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Symbol & Side */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{pos.symbol}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                            isLong
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {pos.side} {pos.leverage}x
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {pos.openedAt}
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {pos.size} {pos.symbol.split('/')[0]}
                      </td>

                      {/* Entry Price */}
                      <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                        ${formatNumber(pos.entryPrice, 2)}
                      </td>

                      {/* Mark Price */}
                      <td className="py-3 px-3 text-right font-semibold text-white whitespace-nowrap">
                        ${formatNumber(pos.markPrice, 2)}
                      </td>

                      {/* TP / SL Column */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center space-y-0.5 text-[10px]">
                          {pos.tpPrice ? (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              TP: ${formatNumber(pos.tpPrice, 2)}
                            </span>
                          ) : (
                            <span className="text-slate-600">TP: --</span>
                          )}
                          {pos.slPrice ? (
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              SL: ${formatNumber(pos.slPrice, 2)}
                            </span>
                          ) : (
                            <span className="text-slate-600">SL: --</span>
                          )}
                        </div>
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap">
                        {formatCurrency(pos.amount, false)}
                      </td>

                      {/* PnL Live */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold text-xs ${pos.isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.isProfit ? '+' : ''}{formatCurrency(pos.pnl, false)}
                        </div>
                        <div className="flex items-center justify-end space-x-1 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            pos.isProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {formatPips(pos.pips)}
                          </span>
                          <span className={`text-[10px] font-semibold ${pos.isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ({pos.isProfit ? '+' : ''}{formatPercent(pos.pnlPercent)})
                          </span>
                        </div>
                      </td>

                      {/* Close Button */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleManualClose(pos.id, pos.pnl)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold text-[10px] border border-slate-700 transition-all active:scale-95"
                        >
                          Market Close
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <div className="text-sm font-semibold text-slate-300">
              ยังไม่มีสถานะออเดอร์ที่เปิดอยู่
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ส่งคำสั่ง Buy (Long) หรือ Sell (Short) จากแผงคำสั่งเพื่อเริ่มต้นเทรดจำลอง
            </p>
          </div>
        )
      )}

      {/* Limit Orders Tab Table */}
      {activeTab === 'limit' && (
        limitOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2638] text-slate-400 text-[10px] uppercase font-bold">
                  <th className="py-2.5 px-3">คู่เทรด / ด้าน</th>
                  <th className="py-2.5 px-3">ประเภท</th>
                  <th className="py-2.5 px-3 text-right">ราคาเป้าหมาย (Trigger)</th>
                  <th className="py-2.5 px-3 text-right">ราคาตลาด (Market)</th>
                  <th className="py-2.5 px-3 text-right">หลักประกัน</th>
                  <th className="py-2.5 px-3 text-center">ยกเลิก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/60 text-[11px]">
                {limitOrders.map((ord) => {
                  const livePrice = currentPrices[ord.symbol] || ord.markPrice
                  const isLong = ord.side === 'LONG'

                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{ord.symbol}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                            isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {ord.side} {ord.leverage}x
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{ord.openedAt}</div>
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-bold">Limit Order</td>
                      <td className="py-3 px-3 text-right font-bold text-amber-300">${formatNumber(ord.targetPrice, 2)}</td>
                      <td className="py-3 px-3 text-right text-slate-300">${formatNumber(livePrice, 2)}</td>
                      <td className="py-3 px-3 text-right text-slate-300">{formatCurrency(ord.amount, false)}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onCancelLimitOrder && onCancelLimitOrder(ord.id)}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300 font-bold text-[10px] border border-slate-700 transition-all active:scale-95"
                        >
                          ยกเลิกคำสั่ง
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
            <div className="text-sm font-semibold text-slate-300">ไม่มีคำสั่ง Limit Order รอเปิด</div>
            <p className="text-xs text-slate-500 mt-1">เลือกประเภทคำสั่งเป็น "Limit" ในแผงส่งคำสั่งเพื่อตั้งราคารอเปิดสัญญา</p>
          </div>
        )
      )}

      {/* Trade History Tab Table */}
      {activeTab === 'history' && (
        tradeHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2638] text-slate-400 text-[10px] uppercase font-bold">
                  <th className="py-2.5 px-3">คู่เทรด</th>
                  <th className="py-2.5 px-3">ฝั่ง</th>
                  <th className="py-2.5 px-3 text-right">เงินต้น Margin</th>
                  <th className="py-2.5 px-3 text-right">กำไร/ขาดทุนสุทธิ (Realized)</th>
                  <th className="py-2.5 px-3 text-right">เวลาที่ปิด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/60 text-[11px]">
                {tradeHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {item.symbol}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.side === 'LONG' ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
                      }`}>
                        {item.side} {item.leverage}x
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(item.amount, false)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl, false)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {item.closedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <div className="text-sm font-semibold text-slate-300">
              ยังไม่มีประวัติการปิดออเดอร์
            </div>
          </div>
        )
      )}

    </div>
  )
}
