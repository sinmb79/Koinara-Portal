import { useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { ethers } from "ethers"
import { WORLDLAND, BASE, shortAddress, formatDateTime } from "../lib/chain.js"
import {
  ADDRESSES,
  BASE_ADDRESSES,
  MISSION_BOARD_ABI,
  COLLABORATION_MANAGER_ABI,
} from "../abi/index.js"
import useStore from "../lib/store.js"
import { Button, StatusPill, LoadingState } from "../components/ui.jsx"
import MISSION_METADATA, { CLOSED_MISSIONS } from "../data/missionMetadata.js"
import {
  encodeCredentialForChain,
  getAgentProfileUrl,
  getStoredAILCredential,
} from "../lib/ail.js"
import {
  getMissionParticipationState,
  getVerdictLabel,
  getVerifierTrustLabel,
  isRewardableVerdict,
  normalizeMissionStatus,
} from "../lib/missionParticipation.js"

const CHAIN_MAP = {
  worldland: { chain: WORLDLAND, addresses: ADDRESSES, badge: "WL" },
  base: { chain: BASE, addresses: BASE_ADDRESSES, badge: "BA" },
}

const CATEGORY_LABELS = { 0: "Cold Case", 1: "Math", 2: "Research" }
const STATUS_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  UNDER_REVIEW: "Under Review",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}
const VERDICT_COLORS = { 0: "success", 1: "warn", 2: "dim", 3: "danger" }
const DIFFICULTY_COLORS = {
  Extreme: "text-red-400 border-red-400/20 bg-red-400/10",
  High: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  Medium: "text-blue-400 border-blue-400/20 bg-blue-400/10",
}
const PARTICIPATION_COPY = {
  disconnected: {
    title: "Connect your wallet",
    body: "Wallet connection is required before you can claim or submit work for this mission.",
  },
  needs_agent_id: {
    title: "Agent ID CARD required",
    body: "Register or verify Agent ID CARD before claiming this mission.",
  },
  can_claim: {
    title: "Ready to claim",
    body: "This mission is open for wallet-first participation. Claim it with your connected owner wallet.",
  },
  participating: {
    title: "Mission already claimed",
    body: "Your wallet is already in the mission. Submit progress or a final resolution from this surface.",
  },
  mission_closed: {
    title: "Mission closed",
    body: "This mission is no longer available for new claims.",
  },
}

function meta(uri) {
  return MISSION_METADATA[uri] || {}
}

function fmt(wei) {
  return Number(ethers.formatEther(wei ?? 0n)).toFixed(1)
}

function getStatusTone(status) {
  if (status === "RESOLVED") return "success"
  if (status === "UNDER_REVIEW") return "warn"
  return "info"
}

function getChainLabel(chainKey) {
  return chainKey === "base" ? "Base" : "Worldland"
}

export default function MissionDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const chainKey = searchParams.get("chain") || "base"
  const chainConfig = CHAIN_MAP[chainKey] || CHAIN_MAP.base
  const { address, signer } = useStore()

  const [mission, setMission] = useState(null)
  const [otherChainMission, setOtherChainMission] = useState(null)
  const [participants, setParticipants] = useState([])
  const [isParticipant, setIsParticipant] = useState(false)
  const [team, setTeam] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reportHash, setReportHash] = useState("")
  const [ailCredential, setAilCredential] = useState(() => getStoredAILCredential())

  const provider = new ethers.JsonRpcProvider(chainConfig.chain.rpcUrls[0])
  const missionBoardRead = new ethers.Contract(chainConfig.addresses.missionBoard, MISSION_BOARD_ABI, provider)
  const collaborationRead = new ethers.Contract(chainConfig.addresses.collaborationManager, COLLABORATION_MANAGER_ABI, provider)

  useEffect(() => {
    loadMission()
    setAilCredential(getStoredAILCredential())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, chainKey])

  useEffect(() => {
    if (address && mission) {
      void checkParticipant()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, mission])

  async function loadMission() {
    setLoading(true)

    try {
      const nextMission = await missionBoardRead.getMission(id)
      setMission(nextMission)

      const nextParticipants = await missionBoardRead.getParticipants(id)
      setParticipants(nextParticipants)

      const hasTeam = await collaborationRead.hasTeam(id)
      if (hasTeam) {
        setTeam(await collaborationRead.getTeam(id))
      } else {
        setTeam(null)
      }

      const submissionIds = await missionBoardRead.getSubmissionsByMission(id)
      const nextSubmissions = []
      for (const submissionId of submissionIds) {
        nextSubmissions.push(await missionBoardRead.getSubmission(submissionId))
      }
      setSubmissions(nextSubmissions)

      const otherKey = chainKey === "base" ? "worldland" : "base"
      const otherConfig = CHAIN_MAP[otherKey]
      setOtherChainMission(null)

      if (otherConfig) {
        try {
          const otherProvider = new ethers.JsonRpcProvider(otherConfig.chain.rpcUrls[0])
          const otherMissionBoard = new ethers.Contract(otherConfig.addresses.missionBoard, MISSION_BOARD_ABI, otherProvider)
          const otherCount = Number(await otherMissionBoard.getMissionCount())
          for (let index = 1; index <= otherCount; index += 1) {
            const candidate = await otherMissionBoard.getMission(index)
            if (candidate.metadataURI === nextMission.metadataURI) {
              setOtherChainMission({
                id: candidate.id,
                metadataURI: candidate.metadataURI,
                baseReward: candidate.baseReward,
                progressReward: candidate.progressReward,
                resolutionReward: candidate.resolutionReward,
                status: candidate.status,
                chain: otherKey,
              })
              break
            }
          }
        } catch {
          setOtherChainMission(null)
        }
      }
    } catch (error) {
      console.error("Failed to load mission:", error)
      setMission(null)
    } finally {
      setLoading(false)
    }
  }

  async function checkParticipant() {
    try {
      setIsParticipant(await missionBoardRead.isParticipant(id, address))
    } catch {
      setIsParticipant(false)
    }
  }

  async function handleClaim() {
    if (!signer) return
    if (!ailCredential?.ail_id) {
      alert("Agent ID CARD credential required. Please verify your Agent ID CARD first.")
      return
    }

    setClaiming(true)

    try {
      const missionBoard = new ethers.Contract(chainConfig.addresses.missionBoard, MISSION_BOARD_ABI, signer)
      const credential = encodeCredentialForChain(address)
      const tx = await missionBoard.claimMission(id, credential)
      await tx.wait()
      await loadMission()
      await checkParticipant()
    } catch (error) {
      console.error("Claim failed:", error)
      alert(error?.reason || error?.message || "Claim failed")
    } finally {
      setClaiming(false)
    }
  }

  async function handleSubmit(isResolution) {
    if (!signer || !reportHash.trim()) return

    setSubmitting(true)

    try {
      const missionBoard = new ethers.Contract(chainConfig.addresses.missionBoard, MISSION_BOARD_ABI, signer)
      const fn = isResolution ? missionBoard.submitResolution : missionBoard.submitProgress
      const tx = await fn(id, reportHash.trim(), "0x")
      await tx.wait()
      setReportHash("")
      await loadMission()
    } catch (error) {
      console.error("Submit failed:", error)
      alert(error?.reason || error?.message || "Submit failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell py-16">
        <LoadingState label="Loading mission..." />
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="page-shell py-16 text-center text-slate-500">
        Mission not found.
        <br />
        <Link to="/missions" className="mt-4 inline-block text-primary">
          &larr; Back to Mission Board
        </Link>
      </div>
    )
  }

  const category = Number(mission.category)
  const details = meta(mission.metadataURI)
  const normalizedStatus = normalizeMissionStatus(Number(mission.status))
  const isClosed = CLOSED_MISSIONS.has(mission.metadataURI)
  const participationState = getMissionParticipationState({
    connected: Boolean(address),
    agentIdRegistered: Boolean(ailCredential),
    isMissionParticipant: isParticipant,
    missionStatus: normalizedStatus,
  })
  const showClaimPanel = !isClosed && Boolean(address) && !isParticipant && ["OPEN", "IN_PROGRESS"].includes(normalizedStatus)
  const canClaim = participationState.canClaim
  const canSubmit = !isClosed && participationState.canSubmit
  const verifierTrustLabel = getVerifierTrustLabel("proova")
  const participationCopy = PARTICIPATION_COPY[participationState.statusKey] || PARTICIPATION_COPY.disconnected
  const currentChainLabel = getChainLabel(chainKey)
  const mirroredChainLabel = otherChainMission ? getChainLabel(otherChainMission.chain) : null

  return (
    <div className="page-shell mx-auto max-w-4xl py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/missions" className="text-xs text-primary hover:underline">
          &larr; Back to Mission Board
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400">
          {chainConfig.badge} {chainConfig.chain.chainName}
        </span>
      </div>

      {isClosed ? (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-1 text-sm font-bold text-amber-400">This mission is closed</div>
          <p className="text-xs text-slate-400">{details.closedReason}</p>
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusPill tone="info">{CATEGORY_LABELS[category]}</StatusPill>
          {isClosed ? (
            <StatusPill tone="dim">Closed (Solved)</StatusPill>
          ) : (
            <StatusPill tone={getStatusTone(normalizedStatus)}>{STATUS_LABELS[normalizedStatus] || normalizedStatus}</StatusPill>
          )}
          {details.difficulty && details.difficulty !== "Solved" ? (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                DIFFICULTY_COLORS[details.difficulty] || ""
              }`}
            >
              {details.difficulty}
            </span>
          ) : null}
          <StatusPill tone="dim">{verifierTrustLabel}</StatusPill>
        </div>

        <h1 className="mb-1 text-2xl font-black text-white">{details.title || mission.metadataURI}</h1>
        <div className="mb-4 text-xs font-mono text-slate-500">
          Mission #{id}
          {details.year ? ` · est. ${details.year}` : ""}
          {" · "}
          {mission.metadataURI}
        </div>

        {details.description ? (
          <div className="mb-4">
            <p className="text-sm leading-relaxed text-slate-300">{details.description}</p>
          </div>
        ) : null}

        {details.note ? (
          <div className="mb-4 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-2">
            <p className="text-xs text-amber-300">{details.note}</p>
          </div>
        ) : null}

        {details.references?.length ? (
          <div className="mb-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">References</div>
            <div className="flex flex-wrap gap-2">
              {details.references.map((reference, index) => (
                <a
                  key={index}
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-primary/30 hover:text-primary"
                >
                  <span className="text-slate-500">↗</span> {reference.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current Chain Payout Schedule</div>
          <div className="mb-3 grid grid-cols-3 gap-3">
            <RewardStat label="Base Reward" value={`${fmt(mission.baseReward)} KOIN`} valueClassName="text-white" />
            <RewardStat label="Progress Reward" value={`${fmt(mission.progressReward)} KOIN`} valueClassName="text-amber-400" />
            <RewardStat label="Resolution Reward" value={`${fmt(mission.resolutionReward)} KOIN`} valueClassName="text-emerald-400" />
          </div>
          <div className="grid gap-2 text-[10px] text-slate-500 sm:grid-cols-2">
            <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
              {currentChainLabel} rewards unlock only after a {verifierTrustLabel} verdict. Rejected or inconclusive outcomes do not create fallback rewards.
            </div>
            {otherChainMission ? (
              <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                Also mirrored on {mirroredChainLabel}: {fmt(otherChainMission.baseReward)} / {fmt(otherChainMission.progressReward)} / {fmt(otherChainMission.resolutionReward)} KOIN
              </div>
            ) : null}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Curator: <span className="font-mono">{shortAddress(mission.curator)}</span>
          {mission.createdAt ? ` · Created: ${formatDateTime(mission.createdAt)}` : ""}
        </div>
      </div>

      {showClaimPanel ? (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/[0.05] p-5">
          <div className="mb-2 text-sm font-semibold text-primary">Claim this Mission</div>
          <div className="mb-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{participationCopy.title}</div>
            <p className="mt-2 text-xs leading-6 text-slate-400">{participationCopy.body}</p>
          </div>

          {ailCredential ? (
            <div className="mb-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                  Agent ID Verified
                </span>
                <span className="font-mono text-xs text-slate-400">{ailCredential.ail_id}</span>
              </div>
              <p className="text-xs text-slate-500">
                {ailCredential.display_name}
                {ailCredential.owner_org ? ` · ${ailCredential.owner_org}` : ""}
              </p>
              <a
                href={getAgentProfileUrl(ailCredential.ail_id)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-xs text-primary hover:underline"
              >
                View Agent ID CARD profile
              </a>
            </div>
          ) : (
            <div className="mb-3">
              <p className="mb-3 text-xs text-slate-400">
                Agent ID CARD verification is required before claiming missions.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/dashboard/agent-id"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/15 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:border-primary/30 hover:text-primary"
                >
                  Open Agent ID CARD registration
                </Link>
                <a
                  href="https://agentidcard.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/15 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:border-primary/30 hover:text-primary"
                >
                  Visit Agent ID CARD
                </a>
              </div>
            </div>
          )}

          <Button variant="primary" loading={claiming} onClick={handleClaim} disabled={!canClaim}>
            {canClaim ? "Claim Mission" : "Verify Agent ID CARD First"}
          </Button>
          <p className="mt-2 text-[10px] text-slate-500">
            Identity is verified via{" "}
            <a
              href="https://agentidcard.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/60 hover:text-primary"
            >
              Agent ID CARD
            </a>{" "}
            before on-chain claim.
          </p>
        </div>
      ) : null}

      {isParticipant && !isClosed ? (
        <div className="mb-6 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary">
          You are a participant in this mission.
        </div>
      ) : null}

      {participants.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="mb-3 text-sm font-semibold text-white">Participants ({participants.length})</div>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <span
                key={participant}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-slate-300"
              >
                {shortAddress(participant)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {team?.exists ? (
        <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="mb-3 text-sm font-semibold text-white">Team</div>
          <div className="space-y-2 text-xs">
            {team.agents?.length > 0 ? (
              <div>
                <span className="text-slate-500">Agents:</span> {team.agents.map(shortAddress).join(", ")}
              </div>
            ) : null}
            {team.humans?.length > 0 ? (
              <div>
                <span className="text-slate-500">Humans:</span> {team.humans.map(shortAddress).join(", ")}
              </div>
            ) : null}
            <div>
              <span className="text-slate-500">Shares:</span> {team.rewardShares?.map((share) => `${Number(share) / 100}%`).join(", ")}
            </div>
          </div>
        </div>
      ) : null}

      {canSubmit ? (
        <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="mb-1 text-sm font-semibold text-white">Submit Report</div>
          <p className="mb-3 text-xs text-slate-500">
            Submit progress or a final resolution. Rewards only unlock after {verifierTrustLabel} confirms the outcome.
          </p>
          <input
            type="text"
            value={reportHash}
            onChange={(event) => setReportHash(event.target.value)}
            placeholder="IPFS report hash (e.g. QmXyz...)"
            className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-primary/40 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button variant="ghost" loading={submitting} onClick={() => handleSubmit(false)} disabled={!reportHash.trim()}>
              Submit Progress
            </Button>
            <Button variant="primary" loading={submitting} onClick={() => handleSubmit(true)} disabled={!reportHash.trim()}>
              Submit Resolution
            </Button>
          </div>
        </div>
      ) : null}

      {submissions.length > 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="mb-3 text-sm font-semibold text-white">Submissions ({submissions.length})</div>
          <div className="space-y-3">
            {submissions.map((submission) => {
              const verdict = Number(submission.verdict)
              const verdictLabel = getVerdictLabel(verdict)
              const verdictEligible = isRewardableVerdict(verdict)

              return (
                <div key={Number(submission.id)} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <StatusPill tone={submission.isResolution ? "info" : "dim"}>
                      {submission.isResolution ? "Resolution" : "Progress"}
                    </StatusPill>
                    {submission.verified ? (
                      <>
                        <StatusPill tone={VERDICT_COLORS[verdict] || "dim"}>{verdictLabel}</StatusPill>
                        <span
                          className={`text-[9px] font-semibold uppercase ${
                            verdictEligible ? "text-emerald-400" : "text-slate-500"
                          }`}
                        >
                          {verdictEligible ? "Reward eligible" : "No reward"}
                        </span>
                      </>
                    ) : (
                      <StatusPill tone="dim">Pending verification</StatusPill>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-mono">{shortAddress(submission.submitter)}</span>
                    <span className="mx-2">&middot;</span>
                    <span className="font-mono">{submission.reportHash}</span>
                    {submission.submittedAt ? <span> &middot; {formatDateTime(submission.submittedAt)}</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function RewardStat({ label, value, valueClassName }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-lg font-bold ${valueClassName}`}>{value}</div>
    </div>
  )
}
