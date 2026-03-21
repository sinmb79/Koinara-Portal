import { getOfficialSwapConfig, isCanonicalSwapNetwork, isSwapLive } from "./officialSwapConfig.js"

const DIRECTIONS = {
  BUY: { from: "WLC", to: "KOIN", label: "WLC \u2192 KOIN", labelKo: "WLC \u2192 KOIN" },
  SELL: { from: "KOIN", to: "WLC", label: "KOIN \u2192 WLC", labelKo: "KOIN \u2192 WLC" },
}

export function getDirectionLabel(direction, lang = "en") {
  const selected = DIRECTIONS[direction] || DIRECTIONS.BUY
  return lang === "ko" ? selected.labelKo : selected.label
}

export function getDirectionAssets(direction) {
  const selected = DIRECTIONS[direction] || DIRECTIONS.BUY
  return { from: selected.from, to: selected.to }
}

export function validateSwapNetwork(connectedNetwork) {
  if (!connectedNetwork) {
    return { ok: false, message: "Connect your wallet to continue." }
  }
  if (!isCanonicalSwapNetwork(connectedNetwork)) {
    return { ok: false, message: "Switch to Worldland Mainnet to use the official KOIN/WLC market." }
  }
  return { ok: true, message: "" }
}

export function getSwapReadiness({ connected = false, network = "" } = {}) {
  if (!isSwapLive()) {
    return { ready: false, reason: "not_live" }
  }
  if (!connected) {
    return { ready: false, reason: "disconnected" }
  }
  const networkValidation = validateSwapNetwork(network)
  if (!networkValidation.ok) {
    return { ready: false, reason: "wrong_network" }
  }
  return { ready: true, reason: null }
}

export function assembleDisclosure(lang = "en") {
  const cfg = getOfficialSwapConfig()
  const isKo = lang === "ko"

  return {
    title: isKo ? "\uacf5\uc2dd KOIN/WLC \ub9c8\ucf13" : "Official KOIN/WLC Market",
    networkLabel: "Worldland Mainnet",
    poolAddress: cfg.poolAddress || (isKo ? "\uc544\uc9c1 \uacf5\uac1c\ub418\uc9c0 \uc54a\uc74c" : "Not yet disclosed"),
    venue: cfg.venueName || (isKo ? "\uc544\uc9c1 \ud655\uc815\ub418\uc9c0 \uc54a\uc74c" : "Not yet confirmed"),
    venueUrl: cfg.venueUrl || null,
    poolExplorerUrl: cfg.poolExplorerUrl || null,
    liquidityWarning: isKo
      ? "\ubd80\ud2b8\uc2a4\ud2b8\ub7a9 \uc720\ub3d9\uc131\uc740 Koinara \ud300\uc774 \uc81c\uacf5\ud569\ub2c8\ub2e4. \uc720\ub3d9\uc131\uc774 \uc595\uc744 \uc218 \uc788\uc73c\uba70, \uac00\uaca9\uc774 \ube60\ub974\uac8c \ubcc0\ub3d9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4."
      : cfg.liquidityDisclosure,
    canonicalNote: isKo
      ? "Worldland KOIN\ub9cc\uc774 \uacf5\uc2dd \ud504\ub85c\ud1a0\ucf5c \ud1a0\ud070\uc785\ub2c8\ub2e4. Demo \uc790\uc0b0\uc740 \uc11c\ub85c \uad50\ud658\ub418\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4."
      : "Only Worldland KOIN is the canonical protocol token. Demo assets are not interchangeable.",
    complianceNote: isKo
      ? "\uc0ac\uc6a9\uc790\ub294 \ud604\uc9c0 \ubc95\ub960 \ubc0f \uaddc\uc81c \uc900\uc218\uc5d0 \ub300\ud574 \ubcf8\uc778\uc774 \ucc45\uc784\uc744 \uc9d1\ub2c8\ub2e4."
      : "Users are responsible for local legal and regulatory compliance.",
  }
}

const FORBIDDEN_PATTERNS = [
  "launch token",
  "bonding curve",
  "graduation",
  "Base official market",
  "fair-launch distribution",
]

export function checkForbiddenFraming(text) {
  const lower = text.toLowerCase()
  return FORBIDDEN_PATTERNS.filter((pattern) => lower.includes(pattern.toLowerCase()))
}
