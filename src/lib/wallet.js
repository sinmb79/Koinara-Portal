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

function getInjectedProviders() {
  if (typeof window === "undefined") return []
  const injected = window.ethereum
  if (!injected) return []
  return Array.isArray(injected.providers) ? injected.providers : [injected]
}

function detectWalletMeta(provider, index) {
  const matched = DETECTORS.find((item) => item.test(provider))
  if (matched) {
    return matched
  }

  const label =
    provider?.info?.name ||
    provider?.providerInfo?.name ||
    provider?.name ||
    `Wallet ${index + 1}`

  return {
    id: String(
      provider?.info?.rdns ||
      provider?.providerInfo?.rdns ||
      provider?.rdns ||
      `browser-wallet-${index + 1}`
    ),
    name: label,
    icon: "account_balance_wallet",
  }
}

export function listInjectedWallets() {
  const seen = new Set()
  const wallets = []

  getInjectedProviders().forEach((provider, index) => {
    const meta = detectWalletMeta(provider, index)
    const key = `${meta.id}:${provider === window.ethereum ? "root" : index}`
    if (seen.has(key)) return
    seen.add(key)
    wallets.push({
      ...meta,
      provider,
    })
  })

  return wallets
}

export function requireInjectedWallet(walletId = null) {
  const wallets = listInjectedWallets()
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
