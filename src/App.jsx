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
import { INITIAL_POSITIONS } from './data/tradingData'

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

  // Active Navigation Tab (Default to 'trading' for pro trading app experience)
  const [activeTab, setActiveTab] = useState('trading')
  const [activeTradingPair, setActiveTradingPair] = useState('BTC/USDT')

  // Quick Action Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // Load User Data based on current authenticated user
  const initialUserData = authService.getUserData(currentUser?.id)

  // Transactions State (User-scoped, defaults to clean 0 items)
  const [transactions, setTransactions] = useState(() => initialUserData.transactions || [])

  // Portfolio State (User-scoped, defaults to clean 0 items)
  const [portfolio, setPortfolio] = useState(() => initialUserData.portfolio || [])

  // Pro Trading States (User-scoped)
  const [tradingBalance, setTradingBalance] = useState(() => initialUserData.balance !== undefined ? initialUserData.balance : 500000)
  const [positions, setPositions] = useState(() => initialUserData.positions || [])
  const [tradeHistory, setTradeHistory] = useState(() => initialUserData.tradeHistory || [])

  // Synchronize state when switching users (login / register / logout / switch account)
  useEffect(() => {
    if (currentUser?.id) {
      const data = authService.getUserData(currentUser.id)
      setTransactions(data.transactions || [])
      setPortfolio(data.portfolio || [])
      setTradingBalance(data.balance !== undefined ? data.balance : 500000)
      setPositions(data.positions || [])
      setTradeHistory(data.tradeHistory || [])
    } else {
      setTransactions([])
      setPortfolio([])
      setTradingBalance(500000)
      setPositions([])
      setTradeHistory([])
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
        balance: tradingBalance,
        positions,
        tradeHistory,
      })
    }
  }, [transactions, portfolio, tradingBalance, positions, tradeHistory, currentUser?.id])

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

  // Trading Handlers
  const handleAddPosition = (newPos) => {
    setTradingBalance((prev) => Math.max(0, prev - newPos.amount))
    setPositions((prev) => [newPos, ...prev])
  }

  const handleClosePosition = (id, realizedPnL) => {
    const target = positions.find((p) => p.id === id)
    if (!target) return

    // Return Margin + PnL to balance
    const returnedAmount = Math.max(0, target.amount + realizedPnL)
    setTradingBalance((prev) => prev + returnedAmount)

    // Add to history
    const historyItem = {
      id: 'history-' + Date.now(),
      symbol: target.symbol,
      side: target.side,
      amount: target.amount,
      leverage: target.leverage,
      pnl: realizedPnL,
      closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    setTradeHistory((prev) => [historyItem, ...prev])

    // Remove from open positions
    setPositions((prev) => prev.filter((p) => p.id !== id))
  }

  const handleCloseAllPositions = () => {
    let returnedTotal = 0
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const newHistories = []

    positions.forEach((p) => {
      // Calculate closing return
      const pnl = (p.side === 'LONG' ? (p.markPrice - p.entryPrice) : (p.entryPrice - p.markPrice)) / p.entryPrice * p.leverage * p.amount
      returnedTotal += Math.max(0, p.amount + pnl)
      newHistories.push({
        id: 'history-' + Math.random(),
        symbol: p.symbol,
        side: p.side,
        amount: p.amount,
        leverage: p.leverage,
        pnl: Math.round(pnl),
        closedAt: nowStr,
      })
    })

    setTradingBalance((prev) => prev + returnedTotal)
    setTradeHistory((prev) => [...newHistories, ...prev])
    setPositions([])
  }

  const handleTopUpBalance = () => {
    setTradingBalance((prev) => prev + 100000)
  }

  const handleResetData = () => {
    if (currentUser?.id) {
      authService.clearUserData(currentUser.id)
    }
    setTransactions([])
    setPortfolio([])
    setTradingBalance(500000)
    setPositions([])
    setTradeHistory([])
  }

  const handleLoadSampleData = () => {
    if (currentUser?.id) {
      const sample = authService.loadSampleData(currentUser.id)
      setTransactions(sample.transactions || [])
      setPortfolio(sample.portfolio || [])
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
      setTradingBalance(data.balance !== undefined ? data.balance : 500000)
      setPositions(data.positions || [])
      setTradeHistory(data.tradeHistory || [])
    }
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setTransactions([])
    setPortfolio([])
    setTradingBalance(500000)
    setPositions([])
    setTradeHistory([])
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
              tradingBalance={tradingBalance}
              positions={positions}
              tradeHistory={tradeHistory}
              onAddPosition={handleAddPosition}
              onClosePosition={handleClosePosition}
              onCloseAllPositions={handleCloseAllPositions}
              onTopUpBalance={handleTopUpBalance}
              onNavigateToNews={() => setActiveTab('news')}
              initialSymbol={activeTradingPair}
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
              tradingBalance={tradingBalance}
              tradeHistory={tradeHistory}
              positions={positions}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              portfolio={portfolio}
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
              tradingBalance={tradingBalance}
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
        balance={tradingBalance}
        positionsCount={positions.length}
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
