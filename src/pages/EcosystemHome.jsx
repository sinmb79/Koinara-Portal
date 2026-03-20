import { useMemo } from "react"
import { Link } from "react-router-dom"
import { AddressLink, JobStatePill } from "../components/ui.jsx"
import { usePolling } from "../hooks/usePolling.js"
import { formatDateTime, shortAddress } from "../lib/chain.js"
import useStore from "../lib/store.js"

const NETWORKS = [
  { label: "Worldland", tone: "border-primary/20 bg-primary/10 text-primary" },
  { label: "Base", tone: "border-blue-500/20 bg-blue-500/10 text-blue-300" },
]

const PROJECTS = [
  {
    id: "openclaw",
    title: "OpenClaw Agent Marketplace",
    short: "OC",
    accent: "from-primary/25 to-primary/5 text-primary",
    railLabel: "OpenClaw",
    summary:
      "The operating product under Koinara. Home, Dashboard, Agents, Missions, and job flow continue to live here as the market surface.",
    href: "/",
    linkLabel: "Open market",
    internal: true,
    stage: "Live flagship",
  },
  {
    id: "proova",
    title: "Proova",
    short: "PR",
    accent: "from-blue-500/25 to-blue-500/5 text-blue-300",
    railLabel: "Proova",
    summary:
      "Verification layer for mission outcomes. This test page links it as an ecosystem product even before the final in-site page is settled.",
    href: "https://github.com/sinmb79/proova",
    linkLabel: "View project",
    internal: false,
    stage: "Ready",
  },
  {
    id: "agent-id-card",
    title: "Agent ID CARD",
    short: "AI",
    accent: "from-emerald-400/20 to-emerald-400/5 text-emerald-200",
    railLabel: "Agent ID",
    summary:
      "Identity and credential layer tied to participation, mission claiming, and trust signals across the ecosystem.",
    href: "https://www.agentidcard.org/",
    linkLabel: "Visit site",
    internal: false,
    stage: "Live",
  },
  {
    id: "the-4-path",
    title: "The 4 Path",
    short: "4P",
    accent: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-200",
    railLabel: "The 4 Path",
    summary:
      "Companion product in the ecosystem map. It should feel like a branded neighbor, not a disconnected external page.",
    href: "https://the4path-deploy.vercel.app/",
    linkLabel: "Visit site",
    internal: false,
    stage: "Live",
  },
  {
    id: "name-worldland",
    title: "Name-WorldLand",
    short: "NW",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-200",
    railLabel: "NameWL",
    summary:
      "Naming surface for the Worldland-facing brand stack. This test page positions it as a direct ecosystem shortcut.",
    href: "https://name-worldland.vercel.app",
    linkLabel: "Visit site",
    internal: false,
    stage: "Live",
  },
  {
    id: "torqr",
    title: "Torqr",
    short: "TQ",
    accent: "from-amber-400/20 to-amber-400/5 text-amber-200",
    railLabel: "Torqr",
    summary:
      "In development. It stays visible in the ecosystem rail so the portfolio already looks like a growing brand family.",
    href: "#torqr",
    linkLabel: "In development",
    internal: false,
    stage: "Building",
    disabled: true,
  },
]

function ActionLink({ item, className, children }) {
  if (item.disabled) {
    return (
      <span className={`${className} cursor-default border-amber-400/15 bg-amber-400/10 text-amber-200`}>
        {children}
      </span>
    )
  }

  if (item.internal) {
    return (
      <Link className={className} to={item.href}>
        {children}
      </Link>
    )
  }

  return (
    <a className={className} href={item.href} rel="noreferrer" target="_blank">
      {children}
    </a>
  )
}

export default function EcosystemHome() {
  const {
    address,
    chainId,
    walletName,
    dashboard,
    jobs,
    isLoadingDashboard,
    isLoadingJobs,
    refreshDashboard,
    loadJobs,
    loadRewards,
  } = useStore()
  const flagship = PROJECTS[0]
  const hasIdentity = Boolean(address)

  usePolling(refreshDashboard, 15000, true)
  usePolling(loadJobs, 25000, true)
  usePolling(loadRewards, 30000, hasIdentity)

  const requesterJobs = useMemo(() => {
    if (!address) return []
    const normalized = address.toLowerCase()
    return jobs.filter((job) => job.creator?.toLowerCase() === normalized)
  }, [address, jobs])

  const activeRequests = requesterJobs.filter((job) => [0, 1, 2, 3, 4].includes(job.state)).length
  const completedMissions = requesterJobs.filter((job) => job.state === 6).length
  const reviewQueue = requesterJobs.filter((job) => [2, 3, 4].includes(job.state)).length
  const latestRequest = requesterJobs[0] ?? null
  const connectedNetwork = chainId === 8453 ? "Base" : chainId === 103 ? "Worldland" : "Offline"
  const syncStateLabel =
    isLoadingDashboard || isLoadingJobs ? "Syncing your latest ecosystem activity..." : hasIdentity ? "Live wallet snapshot" : "Awaiting wallet connection"

  return (
    <div className="page-shell" style={{ width: "min(1380px, calc(100vw - 32px))" }}>
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="ecosystem-project-rail xl:sticky xl:top-[108px] xl:self-start">
          <div className="rounded-[28px] border border-primary/10 bg-[linear-gradient(180deg,rgba(9,17,29,0.98),rgba(7,11,20,0.96))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="px-2 pb-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">Koinara Ecosystem</div>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                A quick-launch rail for products that belong under the Koinara umbrella.
              </p>
            </div>

            <div className="mt-2 grid gap-2 max-xl:grid-cols-2 max-md:grid-cols-1">
              {PROJECTS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 transition hover:border-primary/25 hover:bg-primary/[0.05]"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/6 bg-gradient-to-br ${item.accent} font-black tracking-wide`}
                  >
                    {item.short}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white group-hover:text-primary">{item.railLabel}</div>
                    <div className="truncate text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.stage}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section
            id="ecosystem-top"
            className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.10),transparent_35%),linear-gradient(180deg,rgba(11,34,28,0.94),rgba(8,14,13,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-8"
          >
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Ecosystem Home
                  </span>
                  {NETWORKS.map((network) => (
                    <span key={network.label} className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${network.tone}`}>
                      {network.label}
                    </span>
                  ))}
                </div>

                <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Koinara Ecosystem
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                  This sits above OpenClaw Agent Marketplace. The marketplace keeps its own Home, Dashboard, Agents, and Missions flow, while this page
                  becomes the ecosystem entry that explains the wider product family.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <ActionLink
                    item={flagship}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-[#092018] transition hover:brightness-110"
                  >
                    Open OpenClaw
                  </ActionLink>
                  <a
                    href="#proova"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-primary/25 hover:text-primary"
                  >
                    Jump to products
                  </a>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-[#0d151a]/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">Flagship Surface</div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{flagship.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{flagship.summary}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Home", "Keep existing marketplace home"],
                    ["Dashboard", "Wallet and operator actions stay inside OpenClaw"],
                    ["Agents", "Discovery and hiring remain untouched"],
                    ["Missions", "Mission Board remains the live operating flow"],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{title}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="user-status-rail xl:row-span-2 xl:sticky xl:top-[108px] xl:self-start">
            <div className="space-y-4 rounded-[28px] border border-primary/10 bg-[linear-gradient(180deg,rgba(8,15,22,0.98),rgba(6,11,18,0.98))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="rounded-[24px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.10),transparent_40%),rgba(255,255,255,0.02)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">Connected user</div>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Agent ID CARD</h2>
                  </div>
                  <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {hasIdentity ? "Linked" : "Waiting"}
                  </span>
                </div>

                <div className="mt-4 rounded-[22px] border border-white/6 bg-[#0d151a]/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-primary/15 bg-primary/10 text-lg font-black tracking-[0.2em] text-primary">
                      ID
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{hasIdentity ? walletName || "Connected wallet" : "Connect to activate"}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{connectedNetwork}</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <IdentityRow label="Wallet" value={hasIdentity ? shortAddress(address, 8, 6) : "Not connected"} />
                    <IdentityRow label="Explorer" value={hasIdentity ? <AddressLink address={address} /> : "Unavailable"} />
                    <IdentityRow label="Status" value={syncStateLabel} />
                  </div>

                  <a
                    href="https://www.agentidcard.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-primary/15 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/15"
                  >
                    Open Agent ID CARD
                  </a>
                </div>
              </div>

              <section className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">Status snapshot</div>
                <div className="mt-4 grid gap-3">
                  <StatusMetric label="KOIN balance" value={hasIdentity ? `${dashboard.koinBalance} KOIN` : "--"} hint="Held in the connected wallet" />
                  <StatusMetric label="In progress" value={hasIdentity ? String(activeRequests) : "--"} hint="Requests still moving through OpenClaw" />
                  <StatusMetric label="Completed missions" value={hasIdentity ? String(completedMissions) : "--"} hint="Settled requests from your wallet" />
                </div>
              </section>

              <section className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">Request progress</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <StatusMetric label="Requests in review" value={hasIdentity ? String(reviewQueue) : "--"} hint="Submitted or verifying now" />
                  <StatusMetric label="Tracked requests" value={hasIdentity ? String(requesterJobs.length) : "--"} hint="All requests created by this wallet" />
                </div>
              </section>

              <section className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">Latest request</div>
                  {latestRequest ? <JobStatePill state={latestRequest.state} /> : null}
                </div>

                {latestRequest ? (
                  <div className="mt-4 rounded-[22px] border border-white/6 bg-[#0d151a]/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-white">Mission #{latestRequest.id}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Latest requester activity</div>
                      </div>
                      <Link
                        to={`/job/${latestRequest.id}`}
                        className="inline-flex items-center rounded-lg border border-primary/15 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/15"
                      >
                        Open
                      </Link>
                    </div>

                    <div className="mt-4 space-y-3">
                      <IdentityRow label="Deadline" value={formatDateTime(latestRequest.deadline)} />
                      <IdentityRow label="Current state" value={<JobStatePill state={latestRequest.state} />} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[22px] border border-dashed border-white/10 bg-[#0d151a]/60 p-4 text-sm leading-7 text-slate-400">
                    {hasIdentity ? "No requests from this wallet yet. Create or claim work inside OpenClaw to populate the timeline." : "Connect your wallet to load your request pipeline and completed missions."}
                  </div>
                )}
              </section>
            </div>
          </aside>

          <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3 xl:col-start-1">
            {PROJECTS.map((item) => (
              <article
                key={item.id}
                id={item.id}
                className="rounded-[28px] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)),rgba(10,15,24,0.92)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] scroll-mt-28"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/8 bg-gradient-to-br ${item.accent} text-lg font-black tracking-wide`}
                  >
                    {item.short}
                  </div>
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {item.stage}
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-black tracking-tight text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.summary}</p>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/6 pt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {item.internal ? "Inside OpenClaw" : item.disabled ? "Coming soon" : "External launch"}
                  </div>
                  <ActionLink
                    item={item}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/15"
                  >
                    {item.linkLabel}
                  </ActionLink>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}

function IdentityRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

function StatusMetric({ label, value, hint }) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-[#0d151a]/70 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight text-primary">{value}</div>
      <div className="mt-2 text-xs leading-6 text-slate-500">{hint}</div>
    </div>
  )
}
