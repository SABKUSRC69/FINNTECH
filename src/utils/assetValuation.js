import { TRADING_PAIRS } from '../data/tradingData.js'
import { calculateLockedBalances } from '../services/spotTradingService.js'

// Only currencies with an explicit conversion rule may contribute to THB totals.
// The app currently has no verified or demo FX conversion for non-THB assets.
const CURRENCY_TO_THB = Object.freeze({ THB: 1 })

function normalizeCurrency(currency) {
  return typeof currency === 'string' ? currency.trim().toUpperCase() : ''
}

function getOptionalFiniteNumber(value) {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function getAssetSymbol(item) {
  const symbol = String(item?.baseAsset || item?.symbol || '').trim().toUpperCase()
  return symbol.split('/')[0].split(' ')[0]
}

export function getCurrencyRateToTHB(currency) {
  const normalized = normalizeCurrency(currency)
  const rate = normalized === 'USDT'
    ? getDemoSpotPriceTHB('USDT')
    : CURRENCY_TO_THB[normalized]
  return Number.isFinite(rate) && rate > 0 ? rate : null
}

export function getDemoSpotPriceTHB(asset) {
  const symbol = String(asset || '').trim().toUpperCase()
  if (!symbol) return null
  const pair = TRADING_PAIRS.find((candidate) => candidate.baseAsset === symbol && candidate.quoteAsset === 'THB')
  const price = Number(pair?.priceInTHB)
  return Number.isFinite(price) && price > 0 ? price : null
}

export function calculateAssetValuationTHB(item = {}) {
  const quantity = getOptionalFiniteNumber(item.shares)
  const currency = normalizeCurrency(item.currency)
  const rateToTHB = getCurrencyRateToTHB(currency)
  const demoSpotPrice = currency === 'THB' ? getDemoSpotPriceTHB(getAssetSymbol(item)) : null
  const unitPrice = demoSpotPrice ?? getOptionalFiniteNumber(item.currentPrice)
  const unitCost = getOptionalFiniteNumber(item.avgBuyPrice)
  const validQuantity = quantity !== null && quantity >= 0
  const validPrice = unitPrice !== null && unitPrice > 0
  const validCost = unitCost !== null && unitCost >= 0
  const canConvert = Boolean(currency) && rateToTHB !== null
  const currentValueTHB = validQuantity && validPrice && canConvert
    ? quantity * unitPrice * rateToTHB
    : null
  const costValueTHB = validQuantity && validCost && canConvert
    ? quantity * unitCost * rateToTHB
    : null
  const profitLossTHB = currentValueTHB !== null && costValueTHB !== null
    ? currentValueTHB - costValueTHB
    : null
  const priceSource = demoSpotPrice !== null || (currency === 'USDT' && rateToTHB !== null) ? 'DEMO' : 'USER'
  const priceSourceText = demoSpotPrice !== null
    ? `${getAssetSymbol(item)}/THB DEMO`
    : currency === 'USDT' && rateToTHB !== null ? 'USDT/THB DEMO' : 'ราคาที่ผู้ใช้กรอก'

  return {
    currency: currency || null,
    unitPrice,
    unitCost,
    priceSource,
    priceSourceText,
    currentValueTHB: Number.isFinite(currentValueTHB) ? currentValueTHB : null,
    costValueTHB: Number.isFinite(costValueTHB) ? costValueTHB : null,
    profitLossTHB: Number.isFinite(profitLossTHB) ? profitLossTHB : null,
    profitLossPercent: costValueTHB > 0 && profitLossTHB !== null
      ? (profitLossTHB / costValueTHB) * 100
      : null,
  }
}

export function calculatePortfolioValuation(portfolio = []) {
  const assets = (Array.isArray(portfolio) ? portfolio : []).map((item) => ({
    ...item,
    valuation: calculateAssetValuationTHB(item),
  }))
  const canValueAllAssets = assets.every((item) => item.valuation.currentValueTHB !== null)
  const canValueAllCosts = assets.every((item) => item.valuation.costValueTHB !== null)
  const totalValueTHB = canValueAllAssets
    ? assets.reduce((sum, item) => sum + item.valuation.currentValueTHB, 0)
    : null
  const totalCostTHB = canValueAllCosts
    ? assets.reduce((sum, item) => sum + item.valuation.costValueTHB, 0)
    : null
  const profitLossTHB = totalValueTHB !== null && totalCostTHB !== null
    ? totalValueTHB - totalCostTHB
    : null

  return {
    assets,
    totalValueTHB: Number.isFinite(totalValueTHB) ? totalValueTHB : null,
    totalCostTHB: Number.isFinite(totalCostTHB) ? totalCostTHB : null,
    profitLossTHB: Number.isFinite(profitLossTHB) ? profitLossTHB : null,
    profitLossPercent: totalCostTHB > 0 && profitLossTHB !== null
      ? (profitLossTHB / totalCostTHB) * 100
      : null,
  }
}

export function calculateSpotWalletValuation(spotBalances = {}, openOrders = []) {
  if (!spotBalances || typeof spotBalances !== 'object' || Array.isArray(spotBalances)) {
    return { rows: [], availableValueTHB: null, lockedValueTHB: null, totalValueTHB: null }
  }

  const lockedBalances = calculateLockedBalances(openOrders)
  const assets = new Set([...Object.keys(spotBalances), ...Object.keys(lockedBalances)])
  const rows = [...assets].map((asset) => {
    const rawAvailable = getOptionalFiniteNumber(spotBalances[asset])
    const rawLocked = getOptionalFiniteNumber(lockedBalances[asset] ?? 0)
    const validAvailable = rawAvailable !== null && rawAvailable >= 0
    const validLocked = rawLocked !== null && rawLocked >= 0
    const available = rawAvailable ?? 0
    const locked = rawLocked ?? 0
    const rateToTHB = asset === 'THB' ? 1 : getDemoSpotPriceTHB(asset)
    const total = available + locked
    const valueTHB = validAvailable && validLocked && rateToTHB !== null && Number.isFinite(total) && total >= 0
      ? total * rateToTHB
      : validAvailable && validLocked && total === 0 ? 0 : null

    return {
      asset,
      available,
      locked,
      total,
      unitPriceTHB: rateToTHB,
      valueTHB: Number.isFinite(valueTHB) ? valueTHB : null,
      availableValueTHB: validAvailable && (rateToTHB !== null || available === 0)
        ? available * (rateToTHB ?? 1)
        : null,
      lockedValueTHB: validLocked && (rateToTHB !== null || locked === 0)
        ? locked * (rateToTHB ?? 1)
        : null,
    }
  }).filter((row) => row.total !== 0 || row.asset === 'THB')

  const canValueAll = rows.every((row) => row.valueTHB !== null)
  const canValueAvailable = rows.every((row) => row.availableValueTHB !== null)
  const canValueLocked = rows.every((row) => row.lockedValueTHB !== null)
  const totalValueTHB = canValueAll ? rows.reduce((sum, row) => sum + row.valueTHB, 0) : null
  const availableValueTHB = canValueAvailable ? rows.reduce((sum, row) => sum + row.availableValueTHB, 0) : null
  const lockedValueTHB = canValueLocked ? rows.reduce((sum, row) => sum + row.lockedValueTHB, 0) : null

  return {
    rows,
    availableValueTHB: Number.isFinite(availableValueTHB) ? availableValueTHB : null,
    lockedValueTHB: Number.isFinite(lockedValueTHB) ? lockedValueTHB : null,
    totalValueTHB: Number.isFinite(totalValueTHB) ? totalValueTHB : null,
  }
}
