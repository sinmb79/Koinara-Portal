import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ethers } from "ethers"
import { WORLDLAND, shortAddress, formatDateTime } from "../lib/chain.js"
import {
  ADDRESSES, MISSION_BOARD_ABI, COLLABORATION_MANAGER_ABI,
} from "../abi/index.js"
import useStore from "../lib/store.js"
import { Button, StatusPill, LoadingState } from "../components/ui.jsx"
import MISSION_METADATA, { CLOSED_MISSIONS } from "../data/missionMetadata.js"
import { getSavedCredential, saveCredential, verifyCredential, encodeCredentialForChain } from "../lib/ail.js"

const CATEGORY_LABELS = { 0: "Cold Case", 1: "Math", 2: "Research" }
const STATUS_LABELS = { 0: "Open", 1: "In Progress", 2: "Under Review", 3: "Resolved", 4: "Closed" }
const VERDICT_LABELS = { 0: "Verified", 1: "Progress", 2: "Inconclusive", 3: "Rejected" }
const VERDICT_COLORS = { 0: "success", 1: "warn", 2: "dim", 3: "danger" }
const DIFFICULTY_COLORS = { Extreme: "text-red-400 border-red-400/20 bg-red-400/10", High: "text-amber-400 border-amber-400/20 bg-amber-400/10", Medium: "text-blue-400 border-blue-400/20 bg-blue-400/10" }

function meta(uri) {
  return MISSION_METADATA[uri] || {}
}

function fmt(wei) {
  return Number(ethers.formatEther(wei ?? 0n)).toFixed(1)
}

export default function MissionDetail() {
  const { id } = useParams()
  const { address, signer } = useStore()

  const [mission, setMission] = useState(null)
  const [participants, setParticipants] = useState([])
  const [isParticipant, setIsParticipant] = useState(false)
  const [team, setTeam] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reportHash, setReportHash] = useState("")
  const [ailCredential, setAilCredential] = useState(() => getSavedCredential())
  const [ailTokenInput, setAilTokenInput] = useState("")
  const [ailVerifying, setAilVerifying] = useState(false)
  const [ailError, setAilError] = useState("")

  const provider = new ethers.JsonRpcProvider(WORLDLAND.rpcUrls[0])
  const mbRead = new ethers.Contract(ADDRESSES.missionBoard, MISSION_BOARD_ABI, provider)
  const cmRead = new ethers.Contract(ADDRESSES.collaborationManager, COLLABORATION_MANAGER_ABI, provider)

  useEffect(() => {
    loadMission()
  }, [id])

  useEffect(() => {
    if (address && mission) checkParticipant()
  }, [address, mission])

  async function loadMission() {
    setLoading(true)
    try {
      const m = await mbRead.getMission(id)
      setMission(m)

      const parts = await mbRead.getParticipants(id)
      setParticipants(parts)

      const hasTeam = await cmRead.hasTeam(id)
      if (hasTeam) {
        const t = await cmRead.getTeam(id)
        setTeam(t)
      }

      const subIds = await mbRead.getSubmissionsByMission(id)
      const subs = []
      for (const sid of subIds) {
        const s = await mbRead.getSubmission(sid)
        subs.push(s)
      }
      setSubmissions(subs)
    } catch (err) {
      console.error("Failed to load mission:", err)
    } finally {
      setLoading(false)
    }
  }

  async function checkParticipant() {
    try {
      const result = await mbRead.isParticipant(id, address)
      setIsParticipant(result)
    } catch {}
  }

  async function handleVerifyAil() {
    if (!ailTokenInput.trim()) return
    setAilVerifying(true)
    setAilError("")
    try {
      const result = await verifyCredential(ailTokenInput.trim())
      if (result.valid) {
        const cred = { token: ailTokenInput.trim(), ail_id: result.ail_id, display_name: result.display_name, owner_org: result.owner_org }
        saveCredential(cred)
        setAilCredential(cred)
        setAilTokenInput("")
      } else {
        setAilError("Invalid credential: " + (result.reason || "verification failed"))
      }
    } catch (err) {
      setAilError(err.message)
    } finally {
      setAilVerifying(false)
    }
  }

  async function handleClaim() {
    if (!signer) return
    setClaiming(true)
    try {
      const mb = new ethers.Contract(ADDRESSES.missionBoard, MISSION_BOARD_ABI, signer)
      // Use AIL credential or fallback to mock format
      const credential = encodeCredentialForChain(address)
      const tx = await mb.claimMission(id, credential)
      await tx.wait()
      await loadMission()
      await checkParticipant()
    } catch (err) {
      console.error("Claim failed:", err)
      alert(err?.reason || err?.message || "Claim failed")
    } finally {
      setClaiming(false)
    }
  }

  async function handleSubmit(isResolution) {
    if (!signer || !reportHash.trim()) return
    setSubmitting(true)
    try {
      const mb = new ethers.Contract(ADDRESSES.missionBoard, MISSION_BOARD_ABI, signer)
      const fn = isResolution ? mb.submitResolution : mb.submitProgress
      const tx = await fn(id, reportHash.trim(), "0x")
      await tx.wait()
      setReportHash("")
      await loadMission()
    } catch (err) {
      console.error("Submit failed:", err)
      alert(err?.reason || err?.message || "Submit failed")
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
        <Link to="/missions" className="text-primary mt-4 inline-block">&larr; Back to Mission Board</Link>
      </div>
    )
  }

  const cat = Number(mission.category)
  const status = Number(mission.status)
  const md = meta(mission.metadataURI)
  const isClosed = CLOSED_MISSIONS.has(mission.metadataURI)
  const canClaim = !isClosed && (status === 0 || status === 1) && address && !isParticipant
  const canSubmit = !isClosed && (status === 1) && isParticipant

  return (
    <div className="page-shell py-8 max-w-4xl mx-auto">
      <Link to="/missions" className="text-xs text-primary hover:underline mb-4 inline-block">&larr; Back to Mission Board</Link>

      {/* Closed banner */}
      {isClosed && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
          <div className="text-sm font-bold text-amber-400 mb-1">This mission is closed</div>
          <p className="text-xs text-slate-400">{md.closedReason}</p>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <StatusPill tone="info">{CATEGORY_LABELS[cat]}</StatusPill>
          {isClosed ? (
            <StatusPill tone="dim">Closed (Solved)</StatusPill>
          ) : (
            <StatusPill tone={status === 3 ? "success" : status === 2 ? "warn" : "info"}>{STATUS_LABELS[status]}</StatusPill>
          )}
          {md.difficulty && md.difficulty !== "Solved" && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${DIFFICULTY_COLORS[md.difficulty] || ""}`}>
              {md.difficulty}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-black text-white mb-1">{md.title || mission.metadataURI}</h1>
        <div className="text-xs text-slate-500 font-mono mb-4">
          Mission #{id}{md.year ? ` \u00b7 est. ${md.year}` : ""} \u00b7 {mission.metadataURI}
        </div>

        {/* Description */}
        {md.description && (
          <div className="mb-4">
            <p className="text-sm text-slate-300 leading-relaxed">{md.description}</p>
          </div>
        )}

        {/* Note (partial progress etc) */}
        {md.note && (
          <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-2 mb-4">
            <p className="text-xs text-amber-300">{md.note}</p>
          </div>
        )}

        {/* References */}
        {md.references && md.references.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">References</div>
            <div className="flex flex-wrap gap-2">
              {md.references.map((ref, i) => (
                <a
                  key={i}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:border-primary/30 hover:text-primary transition"
                >
                  <span className="text-slate-500">&#x2197;</span> {ref.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Base Reward</div>
            <div className="text-lg font-bold text-white">{fmt(mission.baseReward)} KOIN</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Progress Reward</div>
            <div className="text-lg font-bold text-amber-400">{fmt(mission.progressReward)} KOIN</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Resolution Reward</div>
            <div className="text-lg font-bold text-emerald-400">{fmt(mission.resolutionReward)} KOIN</div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Curator: <span className="font-mono">{shortAddress(mission.curator)}</span>
          {mission.createdAt ? ` \u00b7 Created: ${formatDateTime(mission.createdAt)}` : ""}
        </div>
      </div>

      {/* AIL Credential */}
      {canClaim && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-5 mb-6">
          <div className="text-sm font-semibold text-primary mb-2">Claim this Mission</div>

          {ailCredential ? (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">AIL Verified</span>
                <span className="text-xs text-slate-400 font-mono">{ailCredential.ail_id}</span>
              </div>
              <p className="text-xs text-slate-500">{ailCredential.display_name} &middot; {ailCredential.owner_org}</p>
            </div>
          ) : (
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-2">
                AIL credential required. Get one at{" "}
                <a href="https://api.agentidcard.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  agentidcard.org
                </a>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ailTokenInput}
                  onChange={(e) => setAilTokenInput(e.target.value)}
                  placeholder="Paste your AIL JWT token..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-primary/40 focus:outline-none"
                />
                <Button variant="ghost" loading={ailVerifying} onClick={handleVerifyAil} disabled={!ailTokenInput.trim()}>
                  Verify
                </Button>
              </div>
              {ailError && <p className="text-xs text-red-400 mt-1">{ailError}</p>}
            </div>
          )}

          <Button variant="primary" loading={claiming} onClick={handleClaim}>
            Claim Mission
          </Button>
          <p className="text-[10px] text-slate-500 mt-2">
            On-chain verification via MockAILVerifier (production: JWT signature check)
          </p>
        </div>
      )}

      {isParticipant && !isClosed && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-xs text-primary font-semibold mb-6">
          &#x2713; You are a participant in this mission
        </div>
      )}

      {/* Participants */}
      {participants.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mb-6">
          <div className="text-sm font-semibold text-white mb-3">Participants ({participants.length})</div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <span key={p} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                {shortAddress(p)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Team */}
      {team && team.exists && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mb-6">
          <div className="text-sm font-semibold text-white mb-3">Team</div>
          <div className="space-y-2 text-xs">
            {team.agents?.length > 0 && (
              <div><span className="text-slate-500">Agents:</span> {team.agents.map(shortAddress).join(", ")}</div>
            )}
            {team.humans?.length > 0 && (
              <div><span className="text-slate-500">Humans:</span> {team.humans.map(shortAddress).join(", ")}</div>
            )}
            <div><span className="text-slate-500">Shares:</span> {team.rewardShares?.map((s) => `${Number(s) / 100}%`).join(", ")}</div>
          </div>
        </div>
      )}

      {/* Submit */}
      {canSubmit && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 mb-6">
          <div className="text-sm font-semibold text-white mb-3">Submit Report</div>
          <input
            type="text"
            value={reportHash}
            onChange={(e) => setReportHash(e.target.value)}
            placeholder="IPFS report hash (e.g. QmXyz...)"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-primary/40 focus:outline-none mb-3"
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
      )}

      {/* Submissions */}
      {submissions.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="text-sm font-semibold text-white mb-3">Submissions ({submissions.length})</div>
          <div className="space-y-3">
            {submissions.map((s) => {
              const verdict = Number(s.verdict)
              return (
                <div key={Number(s.id)} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusPill tone={s.isResolution ? "info" : "dim"}>
                      {s.isResolution ? "Resolution" : "Progress"}
                    </StatusPill>
                    {s.verified ? (
                      <StatusPill tone={VERDICT_COLORS[verdict]}>{VERDICT_LABELS[verdict]}</StatusPill>
                    ) : (
                      <StatusPill tone="dim">Pending</StatusPill>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-mono">{shortAddress(s.submitter)}</span>
                    <span className="mx-2">&middot;</span>
                    <span className="font-mono">{s.reportHash}</span>
                    {s.submittedAt ? <span> &middot; {formatDateTime(s.submittedAt)}</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
