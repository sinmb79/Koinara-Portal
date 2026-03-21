import { ethers } from "ethers"

export const TORQR_ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
export const TORQR_SLIPPAGE_OPTIONS = [50, 100, 300]
export const TORQR_DEFAULT_SLIPPAGE = 100
export const TORQR_TRADING_FEE_BPS = 100

export function toBigInt(value, fallback = 0n) {
  try {
    return BigInt(value ?? 0)
  } catch {
    return fallback
  }
}

export function parseTorqrAmount(value, decimals = 18) {
  const normalized = String(value || "").trim()
  if (!normalized) return 0n

  try {
    return ethers.parseUnits(normalized, decimals)
  } catch {
    return 0n
  }
}

export function formatTorqrWlc(value, decimals = 18) {
  try {
    const numeric = Number(ethers.formatUnits(toBigInt(value), decimals))
    if (!Number.isFinite(numeric) || numeric === 0) return "0"
    if (numeric < 0.0001) return "<0.0001"
    return numeric.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    })
  } catch {
    return "0"
  }
}

export function formatTorqrTokenAmount(value, decimals = 18) {
  try {
    const numeric = Number(ethers.formatUnits(toBigInt(value), decimals))
    if (!Number.isFinite(numeric) || numeric === 0) return "0"
    if (numeric < 0.01) return numeric.toFixed(6)
    if (numeric < 1000) return numeric.toFixed(2)
    if (numeric < 1000000) return `${(numeric / 1000).toFixed(2)}K`
    if (numeric < 1000000000) return `${(numeric / 1000000).toFixed(2)}M`
    return `${(numeric / 1000000000).toFixed(2)}B`
  } catch {
    return "0"
  }
}

export function applyTorqrSlippage(amount, slippageBps) {
  const normalizedAmount = toBigInt(amount)
  const normalizedBps = Number(slippageBps || 0)
  if (normalizedAmount <= 0n) return 0n
  return (normalizedAmount * BigInt(10000 - normalizedBps)) / 10000n
}

export function calculateMinimumBuyGrossWlc({
  oneTokenNetCostWei,
  tradingFeeBps = TORQR_TRADING_FEE_BPS,
}) {
  const normalizedCost = toBigInt(oneTokenNetCostWei)
  const feeBps = Number(tradingFeeBps || 0)
  const denominator = 10000 - feeBps

  if (normalizedCost <= 0n || denominator <= 0) return 0n

  const numerator = normalizedCost * 10000n
  return (numerator + BigInt(denominator - 1)) / BigInt(denominator)
}

export async function estimateBuyTokensForWlc({
  budgetWlc,
  remainingSupply,
  getBuyPrice,
  step = 10n ** 18n,
}) {
  const normalizedBudget = toBigInt(budgetWlc)
  const normalizedSupply = toBigInt(remainingSupply)
  const granularity = step > 0n ? step : 1n

  if (normalizedBudget <= 0n || normalizedSupply <= 0n) {
    return 0n
  }

  const maxUnits = normalizedSupply / granularity
  if (maxUnits === 0n) {
    return 0n
  }

  let low = 0n
  let high = maxUnits
  let best = 0n

  while (low <= high) {
    const midUnits = (low + high) / 2n
    const amount = midUnits * granularity
    const cost = toBigInt(await getBuyPrice(amount))

    if (cost <= normalizedBudget) {
      best = amount
      low = midUnits + 1n
    } else {
      if (midUnits === 0n) break
      high = midUnits - 1n
    }
  }

  return best
}

export function getTorqrTradePrimaryActionLabel({
  isConnected,
  isCorrectChain,
  isBusy,
  tradeMode,
  requiresApproval,
  txAction,
}) {
  if (!isConnected) return "Connect Wallet"
  if (!isCorrectChain) return "Switch Worldland"

  if (isBusy) {
    if (txAction === "approve") return "Approving..."
    if (txAction === "sell") return "Selling..."
    if (txAction === "buy") return "Buying..."
    return "Processing..."
  }

  if (tradeMode === "sell" && requiresApproval) {
    return "Approve Tokens"
  }

  return tradeMode === "buy" ? "Buy Tokens" : "Sell Tokens"
}

export function getTorqrSwapPrimaryActionLabel({
  isConnected,
  isCorrectChain,
  isBusy,
  requiresApproval,
  txAction,
}) {
  if (!isConnected) return "Connect Wallet"
  if (!isCorrectChain) return "Switch Worldland"

  if (isBusy) {
    if (txAction === "approve") return "Approving..."
    if (txAction === "swap") return "Swapping..."
    return "Processing..."
  }

  if (requiresApproval) {
    return "Approve Tokens"
  }

  return "Swap"
}
