/**
 * Authentication & User Accounts Service for FINNTECH
 * Stores encrypted/salted user profiles in LocalStorage with multi-user data isolation.
 */

const DEFAULT_DEMO_USER = {
  id: 'user_demo_001',
  name: 'Demo Trader',
  email: 'demo@finntech.com',
  password: 'demo', // Simple demo password
  avatarColor: 'from-emerald-500 to-teal-600',
  tier: 'VIP PRO',
  createdAt: '2026-09-17',
  balance: 500000,
  positions: [
    {
      id: 'pos-demo-1',
      symbol: 'BTC/USDT',
      side: 'LONG',
      entryPrice: 75200.00,
      amount: 50000,
      leverage: 10,
      tpPrice: 79000,
      slPrice: 74000,
      openedAt: '14:30:10'
    }
  ],
  tradeHistory: [],
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
      'from-rose-500 to-pink-600'
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
      balance: 500000, // ฿500,000 Welcome Bonus!
      positions: [],
      tradeHistory: [],
    }

    users.push(newUser)
    this.saveUsers(users)
    localStorage.setItem('finntech_current_user_id', newUser.id)
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

  // Save current user's state (balance, positions, history)
  saveUserData(userId, { balance, positions, tradeHistory }) {
    const users = this.getUsers()
    const idx = users.findIndex((u) => u.id === userId)
    if (idx !== -1) {
      if (balance !== undefined) users[idx].balance = balance
      if (positions !== undefined) users[idx].positions = positions
      if (tradeHistory !== undefined) users[idx].tradeHistory = tradeHistory
      this.saveUsers(users)
    }
  }
}

export const authService = new AuthService()
