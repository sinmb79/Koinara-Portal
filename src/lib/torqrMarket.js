import { ethers } from "ethers"
import { WORLDLAND, shortAddress } from "./chain.js"
import {
  TORQR_APP_URL,
  TORQR_BONDING_CURVE_ABI,
  TORQR_BONDING_CURVE_ADDRESS,
  TORQR_FACTORY_ABI,
  TORQR_FACTORY_ADDRESS,
  TORQR_INDEXER_API_BASE_URL,
} from "./torqrIntegration.js"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const DEFAULT_TICKER_LIMIT = 12

let sharedReadProvider = null

function normalizeUrl(value) {
  const normalized = String(value || "").trim().replace(/\/+$/, "")
  if (!normalized) return ""

  try {
    return new URL(`${normalized}/`).toString().replace(/\/$/, "")
  } catch {
    return ""
  }
}

function formatNumber(value, { maximumFractionDigits = 2, zero = "0" } = {}) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return zero
  if (numeric === 0) return zero

  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })
}

function timeAgo(timestampSeconds) {
  const value = Number(timestampSeconds || 0)
  if (!Number.isFinite(value) || value <= 0) return "-"

  const diff = Math.max(0, Math.floor(Date.now() / 1000) - value)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`
  return `${Math.floor(diff / 2592000)}mo ago`
}

function buildBadge(symbol, name) {
  const raw = String(symbol || name || "?").replace(/[^a-z0-9]/gi, "").toUpperCase()
  return raw.slice(0, 2) || "??"
}

function toSafeAddress(address) {
  try {
    return ethers.getAddress(address)
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

function toWlcDisplay(value) {
  try {
    return formatNumber(ethers.formatEther(toBigInt(value)), {
      maximumFractionDigits: 4,
    })
  } catch {
    return "0"
  }
}

function toTokenAmountDisplay(value) {
  try {
    return formatNumber(ethers.formatEther(toBigInt(value)), {
      maximumFractionDigits: 2,
    })
  } catch {
    return "0"
  }
}

export function resolveTorqrApiBaseUrl({
  apiBaseUrl = TORQR_INDEXER_API_BASE_URL,
  appUrl = TORQR_APP_URL,
} = {}) {
  return normalizeUrl(apiBaseUrl) || normalizeUrl(appUrl)
}

export function getTorqrApiQuery(tab) {
  switch (tab) {
    case "new":
      return { sort: "newest", graduated: undefined }
    case "graduating":
      return { sort: "progress", graduated: false }
    case "graduated":
      return { sort: "mcap", graduated: true }
    case "trending":
    default:
      return { sort: "volume", graduated: undefined }
  }
}

export function normalizeTorqrListToken(token) {
  const address = toSafeAddress(token?.address || token?.tokenAddress)
  const creator = toSafeAddress(token?.creator) || ZERO_ADDRESS
  const symbol = String(token?.symbol || "").trim() || "TOKEN"
  const name = String(token?.name || "").trim() || shortAddress(address || ZERO_ADDRESS)
  const createdAt = Number(token?.createdAt || 0)
  const mcapDisplay = formatNumber(token?.mcap, { maximumFractionDigits: 4 })
  const volume24hDisplay = formatNumber(token?.volume24h, { maximumFractionDigits: 4 })

  return {
    address: address || ZERO_ADDRESS,
    creator,
    name,
    symbol,
    description: String(token?.description || "").trim(),
    imageUri: String(token?.imageUri || "").trim(),
    createdAt,
    createdAgo: String(token?.createdAgo || "").trim() || timeAgo(createdAt),
    graduated: Boolean(token?.graduated),
    poolAddress: toSafeAddress(token?.poolAddress),
    reserveWlc: String(token?.reserveWlc || token?.mcap || "0"),
    soldSupply: String(token?.soldSupply || "0"),
    progress: Number(token?.progress || 0),
    mcapDisplay,
    volume24hDisplay,
    badge: buildBadge(symbol, name),
    source: token?.source || "api",
  }
}

function numericValue(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDuplicateKey(value) {
  return String(value || "").trim().toLowerCase()
}

export function applyTorqrTokenFilters(tokens, { tab = "trending", search = "" } = {}) {
  const query = String(search || "").trim().toLowerCase()
  let list = [...tokens]

  if (query) {
    list = list.filter((token) => {
      return (
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      )
    })
  }

  switch (tab) {
    case "new":
      return list.sort((left, right) => right.createdAt - left.createdAt)
    case "graduating":
      return list
        .filter((token) => !token.graduated)
        .sort((left, right) => right.progress - left.progress)
    case "graduated":
      return list
        .filter((token) => token.graduated)
        .sort((left, right) => numericValue(right.mcapDisplay) - numericValue(left.mcapDisplay))
    case "trending":
    default:
      return list.sort((left, right) => {
        const volumeDelta = numericValue(right.volume24hDisplay) - numericValue(left.volume24hDisplay)
        if (volumeDelta !== 0) return volumeDelta
        return right.createdAt - left.createdAt
      })
  }
}

export function buildTorqrStatsSnapshot({ stats = null, tokens = [] } = {}) {
  if (stats) {
    return {
      totalTokens: Number(stats.totalTokens || 0),
      graduatedTokens: Number(stats.graduatedTokens || 0),
      volume24h: stats.volume24h == null ? null : String(stats.volume24h),
      activeTraders24h: stats.activeTraders24h == null ? null : Number(stats.activeTraders24h),
    }
  }

  return {
    totalTokens: tokens.length,
    graduatedTokens: tokens.filter((token) => token.graduated).length,
    volume24h: null,
    activeTraders24h: null,
  }
}

export function findTorqrDuplicateTokenInList(tokens, { name = "", symbol = "" } = {}) {
  const normalizedName = normalizeDuplicateKey(name)
  const normalizedSymbol = normalizeDuplicateKey(symbol)

  if (normalizedName) {
    const byName = tokens.find((token) => normalizeDuplicateKey(token.name) === normalizedName)
    if (byName) {
      return { field: "name", token: byName }
    }
  }

  if (normalizedSymbol) {
    const bySymbol = tokens.find((token) => normalizeDuplicateKey(token.symbol) === normalizedSymbol)
    if (bySymbol) {
      return { field: "symbol", token: bySymbol }
    }
  }

  return null
}

function buildUrl(baseUrl, path, params = {}) {
  const url = new URL(path, `${baseUrl}/`)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function fetchJson(baseUrl, path, params = {}, { signal, fetchImpl = fetch } = {}) {
  if (!baseUrl) {
    throw new Error("Torqr API base URL is not configured.")
  }

  const response = await fetchImpl(buildUrl(baseUrl, path, params), { signal })
  if (!response.ok) {
    throw new Error(`Torqr API request failed: ${response.status}`)
  }

  return response.json()
}

function getReadProvider() {
  if (!sharedReadProvider) {
    sharedReadProvider = new ethers.JsonRpcProvider(WORLDLAND.rpcUrls[0], WORLDLAND.chainId)
  }
  return sharedReadProvider
}

function createContracts(provider) {
  return {
    factory: new ethers.Contract(TORQR_FACTORY_ADDRESS, TORQR_FACTORY_ABI, provider),
    bondingCurve: new ethers.Contract(TORQR_BONDING_CURVE_ADDRESS, TORQR_BONDING_CURVE_ABI, provider),
  }
}

function normalizeChainToken(address, info, curveState, progress) {
  const createdAt = Number(info?.createdAt ?? info?.[4] ?? 0)
  const graduated = Boolean(info?.graduated ?? info?.[5] ?? curveState?.graduated ?? curveState?.[5] ?? false)
  const reserveWlc = curveState?.reserveWLC ?? curveState?.[4] ?? 0n
  const soldSupply = curveState?.soldSupply ?? curveState?.[3] ?? 0n

  return normalizeTorqrListToken({
    address,
    creator: info?.creator ?? info?.[1] ?? ZERO_ADDRESS,
    name: info?.name ?? info?.[2] ?? shortAddress(address),
    symbol: info?.symbol ?? info?.[3] ?? "TOKEN",
    createdAt,
    createdAgo: timeAgo(createdAt),
    graduated,
    reserveWlc,
    soldSupply,
    progress: Number(progress ?? 0) / 100,
    mcap: toWlcDisplay(reserveWlc),
    volume24h: "0",
    source: "chain",
  })
}

async function loadTorqrTokensFromChain() {
  const provider = getReadProvider()
  const { factory, bondingCurve } = createContracts(provider)
  const tokenAddresses = await factory.getAllTokens()

  const records = await Promise.all(
    tokenAddresses.map(async (tokenAddress) => {
      try {
        const [info, curveState, progress] = await Promise.all([
          factory.getTokenInfo(tokenAddress),
          bondingCurve.getCurveState(tokenAddress),
          bondingCurve.getProgress(tokenAddress),
        ])
        return normalizeChainToken(tokenAddress, info, curveState, progress)
      } catch {
        return null
      }
    }),
  )

  return records.filter(Boolean).sort((left, right) => right.createdAt - left.createdAt)
}

async function loadAllTorqrTokens({ fetchImpl } = {}) {
  const baseUrl = resolveTorqrApiBaseUrl()

  if (baseUrl) {
    try {
      const result = await fetchJson(
        baseUrl,
        "/api/tokens",
        {
          sort: "newest",
          limit: 500,
          offset: 0,
        },
        { fetchImpl },
      )
      return (result?.tokens || []).map((token) => normalizeTorqrListToken({ ...token, source: "api" }))
    } catch {
      // Fall back to on-chain reads below.
    }
  }

  return loadTorqrTokensFromChain()
}

async function loadTorqrTickerFromChain(limit = DEFAULT_TICKER_LIMIT) {
  const provider = getReadProvider()
  const { factory } = createContracts(provider)
  const latestBlock = await provider.getBlockNumber()
  const fromBlock = Math.max(0, latestBlock - 12000)
  const events = await factory.queryFilter(factory.filters.TokenCreated(), fromBlock, latestBlock)
  const recentEvents = events.slice(-limit).reverse()
  const blockCache = new Map()

  return Promise.all(
    recentEvents.map(async (event) => {
      const blockNumber = Number(event.blockNumber || 0)
      if (!blockCache.has(blockNumber)) {
        blockCache.set(blockNumber, await provider.getBlock(blockNumber))
      }

      const block = blockCache.get(blockNumber)
      const timestamp = Number(block?.timestamp || 0)
      return {
        type: "create",
        token: String(event.args?.symbol || "NEW"),
        tokenAddress: toSafeAddress(event.args?.tokenAddress) || ZERO_ADDRESS,
        amount: "1 WLC",
        time: timeAgo(timestamp),
        timestamp,
      }
    }),
  )
}

async function loadTorqrTokenFromChain(address) {
  const provider = getReadProvider()
  const { factory, bondingCurve } = createContracts(provider)
  const [info, curveState, progress] = await Promise.all([
    factory.getTokenInfo(address),
    bondingCurve.getCurveState(address),
    bondingCurve.getProgress(address),
  ])

  return normalizeChainToken(address, info, curveState, progress)
}

export async function loadTorqrMarketSnapshot({
  tab = "trending",
  search = "",
  signal,
  fetchImpl,
} = {}) {
  const baseUrl = resolveTorqrApiBaseUrl()
  const apiQuery = getTorqrApiQuery(tab)

  const [tokensResult, statsResult, tickerResult] = await Promise.allSettled([
    fetchJson(
      baseUrl,
      "/api/tokens",
      {
        sort: apiQuery.sort,
        graduated: apiQuery.graduated,
        search,
        limit: 100,
        offset: 0,
      },
      { signal, fetchImpl },
    ),
    fetchJson(baseUrl, "/api/stats", {}, { signal, fetchImpl }),
    fetchJson(baseUrl, "/api/ticker", { limit: DEFAULT_TICKER_LIMIT }, { signal, fetchImpl }),
  ])

  if (tokensResult.status === "fulfilled") {
    const tokens = applyTorqrTokenFilters(
      (tokensResult.value?.tokens || []).map((token) => normalizeTorqrListToken({ ...token, source: "api" })),
      { tab, search },
    )

    const stats = buildTorqrStatsSnapshot({
      stats: statsResult.status === "fulfilled" ? statsResult.value : null,
      tokens,
    })
    const ticker =
      tickerResult.status === "fulfilled"
        ? (tickerResult.value?.items || []).map((item) => ({
            type: item.type,
            token: item.token,
            tokenAddress: item.tokenAddress,
            amount: item.amount,
            time: item.time,
            timestamp: Number(item.timestamp || 0),
          }))
        : []

    return {
      source: "api",
      tokens,
      stats,
      ticker,
    }
  }

  const tokens = applyTorqrTokenFilters(await loadTorqrTokensFromChain(), { tab, search })
  const [ticker, selectedStats] = await Promise.all([
    loadTorqrTickerFromChain().catch(() => []),
    statsResult.status === "fulfilled" ? statsResult.value : null,
  ])

  return {
    source: "chain",
    tokens,
    stats: buildTorqrStatsSnapshot({ stats: selectedStats, tokens }),
    ticker,
  }
}

export async function loadTorqrTokenDetail(address, { fetchImpl } = {}) {
  const normalizedAddress = toSafeAddress(address)
  if (!normalizedAddress) return null

  const baseUrl = resolveTorqrApiBaseUrl()
  if (baseUrl) {
    try {
      const token = await fetchJson(baseUrl, `/api/tokens/${normalizedAddress}`, {}, { fetchImpl })
      return normalizeTorqrListToken({ ...token, source: "api" })
    } catch {
      // Fall back to on-chain reads below.
    }
  }

  try {
    return await loadTorqrTokenFromChain(normalizedAddress)
  } catch {
    return null
  }
}

export async function findTorqrDuplicateToken({ name = "", symbol = "", fetchImpl } = {}) {
  const tokens = await loadAllTorqrTokens({ fetchImpl })
  return findTorqrDuplicateTokenInList(tokens, { name, symbol })
}

export function formatTorqrStatValue(label, stats) {
  switch (label) {
    case "Total Tokens":
      return String(stats.totalTokens || 0)
    case "24h Volume":
      return stats.volume24h == null ? "-" : `${formatNumber(stats.volume24h, { maximumFractionDigits: 4 })} WLC`
    case "Graduated":
      return String(stats.graduatedTokens || 0)
    case "Active Traders":
      return stats.activeTraders24h == null ? "-" : String(stats.activeTraders24h)
    default:
      return "-"
  }
}

export function formatTorqrTokenDetailStats(token) {
  return [
    ["Token", `${token.name} ($${token.symbol})`, null],
    ["Address", shortAddress(token.address), null],
    ["Creator", shortAddress(token.creator), null],
    ["Progress", `${formatNumber(token.progress, { maximumFractionDigits: 2 })}%`, null],
    ["Market Cap", `${token.mcapDisplay} WLC`, null],
    ["24h Volume", `${token.volume24hDisplay} WLC`, null],
    ["Sold Supply", toTokenAmountDisplay(token.soldSupply), null],
    ["Status", token.graduated ? "AMM" : "Bonding Curve", token.graduated ? "#22c55e" : "#00e5ff"],
  ]
}
