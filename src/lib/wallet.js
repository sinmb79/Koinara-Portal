export function getMetaMaskProvider() {
  if (typeof window === "undefined") return null

  const injected = window.ethereum
  if (!injected) return null

  const providers = Array.isArray(injected.providers)
    ? injected.providers
    : [injected]

  return providers.find((provider) => provider?.isMetaMask) || (injected.isMetaMask ? injected : null)
}

export function requireMetaMaskProvider() {
  const provider = getMetaMaskProvider()
  if (!provider) {
    throw new Error("MetaMask provider not found.")
  }
  return provider
}
