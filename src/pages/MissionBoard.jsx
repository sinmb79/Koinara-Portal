import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ethers } from "ethers"
import { WORLDLAND } from "../lib/chain.js"
import { ADDRESSES, MISSION_BOARD_ABI, MISSION_CATEGORY, MISSION_STATUS } from "../abi/index.js"
import { LoadingState, StatusPill } from "../components/ui.jsx"

const CATEGORY_LABELS = { 0: "Cold Case", 1: "Math", 2: "Research" }
const CATEGORY_COLORS = { 0: "danger", 1: "info", 2: "success" }
const STATUS_LABELS = { 0: "Open", 1: "In Progress", 2: "Under Review", 3: "Resolved", 4: "Closed" }
const STATUS_COLORS = { 0: "success", 1: "info", 2: "warn", 3: "dim", 4: "dim" }

function fmt(wei) {
  const n = Number(ethers.formatEther(wei ?? 0n))
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  if (n >= 1) return n.toFixed(1)
  return n.toFixed(2)
}

export default function MissionBoard() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null) // null = all

  useEffect(() => {
    ;(async () => {
      try {
        const provider = new ethers.JsonRpcProvider(WORLDLAND.rpcUrls[0])
        const mb = new ethers.Contract(ADDRESSES.missionBoard, MISSION_BOARD_ABI, provider)
        const count = Number(await mb.getMissionCount())
        const list = []
        for (let i = 1; i <= count; i++) {
          const m = await mb.getMission(i)
          list.push(m)
        }
        setMissions(list)
      } catch (err) {
        console.error("Failed to load missions:", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = filter !== null ? missions.filter((m) => Number(m.category) === filter) : missions

  return (
    <div className="page-shell py-8">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-2">Mission Board</div>
        <h1 className="text-3xl font-black text-white tracking-tight">Unsolved Missions</h1>
        <p className="mt-2 text-sm text-slate-400">Cold cases, math conjectures, and open research — claim, collaborate, solve, earn KOIN.</p>
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
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading missions from Worldland..." />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No missions found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const id = Number(m.id)
            const cat = Number(m.category)
            const status = Number(m.status)
            return (
              <Link
                key={id}
                to={`/missions/${id}`}
                className="group rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-primary/30 hover:bg-primary/[0.04]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <StatusPill tone={CATEGORY_COLORS[cat]}>{CATEGORY_LABELS[cat]}</StatusPill>
                  <StatusPill tone={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</StatusPill>
                </div>

                <div className="text-sm font-mono text-slate-500 mb-1">Mission #{id}</div>
                <div className="text-xs text-slate-500 font-mono truncate mb-4">{m.metadataURI}</div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/5 py-2 px-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Base</div>
                    <div className="text-sm font-bold text-white">{fmt(m.baseReward)}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 py-2 px-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Progress</div>
                    <div className="text-sm font-bold text-amber-400">{fmt(m.progressReward)}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 py-2 px-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Resolution</div>
                    <div className="text-sm font-bold text-emerald-400">{fmt(m.resolutionReward)}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
