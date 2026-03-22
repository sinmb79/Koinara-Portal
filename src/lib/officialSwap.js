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
    title: isKo ? "Worldland KOIN/WLC \ub9c8\ucf13 \uacf5\uac1c \uc815\ubcf4" : "Worldland KOIN/WLC market disclosure",
    networkLabel: "Worldland Mainnet",
    poolAddress: cfg.poolAddress || (isKo ? "\uc544\uc9c1 \uacf5\uac1c\ub418\uc9c0 \uc54a\uc74c" : "Not yet disclosed"),
    venue: cfg.venueName || (isKo ? "\uc544\uc9c1 \ud655\uc815\ub418\uc9c0 \uc54a\uc74c" : "Not yet confirmed"),
    venueUrl: cfg.venueUrl || null,
    poolExplorerUrl: cfg.poolExplorerUrl || null,
    liquidityWarning: isKo
      ? "\ubd80\ud2b8\uc2a4\ud2b8\ub7a9 \uc720\ub3d9\uc131\uc740 Koinara \ud300\uc774 \uc81c\uacf5\ud569\ub2c8\ub2e4. \uc720\ub3d9\uc131\uc774 \uc595\uc744 \uc218 \uc788\uc73c\uba70, \uac00\uaca9\uc774 \ube60\ub974\uac8c \ubcc0\ub3d9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4."
      : cfg.liquidityDisclosure,
    canonicalNote: isKo
      ? "\ud604\uc7ac Worldland KOIN \ud45c\uae30\ub294 \ub808\uac70\uc2dc \ub178\ub4dc \ubcf4\uc0c1, v3 \ud3ec\ud138, \ubbf8\uc158 \ub9c8\ucf13 surface\ub85c \ub098\ub258\uc5b4 \uc788\uc2b5\ub2c8\ub2e4. \uc774 \uc2a4\uc649\uc740 \uacf5\uac1c \ub9c8\ucf13 \uc8fc\uc18c\uac00 \ucd5c\uc885 \ud655\uc815\ub418\uae30 \uc804\uae4c\uc9c0 \uac8c\uc774\ud2b8 \uc0c1\ud0dc\ub97c \uc720\uc9c0\ud569\ub2c8\ub2e4."
      : "Worldland KOIN is currently split across legacy node rewards, the v3 portal reference, and the mission-market surface. This swap stays gated until the public market address is finalized.",
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
