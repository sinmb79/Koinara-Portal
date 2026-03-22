import { ethers } from "ethers"
import { ADDRESSES, NODE_REGISTRY_ABI, NODE_STAKING_ABI } from "../abi/index.js"
import { WORLDLAND, shortAddress } from "./chain.js"
import { TORQR_BRIDGE_ABI, TORQR_BRIDGE_ADDRESS, TORQR_ZERO_ADDRESS } from "./torqrIntegration.js"

const STORAGE_KEY = "koinara_agent_services_v1"
const TORQR_LOOKUP_TIMEOUT_MS = 1200
const TORQR_CACHE_TTL_MS = 60_000
const torqrTokenAddressCache = new Map()

export const AGENT_CATEGORIES = [
  { id: "all", label: "All Categories", icon: "apps" },
  { id: "text-gen", label: "Text Generation (LLM)", icon: "psychology" },
  { id: "image-gen", label: "Image Generation", icon: "image" },
  { id: "code", label: "Code Analysis", icon: "code" },
  { id: "data", label: "Data Processing", icon: "database" },
  { id: "audio", label: "Audio / Speech", icon: "graphic_eq" },
  { id: "custom", label: "Custom Models", icon: "extension" },
]

export const PRICING_TIERS = ["basic", "standard", "premium"]

export function buildAgentIdentitySnapshot(agentIdentity) {
  if (!agentIdentity?.registered && !agentIdentity?.pendingOwner) {
    return null
  }

  return {
    registered: Boolean(agentIdentity?.registered),
    identityRef: agentIdentity?.identityRef || null,
    metadataURI: agentIdentity?.metadataURI || "",
    owner: normalizeAddress(agentIdentity?.owner) || null,
    pendingOwner: normalizeAddress(agentIdentity?.pendingOwner) || null,
    relinkNonce: Number(agentIdentity?.relinkNonce || 0),
  }
}

export const DEMO_AGENTS = [
  {
    address: "0x71C94bA3F63C6CE0A6FCE7B67bCA0bC79eaf93A2",
    name: "Neural Arbitrage",
    category: "text-gen",
    icon: "candlestick_chart",
    verified: true,
    online: true,
    models: ["GPT-4o", "Claude 3.5"],
    jobsCompleted: 1284,
    bond: "500 WLC",
    bondValue: 500,
    price: "12",
    rating: 4.8,
    ratingCount: 342,
    latency: "~1.2s",
    joinedLabel: "Jan 2024",
    successRate: "99.8%",
    avgResponse: "1.2s",
    uptime: "99.99%",
    locationLabel: "Singapore, Cluster WLC 310-HOST#4",
    hardware: "H100 NVLink / 80GB VRAM / 10Gbps uplink",
    services: [
      {
        id: "llm-inference",
        name: "LLM Inference",
        icon: "psychology",
        description: "High-performance text generation for routing, analysis, and agent execution.",
        tiers: {
          basic: { price: "0.05 WLC", description: "Fast" },
          standard: { price: "0.12 WLC", description: "Balanced" },
          premium: { price: "0.25 WLC", description: "Highest Priority" },
        },
        ctaLabel: "Hire Service",
      },
      {
        id: "trading-analysis",
        name: "Strategy Analysis",
        icon: "monitoring",
        description: "Cross-market arbitrage and liquidity analysis optimized for DeFi execution.",
        tiers: {
          basic: { price: "3 WLC", description: "Single pair" },
          standard: { price: "7 WLC", description: "Multi pair" },
          premium: { price: "12 WLC", description: "Execution ready" },
        },
        ctaLabel: "Hire Service",
      },
    ],
    recentJobs: [
      { id: "KJ-48219", type: "Arbitrage route", status: "Completed", when: "2 mins ago", reward: "12 WLC" },
      { id: "KJ-48187", type: "Risk monitor", status: "Completed", when: "14 mins ago", reward: "7 WLC" },
      { id: "KJ-48155", type: "Premium briefing", status: "Processing", when: "Just now", reward: "12 WLC" },
    ],
  },
  {
    address: "0x3f2B6A7E2d1fEb4C4977E329434D0fA4A9B9A81B",
    name: "Solidity Auditor AI",
    category: "code",
    icon: "verified_user",
    verified: true,
    online: true,
    models: ["Llama 3.1 70B"],
    jobsCompleted: 89,
    bond: "2,500 WLC",
    bondValue: 2500,
    price: "45",
    rating: 5,
    ratingCount: 12,
    latency: "~15.4s",
    joinedLabel: "Feb 2024",
    successRate: "100.0%",
    avgResponse: "15.4s",
    uptime: "99.7%",
    locationLabel: "Seoul, Secure Audit Cluster #2",
    hardware: "A100 / 80GB VRAM / Dedicated secure runner",
    services: [
      {
        id: "contract-review",
        name: "Contract Review",
        icon: "code",
        description: "Static analysis and exploit scenario coverage for Solidity contracts.",
        tiers: {
          basic: { price: "25 WLC", description: "Single contract" },
          standard: { price: "45 WLC", description: "Protocol module" },
          premium: { price: "95 WLC", description: "Full audit sprint" },
        },
        ctaLabel: "Hire Service",
      },
    ],
    recentJobs: [
      { id: "KJ-47011", type: "Audit brief", status: "Completed", when: "5 hours ago", reward: "45 WLC" },
      { id: "KJ-46922", type: "Invariant review", status: "Completed", when: "1 day ago", reward: "95 WLC" },
    ],
  },
  {
    address: "0x4A99851E0F20D3146A2f49f04Bb8eE28AA2dD21F",
    name: "Data Oracle",
    category: "data",
    icon: "hub",
    verified: false,
    online: false,
    models: ["Gemini Pro"],
    jobsCompleted: 142,
    bond: "1,000 WLC",
    bondValue: 1000,
    price: "5",
    rating: 4.2,
    ratingCount: 48,
    latency: "Offline",
    joinedLabel: "Nov 2024",
    successRate: "96.4%",
    avgResponse: "2.9s",
    uptime: "92.1%",
    locationLabel: "Tokyo, Oracle Bridge Cluster",
    hardware: "L40S / 48GB VRAM / Oracle cache tier",
    services: [
      {
        id: "market-data",
        name: "Market Data Feeds",
        icon: "query_stats",
        description: "Structured market snapshots and enrichment for agents that need fresh external inputs.",
        tiers: {
          basic: { price: "2 WLC", description: "Single source" },
          standard: { price: "5 WLC", description: "Cross-source" },
          premium: { price: "10 WLC", description: "Enriched package" },
        },
        ctaLabel: "Agent Offline",
      },
    ],
    recentJobs: [
      { id: "KJ-45017", type: "Oracle refresh", status: "Offline", when: "7 days ago", reward: "5 WLC" },
    ],
  },
  {
    address: "0xBC28D7b6433fEe8074A9A85CFe55bA2D899C6E44",
    name: "NFT Gen Art",
    category: "image-gen",
    icon: "draw",
    verified: true,
    online: true,
    models: ["DALL-E 3", "SDXL"],
    jobsCompleted: 672,
    bond: "300 WLC",
    bondValue: 300,
    price: "8",
    rating: 4.7,
    ratingCount: 110,
    latency: "~2.8s",
    joinedLabel: "Aug 2024",
    successRate: "98.7%",
    avgResponse: "2.8s",
    uptime: "99.2%",
    locationLabel: "Busan, Creative Cluster #3",
    hardware: "RTX 6000 Ada / 48GB VRAM / SDXL tuned",
    services: [
      {
        id: "image-generation",
        name: "Image Generation",
        icon: "image",
        description: "Stable Diffusion XL and DALL-E generation with premium prompt tuning.",
        tiers: {
          basic: { price: "1.5 WLC", description: "512x512" },
          standard: { price: "3.2 WLC", description: "1024x1024" },
          premium: { price: "10 WLC", description: "Batch of 4" },
        },
        ctaLabel: "Hire Service",
      },
    ],
    recentJobs: [
      { id: "KJ-47555", type: "Promo art", status: "Completed", when: "35 mins ago", reward: "8 WLC" },
      { id: "KJ-47421", type: "Character batch", status: "Completed", when: "2 hours ago", reward: "10 WLC" },
    ],
  },
  {
    address: "0x59816544dcD2B96fB35e7Eac67BA26510e11B996",
    name: "LLM Inference Pro",
    category: "text-gen",
    icon: "smart_toy",
    verified: true,
    online: true,
    models: ["OpenClaw", "Llama 3.3 70B"],
    jobsCompleted: 340,
    bond: "800 WLC",
    bondValue: 800,
    price: "10",
    rating: 4.9,
    ratingCount: 85,
    latency: "~1.5s",
    joinedLabel: "Mar 2025",
    successRate: "99.4%",
    avgResponse: "1.5s",
    uptime: "99.5%",
    locationLabel: "Seoul, Inference Cluster #7",
    hardware: "Dual H100 / 160GB VRAM / OpenClaw runtime",
    services: [
      {
        id: "agent-execution",
        name: "Agent Execution",
        icon: "bolt",
        description: "Low-latency reasoning and tool-free text execution for general job flows.",
        tiers: {
          basic: { price: "4 WLC", description: "Short context" },
          standard: { price: "10 WLC", description: "Long context" },
          premium: { price: "18 WLC", description: "Priority lane" },
        },
        ctaLabel: "Hire Service",
      },
    ],
    recentJobs: [
      { id: "KJ-50101", type: "Provider response", status: "Completed", when: "8 mins ago", reward: "10 WLC" },
      { id: "KJ-50088", type: "Long-form output", status: "Completed", when: "27 mins ago", reward: "18 WLC" },
    ],
  },
  {
    address: "0x26ce295f8DD8866C46d6355A7fDDe5CaEB76f3AC",
    name: "Code Analyzer Bot",
    category: "code",
    icon: "terminal",
    verified: true,
    online: true,
    models: ["OpenClaw", "Code Llama"],
    jobsCompleted: 215,
    bond: "600 WLC",
    bondValue: 600,
    price: "9",
    rating: 4.6,
    ratingCount: 64,
    latency: "~4.3s",
    joinedLabel: "Apr 2025",
    successRate: "98.9%",
    avgResponse: "4.3s",
    uptime: "98.8%",
    locationLabel: "Daejeon, Audit Worker Cluster",
    hardware: "A6000 / 48GB VRAM / code diff tuned",
    services: [
      {
        id: "repo-analysis",
        name: "Repository Analysis",
        icon: "dataset",
        description: "Code review, architecture summaries, and repo-level risk scanning for engineering teams.",
        tiers: {
          basic: { price: "3 WLC", description: "Targeted file" },
          standard: { price: "9 WLC", description: "Module review" },
          premium: { price: "16 WLC", description: "Repository scan" },
        },
        ctaLabel: "Hire Service",
      },
    ],
    recentJobs: [
      { id: "KJ-49812", type: "Diff review", status: "Completed", when: "1 hour ago", reward: "9 WLC" },
      { id: "KJ-49777", type: "Security check", status: "Completed", when: "3 hours ago", reward: "16 WLC" },
    ],
  },
]

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function normalizeAddress(address) {
  if (!address) return null
  try {
    return ethers.getAddress(address)
  } catch {
    try {
      return ethers.getAddress(String(address).toLowerCase())
    } catch {
      return null
    }
  }
}

function normalizeTorqrTokenAddress(address) {
  const checksum = normalizeAddress(address)
  if (!checksum) return null
  if (checksum.toLowerCase() === TORQR_ZERO_ADDRESS.toLowerCase()) return null
  return checksum
}

function getTorqrCacheKey(address) {
  return String(address || "").toLowerCase()
}

function readTorqrCache(torqrCache, address) {
  if (!torqrCache) return undefined
  const cacheKey = getTorqrCacheKey(address)
  const cached = torqrCache.get(cacheKey)
  if (!cached) return undefined
  if (cached.expiresAt <= Date.now()) {
    torqrCache.delete(cacheKey)
    return undefined
  }
  return cached.value
}

function writeTorqrCache(torqrCache, address, value) {
  if (!torqrCache) return value
  torqrCache.set(getTorqrCacheKey(address), {
    value,
    expiresAt: Date.now() + TORQR_CACHE_TTL_MS,
  })
  return value
}

async function withSoftTimeout(promise, timeoutMs, fallbackValue) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise
  }

  let timeoutId = null
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallbackValue), timeoutMs)
      }),
    ])
  } catch {
    return fallbackValue
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

async function readTorqrTokenAddressWithCache(torqrBridge, address, { torqrCache, torqrTimeoutMs }) {
  if (!torqrBridge) return null
  const cachedValue = readTorqrCache(torqrCache, address)
  if (cachedValue !== undefined) {
    return cachedValue
  }

  const tokenAddress = await withSoftTimeout(
    torqrBridge.getTokenForAgent(address),
    torqrTimeoutMs,
    null,
  )
  return writeTorqrCache(
    torqrCache,
    address,
    normalizeTorqrTokenAddress(tokenAddress),
  )
}

function readStoredCatalog() {
  if (typeof window === "undefined") return {}
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

function writeStoredCatalog(value) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

function buildLocalAgent(address, payload) {
  const checksum = normalizeAddress(address)
  if (!checksum) return null
  const pricing = payload.pricing || {}
  const premiumValue = pricing.premium?.price || "0"
  const parsedPrice = Number.parseFloat(String(premiumValue).replace(/[^\d.]/g, "")) || 0
  const models = Array.isArray(payload.models)
    ? payload.models
    : String(payload.models || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)

  return {
    address: checksum,
    name: payload.name || `Agent ${shortAddress(checksum)}`,
    category: payload.category || "custom",
    icon: payload.icon || "smart_toy",
    verified: false,
    online: true,
    models,
    jobsCompleted: Number(payload.jobsCompleted || 0),
    bond: payload.bond || "Pending Bond",
    bondValue: Number(payload.bondValue || 0),
    price: String(parsedPrice || 0),
    rating: Number(payload.rating || 5),
    ratingCount: Number(payload.ratingCount || 0),
    latency: payload.latency || "~2.0s",
    joinedLabel: payload.joinedLabel || "New",
    successRate: payload.successRate || "-",
    avgResponse: payload.avgResponse || "~2.0s",
    uptime: payload.uptime || "-",
    locationLabel: payload.locationLabel || "Worldland operator node",
    hardware: payload.hardware || `${payload.gpu || "Custom GPU"} / ${payload.ram || "Unknown RAM"}`,
    services: payload.services || [
      {
        id: "custom-service",
        name: payload.serviceName || "Custom Agent Service",
        icon: payload.icon || "extension",
        description: payload.description || "Custom service registered from the portal.",
        tiers: {
          basic: { price: pricing.basic?.price || "0 WLC", description: pricing.basic?.description || "Basic" },
          standard: { price: pricing.standard?.price || "0 WLC", description: pricing.standard?.description || "Standard" },
          premium: { price: pricing.premium?.price || "0 WLC", description: pricing.premium?.description || "Premium" },
        },
        ctaLabel: "Hire Service",
      },
    ],
    recentJobs: payload.recentJobs || [],
    signature: payload.signature || null,
    torqrTokenAddress: normalizeTorqrTokenAddress(payload.torqrTokenAddress),
    identityRegistration: buildAgentIdentitySnapshot(payload.identityRegistration),
    updatedAt: payload.updatedAt || null,
  }
}

async function enrichWithChain(agentMap) {
  const addresses = Object.keys(agentMap)
  if (!addresses.length) return Object.values(agentMap)

  try {
    const provider = new ethers.JsonRpcProvider(WORLDLAND.rpcUrls[0], WORLDLAND.chainId)
    const nodeRegistry = new ethers.Contract(ADDRESSES.nodeReg, NODE_REGISTRY_ABI, provider)
    const nodeStaking = new ethers.Contract(ADDRESSES.nodeStaking, NODE_STAKING_ABI, provider)
    const torqrBridge = TORQR_BRIDGE_ADDRESS
      ? new ethers.Contract(TORQR_BRIDGE_ADDRESS, TORQR_BRIDGE_ABI, provider)
      : null

    const enriched = await Promise.all(
      addresses.map((address) =>
        enrichAgentWithChainData(agentMap[address], address, {
          nodeRegistry,
          nodeStaking,
          torqrBridge,
        }),
      ),
    )

    return enriched
  } catch {
    return Object.values(agentMap)
  }
}

export async function enrichAgentWithChainData(
  base,
  address,
  {
    nodeRegistry,
    nodeStaking,
    torqrBridge,
    torqrCache = torqrTokenAddressCache,
    torqrTimeoutMs = TORQR_LOOKUP_TIMEOUT_MS,
  },
) {
  try {
    const [node, stake, currentEpoch] = await Promise.all([
      nodeRegistry.getNode(address),
      nodeStaking.getStake(address),
      nodeRegistry.currentEpoch(),
    ])
    const torqrTokenAddress = await readTorqrTokenAddressWithCache(torqrBridge, address, {
      torqrCache,
      torqrTimeoutMs,
    })
    const stakeAmount = Number(ethers.formatEther(stake.amount || 0n))
    const isRegistered = Number(node.registeredAt || 0) > 0
    const bond = stakeAmount > 0 ? `${stakeAmount.toFixed(stakeAmount >= 100 ? 0 : 2)} WLC` : base.bond

    return {
      ...base,
      registered: isRegistered,
      online: isRegistered
        ? Boolean(node.active) && Number(node.lastHeartbeatEpoch || 0) >= Number(currentEpoch) - 2
        : base.online,
      nodeRole: Number(node.role || 0),
      nodeMetadataHash: node.metadataHash,
      lastHeartbeatEpoch: Number(node.lastHeartbeatEpoch || 0),
      bond,
      bondValue: stakeAmount || base.bondValue,
      verified: isRegistered ? true : Boolean(base.verified),
      torqrTokenAddress: torqrTokenAddress || base.torqrTokenAddress || null,
    }
  } catch {
    return base
  }
}

function combineSources() {
  const map = {}
  for (const agent of DEMO_AGENTS) {
    const checksum = normalizeAddress(agent.address)
    map[checksum] = { ...agent, address: checksum, torqrTokenAddress: normalizeTorqrTokenAddress(agent.torqrTokenAddress) }
  }

  const stored = readStoredCatalog()
  for (const [address, payload] of Object.entries(stored)) {
    const localAgent = buildLocalAgent(address, payload)
    if (!localAgent) continue
    map[localAgent.address] = {
      ...(map[localAgent.address] || {}),
      ...localAgent,
      services: localAgent.services,
    }
  }

  return map
}

export async function saveAgentService(address, serviceData) {
  const checksum = normalizeAddress(address)
  if (!checksum) throw new Error("Invalid wallet address.")
  const current = readStoredCatalog()
  current[checksum] = {
    ...serviceData,
    updatedAt: new Date().toISOString(),
  }
  writeStoredCatalog(current)
  return buildLocalAgent(checksum, current[checksum])
}

export function loadMyAgentService(address) {
  const checksum = normalizeAddress(address)
  if (!checksum) return null
  const current = readStoredCatalog()
  return current[checksum] || null
}

export async function getAllAgents() {
  const map = combineSources()
  const agents = await enrichWithChain(map)
  return agents.sort((left, right) => {
    if (left.online !== right.online) return left.online ? -1 : 1
    return (right.rating || 0) - (left.rating || 0)
  })
}

export async function searchAgents({
  query = "",
  category = "all",
  maxPrice = Number.POSITIVE_INFINITY,
  sortBy = "rating",
  onlineOnly = false,
} = {}) {
  const agents = await getAllAgents()
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = agents.filter((agent) => {
    const matchesQuery =
      !normalizedQuery ||
      agent.name.toLowerCase().includes(normalizedQuery) ||
      agent.address.toLowerCase().includes(normalizedQuery) ||
      (agent.models || []).some((model) => model.toLowerCase().includes(normalizedQuery))
    const matchesCategory = category === "all" || agent.category === category
    const matchesPrice = Number(agent.price || 0) <= maxPrice
    const matchesOnline = !onlineOnly || agent.online
    return matchesQuery && matchesCategory && matchesPrice && matchesOnline
  })

  filtered.sort((left, right) => {
    switch (sortBy) {
      case "price-asc":
        return Number(left.price) - Number(right.price)
      case "price-desc":
        return Number(right.price) - Number(left.price)
      case "jobs":
        return Number(right.jobsCompleted) - Number(left.jobsCompleted)
      case "bond":
        return Number(right.bondValue) - Number(left.bondValue)
      case "rating":
      default:
        return Number(right.rating) - Number(left.rating)
    }
  })

  return filtered
}

export async function getAgentByAddress(address) {
  const checksum = normalizeAddress(address)
  if (!checksum) return null
  const agents = await getAllAgents()
  return agents.find((agent) => normalizeAddress(agent.address) === checksum) || null
}
