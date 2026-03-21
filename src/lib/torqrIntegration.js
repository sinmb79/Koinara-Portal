import { ethers } from "ethers"
import { normalizeTorqrAppUrl } from "./torqrLinks.js"

const env = (import.meta && import.meta.env) || {}
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

function normalizeContractAddress(address) {
  if (!address) return null
  try {
    return ethers.getAddress(address)
  } catch {
    return null
  }
}

export const TORQR_APP_URL = normalizeTorqrAppUrl(env.VITE_TORQR_APP_URL || "")
export const TORQR_BRIDGE_ADDRESS = normalizeContractAddress(env.VITE_TORQR_BRIDGE_ADDRESS || "")
export const TORQR_ZERO_ADDRESS = ZERO_ADDRESS

export const TORQR_BRIDGE_ABI = [
  "function getTokenForAgent(address agent) view returns (address)",
]
