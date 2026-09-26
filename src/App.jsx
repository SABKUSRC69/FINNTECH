import React, { useState, useEffect, useRef } from 'react'
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
import liveMarketService from './services/liveMarketService'
import {
  applyLimitPriceTick,
  applySpotDeposit,
  applySpotOrder,
  applySpotWithdrawal,
  createSpotAccount,
  ZERO_SPOT_BALANCES,
  cancelSpotLimitOrder,
} from './services/spotTradingService'
import { INITIAL_TRANSACTIONS, INITIAL_PORTFOLIO } from './data/initialData'
import {
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
  const [priceAlerts, setPriceAlerts] = useState(() => initialUserData.priceAlerts || [])

  const [tradingBalance, setTradingBalance] = useState(() => {
    if (initialUserData.spotBalances?.THB !== undefined) return initialUserData.spotBalances.THB
    return initialUserData.balance !== undefined ? initialUserData.balance : 500000
  })
  const spotAccountRef = useRef(createSpotAccount({
    spotBalances,
    openOrders,
    tradeHistory,
    cancelledOrderIds: initialUserData.cancelledOrderIds || [],
  }))

  // Synchronize state when switching users (login / register / logout / switch account)
  useEffect(() => {
    if (currentUser?.id) {
      const data = authService.getUserData(currentUser.id)
      setTransactions(data.transactions || [])
      setPortfolio(data.portfolio || [])
      setSpotBalances(data.spotBalances || INITIAL_SPOT_BALANCES)
      setOpenOrders(data.openOrders || INITIAL_OPEN_ORDERS)
      setTradeHistory(data.tradeHistory || INITIAL_TRADE_HISTORY)
      setPriceAlerts(data.priceAlerts || [])
      setTradingBalance(data.spotBalances?.THB ?? data.balance ?? 500000)
      spotAccountRef.current = createSpotAccount(data)
    } else {
      setTransactions([])
      setPortfolio([])
      setSpotBalances(INITIAL_SPOT_BALANCES)
      setOpenOrders(INITIAL_OPEN_ORDERS)
      setTradeHistory(INITIAL_TRADE_HISTORY)
      setPriceAlerts([])
      setTradingBalance(500000)
      spotAccountRef.current = createSpotAccount({
        spotBalances: INITIAL_SPOT_BALANCES,
        openOrders: INITIAL_OPEN_ORDERS,
        tradeHistory: INITIAL_TRADE_HISTORY,
      })
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
        cancelledOrderIds: spotAccountRef.current.cancelledOrderIds,
        priceAlerts,
      })
    } else {
      authService.saveUserData(null, {
        transactions,
        portfolio,
        balance: spotBalances.THB ?? tradingBalance,
        spotBalances,
        openOrders,
        tradeHistory,
        cancelledOrderIds: spotAccountRef.current.cancelledOrderIds,
        priceAlerts,
      })
    }
  }, [transactions, portfolio, spotBalances, openOrders, tradeHistory, priceAlerts, currentUser?.id])

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
  const commitSpotAccount = (account) => {
    spotAccountRef.current = account
    setSpotBalances(account.spotBalances)
    setOpenOrders(account.openOrders)
    setTradeHistory(account.tradeHistory)
    setTradingBalance(account.spotBalances.THB || 0)
  }

  const handleExecuteSpotOrder = (order) => {
    const priceStatus = order.priceStatus || liveMarketService.getSymbolStatus(order.symbol).status
    const result = applySpotOrder(spotAccountRef.current, order, { priceStatus })
    if (result.success) commitSpotAccount(result.account)
    return result
  }

  const handleLimitPriceTick = (symbol, price, priceStatus) => {
    const result = applyLimitPriceTick(spotAccountRef.current, symbol, price, priceStatus)
    if (result.success && result.filledOrders.length > 0) commitSpotAccount(result.account)
    return result
  }

  const handleCancelOpenOrder = (orderId) => {
    const result = cancelSpotLimitOrder(spotAccountRef.current, orderId)
    if (result.success) commitSpotAccount(result.account)
    return result
  }

  const handleDepositTHB = (amount) => {
    const result = applySpotDeposit(spotAccountRef.current, amount)
    if (result.success) commitSpotAccount(result.account)
    return result
  }

  const handleWithdrawTHB = (data) => {
    const result = applySpotWithdrawal(spotAccountRef.current, data)
    if (result.success) commitSpotAccount(result.account)
    return result
  }

  const handleResetData = () => {
    const cleanData = authService.clearUserData(currentUser?.id || null)
    setTransactions([])
    setPortfolio([])
    setSpotBalances(cleanData?.spotBalances || { ...ZERO_SPOT_BALANCES })
    setOpenOrders([])
    setTradeHistory([])
    setPriceAlerts([])
    setTradingBalance(cleanData?.balance || 0)
    spotAccountRef.current = createSpotAccount({ spotBalances: cleanData?.spotBalances || ZERO_SPOT_BALANCES })
  }

  const handleLoadSampleData = () => {
    if (currentUser?.id) {
      const sample = authService.loadSampleData(currentUser.id)
      setTransactions(sample.transactions || [])
      setPortfolio(sample.portfolio || [])
      setSpotBalances(sample.spotBalances || INITIAL_SPOT_BALANCES)
      setOpenOrders(sample.openOrders || INITIAL_OPEN_ORDERS)
      setTradeHistory(sample.tradeHistory || INITIAL_TRADE_HISTORY)
      setPriceAlerts(sample.priceAlerts || [])
      setTradingBalance(sample.spotBalances?.THB ?? 500000)
      spotAccountRef.current = createSpotAccount(sample)
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
      setPriceAlerts(data.priceAlerts || [])
      setTradingBalance(data.spotBalances?.THB ?? data.balance ?? 500000)
      spotAccountRef.current = createSpotAccount(data)
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
    setPriceAlerts([])
    setTradingBalance(500000)
    spotAccountRef.current = createSpotAccount({
      spotBalances: INITIAL_SPOT_BALANCES,
      openOrders: INITIAL_OPEN_ORDERS,
      tradeHistory: INITIAL_TRADE_HISTORY,
    })
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
              priceAlerts={priceAlerts}
              onPriceAlertsChange={setPriceAlerts}
              onExecuteSpotOrder={handleExecuteSpotOrder}
              onLimitPriceTick={handleLimitPriceTick}
              onCancelOpenOrder={handleCancelOpenOrder}
              onDepositTHB={handleDepositTHB}
              onWithdrawTHB={handleWithdrawTHB}
              onTopUpBalance={() => handleDepositTHB(100000)}
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
              tradingBalance={spotBalances.THB ?? tradingBalance}
              tradeHistory={tradeHistory}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              portfolio={portfolio}
              spotBalances={spotBalances}
              openOrders={openOrders}
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
              spotBalances={spotBalances}
              openOrders={openOrders}
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
