/**
 * Local Demo Profile & Accounts Service for FINNTECH
 * In-browser profile manager with multi-user data isolation in LocalStorage.
 * Note: FINNTECH is a static client-side web application without a backend server.
 * Profiles are strictly local demo accounts and do not connect to external banking servers.
 * Plaintext passwords are never stored in LocalStorage.
 */
import { INITIAL_TRANSACTIONS, INITIAL_PORTFOLIO } from '../data/initialData.js'
import { INITIAL_POSITIONS } from '../data/tradingData.js'

function hashPasscode(passcode) {
  if (!passcode) return ''
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d
  const str = String(passcode) + '_ft_local_demo_salt'
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 'demo_hash_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

const DEFAULT_DEMO_USER = {
  id: 'user_demo_001',
  name: 'Demo Trader',
  email: 'demo@finntech.local',
  passcodeHash: hashPasscode('demo'),
  avatarColor: 'from-emerald-500 to-teal-600',
  tier: 'DEMO PROFILE',
  isDemoProfile: true,
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
      localStorage.setItem('finntech_users_db', JSON.stringify([]))
    }
    // If the legacy demo user is stored, clear it so real user registers
    if (localStorage.getItem('finntech_current_user_id') === 'user_demo_001') {
      localStorage.removeItem('finntech_current_user_id')
    }
  }

  getUsers() {
    try {
      const data = localStorage.getItem('finntech_users_db')
      const users = data ? JSON.parse(data) : []
      // Sanitize any legacy records that had plaintext password stored
      let modified = false
      const sanitized = users.map((u) => {
        if (u.password) {
          u.passcodeHash = hashPasscode(u.password)
          delete u.password
          modified = true
        }
        return u
      })
      if (modified) {
        this.saveUsers(sanitized)
      }
      return sanitized
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

  register(name, identifier, password) {
    const users = this.getUsers()
    const cleanId = (identifier || '').trim().toLowerCase()

    if (!cleanId) {
      throw new Error('กรุณาระบุชื่อบัญชีหรืออีเมล')
    }
    if (!password || password.length < 4) {
      throw new Error('กรุณากำหนดรหัสผ่านอย่างน้อย 4 ตัวอักษร')
    }

    // Check if username or email already exists
    if (users.some((u) => u.email?.toLowerCase() === cleanId || u.username?.toLowerCase() === cleanId)) {
      throw new Error('ชื่อบัญชีหรืออีเมลนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านเดิม')
    }

    const colors = [
      'from-emerald-500 to-teal-600',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-purple-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const isEmail = cleanId.includes('@')
    const newUser = {
      id: 'user_' + Date.now(),
      name: (name || '').trim() || cleanId,
      username: cleanId,
      email: isEmail ? cleanId : `${cleanId}@finntech.local`,
      passcodeHash: hashPasscode(password),
      avatarColor: randomColor,
      tier: 'DEMO PROFILE',
      isDemoProfile: true,
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

  login(identifier, password) {
    const users = this.getUsers()
    const cleanId = (identifier || '').trim().toLowerCase()

    if (!cleanId || !password) {
      throw new Error('กรุณากรอกชื่อบัญชี/อีเมล และรหัสผ่าน')
    }

    const inputHash = hashPasscode(password)
    const user = users.find(
      (u) =>
        (u.email?.toLowerCase() === cleanId ||
         u.username?.toLowerCase() === cleanId ||
         u.name?.toLowerCase() === cleanId) &&
        (u.passcodeHash === inputHash || (u.password && u.password === password))
    )

    if (!user) {
      throw new Error('ชื่อบัญชี/อีเมล หรือรหัสผ่านไม่ถูกต้อง กรุณาใช้รหัสผ่านเดิมที่คุณเคยตั้งไว้')
    }

    const safeUser = { ...user }
    delete safeUser.password
    localStorage.setItem('finntech_current_user_id', safeUser.id)
    return safeUser
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
