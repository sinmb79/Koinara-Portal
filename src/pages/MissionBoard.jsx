import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ethers } from "ethers"
import { WORLDLAND, BASE } from "../lib/chain.js"
import { ADDRESSES, BASE_ADDRESSES, MISSION_BOARD_ABI } from "../abi/index.js"
import { LoadingState, StatusPill } from "../components/ui.jsx"
import MISSION_METADATA, { CLOSED_MISSIONS } from "../data/missionMetadata.js"

const CHAINS = [
  { id: "worldland", label: "Worldland", icon: "🌐", chain: WORLDLAND, addresses: ADDRESSES },
  { id: "base", label: "Base", icon: "⬡", chain: BASE, addresses: BASE_ADDRESSES },
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

async function loadChainMissions(chainConfig) {
  try {
    const provider = new ethers.JsonRpcProvider(chainConfig.chain.rpcUrls[0])
    const mb = new ethers.Contract(chainConfig.addresses.missionBoard, MISSION_BOARD_ABI, provider)
    const count = Number(await mb.getMissionCount())
    const list = []
    for (let i = 1; i <= count; i++) {
      const m = await mb.getMission(i)
      list.push({ ...m, _chainId: chainConfig.id, _missionId: Number(m.id) })
    }
    return list
  } catch (err) {
    console.error(`Failed to load missions from ${chainConfig.label}:`, err)
    return []
  }
}

// Merge missions from both chains by metadataURI
function mergeMissions(worldlandMissions, baseMissions) {
  const merged = new Map()

  for (const m of worldlandMissions) {
    const key = m.metadataURI
    merged.set(key, {
      metadataURI: m.metadataURI,
      category: m.category,
      status: m.status,
      createdAt: m.createdAt,
      worldland: m,
      base: null,
    })
  }

  for (const m of baseMissions) {
    const key = m.metadataURI
    if (merged.has(key)) {
      merged.get(key).base = m
    } else {
      merged.set(key, {
        metadataURI: m.metadataURI,
        category: m.category,
        status: m.status,
        createdAt: m.createdAt,
        worldland: null,
        base: m,
      })
    }
  }

  return Array.from(merged.values())
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

      const [wl, base] = await Promise.all([
        loadChainMissions(CHAINS[0]).then((r) => { setChainStatus((s) => ({ ...s, worldland: "done" })); return r }),
        loadChainMissions(CHAINS[1]).then((r) => { setChainStatus((s) => ({ ...s, base: "done" })); return r }),
      ])

      setMissions(mergeMissions(wl, base))
      setLoading(false)
    })()
  }, [])

  const filtered = (filter !== null ? missions.filter((m) => Number(m.category) === filter) : missions)
    .slice()
    .sort((a, b) => {
      const aClosed = CLOSED_MISSIONS.has(a.metadataURI) ? 1 : 0
      const bClosed = CLOSED_MISSIONS.has(b.metadataURI) ? 1 : 0
      return aClosed - bClosed
    })

  const activeCount = missions.filter((m) => !CLOSED_MISSIONS.has(m.metadataURI)).length

  return (
    <div className="page-shell py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary/80">Mission Board</div>
          {/* Chain status indicators */}
          <div className="flex gap-1.5">
            {CHAINS.map((c) => (
              <span
                key={c.id}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  chainStatus[c.id] === "done"
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    : "border-white/10 bg-white/5 text-slate-500 animate-pulse"
                }`}
              >
                {c.icon} {c.label}
                {chainStatus[c.id] === "done" && <span className="text-emerald-400">✓</span>}
              </span>
            ))}
          </div>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Unsolved Missions</h1>
        <p className="mt-2 text-sm text-slate-400">
          Cold cases, math conjectures, and open research — claim on any chain, earn KOIN on both.
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span>{missions.length} missions</span>
          <span>{activeCount} active</span>
          <span className="text-primary/40">Worldland + Base</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
            filter === null
              ? "border-primary bg-primary/15 text-primary"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(Number(k))}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
              filter === Number(k)
                ? "border-primary bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {CATEGORY_ICONS[k]} {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading missions from Worldland + Base..." />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No missions found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const cat = Number(m.category)
            const status = Number(m.status)
            const md = meta(m.metadataURI)
            const isClosed = CLOSED_MISSIONS.has(m.metadataURI)
            const wl = m.worldland
            const base = m.base
            const primary = base || wl
            const primaryChain = base ? "base" : "worldland"
            const primaryId = primary._missionId

            // Sum rewards from both chains
            const totalBase = (wl?.baseReward ?? 0n) + (base?.baseReward ?? 0n)
            const totalProgress = (wl?.progressReward ?? 0n) + (base?.progressReward ?? 0n)
            const totalResolution = (wl?.resolutionReward ?? 0n) + (base?.resolutionReward ?? 0n)

            return (
              <Link
                key={m.metadataURI}
                to={`/missions/${primaryId}?chain=${primaryChain}`}
                className={`group rounded-2xl border p-5 transition ${
                  isClosed
                    ? "border-white/5 bg-white/[0.01] opacity-50 hover:opacity-70"
                    : "border-white/8 bg-white/[0.03] hover:border-primary/30 hover:bg-primary/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <StatusPill tone={CATEGORY_COLORS[cat]}>{CATEGORY_LABELS[cat]}</StatusPill>
                  {isClosed ? (
                    <StatusPill tone="dim">Closed (Solved)</StatusPill>
                  ) : (
                    <StatusPill tone={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</StatusPill>
                  )}
                  {md.difficulty && !isClosed && (
                    <span className={`text-[10px] font-bold uppercase ${DIFFICULTY_COLORS[md.difficulty] || "text-slate-500"}`}>
                      {md.difficulty}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-1 line-clamp-2 group-hover:text-primary/90 transition">
                  {CATEGORY_ICONS[cat]} {md.title || m.metadataURI}
                </h3>
                <div className="text-xs text-slate-500 font-mono mb-2">
                  {md.year ? `est. ${md.year}` : ""}
                  {/* Chain availability badges */}
                  <span className="ml-2">
                    {wl && <span className="inline-flex items-center gap-0.5 rounded bg-white/5 px-1 py-0.5 text-[9px] text-slate-500 mr-1">🌐</span>}
                    {base && <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/5 px-1 py-0.5 text-[9px] text-blue-400">⬡</span>}
                  </span>
                </div>

                {md.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{md.description}</p>
                )}

                {!isClosed && (
                  <div className="space-y-2">
                    {/* Combined total rewards */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-white/5 py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Base</div>
                        <div className="text-sm font-bold text-white">{fmt(totalBase)}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Progress</div>
                        <div className="text-sm font-bold text-amber-400">{fmt(totalProgress)}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 py-2 px-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Resolution</div>
                        <div className="text-sm font-bold text-emerald-400">{fmt(totalResolution)}</div>
                      </div>
                    </div>
                    {/* Per-chain breakdown hint */}
                    {wl && base && (
                      <div className="text-[9px] text-slate-600 text-center">
                        🌐 {fmt(wl.baseReward)} + ⬡ {fmt(base.baseReward)} KOIN combined
                      </div>
                    )}
                  </div>
                )}

                {isClosed && md.closedReason && (
                  <div className="text-xs text-slate-500 italic mt-1">{md.closedReason}</div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
