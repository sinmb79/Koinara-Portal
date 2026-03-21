import { WORLDLAND, shortAddress } from "./chain.js"

function isMobileUserAgent(userAgent) {
  return /Android|iPhone|iPad|iPod/i.test(String(userAgent || ""))
}

export function formatTorqrWalletLabel({ address }) {
  if (!address) return "Connect Wallet"
  return shortAddress(address, 6, 4)
}

export function getTorqrCreateButtonState({ address, chainId, isConnecting, isReady }) {
  if (isConnecting) {
    return {
      intent: "connect",
      disabled: true,
      label: "Connecting...",
    }
  }

  if (!isReady) {
    return {
      intent: "fill",
      disabled: true,
      label: "Complete Form to Continue",
    }
  }

  if (!address) {
    return {
      intent: "connect",
      disabled: false,
      label: "Connect Wallet to Deploy",
    }
  }

  if (chainId !== WORLDLAND.chainId) {
    return {
      intent: "switch",
      disabled: false,
      label: "Switch to Worldland",
    }
  }

  return {
    intent: "deploy",
    disabled: false,
    label: "Deploy Token",
  }
}

export function getTorqrWalletConnectAction({ wallets, userAgent, href }) {
  if (!Array.isArray(wallets) || wallets.length === 0) {
    if (isMobileUserAgent(userAgent)) {
      return {
        type: "deeplink",
        walletId: null,
        href: `https://metamask.app.link/dapp/${String(href || "").replace(/^https?:\/\//, "")}`,
      }
    }

    return {
      type: "missing",
      walletId: null,
      href: null,
    }
  }

  if (wallets.length > 1) {
    return {
      type: "picker",
      walletId: null,
      href: null,
    }
  }

  return {
    type: "connect",
    walletId: wallets[0]?.id ?? null,
    href: null,
  }
}
