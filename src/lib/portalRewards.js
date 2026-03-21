import { ADDRESSES, BASE_ADDRESSES } from "../abi/index.js"
import { BASE, SUPPORTED_CHAINS, WORLDLAND } from "./chain.js"

export function supportsActiveEpochRewards(chainId) {
  if (chainId == null) return true
  return Number(chainId) === WORLDLAND.chainId
}

export function getKoinBalanceAddress(chainId) {
  return Number(chainId) === BASE.chainId ? BASE_ADDRESSES.missionKoin : ADDRESSES.koin
}

export function getKoinBalanceChain(chainId) {
  return SUPPORTED_CHAINS[Number(chainId)] || WORLDLAND
}

export function estimateActiveEpochReward({
  emission = 0n,
  addressWeight = 0n,
  totalWeight = 0n,
  activeAt = false,
}) {
  const normalizedEmission = BigInt(emission ?? 0)
  const normalizedAddressWeight = BigInt(addressWeight ?? 0)
  const normalizedTotalWeight = BigInt(totalWeight ?? 0)

  if (!activeAt || normalizedEmission <= 0n || normalizedAddressWeight <= 0n || normalizedTotalWeight <= 0n) {
    return 0n
  }

  return (normalizedEmission * normalizedAddressWeight) / normalizedTotalWeight
}
