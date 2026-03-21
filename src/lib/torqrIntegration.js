import { ethers } from "ethers"
import { normalizeTorqrAppUrl } from "./torqrLinks.js"

const env = (import.meta && import.meta.env) || {}
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
const DEFAULT_FACTORY_ADDRESS = "0x80a4142320Aa796F120492ACa8FA2058c9AB6DaA"
const DEFAULT_BONDING_CURVE_ADDRESS = "0x43A309C814f68e8B96E56E5F85A51f524Ac73cAc"
const DEFAULT_LEGACY_FACTORY_ADDRESS = "0x1E8d07B68b0447c27B8976767d91974Eee5B5103"
const DEFAULT_LEGACY_BONDING_CURVE_ADDRESS = "0x2a6aa1d72Cc5216Ef68d888f7163559b30FED58C"

function normalizeContractAddress(address) {
  if (!address) return null
  try {
    return ethers.getAddress(address)
  } catch {
    return null
  }
}

export const TORQR_APP_URL = normalizeTorqrAppUrl(env.VITE_TORQR_APP_URL || "")
export const TORQR_INDEXER_API_BASE_URL = normalizeTorqrAppUrl(env.VITE_TORQR_INDEXER_API_BASE_URL || "")
export const TORQR_FACTORY_ADDRESS = normalizeContractAddress(env.VITE_TORQR_FACTORY_ADDRESS || DEFAULT_FACTORY_ADDRESS)
export const TORQR_BONDING_CURVE_ADDRESS = normalizeContractAddress(env.VITE_TORQR_BONDING_CURVE_ADDRESS || DEFAULT_BONDING_CURVE_ADDRESS)
export const TORQR_BRIDGE_ADDRESS = normalizeContractAddress(env.VITE_TORQR_BRIDGE_ADDRESS || "")
export const TORQR_LEGACY_FACTORY_ADDRESS = normalizeContractAddress(env.VITE_TORQR_LEGACY_FACTORY_ADDRESS || DEFAULT_LEGACY_FACTORY_ADDRESS)
export const TORQR_LEGACY_BONDING_CURVE_ADDRESS = normalizeContractAddress(env.VITE_TORQR_LEGACY_BONDING_CURVE_ADDRESS || DEFAULT_LEGACY_BONDING_CURVE_ADDRESS)
export const TORQR_ZERO_ADDRESS = ZERO_ADDRESS
export const TORQR_CREATION_FEE_WEI = ethers.parseEther("1").toString()

export const TORQR_FACTORY_STACKS = [
  {
    key: "v2",
    factoryAddress: TORQR_FACTORY_ADDRESS,
    bondingCurveAddress: TORQR_BONDING_CURVE_ADDRESS,
    bridgeAddress: TORQR_BRIDGE_ADDRESS,
  },
  {
    key: "legacy",
    factoryAddress: TORQR_LEGACY_FACTORY_ADDRESS,
    bondingCurveAddress: TORQR_LEGACY_BONDING_CURVE_ADDRESS,
    bridgeAddress: null,
  },
].filter((stack, index, stacks) => {
  if (!stack.factoryAddress || !stack.bondingCurveAddress) return false
  return stacks.findIndex((candidate) => candidate.factoryAddress === stack.factoryAddress) === index
})

export const TORQR_FACTORY_ABI = [
  "function createToken(string name,string symbol,string description,string imageURI) payable returns (address)",
  "function getAllTokens() view returns (address[])",
  "function getTokenInfo(address token) view returns (tuple(address tokenAddress,address creator,string name,string symbol,uint256 createdAt,bool graduated))",
  "function getPool(address token) view returns (address)",
  "event TokenCreated(address indexed tokenAddress,address indexed creator,string name,string symbol,uint256 createdAt)",
]

export const TORQR_BONDING_CURVE_ABI = [
  "function getCurveState(address token) view returns (address tokenAddress,address creator,uint256 totalSupply,uint256 soldSupply,uint256 reserveWLC,bool graduated,bool exists)",
  "function getProgress(address token) view returns (uint256)",
  "function buy(address token,uint256 minTokensOut) payable returns (uint256)",
  "function sell(address token,uint256 amount,uint256 minWLCOut) returns (uint256)",
  "function getBuyPrice(address token,uint256 amount) view returns (uint256)",
  "function getSellPrice(address token,uint256 amount) view returns (uint256)",
  "event Buy(address indexed token,address indexed buyer,uint256 wlcIn,uint256 tokensOut,uint256 fee)",
  "event Sell(address indexed token,address indexed seller,uint256 tokensIn,uint256 wlcOut,uint256 fee)",
]

export const TORQR_BRIDGE_ABI = [
  "function getTokenForAgent(address agent) view returns (address)",
  "function launchForSelf(string name,string symbol,string description,string imageURI) payable returns (address)",
  "event AgentTokenLaunched(address indexed agent,address indexed token,string name,string symbol)",
]

export const TORQR_POOL_ABI = [
  "function getAmountOut(bool wlcIn,uint256 amountIn) view returns (uint256)",
  "function getReserves() view returns (uint256,uint256)",
  "function swap(bool wlcIn,uint256 amountIn,uint256 minAmountOut) payable returns (uint256)",
  "event Swap(address indexed sender,bool wlcIn,uint256 amountIn,uint256 amountOut)",
]

export const TORQR_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
  "function description() view returns (string)",
  "function imageURI() view returns (string)",
]
