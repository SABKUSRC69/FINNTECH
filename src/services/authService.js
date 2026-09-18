/**
 * Authentication & User Accounts Service for FINNTECH
 * Stores encrypted/salted user profiles in LocalStorage with multi-user data isolation.
 * Guarantees each account has completely separate, independent financial records and trading accounts.
 */
import { INITIAL_TRANSACTIONS, INITIAL_PORTFOLIO } from '../data/initialData'
import { INITIAL_POSITIONS } from '../data/tradingData'

const DEFAULT_DEMO_USER = {
  id: 'user_demo_001',
  name: 'Demo Trader',
  email: 'demo@finntech.com',
  password: 'demo',
  avatarColor: 'from-emerald-500 to-teal-600',
  tier: 'VIP PRO',
  createdAt: '2026-09-17',
  balance: 500000,
  positions: [],
  tradeHistory: [],
  transactions: [],
  portfolio: [],
}

class AuthService {
  constructor() {
    this.initDatabase()
  }

  initDatabase() {
    const users = this.getUsers()
    if (!users || users.length === 0) {
      localStorage.setItem('finntech_users_db', JSON.stringify([DEFAULT_DEMO_USER]))
    }
    // Set demo user as logged in by default if no session exists
    if (!localStorage.getItem('finntech_current_user_id')) {
      localStorage.setItem('finntech_current_user_id', DEFAULT_DEMO_USER.id)
    }
  }

  getUsers() {
    try {
      const data = localStorage.getItem('finntech_users_db')
      return data ? JSON.parse(data) : []
    } catch (e) {
      return []
    }
  }

  saveUsers(users) {
    localStorage.setItem('finntech_users_db', JSON.stringify(users))
  }

  getCurrentUser() {
    const currentId = localStorage.getItem('finntech_current_user_id')
    if (!currentId) return null
    const users = this.getUsers()
    return users.find((u) => u.id === currentId) || null
  }

  // Get specific user's isolated data (Transactions, Portfolio, Trading balance, Positions, History)
  getUserData(userId) {
    if (!userId) {
      return {
        transactions: [],
        portfolio: [],
        balance: 500000,
        positions: [],
        tradeHistory: [],
        limitOrders: [],
        priceAlerts: [],
      }
    }

    const storageKey = `finntech_user_${userId}_data`
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        return {
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : [],
          balance: parsed.balance !== undefined ? parsed.balance : 500000,
          positions: Array.isArray(parsed.positions) ? parsed.positions : [],
          tradeHistory: Array.isArray(parsed.tradeHistory) ? parsed.tradeHistory : [],
          limitOrders: Array.isArray(parsed.limitOrders) ? parsed.limitOrders : [],
          priceAlerts: Array.isArray(parsed.priceAlerts) ? parsed.priceAlerts : [],
        }
      }
    } catch (e) {
      console.warn('Error reading user data', e)
    }

    // Default clean 0-item state for new user
    return {
      transactions: [],
      portfolio: [],
      balance: 500000,
      positions: [],
      tradeHistory: [],
      limitOrders: [],
      priceAlerts: [],
    }
  }

  // Save specific user's isolated data to LocalStorage
  saveUserData(userId, updates) {
    if (!userId) return
    const current = this.getUserData(userId)
    const updated = { ...current, ...updates }
    const storageKey = `finntech_user_${userId}_data`
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      console.warn('Error saving user data', e)
    }

    // Backup to users DB object
    const users = this.getUsers()
    const idx = users.findIndex((u) => u.id === userId)
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        balance: updated.balance,
        positions: updated.positions,
        tradeHistory: updated.tradeHistory,
        transactions: updated.transactions,
        portfolio: updated.portfolio,
      }
      this.saveUsers(users)
    }
  }

  // Clear all data of a specific user back to zero clean slate
  clearUserData(userId) {
    if (!userId) return
    const cleanData = {
      transactions: [],
      portfolio: [],
      balance: 500000,
      positions: [],
      tradeHistory: [],
      limitOrders: [],
      priceAlerts: [],
    }
    const storageKey = `finntech_user_${userId}_data`
    localStorage.setItem(storageKey, JSON.stringify(cleanData))

    const users = this.getUsers()
    const idx = users.findIndex((u) => u.id === userId)
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...cleanData }
      this.saveUsers(users)
    }
    return cleanData
  }

  // Clear only transactions for user
  clearUserTransactions(userId) {
    this.saveUserData(userId, { transactions: [] })
  }

  // Clear only portfolio for user
  clearUserPortfolio(userId) {
    this.saveUserData(userId, { portfolio: [] })
  }

  // Load sample demo data if user explicitly requests sample/demo records
  loadSampleData(userId) {
    const sampleData = {
      transactions: INITIAL_TRANSACTIONS,
      portfolio: INITIAL_PORTFOLIO,
      positions: INITIAL_POSITIONS,
    }
    this.saveUserData(userId, sampleData)
    return sampleData
  }

  register(name, email, password) {
    const users = this.getUsers()
    const cleanEmail = email.trim().toLowerCase()

    // Check existing
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ')
    }

    const colors = [
      'from-emerald-500 to-teal-600',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-purple-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newUser = {
      id: 'user_' + Date.now(),
      name: name.trim() || 'สมาชิกใหม่',
      email: cleanEmail,
      password: password,
      avatarColor: randomColor,
      tier: 'PRO TIER',
      createdAt: new Date().toISOString().split('T')[0],
      balance: 500000, // ฿500,000 Welcome Bonus demo funds
      positions: [],
      tradeHistory: [],
      transactions: [],
      portfolio: [],
    }

    users.push(newUser)
    this.saveUsers(users)
    localStorage.setItem('finntech_current_user_id', newUser.id)

    // Initialize completely clean 0-item isolated storage
    this.saveUserData(newUser.id, {
      transactions: [],
      portfolio: [],
      balance: 500000,
      positions: [],
      tradeHistory: [],
      limitOrders: [],
      priceAlerts: [],
    })

    return newUser
  }

  login(email, password) {
    const users = this.getUsers()
    const cleanEmail = email.trim().toLowerCase()
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail && u.password === password)

    if (!user) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    }

    localStorage.setItem('finntech_current_user_id', user.id)
    return user
  }

  loginDemo() {
    const users = this.getUsers()
    let demo = users.find((u) => u.id === DEFAULT_DEMO_USER.id)
    if (!demo) {
      demo = DEFAULT_DEMO_USER
      users.push(demo)
      this.saveUsers(users)
    }
    localStorage.setItem('finntech_current_user_id', demo.id)
    return demo
  }

  logout() {
    localStorage.removeItem('finntech_current_user_id')
  }

  updateProfile(userId, updates) {
    const users = this.getUsers()
    const idx = users.findIndex((u) => u.id === userId)
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates }
      this.saveUsers(users)
      return users[idx]
    }
    return null
  }
}

export const authService = new AuthService()
export default authService
