import { ethers } from "ethers"

import { WORLDLAND } from "./chain.js"
import {
  TORQR_BONDING_CURVE_ABI,
  TORQR_FACTORY_ABI,
  TORQR_FACTORY_STACKS,
  TORQR_POOL_ABI,
  TORQR_ZERO_ADDRESS,
} from "./torqrIntegration.js"

const DEFAULT_LOOKBACK_BLOCKS = 12000
const DEFAULT_LIMIT = 24

let sharedReadProvider = null

function getReadProvider() {
  if (!sharedReadProvider) {
    sharedReadProvider = new ethers.JsonRpcProvider(WORLDLAND.rpcUrls[0], WORLDLAND.chainId)
  }
  return sharedReadProvider
}

function toSafeAddress(address) {
  if (!address) return null
  try {
    const normalized = ethers.getAddress(address)
    return normalized === TORQR_ZERO_ADDRESS ? null : normalized
  } catch {
    return null
  }
}

function toBigInt(value) {
  try {
    return BigInt(value ?? 0)
  } catch {
    return 0n
  }
}

function toEtherFloat(value) {
  try {
    return Number(ethers.formatEther(toBigInt(value)))
  } catch {
    return 0
  }
}

function toDisplayFloat(value) {
  const text = String(value ?? "").trim().replace(/,/g, "")
  if (!text) return 0

  if (text.includes(".")) {
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : 0
  }

  try {
    return Number(ethers.formatEther(BigInt(text)))
  } catch {
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : 0
  }
}

function formatRelativeTime(timestamp) {
  const value = Number(timestamp || 0)
  if (!Number.isFinite(value) || value <= 0) return "-"

  const diff = Math.max(0, Math.floor(Date.now() / 1000) - value)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatNumber(value, maximumFractionDigits = 4) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return "0"
  if (numeric === 0) return "0"
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })
}

function getCandidateStacks(stackKey) {
  if (!stackKey) return TORQR_FACTORY_STACKS
  return [
    ...TORQR_FACTORY_STACKS.filter((stack) => stack.key === stackKey),
    ...TORQR_FACTORY_STACKS.filter((stack) => stack.key !== stackKey),
  ]
}

async function resolveStack(token) {
  const provider = getReadProvider()
  const tokenAddress = toSafeAddress(token?.address)
  if (!tokenAddress) return null

  for (const stack of getCandidateStacks(token?.stackKey)) {
    try {
      const factory = new ethers.Contract(stack.factoryAddress, TORQR_FACTORY_ABI, provider)
      const info = await factory.getTokenInfo(tokenAddress)
      const resolvedAddress = toSafeAddress(info?.tokenAddress ?? info?.[0])
      if (resolvedAddress && resolvedAddress.toLowerCase() === tokenAddress.toLowerCase()) {
        return stack
      }
    } catch {
      // Try the next stack.
    }
  }

  return null
}

function createTradeRecord({
  type,
  source,
  trader,
  wlcAmount,
  tokenAmount,
  txHash,
  blockNumber,
  logIndex,
  timestamp,
}) {
  const wlcAmountFloat = toEtherFloat(wlcAmount)
  const tokenAmountFloat = toEtherFloat(tokenAmount)
  const priceFloat = tokenAmountFloat > 0 ? wlcAmountFloat / tokenAmountFloat : 0

  return {
    id: `${txHash}-${logIndex}`,
    type,
    source,
    trader: toSafeAddress(trader) || TORQR_ZERO_ADDRESS,
    wlcAmountFloat,
    tokenAmountFloat,
    priceFloat,
    txHash,
    blockNumber,
    logIndex,
    timestamp,
    time: formatRelativeTime(timestamp),
  }
}

async function loadCurveTrades(tokenAddress, stack, fromBlock, toBlock) {
  const provider = getReadProvider()
  const bondingCurve = new ethers.Contract(stack.bondingCurveAddress, TORQR_BONDING_CURVE_ABI, provider)

  const [buyEvents, sellEvents] = await Promise.all([
    bondingCurve.queryFilter(bondingCurve.filters.Buy(tokenAddress), fromBlock, toBlock),
    bondingCurve.queryFilter(bondingCurve.filters.Sell(tokenAddress), fromBlock, toBlock),
  ])

  return [
    ...buyEvents.map((event) => ({
      type: "buy",
      source: "bonding",
      trader: event.args?.buyer,
      wlcAmount: event.args?.wlcIn,
      tokenAmount: event.args?.tokensOut,
      txHash: event.transactionHash,
      blockNumber: Number(event.blockNumber || 0),
      logIndex: Number(event.index || 0),
    })),
    ...sellEvents.map((event) => ({
      type: "sell",
      source: "bonding",
      trader: event.args?.seller,
      wlcAmount: event.args?.wlcOut,
      tokenAmount: event.args?.tokensIn,
      txHash: event.transactionHash,
      blockNumber: Number(event.blockNumber || 0),
      logIndex: Number(event.index || 0),
    })),
  ]
}

async function loadPoolTrades(poolAddress, fromBlock, toBlock) {
  const normalizedPool = toSafeAddress(poolAddress)
  if (!normalizedPool) return []

  const provider = getReadProvider()
  const pool = new ethers.Contract(normalizedPool, TORQR_POOL_ABI, provider)
  const events = await pool.queryFilter(pool.filters.Swap(), fromBlock, toBlock)

  return events.map((event) => {
    const wlcIn = Boolean(event.args?.wlcIn)
    const amountIn = event.args?.amountIn
    const amountOut = event.args?.amountOut

    return {
      type: wlcIn ? "buy" : "sell",
      source: "amm",
      trader: event.args?.sender,
      wlcAmount: wlcIn ? amountIn : amountOut,
      tokenAmount: wlcIn ? amountOut : amountIn,
      txHash: event.transactionHash,
      blockNumber: Number(event.blockNumber || 0),
      logIndex: Number(event.index || 0),
    }
  })
}

async function attachTimestamps(records) {
  const provider = getReadProvider()
  const uniqueBlocks = [...new Set(records.map((record) => record.blockNumber).filter((value) => value > 0))]
  const blockEntries = await Promise.all(
    uniqueBlocks.map(async (blockNumber) => {
      const block = await provider.getBlock(blockNumber)
      return [blockNumber, Number(block?.timestamp || 0)]
    }),
  )
  const blockTimes = new Map(blockEntries)

  return records.map((record) =>
    createTradeRecord({
      ...record,
      timestamp: blockTimes.get(record.blockNumber) || 0,
    }),
  )
}

export function buildTorqrTradeSeries(trades) {
  return [...trades]
    .filter((trade) => Number.isFinite(Number(trade?.priceFloat)) && Number(trade.priceFloat) > 0)
    .sort((left, right) => Number(left.timestamp || 0) - Number(right.timestamp || 0))
    .map((trade) => ({
      timestamp: Number(trade.timestamp || 0),
      priceFloat: Number(trade.priceFloat || 0),
    }))
}

export function summarizeTorqrTrades(trades, fallbackPrice = 0) {
  const series = buildTorqrTradeSeries(trades)
  const safeFallback = Number.isFinite(Number(fallbackPrice)) ? Number(fallbackPrice) : 0

  if (series.length === 0) {
    return {
      series: [{ timestamp: Math.floor(Date.now() / 1000), priceFloat: safeFallback }],
      lastPrice: safeFallback,
      lowPrice: safeFallback,
      highPrice: safeFallback,
      changePct: 0,
      tradeCount: 0,
    }
  }

  const prices = series.map((point) => point.priceFloat)
  const firstPrice = prices[0]
  const lastPrice = prices[prices.length - 1]
  const lowPrice = Math.min(...prices)
  const highPrice = Math.max(...prices)

  return {
    series,
    lastPrice,
    lowPrice,
    highPrice,
    changePct: firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0,
    tradeCount: trades.length,
  }
}

export function estimateTorqrFallbackPrice(token) {
  const reserve = toDisplayFloat(token?.reserveWlc || token?.mcapDisplay || 0)
  const sold = toDisplayFloat(token?.soldSupply || 0)
  if (reserve > 0 && sold > 0) return reserve / sold
  return 0
}

export function formatTorqrActivityPrice(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return "-"
  if (numeric < 0.000001) return numeric.toExponential(2)
  if (numeric < 0.01) return numeric.toFixed(6)
  if (numeric < 1) return numeric.toFixed(4)
  return formatNumber(numeric, 4)
}

export function formatTorqrActivityAmount(value, suffix = "") {
  const label = formatNumber(value, value >= 1000 ? 2 : 4)
  return suffix ? `${label} ${suffix}` : label
}

export async function loadTorqrTradeActivity(token, { limit = DEFAULT_LIMIT, lookbackBlocks = DEFAULT_LOOKBACK_BLOCKS } = {}) {
  const tokenAddress = toSafeAddress(token?.address)
  if (!tokenAddress) {
    return { trades: [], source: "none" }
  }

  const provider = getReadProvider()
  const stack = await resolveStack(token)
  if (!stack) {
    return { trades: [], source: "none" }
  }

  const latestBlock = await provider.getBlockNumber()
  const fromBlock = Math.max(0, latestBlock - Math.max(1000, Number(lookbackBlocks || DEFAULT_LOOKBACK_BLOCKS)))

  const [curveTrades, poolTrades] = await Promise.all([
    loadCurveTrades(tokenAddress, stack, fromBlock, latestBlock).catch(() => []),
    loadPoolTrades(token?.poolAddress, fromBlock, latestBlock).catch(() => []),
  ])

  const timestamped = await attachTimestamps(
    [...curveTrades, ...poolTrades]
      .sort((left, right) => {
        if (right.blockNumber !== left.blockNumber) return right.blockNumber - left.blockNumber
        return right.logIndex - left.logIndex
      })
      .slice(0, Math.max(1, Number(limit || DEFAULT_LIMIT))),
  )

  return {
    source: poolTrades.length > 0 ? "mixed" : "chain",
    trades: timestamped.sort((left, right) => {
      if (right.timestamp !== left.timestamp) return right.timestamp - left.timestamp
      if (right.blockNumber !== left.blockNumber) return right.blockNumber - left.blockNumber
      return right.logIndex - left.logIndex
    }),
  }
}
