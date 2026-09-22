import React, { useState, useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import DashboardView from './components/dashboard/DashboardView'
import TransactionManager from './components/transactions/TransactionManager'
import CalculatorsView from './components/calculators/CalculatorsView'
import PortfolioView from './components/portfolio/PortfolioView'
import QuickActionModal from './components/dashboard/QuickActionModal'
import TradingTerminal from './components/trading/TradingTerminal'
import AnalyticsView from './components/analytics/AnalyticsView'
import ForexNewsView from './components/news/ForexNewsView'
import AuthModal from './components/auth/AuthModal'
import UserProfileModal from './components/auth/UserProfileModal'
import { authService } from './services/authService'
import { INITIAL_TRANSACTIONS, INITIAL_PORTFOLIO } from './data/initialData'
import {
  INITIAL_POSITIONS,
  INITIAL_SPOT_BALANCES,
  INITIAL_OPEN_ORDERS,
  INITIAL_TRADE_HISTORY,
} from './data/tradingData'

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('finntech_dark_mode')
    return saved !== null ? JSON.parse(saved) : true // default dark mode
  })

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState(() => {
    return authService.getUsers().length > 0 ? 'login' : 'register'
  })
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Active Navigation Tab (Default to 'trading' for exchange platform experience)
  const [activeTab, setActiveTab] = useState('trading')
  const [activeTradingPair, setActiveTradingPair] = useState('BTC/THB')

  // Quick Action Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // Load User Data based on current authenticated user
  const initialUserData = authService.getUserData(currentUser?.id)

  // Transactions State (User-scoped)
  const [transactions, setTransactions] = useState(() => initialUserData.transactions || [])

  // Portfolio State (User-scoped)
  const [portfolio, setPortfolio] = useState(() => initialUserData.portfolio || [])

  // Spot Asset Balances (THB, BTC, ETH, SOL, USDT, etc.)
  const [spotBalances, setSpotBalances] = useState(() => initialUserData.spotBalances || INITIAL_SPOT_BALANCES)
  const [openOrders, setOpenOrders] = useState(() => initialUserData.openOrders || INITIAL_OPEN_ORDERS)
  const [tradeHistory, setTradeHistory] = useState(() => initialUserData.tradeHistory || INITIAL_TRADE_HISTORY)

  // Backwards compatibility legacy states
  const [tradingBalance, setTradingBalance] = useState(() => {
    if (initialUserData.spotBalances?.THB !== undefined) return initialUserData.spotBalances.THB
    return initialUserData.balance !== undefined ? initialUserData.balance : 500000
  })
  const [positions, setPositions] = useState(() => initialUserData.positions || [])

  // Synchronize state when switching users (login / register / logout / switch account)
  useEffect(() => {
    if (currentUser?.id) {
      const data = authService.getUserData(currentUser.id)
      setTransactions(data.transactions || [])
      setPortfolio(data.portfolio || [])
      setSpotBalances(data.spotBalances || INITIAL_SPOT_BALANCES)
      setOpenOrders(data.openOrders || INITIAL_OPEN_ORDERS)
      setTradeHistory(data.tradeHistory || INITIAL_TRADE_HISTORY)
      setTradingBalance(data.spotBalances?.THB ?? data.balance ?? 500000)
      setPositions(data.positions || [])
    } else {
      setTransactions([])
      setPortfolio([])
      setSpotBalances(INITIAL_SPOT_BALANCES)
      setOpenOrders(INITIAL_OPEN_ORDERS)
      setTradeHistory(INITIAL_TRADE_HISTORY)
      setTradingBalance(500000)
      setPositions([])
    }
  }, [currentUser?.id])

  // Synchronize Dark Mode with HTML tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('finntech_dark_mode', JSON.stringify(darkMode))
  }, [darkMode])

  // Save current user data changes back into user's isolated storage
  useEffect(() => {
    if (currentUser?.id) {
      authService.saveUserData(currentUser.id, {
        transactions,
        portfolio,
        balance: spotBalances.THB ?? tradingBalance,
        spotBalances,
        openOrders,
        tradeHistory,
        positions,
      })
    }
  }, [transactions, portfolio, spotBalances, openOrders, tradeHistory, positions, currentUser?.id])

  // Handlers
  const handleAddTransaction = (newTx) => {
    setTransactions((prev) => [newTx, ...prev])
  }

  const handleDeleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }

  const handleClearAllTransactions = () => {
    setTransactions([])
    if (currentUser?.id) {
      authService.clearUserTransactions(currentUser.id)
    }
  }

  const handleAddAsset = (newAsset) => {
    setPortfolio((prev) => [newAsset, ...prev])
  }

  const handleDeleteAsset = (id) => {
    setPortfolio((prev) => prev.filter((item) => item.id !== id))
  }

  const handleClearAllPortfolio = () => {
    setPortfolio([])
    if (currentUser?.id) {
      authService.clearUserPortfolio(currentUser.id)
    }
  }

  // Spot Trading Handlers
  const handleExecuteSpotOrder = (order) => {
    const baseAsset = order.baseAsset || order.symbol.split('/')[0]
    const orderType = order.orderType || 'MARKET'
    const isLimit = orderType === 'LIMIT' && !order.isLimitExecution

    if (isLimit) {
      // Lock balance for Limit Order
      if (order.side === 'BUY') {
        setSpotBalances((prev) => ({
          ...prev,
          THB: Math.max(0, (prev.THB || 0) - order.total),
        }))
      } else {
        setSpotBalances((prev) => ({
          ...prev,
          [baseAsset]: Math.max(0, (prev[baseAsset] || 0) - order.amount),
        }))
      }

      setOpenOrders((prev) => [
        {
          ...order,
          status: 'OPEN',
          placedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ])
    } else {
      // Market order or filled limit order
      if (order.isLimitExecution) {
        setOpenOrders((prev) => prev.filter((o) => o.id !== order.id))
      }

      const fee = order.fee || (order.total * 0.0025)

      if (order.side === 'BUY') {
        setSpotBalances((prev) => {
          const next = { ...prev }
          if (!order.isLimitExecution) {
            next.THB = Math.max(0, (next.THB || 0) - order.total)
          }
          next[baseAsset] = (next[baseAsset] || 0) + order.amount
          return next
        })
      } else {
        // SELL
        const netTHB = order.total - fee
        setSpotBalances((prev) => {
          const next = { ...prev }
          if (!order.isLimitExecution) {
            next[baseAsset] = Math.max(0, (next[baseAsset] || 0) - order.amount)
          }
          next.THB = (next.THB || 0) + netTHB
          return next
        })
      }

      const historyEntry = {
        id: 'trade-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        symbol: order.symbol,
        side: order.side,
        orderType,
        price: order.price,
        amount: order.amount,
        total: order.total,
        fee,
        executedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'FILLED',
      }
      setTradeHistory((prev) => [historyEntry, ...prev])
    }
  }

  const handleCancelOpenOrder = (orderId) => {
    const target = openOrders.find((o) => o.id === orderId)
    if (target) {
      const baseAsset = target.baseAsset || target.symbol.split('/')[0]
      setSpotBalances((prev) => {
        const next = { ...prev }
        if (target.side === 'BUY') {
          next.THB = (next.THB || 0) + target.total
        } else {
          next[baseAsset] = (next[baseAsset] || 0) + target.amount
        }
        return next
      })
    }
    setOpenOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

  const handleDepositTHB = (amount) => {
    const val = Number(amount) || 0
    setSpotBalances((prev) => ({
      ...prev,
      THB: (prev.THB || 0) + val,
    }))
    setTradingBalance((prev) => prev + val)
  }

  const handleWithdrawTHB = (data) => {
    const val = Number(data.amount) || 0
    setSpotBalances((prev) => ({
      ...prev,
      THB: Math.max(0, (prev.THB || 0) - val),
    }))
    setTradingBalance((prev) => Math.max(0, prev - val))
  }

  // Legacy position compatibility handlers
  const handleAddPosition = (newPos) => {
    setTradingBalance((prev) => Math.max(0, prev - newPos.amount))
    setPositions((prev) => [newPos, ...prev])
  }

  const handleClosePosition = (id, realizedPnL) => {
    const target = positions.find((p) => p.id === id)
    if (!target) return
    const returnedAmount = Math.max(0, target.amount + realizedPnL)
    setTradingBalance((prev) => prev + returnedAmount)
    setPositions((prev) => prev.filter((p) => p.id !== id))
  }

  const handleCloseAllPositions = () => {
    let returnedTotal = 0
    positions.forEach((p) => {
      const pnl = (p.side === 'LONG' ? (p.markPrice - p.entryPrice) : (p.entryPrice - p.markPrice)) / p.entryPrice * (p.leverage || 1) * p.amount
      returnedTotal += Math.max(0, p.amount + pnl)
    })
    setTradingBalance((prev) => prev + returnedTotal)
    setPositions([])
  }

  const handleResetData = () => {
    if (currentUser?.id) {
      authService.clearUserData(currentUser.id)
    }
    setTransactions([])
    setPortfolio([])
    setSpotBalances(INITIAL_SPOT_BALANCES)
    setOpenOrders(INITIAL_OPEN_ORDERS)
    setTradeHistory(INITIAL_TRADE_HISTORY)
    setTradingBalance(500000)
    setPositions([])
  }

  const handleLoadSampleData = () => {
    if (currentUser?.id) {
      const sample = authService.loadSampleData(currentUser.id)
      setTransactions(sample.transactions || [])
      setPortfolio(sample.portfolio || [])
      setSpotBalances(sample.spotBalances || INITIAL_SPOT_BALANCES)
      setOpenOrders(sample.openOrders || INITIAL_OPEN_ORDERS)
      setTradeHistory(sample.tradeHistory || INITIAL_TRADE_HISTORY)
      setTradingBalance(sample.spotBalances?.THB ?? 500000)
      setPositions(sample.positions || [])
    }
  }

  // Auth Handlers
  const handleAuthSuccess = (type, payload) => {
    let user = null
    if (type === 'login') {
      user = authService.login(payload.email, payload.password)
    } else if (type === 'register') {
      user = authService.register(payload.name, payload.email, payload.password)
    } else if (type === 'demo') {
      user = authService.loginDemo()
    }

    if (user) {
      setCurrentUser(user)
      const data = authService.getUserData(user.id)
      setTransactions(data.transactions || [])
      setPortfolio(data.portfolio || [])
      setSpotBalances(data.spotBalances || INITIAL_SPOT_BALANCES)
      setOpenOrders(data.openOrders || INITIAL_OPEN_ORDERS)
      setTradeHistory(data.tradeHistory || INITIAL_TRADE_HISTORY)
      setTradingBalance(data.spotBalances?.THB ?? data.balance ?? 500000)
      setPositions(data.positions || [])
    }
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setTransactions([])
    setPortfolio([])
    setSpotBalances(INITIAL_SPOT_BALANCES)
    setOpenOrders(INITIAL_OPEN_ORDERS)
    setTradeHistory(INITIAL_TRADE_HISTORY)
    setTradingBalance(500000)
    setPositions([])
    setAuthModalTab('login')
    setIsAuthModalOpen(true)
  }

  const handleUpdateName = (newName) => {
    if (currentUser) {
      const updated = authService.updateProfile(currentUser.id, { name: newName })
      if (updated) setCurrentUser(updated)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onResetData={handleResetData}
        onLoadSampleData={handleLoadSampleData}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setAuthModalTab(authService.getUsers().length > 0 ? 'login' : 'register')
          setIsAuthModalOpen(true)
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Container */}
      <div className={`flex-1 flex w-full mx-auto transition-all duration-300 ${activeTab === 'trading' ? 'max-w-[1680px]' : 'max-w-7xl'}`}>
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-20 md:pb-8 overflow-y-auto">
          {activeTab === 'trading' && (
            <TradingTerminal
              tradingBalance={spotBalances.THB ?? tradingBalance}
              spotBalances={spotBalances}
              openOrders={openOrders}
              tradeHistory={tradeHistory}
              onExecuteSpotOrder={handleExecuteSpotOrder}
              onCancelOpenOrder={handleCancelOpenOrder}
              onDepositTHB={handleDepositTHB}
              onWithdrawTHB={handleWithdrawTHB}
              onTopUpBalance={() => handleDepositTHB(100000)}
              onNavigateToNews={() => setActiveTab('news')}
              initialSymbol={activeTradingPair}
              positions={positions}
              onAddPosition={handleAddPosition}
              onClosePosition={handleClosePosition}
              onCloseAllPositions={handleCloseAllPositions}
            />
          )}

          {activeTab === 'news' && (
            <ForexNewsView
              onSelectTradePair={(pairSymbol) => {
                if (pairSymbol) {
                  setActiveTradingPair(pairSymbol)
                }
                setActiveTab('trading')
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              tradingBalance={spotBalances.THB ?? tradingBalance}
              tradeHistory={tradeHistory}
              positions={positions}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              portfolio={portfolio}
              tradingBalance={spotBalances.THB ?? tradingBalance}
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionManager
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onClearAllTransactions={handleClearAllTransactions}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            />
          )}

          {activeTab === 'calculators' && <CalculatorsView />}

          {activeTab === 'portfolio' && (
            <PortfolioView
              portfolio={portfolio}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleDeleteAsset}
              onClearAllPortfolio={handleClearAllPortfolio}
              tradingPositions={positions}
              tradingBalance={spotBalances.THB ?? tradingBalance}
              spotBalances={spotBalances}
              onCloseTradingPosition={handleClosePosition}
            />
          )}
        </main>
      </div>

      {/* Global Quick Record Modal */}
      <QuickActionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      {/* Authentication Modal (Forced gate if not logged in) */}
      <AuthModal
        isOpen={!currentUser || isAuthModalOpen}
        isForced={!currentUser}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        balance={spotBalances.THB ?? tradingBalance}
        positionsCount={openOrders.length}
        tradesCount={tradeHistory.length}
        transactionsCount={transactions.length}
        portfolioCount={portfolio.length}
        onUpdateName={handleUpdateName}
        onClearAllData={handleResetData}
        onLoadSampleData={handleLoadSampleData}
        onLogout={handleLogout}
      />
    </div>
  )
}
