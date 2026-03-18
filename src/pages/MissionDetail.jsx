import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ethers } from "ethers"
import { WORLDLAND, shortAddress, formatDateTime } from "../lib/chain.js"
import {
  ADDRESSES, MISSION_BOARD_ABI, COLLABORATION_MANAGER_ABI,
  MISSION_CATEGORY, MISSION_STATUS, VERDICT,
} from "../abi/index.js"
import useStore from "../lib/store.js"
import { Button, StatusPill, LoadingState, AddressLink } from "../components/ui.jsx"

const CATEGORY_LABELS = { 0: "Cold Case", 1: "Math", 2: "Research" }
const STATUS_LABELS = { 0: "Open", 1: "In Progress", 2: "Under Review", 3: "Resolved", 4: "Closed" }
const VERDICT_LABELS = { 0: "Verified", 1: "Progress", 2: "Inconclusive", 3: "Rejected" }
const VERDICT_COLORS = { 0: "success", 1: "warn", 2: "dim", 3: "danger" }

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

  async function handleClaim() {
    if (!signer) return
    setClaiming(true)
    try {
      const mb = new ethers.Contract(ADDRESSES.missionBoard, MISSION_BOARD_ABI, signer)
      // Mock AIL credential: address padded to 32 bytes (address first)
      const credential = address + "000000000000000000000000"
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
        <Link to="/missions" className="text-primary mt-4 inline-block">← Back to Mission Board</Link>
      </div>
    )
  }

  const cat = Number(mission.category)
  const status = Number(mission.status)
  const canClaim = (status === 0 || status === 1) && address && !isParticipant
  const canSubmit = (status === 1) && isParticipant

  return (
    <div className="page-shell py-8">
      <Link to="/missions" className="text-xs text-primary hover:underline mb-4 inline-block">← Back to Mission Board</Link>

      {/* Header */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <StatusPill tone="info">{CATEGORY_LABELS[cat]}</StatusPill>
          <StatusPill tone={status === 3 ? "success" : status === 2 ? "warn" : "info"}>{STATUS_LABELS[status]}</StatusPill>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">Mission #{id}</h1>
        <div className="text-sm text-slate-400 font-mono mb-4">{mission.metadataURI}</div>

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
          {mission.createdAt ? ` · Created: ${formatDateTime(mission.createdAt)}` : ""}
        </div>
      </div>

      {/* Claim */}
      {canClaim && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-5 mb-6">
          <div className="text-sm font-semibold text-primary mb-2">Claim this Mission</div>
          <p className="text-xs text-slate-400 mb-3">AIL credential verification will be performed automatically (mock mode).</p>
          <Button variant="primary" loading={claiming} onClick={handleClaim}>
            Claim Mission
          </Button>
        </div>
      )}

      {isParticipant && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-2 text-xs text-primary font-semibold mb-6">
          ✓ You are a participant in this mission
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
                    <span className="mx-2">·</span>
                    <span className="font-mono">{s.reportHash}</span>
                    {s.submittedAt ? <span> · {formatDateTime(s.submittedAt)}</span> : null}
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
