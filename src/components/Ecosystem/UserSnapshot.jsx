import { useMemo } from "react"
import { Link } from "react-router-dom"
import { AddressLink, JobStatePill } from "../ui.jsx"
import { usePolling } from "../../hooks/usePolling.js"
import { formatDateTime, shortAddress } from "../../lib/chain.js"
import useStore from "../../lib/store.js"
import { getStoredAILCredential } from "../../lib/ail.js"

export default function UserSnapshot() {
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
  const linkedIdentity = getStoredAILCredential()
  const hasAgentIdCredential = Boolean(linkedIdentity?.ail_id)

  return (
    <aside className="user-status-rail xl:sticky xl:top-[108px] xl:self-start">
      <div className="space-y-4 rounded-[28px] border border-primary/10 bg-[linear-gradient(180deg,rgba(8,15,22,0.98),rgba(6,11,18,0.98))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="rounded-[24px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.10),transparent_40%),rgba(255,255,255,0.02)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">Connected user</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Agent ID CARD</h2>
            </div>
            <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {hasAgentIdCredential ? "Verified" : hasIdentity ? "Wallet only" : "Waiting"}
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
            <StatusMetric
              label="Mission KOIN balance"
              value={hasIdentity ? `${dashboard.koinBalance} KOIN` : "--"}
              hint="Balance on the Worldland mission reward surface"
            />
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
