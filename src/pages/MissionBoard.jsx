import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ethers } from "ethers"
import { WORLDLAND, BASE } from "../lib/chain.js"
import { ADDRESSES, BASE_ADDRESSES, MISSION_BOARD_ABI } from "../abi/index.js"
import { LoadingState, StatusPill } from "../components/ui.jsx"
import MISSION_METADATA, { CLOSED_MISSIONS } from "../data/missionMetadata.js"

const CHAINS = [
  { id: "worldland", label: "Worldland", badge: "WL", chain: WORLDLAND, addresses: ADDRESSES },
  { id: "base", label: "Base", badge: "BA", chain: BASE, addresses: BASE_ADDRESSES },
]

const CATEGORY_LABELS = { 0: "Cold Case", 1: "Math", 2: "Research" }
const CATEGORY_COLORS = { 0: "danger", 1: "info", 2: "success" }
const CATEGORY_ICONS = { 0: "\u{1F50D}", 1: "\u{1F9EE}", 2: "\u{1F52C}" }
const STATUS_LABELS = { 0: "Open", 1: "In Progress", 2: "Under Review", 3: "Resolved", 4: "Closed" }
const STATUS_COLORS = { 0: "success", 1: "info", 2: "warn", 3: "dim", 4: "dim" }
const DIFFICULTY_COLORS = { Extreme: "text-red-400", High: "text-amber-400", Medium: "text-blue-400", Solved: "text-slate-500" }

function meta(uri) {
  return MISSION_METADATA[uri] || {}
}

function fmt(wei) {
  const n = Number(ethers.formatEther(wei ?? 0n))
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  if (n >= 1) return n.toFixed(0)
  return n.toFixed(2)
}

function toMissionObj(mission) {
  return {
    id: mission.id,
    category: mission.category,
    metadataURI: mission.metadataURI,
    curator: mission.curator,
    baseReward: mission.baseReward,
    progressReward: mission.progressReward,
    resolutionReward: mission.resolutionReward,
    status: mission.status,
    createdAt: mission.createdAt,
    claimedAt: mission.claimedAt,
  }
}

async function loadChainMissions(chainConfig) {
  try {
    const provider = new ethers.JsonRpcProvider(chainConfig.chain.rpcUrls[0])
    const missionBoard = new ethers.Contract(chainConfig.addresses.missionBoard, MISSION_BOARD_ABI, provider)
    const count = Number(await missionBoard.getMissionCount())
    const missions = []

    for (let index = 1; index <= count; index += 1) {
      const mission = await missionBoard.getMission(index)
      missions.push({ ...toMissionObj(mission), _chainId: chainConfig.id, _missionId: Number(mission.id) })
    }

    return missions
  } catch (error) {
    console.error(`Failed to load missions from ${chainConfig.label}:`, error)
    return []
  }
}

function mergeMissions(worldlandMissions, baseMissions) {
  const merged = new Map()

  for (const mission of worldlandMissions) {
    merged.set(mission.metadataURI, {
      metadataURI: mission.metadataURI,
      category: mission.category,
      status: mission.status,
      createdAt: mission.createdAt,
      worldland: mission,
      base: null,
    })
  }

  for (const mission of baseMissions) {
    if (merged.has(mission.metadataURI)) {
      merged.get(mission.metadataURI).base = mission
      continue
    }

    merged.set(mission.metadataURI, {
      metadataURI: mission.metadataURI,
      category: mission.category,
      status: mission.status,
      createdAt: mission.createdAt,
      worldland: null,
      base: mission,
    })
  }

  return Array.from(merged.values())
}

function ChainBadge({ badge, label, tone = "default" }) {
  const classes =
    tone === "base"
      ? "bg-blue-500/5 text-blue-400 border-blue-500/10"
      : "bg-white/5 text-slate-400 border-white/10"

  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold border ${classes}`}>
      <span>{badge}</span>
      <span>{label}</span>
    </span>
  )
}

export default function MissionBoard() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)
  const [chainStatus, setChainStatus] = useState({ worldland: "loading", base: "loading" })

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setChainStatus({ worldland: "loading", base: "loading" })

      const [worldlandMissions, baseMissions] = await Promise.all([
        loadChainMissions(CHAINS[0]).then((result) => {
          setChainStatus((state) => ({ ...state, worldland: "done" }))
          return result
        }),
        loadChainMissions(CHAINS[1]).then((result) => {
          setChainStatus((state) => ({ ...state, base: "done" }))
          return result
        }),
      ])

      setMissions(mergeMissions(worldlandMissions, baseMissions))
      setLoading(false)
    })()
  }, [])

  const filtered = (filter !== null ? missions.filter((mission) => Number(mission.category) === filter) : missions)
    .slice()
    .sort((left, right) => {
      const leftClosed = CLOSED_MISSIONS.has(left.metadataURI) ? 1 : 0
      const rightClosed = CLOSED_MISSIONS.has(right.metadataURI) ? 1 : 0
      return leftClosed - rightClosed
    })

  const activeCount = missions.filter((mission) => !CLOSED_MISSIONS.has(mission.metadataURI)).length

  return (
    <div className="page-shell py-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary/80">Mission Board</div>
          <div className="flex gap-1.5">
            {CHAINS.map((chain) => (
              <span
                key={chain.id}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                  chainStatus[chain.id] === "done"
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    : "border-white/10 bg-white/5 text-slate-500 animate-pulse"
                }`}
              >
                {chain.badge} {chain.label}
                {chainStatus[chain.id] === "done" ? <span className="text-emerald-400">OK</span> : null}
              </span>
            ))}
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white">Unsolved Missions</h1>
        <p className="mt-2 text-sm text-slate-400">
          Cold cases, math conjectures, and open research. Connect your wallet, register Agent ID CARD, and earn KOIN through verifier-backed mission outcomes.
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span>{missions.length} missions</span>
          <span>{activeCount} active</span>
          <span className="text-primary/40">verifier-backed payouts</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
            filter === null
              ? "border-primary bg-primary/15 text-primary"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(Number(key))}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              filter === Number(key)
                ? "border-primary bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {CATEGORY_ICONS[key]} {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading mission surfaces..." />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500">No missions found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => {
            const category = Number(entry.category)
            const status = Number(entry.status)
            const details = meta(entry.metadataURI)
            const isClosed = CLOSED_MISSIONS.has(entry.metadataURI)
            const worldlandMission = entry.worldland
            const baseMission = entry.base
            const primaryMission = baseMission || worldlandMission
            const primaryChain = baseMission ? "base" : "worldland"
            const primaryId = primaryMission._missionId
            const mirrored = Boolean(worldlandMission && baseMission)

            return (
              <Link
                key={entry.metadataURI}
                to={`/missions/${primaryId}?chain=${primaryChain}`}
                className={`group rounded-2xl border p-5 transition ${
                  isClosed
                    ? "border-white/5 bg-white/[0.01] opacity-50 hover:opacity-70"
                    : "border-white/8 bg-white/[0.03] hover:border-primary/30 hover:bg-primary/[0.04]"
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <StatusPill tone={CATEGORY_COLORS[category]}>{CATEGORY_LABELS[category]}</StatusPill>
                  {isClosed ? (
                    <StatusPill tone="dim">Closed (Solved)</StatusPill>
                  ) : (
                    <StatusPill tone={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</StatusPill>
                  )}
                  {details.difficulty && !isClosed ? (
                    <span className={`text-[10px] font-bold uppercase ${DIFFICULTY_COLORS[details.difficulty] || "text-slate-500"}`}>
                      {details.difficulty}
                    </span>
                  ) : null}
                </div>

                <h3 className="mb-1 line-clamp-2 text-base font-bold text-white transition group-hover:text-primary/90">
                  {CATEGORY_ICONS[category]} {details.title || entry.metadataURI}
                </h3>

                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">{details.year ? `est. ${details.year}` : "mission"}</span>
                  <div className="flex gap-1">
                    {worldlandMission ? <ChainBadge badge="WL" label="Worldland" /> : null}
                    {baseMission ? <ChainBadge badge="BA" label="Base" tone="base" /> : null}
                  </div>
                </div>

                {details.description ? (
                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{details.description}</p>
                ) : null}

                {!isClosed ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-white/5 px-1 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Base</div>
                        <div className="text-sm font-bold text-white">{fmt(primaryMission.baseReward)}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 px-1 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Progress</div>
                        <div className="text-sm font-bold text-amber-400">{fmt(primaryMission.progressReward)}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 px-1 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Resolution</div>
                        <div className="text-sm font-bold text-emerald-400">{fmt(primaryMission.resolutionReward)}</div>
                      </div>
                    </div>
                    {mirrored ? (
                      <div className="text-center text-[10px] text-slate-500">
                        Mirrored across both mission surfaces. Open the detail page to compare the chain-specific payout schedule.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {isClosed && details.closedReason ? (
                  <div className="mt-1 text-xs italic text-slate-500">{details.closedReason}</div>
                ) : null}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
