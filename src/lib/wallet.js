const DETECTORS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "shield_with_house",
    test: (provider) => Boolean(provider?.isMetaMask),
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "account_balance_wallet",
    test: (provider) => Boolean(provider?.isCoinbaseWallet),
  },
  {
    id: "rabby",
    name: "Rabby",
    icon: "wallet",
    test: (provider) => Boolean(provider?.isRabby),
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "wallet",
    test: (provider) => Boolean(provider?.isOkxWallet || provider?.okxwallet),
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: "bolt",
    test: (provider) => Boolean(provider?.isPhantom),
  },
]

const EIP6963_ANNOUNCE_EVENT = "eip6963:announceProvider"
const EIP6963_REQUEST_EVENT = "eip6963:requestProvider"

function getInjectedProviders() {
  if (typeof window === "undefined") return []
  const injected = window.ethereum
  if (!injected) return []
  return Array.isArray(injected.providers) ? injected.providers : [injected]
}

function detectWalletMeta(provider, index, info = null) {
  const matched = DETECTORS.find((item) => item.test(provider))
  if (matched) {
    return matched
  }

  const label =
    info?.name ||
    provider?.info?.name ||
    provider?.providerInfo?.name ||
    provider?.name ||
    `Wallet ${index + 1}`

  return {
    id: String(
      info?.rdns ||
      provider?.info?.rdns ||
      provider?.providerInfo?.rdns ||
      provider?.rdns ||
      `browser-wallet-${index + 1}`
    ),
    name: label,
    icon: "account_balance_wallet",
  }
}

function mergeWallets(wallets) {
  const seen = new Set()
  const merged = []

  wallets.forEach((wallet, index) => {
    const key = `${wallet.id}:${wallet.rdns || index}`
    if (seen.has(key)) return
    seen.add(key)
    merged.push(wallet)
  })

  return merged
}

export function listInjectedWallets() {
  return mergeWallets(
    getInjectedProviders().map((provider, index) => {
      const meta = detectWalletMeta(provider, index)
      return {
        ...meta,
        provider,
        rdns: provider?.info?.rdns || provider?.providerInfo?.rdns || provider?.rdns || meta.id,
      }
    })
  )
}

export async function discoverInjectedWallets({ timeoutMs = 350 } = {}) {
  if (typeof window === "undefined") return []

  const discovered = [...listInjectedWallets()]
  const addWallet = (provider, info = null) => {
    if (!provider) return
    const meta = detectWalletMeta(provider, discovered.length, info)
    discovered.push({
      ...meta,
      provider,
      rdns: info?.rdns || provider?.info?.rdns || provider?.providerInfo?.rdns || provider?.rdns || meta.id,
    })
  }

  const handleAnnounce = (event) => {
    const provider = event?.detail?.provider
    const info = event?.detail?.info || null
    addWallet(provider, info)
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
