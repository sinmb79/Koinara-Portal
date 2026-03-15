import { ethers } from "ethers"

export const FEE_CONFIG = {
  launchDate: "2025-07-01",
  requesterFeeBps: 200,
  requesterFeeFloorWlc: "0.5",
  agentFeeBps: 100,
  agentFeeFloorWlc: "0.1",
  feeWallet: "0xf95232Ae6a716862799C90239028fb590C9bB307",
  adminAddress: "0xa4ab0f9095fd4907e3e9252487c5a9e915b1f5ba",
  promoPhases: [
    { name: "launch", months: [1, 2, 3], requesterBps: 0, agentBps: 0 },
    { name: "growth", months: [4, 5, 6], requesterBps: 100, agentBps: 0 },
    { name: "standard", months: [7], requesterBps: 200, agentBps: 0 },
  ],
  acceptedTokens: [
    { symbol: "WLC", type: "native", address: null, decimals: 18, enabled: true },
  ],
}

export function getMonthsSinceLaunch(now = new Date()) {
  const launch = new Date(FEE_CONFIG.launchDate)
  const monthsElapsed =
    (now.getFullYear() - launch.getFullYear()) * 12 +
    (now.getMonth() - launch.getMonth()) +
    1
  return Math.max(1, monthsElapsed)
}

export function getCurrentPromoPhase(now = new Date()) {
  const monthsElapsed = getMonthsSinceLaunch(now)
  for (const phase of FEE_CONFIG.promoPhases) {
    if (phase.months.includes(monthsElapsed)) return phase
  }
  return FEE_CONFIG.promoPhases[FEE_CONFIG.promoPhases.length - 1]
}

export function getPromoPhaseLabelKey(name) {
  const map = {
    launch: "admin_phase_launch",
    growth: "admin_phase_growth",
    standard: "admin_phase_standard",
  }
  return map[name] || "admin_phase_standard"
}

export function calcRequesterFee(premiumWei, now = new Date()) {
  const phase = getCurrentPromoPhase(now)
  const bps = BigInt(phase.requesterBps)
  let fee = (premiumWei * bps) / 10000n
  const floor = ethers.parseEther(FEE_CONFIG.requesterFeeFloorWlc)

  if (premiumWei > 0n && bps > 0n && fee < floor) {
    fee = floor
  }
  if (bps === 0n) {
    fee = 0n
  }

  return {
    fee,
    total: premiumWei + fee,
    currentPhase: phase,
  }
}

export function getAgentFeePolicy(now = new Date()) {
  const phase = getCurrentPromoPhase(now)
  return {
    currentPhase: phase,
    standardBps: FEE_CONFIG.agentFeeBps,
    currentBps: phase.agentBps,
    floorWlc: FEE_CONFIG.agentFeeFloorWlc,
  }
}

export function captureReferral() {
  if (typeof window === "undefined") return
  try {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref && /^0x[a-fA-F0-9]{40}$/.test(ref)) {
      const existing = window.localStorage.getItem("koinara_referrer")
      if (!existing) {
        window.localStorage.setItem("koinara_referrer", ref)
      }
    }
  } catch {
    // Ignore localStorage and URL parsing failures.
  }
}
