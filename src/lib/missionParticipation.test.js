import { describe, it } from "node:test"
import assert from "node:assert/strict"

import {
  normalizeVerdict,
  getVerdictLabel,
  isRewardableVerdict,
  classifyMissionReward,
  getMissionParticipationState,
  getVerifierTrustLabel,
  normalizeMissionStatus,
  summarizeMissionRewards,
} from "./missionParticipation.js"

// ═══════════════════════════════════════════════════════════════
// normalizeVerdict
// ═══════════════════════════════════════════════════════════════

describe("normalizeVerdict", () => {
  it("normalizes numeric verdict 0 → VERIFIED", () => {
    const v = normalizeVerdict(0)
    assert.equal(v.key, "VERIFIED")
    assert.equal(v.rewardable, true)
  })

  it("normalizes numeric verdict 1 → PROGRESS", () => {
    const v = normalizeVerdict(1)
    assert.equal(v.key, "PROGRESS")
    assert.equal(v.rewardable, true)
  })

  it("normalizes numeric verdict 2 → INCONCLUSIVE", () => {
    const v = normalizeVerdict(2)
    assert.equal(v.key, "INCONCLUSIVE")
    assert.equal(v.rewardable, false)
  })

  it("normalizes numeric verdict 3 → REJECTED", () => {
    const v = normalizeVerdict(3)
    assert.equal(v.key, "REJECTED")
    assert.equal(v.rewardable, false)
  })

  it("normalizes string 'verified' (case-insensitive)", () => {
    const v = normalizeVerdict("verified")
    assert.equal(v.key, "VERIFIED")
  })

  it("returns null for unknown verdict", () => {
    assert.equal(normalizeVerdict(99), null)
    assert.equal(normalizeVerdict("invalid"), null)
    assert.equal(normalizeVerdict(null), null)
  })
})

// ═══════════════════════════════════════════════════════════════
// getVerdictLabel
// ═══════════════════════════════════════════════════════════════

describe("getVerdictLabel", () => {
  it("returns English label by default", () => {
    assert.equal(getVerdictLabel(0), "Verified")
    assert.equal(getVerdictLabel(1), "Progress")
  })

  it("returns Korean label when lang=ko", () => {
    assert.equal(getVerdictLabel(0, "ko"), "검증 완료")
    assert.equal(getVerdictLabel(3, "ko"), "거부")
  })

  it("returns raw value for unknown verdict", () => {
    assert.equal(getVerdictLabel("something"), "something")
  })
})

// ═══════════════════════════════════════════════════════════════
// isRewardableVerdict
// ═══════════════════════════════════════════════════════════════

describe("isRewardableVerdict", () => {
  it("VERIFIED and PROGRESS are rewardable", () => {
    assert.equal(isRewardableVerdict(0), true)
    assert.equal(isRewardableVerdict(1), true)
    assert.equal(isRewardableVerdict("VERIFIED"), true)
    assert.equal(isRewardableVerdict("PROGRESS"), true)
  })

  it("INCONCLUSIVE and REJECTED are not rewardable", () => {
    assert.equal(isRewardableVerdict(2), false)
    assert.equal(isRewardableVerdict(3), false)
    assert.equal(isRewardableVerdict("REJECTED"), false)
  })

  it("unknown verdict is not rewardable", () => {
    assert.equal(isRewardableVerdict(null), false)
    assert.equal(isRewardableVerdict("bad"), false)
  })
})

// ═══════════════════════════════════════════════════════════════
// classifyMissionReward
// ═══════════════════════════════════════════════════════════════

describe("classifyMissionReward", () => {
  it("'active' source is classified as legacy", () => {
    const r = classifyMissionReward({ source: "active" })
    assert.equal(r.type, "legacy")
    assert.equal(r.displayable, false)
    assert.equal(r.legacyWarning, true)
  })

  it("'mission' source with VERIFIED verdict is displayable", () => {
    const r = classifyMissionReward({ source: "mission", verdict: 0 })
    assert.equal(r.type, "mission")
    assert.equal(r.displayable, true)
  })

  it("'mission' source with REJECTED verdict is not displayable", () => {
    const r = classifyMissionReward({ source: "mission", verdict: 3 })
    assert.equal(r.type, "mission")
    assert.equal(r.displayable, false)
  })

  it("'work' source is treated as mission", () => {
    const r = classifyMissionReward({ source: "work", verdict: 1 })
    assert.equal(r.type, "mission")
    assert.equal(r.displayable, true)
  })

  it("'verification' source is always displayable", () => {
    const r = classifyMissionReward({ source: "verification" })
    assert.equal(r.type, "verification")
    assert.equal(r.displayable, true)
  })

  it("unknown source is not displayable", () => {
    const r = classifyMissionReward({ source: "foo" })
    assert.equal(r.type, "unknown")
    assert.equal(r.displayable, false)
  })

  it("legacy active reward is excluded from default mission summaries", () => {
    const r = classifyMissionReward({ source: "active", verdict: "VERIFIED" })
    // Even with VERIFIED verdict, active reward remains legacy
    assert.equal(r.type, "legacy")
    assert.equal(r.displayable, false)
    assert.equal(r.legacyWarning, true)
  })
})

// ═══════════════════════════════════════════════════════════════
// getMissionParticipationState
// ═══════════════════════════════════════════════════════════════

describe("getMissionParticipationState", () => {
  it("disconnected wallet cannot claim or submit", () => {
    const s = getMissionParticipationState({ connected: false })
    assert.equal(s.canClaim, false)
    assert.equal(s.canSubmit, false)
    assert.equal(s.statusKey, "disconnected")
  })

  it("connected wallet without Agent ID CARD requires registration", () => {
    const s = getMissionParticipationState({ connected: true, agentIdRegistered: false })
    assert.equal(s.canClaim, false)
    assert.equal(s.requiresAgentId, true)
    assert.equal(s.statusKey, "needs_agent_id")
  })

  it("registered agent can claim OPEN mission", () => {
    const s = getMissionParticipationState({
      connected: true,
      agentIdRegistered: true,
      isMissionParticipant: false,
      missionStatus: "OPEN",
    })
    assert.equal(s.canClaim, true)
    assert.equal(s.canSubmit, false)
    assert.equal(s.statusKey, "can_claim")
  })

  it("registered agent can claim IN_PROGRESS mission", () => {
    const s = getMissionParticipationState({
      connected: true,
      agentIdRegistered: true,
      isMissionParticipant: false,
      missionStatus: "IN_PROGRESS",
    })
    assert.equal(s.canClaim, true)
  })

  it("participant can submit when IN_PROGRESS", () => {
    const s = getMissionParticipationState({
      connected: true,
      agentIdRegistered: true,
      isMissionParticipant: true,
      missionStatus: "IN_PROGRESS",
    })
    assert.equal(s.canClaim, false)
    assert.equal(s.canSubmit, true)
    assert.equal(s.statusKey, "participating")
  })

  it("participant cannot submit when UNDER_REVIEW", () => {
    const s = getMissionParticipationState({
      connected: true,
      agentIdRegistered: true,
      isMissionParticipant: true,
      missionStatus: "UNDER_REVIEW",
    })
    assert.equal(s.canSubmit, false)
  })

  it("cannot claim RESOLVED mission", () => {
    const s = getMissionParticipationState({
      connected: true,
      agentIdRegistered: true,
      isMissionParticipant: false,
      missionStatus: "RESOLVED",
    })
    assert.equal(s.canClaim, false)
    assert.equal(s.statusKey, "mission_closed")
  })
})

// ═══════════════════════════════════════════════════════════════
// getVerifierTrustLabel
// ═══════════════════════════════════════════════════════════════

describe("getVerifierTrustLabel", () => {
  it("proova/oracle role gets distinct verifier label", () => {
    assert.equal(getVerifierTrustLabel("proova"), "Verifier (Proova)")
    assert.equal(getVerifierTrustLabel("oracle"), "Verifier (Proova)")
  })

  it("agent role gets agent label", () => {
    assert.equal(getVerifierTrustLabel("agent"), "Agent")
  })

  it("verifier label is distinct from agent label", () => {
    assert.notEqual(getVerifierTrustLabel("proova"), getVerifierTrustLabel("agent"))
  })

  it("Korean labels work", () => {
    assert.equal(getVerifierTrustLabel("proova", "ko"), "검증자 (Proova)")
    assert.equal(getVerifierTrustLabel("agent", "ko"), "에이전트")
  })
})

// ═══════════════════════════════════════════════════════════════
// normalizeMissionStatus
// ═══════════════════════════════════════════════════════════════

describe("normalizeMissionStatus", () => {
  it("maps numeric statuses", () => {
    assert.equal(normalizeMissionStatus(0), "OPEN")
    assert.equal(normalizeMissionStatus(1), "IN_PROGRESS")
    assert.equal(normalizeMissionStatus(2), "UNDER_REVIEW")
    assert.equal(normalizeMissionStatus(3), "RESOLVED")
    assert.equal(normalizeMissionStatus(4), "CLOSED")
  })

  it("returns UNKNOWN for out-of-range", () => {
    assert.equal(normalizeMissionStatus(99), "UNKNOWN")
  })

  it("passes through string statuses (uppercased)", () => {
    assert.equal(normalizeMissionStatus("open"), "OPEN")
    assert.equal(normalizeMissionStatus("in_progress"), "IN_PROGRESS")
  })
})

// ═══════════════════════════════════════════════════════════════
// summarizeMissionRewards
// ═══════════════════════════════════════════════════════════════

describe("summarizeMissionRewards", () => {
  it("separates mission, verification, and legacy totals", () => {
    const rewards = [
      { source: "mission", amount: 100n, verdict: 0 },
      { source: "verification", amount: 30n },
      { source: "active", amount: 50n },
      { source: "mission", amount: 200n, verdict: 1 },
    ]
    const summary = summarizeMissionRewards(rewards)
    assert.equal(summary.missionTotal, 300n)
    assert.equal(summary.verificationTotal, 30n)
    assert.equal(summary.legacyTotal, 50n)
  })

  it("excludes non-rewardable mission verdicts", () => {
    const rewards = [
      { source: "mission", amount: 100n, verdict: 3 }, // REJECTED
      { source: "mission", amount: 200n, verdict: 0 }, // VERIFIED
    ]
    const summary = summarizeMissionRewards(rewards)
    assert.equal(summary.missionTotal, 200n)
  })

  it("returns zeros for empty rewards", () => {
    const summary = summarizeMissionRewards([])
    assert.equal(summary.missionTotal, 0n)
    assert.equal(summary.verificationTotal, 0n)
    assert.equal(summary.legacyTotal, 0n)
  })

  it("handles string amounts", () => {
    const rewards = [{ source: "mission", amount: "500", verdict: 0 }]
    const summary = summarizeMissionRewards(rewards)
    assert.equal(summary.missionTotal, 500n)
  })
})
