import { ethers } from "ethers"
import { normalizeTorqrAppUrl } from "./torqrLinks.js"

const env = (import.meta && import.meta.env) || {}
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const DEFAULT_FACTORY_ADDRESS = "0x1E8d07B68b0447c27B8976767d91974Eee5B5103"

function normalizeContractAddress(address) {
  if (!address) return null
  try {
    return ethers.getAddress(address)
  } catch {
    return null
  }
}

export const TORQR_APP_URL = normalizeTorqrAppUrl(env.VITE_TORQR_APP_URL || "")
export const TORQR_FACTORY_ADDRESS = normalizeContractAddress(env.VITE_TORQR_FACTORY_ADDRESS || DEFAULT_FACTORY_ADDRESS)
export const TORQR_BRIDGE_ADDRESS = normalizeContractAddress(env.VITE_TORQR_BRIDGE_ADDRESS || "")
export const TORQR_ZERO_ADDRESS = ZERO_ADDRESS
export const TORQR_CREATION_FEE_WEI = ethers.parseEther("1").toString()

export const TORQR_FACTORY_ABI = [
  "function createToken(string name,string symbol,string description,string imageURI) payable returns (address)",
  "event TokenCreated(address indexed tokenAddress,address indexed creator,string name,string symbol,uint256 createdAt)",
]

export const TORQR_BRIDGE_ABI = [
  "function getTokenForAgent(address agent) view returns (address)",
  "function launchForSelf(string name,string symbol,string description,string imageURI) payable returns (address)",
  "event AgentTokenLaunched(address indexed agent,address indexed token,string name,string symbol)",
]
