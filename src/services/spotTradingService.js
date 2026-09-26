import { TRADING_PAIRS } from '../data/tradingData.js'

export const SPOT_FEE_RATE = 0.0025
export const SPOT_WITHDRAWAL_FEE = 20
export const SPOT_LOCK_VERSION = 'spot-lock-v1'

export const ZERO_SPOT_BALANCES = Object.freeze({
  THB: 0,
  BTC: 0,
  ETH: 0,
  SOL: 0,
  USDT: 0,
  BNB: 0,
  XRP: 0,
  DOGE: 0,
})

const EPSILON = 1e-8

const isFinitePositive = (value) => Number.isFinite(value) && value > 0
const getNonNegativeBalance = (balances, asset) => {
  const raw = Object.hasOwn(balances, asset) ? balances[asset] : 0
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : null
}
const nearlyEqual = (left, right) => Math.abs(left - right) <= Math.max(EPSILON, Math.abs(right) * 1e-10)
const decimalPlaces = (value) => {
  const text = String(value).toLowerCase()
  const [coefficient, exponentText] = text.split('e')
  const fractionLength = coefficient.includes('.') ? coefficient.split('.')[1].length : 0
  const exponent = exponentText === undefined ? 0 : Number(exponentText)
  return Math.max(0, fractionLength - exponent)
}
const hasPrecision = (value, precision) => {
  if (!Number.isInteger(precision) || precision < 0 || precision > 12) return false
  return Number.isFinite(value) && decimalPlaces(value) <= precision
}

export function getSpotAmountPrecision(pair) {
  if (Number.isInteger(pair?.amountPrecision) && pair.amountPrecision >= 0) return pair.amountPrecision
  const minimum = Number(pair?.minQty)
  if (!isFinitePositive(minimum)) return 8
  const text = minimum.toString().toLowerCase()
  if (text.includes('e-')) return Number(text.split('e-')[1])
  return text.includes('.') ? text.split('.')[1].length : 0
}

export function floorSpotAmount(pair, amountInput) {
  const amount = Number(amountInput)
  const precision = getSpotAmountPrecision(pair)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  const scale = 10 ** precision
  return Number((Math.floor((amount + Number.EPSILON) * scale) / scale).toFixed(precision))
}

export function isUsablePriceStatus(status) {
  const value = typeof status === 'string' ? status : status?.status
  return value === 'DEMO'
}

export function createSpotAccount({
  spotBalances = {},
  openOrders = [],
  tradeHistory = [],
  cancelledOrderIds = [],
} = {}) {
  return {
    spotBalances: { ...spotBalances },
    openOrders: migrateLegacyOpenOrders(openOrders),
    tradeHistory: [...tradeHistory],
    cancelledOrderIds: [...cancelledOrderIds],
  }
}

// A legacy order has no proof that its balance was actually reduced. Only order
// records stamped by the current Spot flow are eligible for a future refund/fill.
export function migrateLegacyOpenOrders(orders = []) {
  return (Array.isArray(orders) ? orders : []).map((order) => {
    if (order?.status !== 'OPEN') return { ...order }
    if (order.lockVersion === SPOT_LOCK_VERSION && order.lockedAsset && isFinitePositive(Number(order.lockedAmount))) {
      return { ...order }
    }

    const {
      lockedAsset: _unverifiedAsset,
      lockedAmount: _unverifiedAmount,
      lockedFee: _unverifiedFee,
      lockVersion: _unverifiedVersion,
      ...legacyOrder
    } = order
    return { ...legacyOrder, legacyLockUnverified: true }
  })
}

export function validateSpotOrder(order) {
  if (!order || typeof order !== 'object') return { success: false, error: 'ไม่พบข้อมูลคำสั่งเทรด' }

  const price = Number(order.price)
  const amount = Number(order.amount)
  const total = Number(order.total)
  if (!isFinitePositive(price)) return { success: false, error: 'ราคาต้องเป็นเลข finite และมากกว่า 0' }
  if (!isFinitePositive(amount)) return { success: false, error: 'จำนวนต้องเป็นเลข finite และมากกว่า 0' }
  if (!isFinitePositive(total)) return { success: false, error: 'ยอดรวมต้องเป็นเลข finite และมากกว่า 0' }
  if (order.side !== 'BUY' && order.side !== 'SELL') return { success: false, error: 'ด้านคำสั่งต้องเป็น BUY หรือ SELL' }
  if (order.orderType !== 'MARKET' && order.orderType !== 'LIMIT') return { success: false, error: 'รองรับเฉพาะคำสั่ง MARKET และ LIMIT' }

  const calculatedTotal = price * amount
  if (!isFinitePositive(calculatedTotal)) return { success: false, error: 'ยอด price × amount ไม่ถูกต้อง' }
  if (!nearlyEqual(total, calculatedTotal)) return { success: false, error: 'ยอดรวมต้องเท่ากับ price × amount' }

  const fee = calculatedTotal * SPOT_FEE_RATE
  if (!Number.isFinite(fee) || fee < 0 || (order.side === 'SELL' && fee >= calculatedTotal)) {
    return { success: false, error: 'ค่าธรรมเนียมไม่ถูกต้อง' }
  }
  if (order.fee !== undefined && order.fee !== null) {
    const suppliedFee = Number(order.fee)
    if (!Number.isFinite(suppliedFee) || suppliedFee < 0 || !nearlyEqual(suppliedFee, fee)) {
      return { success: false, error: 'ค่าธรรมเนียมไม่ตรงกับอัตรา Spot 0.25%' }
    }
  }

  const [symbolBase, symbolQuote] = String(order.symbol || '').split('/')
  const supportedPair = TRADING_PAIRS.find((pair) => pair.symbol === order.symbol)
  if (!supportedPair) return { success: false, error: 'รองรับเฉพาะคู่ Spot DEMO ที่แสดงในระบบ' }
  const amountPrecision = getSpotAmountPrecision(supportedPair)
  if (amount < Number(supportedPair.minQty)) {
    return { success: false, error: `จำนวนขั้นต่ำของ ${order.symbol} คือ ${supportedPair.minQty} ${supportedPair.baseAsset}` }
  }
  if (!hasPrecision(amount, amountPrecision)) {
    return { success: false, error: `จำนวน ${order.symbol} รองรับทศนิยมไม่เกิน ${amountPrecision} ตำแหน่ง` }
  }
  if (!hasPrecision(price, Number(supportedPair.precision))) {
    return { success: false, error: `ราคา ${order.symbol} รองรับทศนิยมไม่เกิน ${supportedPair.precision} ตำแหน่ง` }
  }
  const baseAsset = order.baseAsset || symbolBase
  const quoteAsset = order.quoteAsset || symbolQuote
  if (baseAsset !== supportedPair.baseAsset || quoteAsset !== supportedPair.quoteAsset) {
    return { success: false, error: 'Base/Quote asset ไม่ตรงกับคู่ Spot ที่เลือก' }
  }
  if (order.orderType === 'LIMIT') {
    const targetPrice = Number(order.targetPrice ?? price)
    if (!order.id || !isFinitePositive(targetPrice)) {
      return { success: false, error: 'Limit order ต้องมี ID และราคาเป้าหมายที่ถูกต้อง' }
    }
    if (!hasPrecision(targetPrice, Number(supportedPair.precision))) {
      return { success: false, error: `ราคาเป้าหมาย ${order.symbol} รองรับทศนิยมไม่เกิน ${supportedPair.precision} ตำแหน่ง` }
    }
    if (targetPrice !== price) {
      return { success: false, error: 'ราคา Limit ต้องตรงกับราคาที่ใช้คำนวณยอดล็อก' }
    }
  }

  return {
    success: true,
    order: {
      ...order,
      price,
      amount,
      total: calculatedTotal,
      fee,
      baseAsset,
      quoteAsset,
      targetPrice: order.orderType === 'LIMIT' ? Number(order.targetPrice ?? price) : undefined,
    },
  }
}

function fail(account, error) {
  return { success: false, account, error }
}

function hasOrderId(account, orderId) {
  return account.openOrders.some((order) => order.id === orderId) ||
    account.tradeHistory.some((trade) => trade.orderId === orderId || trade.id === `trade-${orderId}`) ||
    account.cancelledOrderIds.includes(orderId)
}

function appendTrade(account, order) {
  const entry = {
    id: `trade-${order.id}`,
    orderId: order.id,
    symbol: order.symbol,
    side: order.side,
    orderType: order.orderType,
    price: order.price,
    amount: order.amount,
    total: order.total,
    fee: order.fee,
    executedAt: new Date().toISOString(),
    status: 'FILLED',
  }
  return { ...account, tradeHistory: [entry, ...account.tradeHistory] }
}

export function applySpotOrder(currentAccount, orderInput, { priceStatus } = {}) {
  const account = createSpotAccount(currentAccount)
  const validated = validateSpotOrder(orderInput)
  if (!validated.success) return fail(account, validated.error)
  const order = validated.order
  const isLimitPlacement = order.orderType === 'LIMIT' && !order.isLimitExecution
  const isLimitFill = order.orderType === 'LIMIT' && order.isLimitExecution

  if (order.orderType === 'MARKET' && !isUsablePriceStatus(priceStatus ?? order.priceStatus)) {
    return fail(account, 'ราคาไม่พร้อมใช้งาน จึงปิดคำสั่ง Market ไว้')
  }
  if (isLimitFill && !isUsablePriceStatus(priceStatus ?? order.priceStatus)) {
    return fail(account, 'ฟีดราคาไม่พร้อมใช้งาน จึงยังไม่จับคู่ Limit order')
  }

  if (!order.id) return fail(account, 'คำสั่งต้องมี ID')

  if (isLimitPlacement) {
    if (hasOrderId(account, order.id)) return fail(account, 'ID คำสั่งนี้ถูกใช้แล้ว')
    const lockedAsset = order.side === 'BUY' ? order.quoteAsset : order.baseAsset
    const lockedAmount = order.side === 'BUY' ? order.total + order.fee : order.amount
    const available = getNonNegativeBalance(account.spotBalances, lockedAsset)
    if (!Number.isFinite(lockedAmount) || available === null || available < lockedAmount) {
      return fail(account, `ยอด ${lockedAsset} ที่ใช้ได้ไม่เพียงพอสำหรับล็อกคำสั่ง`)
    }

    const nextBalances = { ...account.spotBalances, [lockedAsset]: available - lockedAmount }
    const limitOrder = {
      ...order,
      status: 'OPEN',
      lockedAsset,
      lockedAmount,
      lockedFee: order.side === 'BUY' ? order.fee : 0,
      lockVersion: SPOT_LOCK_VERSION,
      placedAt: order.placedAt || new Date().toISOString(),
    }
    return {
      success: true,
      account: { ...account, spotBalances: nextBalances, openOrders: [limitOrder, ...account.openOrders] },
      order: limitOrder,
    }
  }

  if (isLimitFill) {
    const storedOrder = account.openOrders.find((candidate) => candidate.id === order.id && candidate.status === 'OPEN')
    if (!storedOrder) return fail(account, 'ไม่พบ Limit order ที่ยังเปิดอยู่ หรือคำสั่งนี้ถูกจับคู่/ยกเลิกไปแล้ว')
    const expectedPrice = Number(storedOrder.targetPrice ?? storedOrder.price)
    const sameTerms = storedOrder.symbol === order.symbol && storedOrder.side === order.side &&
      nearlyEqual(Number(storedOrder.amount), order.amount) && nearlyEqual(expectedPrice, order.price)
    if (!sameTerms) return fail(account, 'รายละเอียดคำสั่งจับคู่ไม่ตรงกับ Limit order ที่ล็อกไว้')

    const lockedAsset = storedOrder.lockedAsset
    const lockedAmount = Number(storedOrder.lockedAmount)
    if (storedOrder.lockVersion !== SPOT_LOCK_VERSION || !lockedAsset || !isFinitePositive(lockedAmount)) {
      return fail(account, 'ไม่พบหลักฐานยอดที่ล็อกไว้ จึงไม่สามารถจับคู่คำสั่งได้')
    }

    const balances = { ...account.spotBalances }
    if (order.side === 'BUY') {
      if (lockedAsset !== order.quoteAsset) return fail(account, 'สินทรัพย์ที่ล็อกไม่ตรงกับ Quote asset')
      const due = order.total + order.fee
      const adjustment = lockedAmount - due
      const available = getNonNegativeBalance(balances, order.quoteAsset)
      if (!Number.isFinite(due) || !Number.isFinite(adjustment) || available === null) {
        return fail(account, 'ยอดล็อกหรือค่าธรรมเนียมไม่ถูกต้อง')
      }
      if (adjustment < 0 && available < -adjustment) return fail(account, 'ยอด Quote สำหรับค่าธรรมเนียมไม่เพียงพอ')
      balances[order.quoteAsset] = available + adjustment
      const baseBalance = getNonNegativeBalance(balances, order.baseAsset)
      if (baseBalance === null || !Number.isFinite(baseBalance + order.amount)) return fail(account, 'ยอดเหรียญหลังจับคู่ไม่ถูกต้อง')
      balances[order.baseAsset] = baseBalance + order.amount
    } else {
      if (lockedAsset !== order.baseAsset || !nearlyEqual(lockedAmount, order.amount)) {
        return fail(account, 'ยอดเหรียญที่ล็อกไม่ตรงกับ Limit order')
      }
      const netQuote = order.total - order.fee
      const quoteBalance = getNonNegativeBalance(balances, order.quoteAsset)
      if (!isFinitePositive(netQuote) || quoteBalance === null || !Number.isFinite(quoteBalance + netQuote)) return fail(account, 'ยอดรับสุทธิไม่ถูกต้อง')
      balances[order.quoteAsset] = quoteBalance + netQuote
    }

    const filled = { ...storedOrder, ...order, status: 'FILLED' }
    const next = {
      ...account,
      spotBalances: balances,
      openOrders: account.openOrders.filter((candidate) => candidate.id !== order.id),
    }
    return { success: true, account: appendTrade(next, filled), order: filled }
  }

  if (hasOrderId(account, order.id)) return fail(account, 'ID คำสั่งนี้ถูกใช้แล้ว')
  const balances = { ...account.spotBalances }
  if (order.side === 'BUY') {
    const cost = order.total + order.fee
    const available = getNonNegativeBalance(balances, order.quoteAsset)
    if (!Number.isFinite(cost) || available === null || available < cost) {
      return fail(account, `ยอด ${order.quoteAsset} ไม่เพียงพอรวมค่าธรรมเนียม`)
    }
    const baseBalance = getNonNegativeBalance(balances, order.baseAsset)
    if (baseBalance === null || !Number.isFinite(baseBalance + order.amount)) return fail(account, 'ยอดเหรียญหลังซื้อไม่ถูกต้อง')
    balances[order.quoteAsset] = available - cost
    balances[order.baseAsset] = baseBalance + order.amount
  } else {
    const available = getNonNegativeBalance(balances, order.baseAsset)
    if (available === null || available < order.amount) {
      return fail(account, `ยอด ${order.baseAsset} ไม่เพียงพอสำหรับการขาย`)
    }
    const netQuote = order.total - order.fee
    const quoteBalance = getNonNegativeBalance(balances, order.quoteAsset)
    if (!isFinitePositive(netQuote) || quoteBalance === null || !Number.isFinite(quoteBalance + netQuote)) return fail(account, 'ยอดรับสุทธิไม่ถูกต้อง')
    balances[order.baseAsset] = available - order.amount
    balances[order.quoteAsset] = quoteBalance + netQuote
  }

  const executed = { ...order, status: 'FILLED' }
  return { success: true, account: appendTrade({ ...account, spotBalances: balances }, executed), order: executed }
}

export function cancelSpotLimitOrder(currentAccount, orderId) {
  const account = createSpotAccount(currentAccount)
  const order = account.openOrders.find((candidate) => candidate.id === orderId && candidate.status === 'OPEN')
  if (!order) return fail(account, 'ไม่พบ Limit order ที่ยังเปิดอยู่')
  const balances = { ...account.spotBalances }
  const hasVerifiedLock = order.lockVersion === SPOT_LOCK_VERSION && order.lockedAsset && isFinitePositive(Number(order.lockedAmount))
  if (hasVerifiedLock) {
    const available = getNonNegativeBalance(balances, order.lockedAsset)
    if (available === null) return fail(account, 'ยอดเงินที่ใช้ได้ไม่ถูกต้อง จึงยกเลิกคำสั่งไม่ได้')
    const updated = available + Number(order.lockedAmount)
    if (!Number.isFinite(updated)) return fail(account, 'ยอดคืนหลังยกเลิกไม่ถูกต้อง')
    balances[order.lockedAsset] = updated
  }
  return {
    success: true,
    account: {
      ...account,
      spotBalances: balances,
      openOrders: account.openOrders.filter((candidate) => candidate.id !== orderId),
      cancelledOrderIds: [...account.cancelledOrderIds, orderId],
    },
    order,
  }
}

export function applyLimitPriceTick(currentAccount, symbol, priceInput, priceStatus) {
  const account = createSpotAccount(currentAccount)
  const price = Number(priceInput)
  if (!isUsablePriceStatus(priceStatus) || !isFinitePositive(price)) {
    return { success: false, account, filledOrders: [], error: 'ฟีดราคาไม่พร้อมใช้งาน จึงไม่จับคู่ Limit order' }
  }

  let nextAccount = account
  const filledOrders = []
  const candidates = [...account.openOrders]
  for (const openOrder of candidates) {
    if (openOrder.symbol !== symbol || openOrder.status !== 'OPEN') continue
    const targetPrice = Number(openOrder.targetPrice ?? openOrder.price)
    if (!isFinitePositive(targetPrice)) continue
    const isTriggered = openOrder.side === 'BUY' ? price <= targetPrice : price >= targetPrice
    if (!isTriggered) continue

    const amount = Number(openOrder.amount)
    const fillPrice = targetPrice
    const total = fillPrice * amount
    const fill = applySpotOrder(nextAccount, {
      ...openOrder,
      price: fillPrice,
      amount,
      total,
      fee: total * SPOT_FEE_RATE,
      isLimitExecution: true,
    }, { priceStatus })
    if (fill.success) {
      nextAccount = fill.account
      filledOrders.push(fill.order)
    }
  }

  return { success: true, account: nextAccount, filledOrders }
}

export function applySpotDeposit(currentAccount, amountInput) {
  const account = createSpotAccount(currentAccount)
  const amount = Number(amountInput)
  const current = getNonNegativeBalance(account.spotBalances, 'THB')
  const updated = current === null ? NaN : current + amount
  if (!isFinitePositive(amount) || current === null || !Number.isFinite(updated)) {
    return fail(account, 'ยอดฝากจำลองต้องเป็นเลข finite และมากกว่า 0')
  }
  return { success: true, account: { ...account, spotBalances: { ...account.spotBalances, THB: updated } } }
}

export function applySpotWithdrawal(currentAccount, withdrawalInput) {
  const account = createSpotAccount(currentAccount)
  const amount = Number(withdrawalInput?.amount)
  const fee = Number(withdrawalInput?.fee)
  const netAmount = Number(withdrawalInput?.netAmount)
  const available = getNonNegativeBalance(account.spotBalances, 'THB')
  if (!isFinitePositive(amount) || !Number.isFinite(fee) || fee < 0 || !Number.isFinite(netAmount) || netAmount < 0) {
    return fail(account, 'ข้อมูลถอนจำลองไม่ถูกต้อง')
  }
  if (!nearlyEqual(fee, SPOT_WITHDRAWAL_FEE)) return fail(account, 'ค่าธรรมเนียมถอนจำลองต้องเป็น ฿20')
  if (!nearlyEqual(amount, fee + netAmount)) return fail(account, 'ยอด amount, fee และ netAmount ไม่สอดคล้องกัน')
  if (available === null || amount > available) return fail(account, 'ยอดเงินบาทที่ใช้ได้ไม่เพียงพอสำหรับการถอนจำลอง')
  if (typeof withdrawalInput?.bank !== 'string' || !withdrawalInput.bank.trim() ||
      typeof withdrawalInput?.accountNo !== 'string' || !withdrawalInput.accountNo.trim()) {
    return fail(account, 'ต้องระบุธนาคารและเลขที่บัญชีสำหรับรายการถอนจำลอง')
  }
  return {
    success: true,
    account: { ...account, spotBalances: { ...account.spotBalances, THB: available - amount } },
    withdrawal: { amount, fee, netAmount, bank: withdrawalInput.bank, accountNo: withdrawalInput.accountNo },
  }
}

export function calculateLockedBalances(openOrders = []) {
  return (Array.isArray(openOrders) ? openOrders : []).reduce((totals, order) => {
    const amount = Number(order?.lockedAmount)
    if (order?.status === 'OPEN' && order.lockVersion === SPOT_LOCK_VERSION && order.lockedAsset && isFinitePositive(amount)) {
      totals[order.lockedAsset] = (totals[order.lockedAsset] || 0) + amount
    }
    return totals
  }, {})
}
