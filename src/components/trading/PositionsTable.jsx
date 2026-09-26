import React, { useState } from 'react'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { Layers, History, Target, XCircle, Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react'

export default function PositionsTable({
  spotBalances = {},
  openOrders = [],
  tradeHistory = [],
  currentPrices = {},
  onCancelOpenOrder,
  onSelectSymbol,
  limitOrders = [],
}) {
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'balances' | 'history'

  // Combine limitOrders and openOrders
  const allOpenOrders = openOrders.length > 0 ? openOrders : limitOrders

  // Crypto asset metadata
  const assetMetadata = {
    THB: { name: 'บาทไทย (Cash)', symbol: 'THB', isFiat: true, pairSymbol: 'BTC/THB' },
    BTC: { name: 'Bitcoin', symbol: 'BTC', pairSymbol: 'BTC/THB' },
    ETH: { name: 'Ethereum', symbol: 'ETH', pairSymbol: 'ETH/THB' },
    SOL: { name: 'Solana', symbol: 'SOL', pairSymbol: 'SOL/THB' },
    USDT: { name: 'Tether USD', symbol: 'USDT', pairSymbol: 'USDT/THB' },
    BNB: { name: 'BNB', symbol: 'BNB', pairSymbol: 'BNB/THB' },
    XRP: { name: 'Ripple', symbol: 'XRP', pairSymbol: 'XRP/THB' },
    DOGE: { name: 'Dogecoin', symbol: 'DOGE', pairSymbol: 'DOGE/THB' },
  }

  // Calculate asset valuation in THB
  const assetsList = Object.keys(spotBalances).map((key) => {
    const amount = spotBalances[key] || 0
    const meta = assetMetadata[key] || { name: key, symbol: key, pairSymbol: `${key}/THB` }
    
    let priceInTHB = 1
    if (key === 'THB') {
      priceInTHB = 1
    } else {
      const pairKey = `${key}/THB`
      priceInTHB = currentPrices[pairKey] || 0
      if (!priceInTHB && key === 'USDT') priceInTHB = 35.80
    }

    const valuationTHB = amount * priceInTHB

    // Calculate in-order locked amount
    const inOrder = allOpenOrders
      .filter((o) => (o.side === 'SELL' && (o.baseAsset === key || o.symbol.startsWith(key))))
      .reduce((sum, o) => sum + (o.amount || 0), 0)

    return {
      key,
      name: meta.name,
      amount,
      inOrder,
      total: amount + inOrder,
      priceInTHB,
      valuationTHB,
      pairSymbol: meta.pairSymbol,
    }
  }).filter((a) => a.total > 0 || a.key === 'THB')

  const totalPortfolioValuation = assetsList.reduce((sum, a) => sum + a.valuationTHB, 0)

  return (
    <div className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm overflow-hidden flex flex-col font-mono text-xs transition-colors">
      
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/70 mb-3">
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>คำสั่งรอจับคู่ ({allOpenOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'balances'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>ยอดสินทรัพย์ในกระเป๋า</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ประวัติการซื้อขาย ({tradeHistory.length})</span>
          </button>
        </div>

        {/* Portfolio Valuation Header */}
        <div className="text-right hidden sm:block">
          <span className="text-slate-400 text-[11px]">มูลค่าพอร์ตประเมิน: </span>
          <span className="text-slate-900 dark:text-white font-bold text-xs">
            ฿{formatNumber(totalPortfolioValuation, 2)} THB
          </span>
        </div>
      </div>

      {/* TAB 1: OPEN ORDERS */}
      {activeTab === 'orders' && (
        <div className="overflow-x-auto">
          {allOpenOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ไม่มีคำสั่งรอจับคู่ในขณะนี้ (สามารถตั้งราคาซื้อ-ขายล่วงหน้าด้วยคำสั่ง Limit ได้)
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">เวลา</th>
                  <th className="py-2.5 px-3">คู่เหรียญ</th>
                  <th className="py-2.5 px-3">ด้าน</th>
                  <th className="py-2.5 px-3">ประเภท</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3 text-right">ราคาเป้าหมาย</th>
                  <th className="py-2.5 px-3 text-right">จำนวน</th>
                  <th className="py-2.5 px-3 text-right">มูลค่า (THB)</th>
                  <th className="py-2.5 px-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {allOpenOrders.map((order) => {
                  const isBuy = order.side === 'BUY'
                  const placedAtDate = order.placedAt ? new Date(order.placedAt) : null
                  const placedAtText = placedAtDate && Number.isFinite(placedAtDate.getTime())
                    ? placedAtDate.toLocaleTimeString('th-TH')
                    : '—'
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {placedAtText}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {order.symbol}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        }`}>
                          {isBuy ? 'ซื้อ (BUY)' : 'ขาย (SELL)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {order.orderType || 'LIMIT'}
                      </td>
                      <td className="py-2.5 px-3 text-[10px]">
                        {order.legacyLockUnverified ? (
                          <span className="text-amber-400">ไม่สามารถจับคู่ได้/รอตรวจสอบ</span>
                        ) : (
                          <span className="text-cyan-400">รอจับคู่</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ฿{formatNumber(order.targetPrice || order.price, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {order.amount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ฿{formatNumber(order.total || (order.amount * order.targetPrice), 2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onCancelOpenOrder && onCancelOpenOrder(order.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          {order.legacyLockUnverified ? 'ยกเลิก (ไม่คืนยอด)' : 'ยกเลิก'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: SPOT BALANCES */}
      {activeTab === 'balances' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-3">สินทรัพย์</th>
                <th className="py-2.5 px-3">ชื่อ</th>
                <th className="py-2.5 px-3 text-right">ยอดคงเหลือพร้อมใช้</th>
                <th className="py-2.5 px-3 text-right">ติดในคำสั่ง</th>
                <th className="py-2.5 px-3 text-right">ยอดรวมทั้งหมด</th>
                <th className="py-2.5 px-3 text-right">มูลค่าประเมิน (THB)</th>
                <th className="py-2.5 px-3 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {assetsList.map((item) => (
                <tr key={item.key} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {item.key}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs font-sans">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {item.key === 'THB' ? `฿${formatNumber(item.amount, 2)}` : formatNumber(item.amount, 4)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {item.inOrder > 0 ? formatNumber(item.inOrder, 4) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    {item.key === 'THB' ? `฿${formatNumber(item.total, 2)}` : formatNumber(item.total, 4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                    ฿{formatNumber(item.valuationTHB, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.key !== 'THB' && onSelectSymbol && (
                      <button
                        onClick={() => onSelectSymbol(item.pairSymbol)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer font-sans"
                      >
                        เทรดเลย ↗
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ORDER HISTORY */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto">
          {tradeHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ยังไม่มีประวัติการทำรายการซื้อขาย (เมื่อส่งคำสั่งสำเร็จ รายการจะแสดงที่นี่)
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">เวลาที่ทำรายการ</th>
                  <th className="py-2.5 px-3">คู่เหรียญ</th>
                  <th className="py-2.5 px-3">ด้าน</th>
                  <th className="py-2.5 px-3">ประเภท</th>
                  <th className="py-2.5 px-3 text-right">ราคาที่จับคู่</th>
                  <th className="py-2.5 px-3 text-right">จำนวน</th>
                  <th className="py-2.5 px-3 text-right">มูลค่ารวม (THB)</th>
                  <th className="py-2.5 px-3 text-right">ค่าธรรมเนียม</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {tradeHistory.map((item) => {
                  const isBuy = item.side === 'BUY'
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {item.executedAt || item.closedAt || '12:00:00'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {item.symbol}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        }`}>
                          {isBuy ? 'ซื้อ (BUY)' : 'ขาย (SELL)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {item.orderType || 'MARKET'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ฿{formatNumber(item.price, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {item.amount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ฿{formatNumber(item.total || (item.amount * item.price), 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        ฿{formatNumber(item.fee || 0, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          สำเร็จ (FILLED)
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  )
}
