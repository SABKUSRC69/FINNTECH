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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Active Navigation Tab (Default to 'trading' for pro trading app experience)
  const [activeTab, setActiveTab] = useState('trading')

  // Quick Action Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // Transactions State (LocalStorage persisted)
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('finntech_transactions')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error parsing stored transactions', e)
      }
    }
    return INITIAL_TRANSACTIONS
  })

  // Portfolio State (LocalStorage persisted)
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('finntech_portfolio')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error parsing stored portfolio', e)
      }
    }
    return INITIAL_PORTFOLIO
  })

  // Pro Trading States (LocalStorage persisted)
  const [tradingBalance, setTradingBalance] = useState(() => {
    const saved = localStorage.getItem('finntech_trading_balance')
    return saved !== null ? parseFloat(saved) : 500000 // ฿500,000 default demo balance
  })

  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem('finntech_trading_positions')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error parsing stored positions', e)
      }
    }
    return INITIAL_POSITIONS
  })

  const [tradeHistory, setTradeHistory] = useState(() => {
    const saved = localStorage.getItem('finntech_trade_history')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error parsing stored trade history', e)
      }
    }
    return []
  })

  // Synchronize Dark Mode with HTML tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('finntech_dark_mode', JSON.stringify(darkMode))
  }, [darkMode])

  // Synchronize Transactions to LocalStorage
  useEffect(() => {
    localStorage.setItem('finntech_transactions', JSON.stringify(transactions))
  }, [transactions])

  // Synchronize Portfolio to LocalStorage
  useEffect(() => {
    localStorage.setItem('finntech_portfolio', JSON.stringify(portfolio))
  }, [portfolio])

  // Synchronize Trading states to LocalStorage
  useEffect(() => {
    localStorage.setItem('finntech_trading_balance', tradingBalance.toString())
  }, [tradingBalance])

  useEffect(() => {
    localStorage.setItem('finntech_trading_positions', JSON.stringify(positions))
  }, [positions])

  useEffect(() => {
    localStorage.setItem('finntech_trade_history', JSON.stringify(tradeHistory))
  }, [tradeHistory])

  // Handlers
  const handleAddTransaction = (newTx) => {
    setTransactions((prev) => [newTx, ...prev])
  }

  const handleDeleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }

  const handleAddAsset = (newAsset) => {
    setPortfolio((prev) => [newAsset, ...prev])
  }

  const handleDeleteAsset = (id) => {
    setPortfolio((prev) => prev.filter((item) => item.id !== id))
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
    setTransactions(INITIAL_TRANSACTIONS)
    setPortfolio(INITIAL_PORTFOLIO)
    setTradingBalance(500000)
    setPositions(INITIAL_POSITIONS)
    setTradeHistory([])
    localStorage.removeItem('finntech_transactions')
    localStorage.removeItem('finntech_portfolio')
    localStorage.removeItem('finntech_trading_balance')
    localStorage.removeItem('finntech_trading_positions')
    localStorage.removeItem('finntech_trade_history')
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
      if (user.balance !== undefined) setTradingBalance(user.balance)
      if (user.positions !== undefined) setPositions(user.positions)
      if (user.tradeHistory !== undefined) setTradeHistory(user.tradeHistory)
    }
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setIsAuthModalOpen(true)
  }

  const handleUpdateName = (newName) => {
    if (currentUser) {
      const updated = authService.updateProfile(currentUser.id, { name: newName })
      if (updated) setCurrentUser(updated)
    }
  }

  // Save current user data changes back into user record
  useEffect(() => {
    if (currentUser) {
      authService.saveUserData(currentUser.id, {
        balance: tradingBalance,
        positions,
        tradeHistory,
      })
    }
  }, [currentUser, tradingBalance, positions, tradeHistory])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onResetData={handleResetData}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            />
          )}

          {activeTab === 'calculators' && <CalculatorsView />}

          {activeTab === 'portfolio' && (
            <PortfolioView
              portfolio={portfolio}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleDeleteAsset}
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

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
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
        onUpdateName={handleUpdateName}
        onLogout={handleLogout}
      />
    </div>
  )
}
