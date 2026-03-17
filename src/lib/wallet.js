const EIP6963_ANNOUNCE_EVENT = "eip6963:announceProvider"
const EIP6963_REQUEST_EVENT = "eip6963:requestProvider"

const DETECTORS = [
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "account_balance_wallet",
    shortLabel: "coinbase",
    rdns: ["com.coinbase.wallet"],
    names: ["coinbase wallet", "coinbase"],
    test: (provider) => Boolean(provider?.isCoinbaseWallet),
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    icon: "wallet",
    shortLabel: "rabby",
    rdns: ["io.rabby"],
    names: ["rabby wallet", "rabby"],
    test: (provider) => Boolean(provider?.isRabby),
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "wallet",
    shortLabel: "okx",
    rdns: ["com.okex.wallet", "com.okx.wallet"],
    names: ["okx wallet", "okx"],
    test: (provider) => Boolean(provider?.isOkxWallet || provider?.okxwallet),
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: "bolt",
    shortLabel: "phantom",
    rdns: ["app.phantom"],
    names: ["phantom"],
    test: (provider) => Boolean(provider?.isPhantom),
  },
  {
    id: "metamask",
    name: "MetaMask",
    icon: "shield_with_house",
    shortLabel: "metamask",
    rdns: ["io.metamask"],
    names: ["metamask"],
    test: (provider) => Boolean(provider?.isMetaMask),
  },
]

function normalizeText(value) {
  return String(value || "").trim().toLowerCase()
}

function getProviderInfo(provider, info = null) {
  return {
    rdns: normalizeText(info?.rdns || provider?.info?.rdns || provider?.providerInfo?.rdns || provider?.rdns),
    name: normalizeText(info?.name || provider?.info?.name || provider?.providerInfo?.name || provider?.name),
    uuid: normalizeText(info?.uuid || provider?.info?.uuid || provider?.providerInfo?.uuid),
  }
}

function detectWalletMeta(provider, index, info = null) {
  const normalized = getProviderInfo(provider, info)
  const matched = DETECTORS.find((item) => {
    if (item.rdns.some((entry) => normalized.rdns.includes(entry))) return true
    if (item.names.some((entry) => normalized.name.includes(entry))) return true
    return item.test(provider)
  })

  if (matched) {
    return {
      id: matched.id,
      name: matched.name,
      icon: matched.icon,
      shortLabel: matched.shortLabel || matched.id,
      rdns: normalized.rdns || matched.rdns[0] || matched.id,
      label: normalized.name || matched.name,
      logo: info?.icon || provider?.info?.icon || provider?.providerInfo?.icon || "",
    }
  }

  return {
    id: normalized.rdns || `browser-wallet-${index + 1}`,
    name: normalized.name || `Wallet ${index + 1}`,
    icon: "account_balance_wallet",
    shortLabel: normalized.name || `wallet-${index + 1}`,
    rdns: normalized.rdns || "",
    label: normalized.name || `Wallet ${index + 1}`,
    logo: info?.icon || provider?.info?.icon || provider?.providerInfo?.icon || "",
  }
}

function collectProviderCandidates() {
  if (typeof window === "undefined") return []

  const root = window.ethereum
  const candidates = [
    root,
    ...(Array.isArray(root?.providers) ? root.providers : []),
    window.coinbaseWalletExtension,
    window.okxwallet?.ethereum,
    window.okxwallet,
    window.phantom?.ethereum,
  ].filter(Boolean)

  const unique = []
  const seen = new Set()

  candidates.forEach((provider) => {
    const key = provider
    if (seen.has(key)) return
    seen.add(key)
    unique.push(provider)
  })

  return unique
}

function mergeWallets(wallets) {
  const byKey = new Map()

  wallets.forEach((wallet, index) => {
    const known = DETECTORS.some((item) => item.id === wallet.id)
    const key = known ? wallet.id : (wallet.rdns || wallet.id || wallet.name || `wallet-${index}`)
    const existing = byKey.get(key)

    if (!existing) {
      byKey.set(key, wallet)
      return
    }

    const existingScore = (existing.rdns ? 2 : 0) + (existing.name ? 1 : 0) + (existing.logo ? 2 : 0)
    const nextScore = (wallet.rdns ? 2 : 0) + (wallet.name ? 1 : 0) + (wallet.logo ? 2 : 0)
    if (nextScore > existingScore) {
      byKey.set(key, wallet)
    }
  })

  const order = new Map(DETECTORS.map((item, index) => [item.id, index]))
  return Array.from(byKey.values()).sort((a, b) => {
    const aOrder = order.has(a.id) ? order.get(a.id) : Number.MAX_SAFE_INTEGER
    const bOrder = order.has(b.id) ? order.get(b.id) : Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })
}

export function listInjectedWallets() {
  return mergeWallets(
    collectProviderCandidates().map((provider, index) => {
      const meta = detectWalletMeta(provider, index)
      return {
        ...meta,
        provider,
      }
    })
  )
}

export async function discoverInjectedWallets({ timeoutMs = 600 } = {}) {
  if (typeof window === "undefined") return []

  const discovered = [...listInjectedWallets()]

  const addWallet = (provider, info = null) => {
    if (!provider) return
    const meta = detectWalletMeta(provider, discovered.length, info)
    discovered.push({
      ...meta,
      provider,
    })
  }

  const handleAnnounce = (event) => {
    addWallet(event?.detail?.provider, event?.detail?.info || null)
  }

  window.addEventListener(EIP6963_ANNOUNCE_EVENT, handleAnnounce)
  try {
    window.dispatchEvent(new Event(EIP6963_REQUEST_EVENT))
    await new Promise((resolve) => window.setTimeout(resolve, timeoutMs))
  } finally {
    window.removeEventListener(EIP6963_ANNOUNCE_EVENT, handleAnnounce)
  }

  return mergeWallets(discovered)
}

export function requireInjectedWallet(walletId = null, wallets = listInjectedWallets()) {
  if (wallets.length === 0) {
    throw new Error("No compatible wallet provider found.")
  }

  if (!walletId) {
    if (wallets.length > 1) {
      const error = new Error("Wallet selection required.")
      error.code = "WALLET_SELECTION_REQUIRED"
      error.wallets = wallets
      throw error
    }
    return wallets[0]
  }

  const selected = wallets.find((wallet) => wallet.id === walletId)
  if (!selected) {
    throw new Error(`Wallet provider not found: ${walletId}`)
  }

  return selected
}
