import { ethers } from "ethers"

export const WORLDLAND = {
  chainId: 103,
  chainIdHex: "0x67",
  chainName: "Worldland Mainnet",
  nativeCurrency: { name: "Worldland Coin", symbol: "WLC", decimals: 18 },
  rpcUrls: ["https://seoul.worldland.foundation/"],
  blockExplorerUrls: ["https://scan.worldland.foundation"],
}

export const EXPLORER = WORLDLAND.blockExplorerUrls[0]

export const JOB_TYPE_OPTIONS = [
  { value: 0, key: "simple", label: "Simple", weight: 1, quorum: 1 },
  { value: 1, key: "general", label: "General", weight: 3, quorum: 3 },
  { value: 2, key: "collective", label: "Collective", weight: 7, quorum: 5 },
]

export const NODE_ROLE_LABELS = {
  0: "Provider",
  1: "Verifier",
  2: "Both",
}

export function txUrl(hash) {
  return `${EXPLORER}/tx/${hash}`
}

export function addrUrl(addr) {
  return `${EXPLORER}/address/${addr}`
}

export function shortAddress(value, head = 6, tail = 4) {
  if (!value) return "-"
  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

export function epochAt(timestamp, genesisTimestamp, epochDuration) {
  if (!timestamp || !epochDuration) return 0
  if (timestamp <= genesisTimestamp) return 0
  return Math.floor((timestamp - genesisTimestamp) / epochDuration)
}

export function formatDateTime(timestampSeconds) {
  if (!timestampSeconds) return "-"
  return new Date(Number(timestampSeconds) * 1000).toLocaleString()
}

export function formatRelativeCountdown(targetTimestampSeconds) {
  if (!targetTimestampSeconds) return null
  const diff = Number(targetTimestampSeconds) * 1000 - Date.now()
  if (diff <= 0) return "Ready now"

  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatTokenAmount(value, digits = 4) {
  try {
    return Number(ethers.formatEther(value ?? 0n)).toFixed(digits)
  } catch {
    return Number(0).toFixed(digits)
  }
}
