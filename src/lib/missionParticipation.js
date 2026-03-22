/**
 * missionParticipation.js — Wallet-first mission participation helpers
 *
 * These helpers classify rewards, participation states, and trust labels
 * for the Koinara Reboot wallet-first model.
 *
 * Core invariants:
 *   - Default rewards are mission-only (verdict-driven) or verification-only.
 *   - "Active reward" / "attendance reward" is legacy — never in default summaries.
 *   - Verifier trust is displayed at a distinct, higher level.
 */

// ─── Verdict labels ─────────────────────────────────────────────

const VERDICT_MAP = {
  VERIFIED: { key: "VERIFIED", rewardable: true, label_ko: "검증 완료", label_en: "Verified" },
  PROGRESS: { key: "PROGRESS", rewardable: true, label_ko: "진전 확인", label_en: "Progress" },
  INCONCLUSIVE: { key: "INCONCLUSIVE", rewardable: false, label_ko: "결론 불가", label_en: "Inconclusive" },
  REJECTED: { key: "REJECTED", rewardable: false, label_ko: "거부", label_en: "Rejected" },
}

export function normalizeVerdict(rawVerdict) {
  if (typeof rawVerdict === "number") {
    const keys = ["VERIFIED", "PROGRESS", "INCONCLUSIVE", "REJECTED"]
    return VERDICT_MAP[keys[rawVerdict]] || null
  }
  const upper = String(rawVerdict ?? "").toUpperCase()
  return VERDICT_MAP[upper] || null
}

export function getVerdictLabel(rawVerdict, lang = "en") {
  const v = normalizeVerdict(rawVerdict)
  if (!v) return rawVerdict ?? ""
  return lang === "ko" ? v.label_ko : v.label_en
}

export function isRewardableVerdict(rawVerdict) {
  const v = normalizeVerdict(rawVerdict)
  return v ? v.rewardable : false
}

// ─── Reward classification ─────────────────────────────────────

/**
 * Classify a reward source for display.
 *
 * @param {object} opts
 * @param {"mission"|"verification"|"active"|"work"} opts.source
 * @param {string|number|null} opts.verdict
 * @returns {{ type: "mission"|"verification"|"legacy", displayable: boolean, legacyWarning: boolean }}
 */
export function classifyMissionReward({ source, verdict = null } = {}) {
  // "active" rewards are legacy — exclude from default summaries
  if (source === "active") {
    return { type: "legacy", displayable: false, legacyWarning: true }
  }

  // Mission reward (provider share) — verdict-driven
  if (source === "mission" || source === "work") {
    const rewardable = verdict != null ? isRewardableVerdict(verdict) : true
    return { type: "mission", displayable: rewardable, legacyWarning: false }
  }

  // Verification reward (verifier share) — separately privileged
  if (source === "verification") {
    return { type: "verification", displayable: true, legacyWarning: false }
  }

  // Unknown source — treat as non-displayable
  return { type: "unknown", displayable: false, legacyWarning: false }
}

// ─── Participation state ────────────────────────────────────────

/**
 * Derive the UI participation state for a connected wallet.
 *
 * @param {object} opts
 * @param {boolean} opts.connected
 * @param {boolean} opts.agentIdRegistered - Agent ID CARD registered
 * @param {boolean} opts.isMissionParticipant - Claimed the current mission
 * @param {string|null} opts.missionStatus
 * @returns {{ canClaim: boolean, canSubmit: boolean, statusKey: string, requiresAgentId: boolean }}
 */
export function getMissionParticipationState({
  connected = false,
  agentIdRegistered = false,
  isMissionParticipant = false,
  missionStatus = null,
} = {}) {
  if (!connected) {
    return { canClaim: false, canSubmit: false, statusKey: "disconnected", requiresAgentId: false }
  }

  if (!agentIdRegistered) {
    return { canClaim: false, canSubmit: false, statusKey: "needs_agent_id", requiresAgentId: true }
  }

  // Already a participant
  if (isMissionParticipant) {
    const submittable = missionStatus === "IN_PROGRESS"
    return { canClaim: false, canSubmit: submittable, statusKey: "participating", requiresAgentId: false }
  }

  // Can claim if mission is open or in progress
  const claimable = missionStatus === "OPEN" || missionStatus === "IN_PROGRESS"
  return { canClaim: claimable, canSubmit: false, statusKey: claimable ? "can_claim" : "mission_closed", requiresAgentId: false }
}

// ─── Verifier trust label ──────────────────────────────────────

/**
 * Return the verifier trust label — always distinct from ordinary agent.
 *
 * @param {"proova"|"oracle"|"agent"|null} role
 * @param {string} lang
 * @returns {string}
 */
export function getVerifierTrustLabel(role, lang = "en") {
  if (role === "proova" || role === "oracle") {
    return lang === "ko" ? "검증자 (Proova)" : "Verifier (Proova)"
  }
  if (role === "agent") {
    return lang === "ko" ? "에이전트" : "Agent"
  }
  return lang === "ko" ? "알 수 없음" : "Unknown"
}

// ─── Mission status normalization ──────────────────────────────

const STATUS_MAP = {
  0: "OPEN",
  1: "IN_PROGRESS",
  2: "UNDER_REVIEW",
  3: "RESOLVED",
  4: "CLOSED",
}

export function normalizeMissionStatus(raw) {
  if (typeof raw === "number") return STATUS_MAP[raw] || "UNKNOWN"
  return String(raw ?? "UNKNOWN").toUpperCase()
}

// ─── Reward summary (for dashboard) ────────────────────────────

/**
 * Summarize rewards for dashboard display. Excludes legacy active rewards
 * from the default summary.
 *
 * @param {Array<{source: string, amount: bigint|string, verdict?: string|number}>} rewards
 * @returns {{ missionTotal: bigint, verificationTotal: bigint, legacyTotal: bigint }}
 */
export function summarizeMissionRewards(rewards = []) {
  let missionTotal = 0n
  let verificationTotal = 0n
  let legacyTotal = 0n

  for (const r of rewards) {
    const classified = classifyMissionReward({ source: r.source, verdict: r.verdict })
    const amount = typeof r.amount === "bigint" ? r.amount : BigInt(r.amount || 0)

    if (classified.type === "mission" && classified.displayable) {
      missionTotal += amount
    } else if (classified.type === "verification") {
      verificationTotal += amount
    } else if (classified.legacyWarning) {
      legacyTotal += amount
    }
  }

  return { missionTotal, verificationTotal, legacyTotal }
}
