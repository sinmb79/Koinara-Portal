import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { usePolling } from "../hooks/usePolling.js"
import { ADDRESSES } from "../abi/index.js"
import { formatDateTime, formatTokenAmount } from "../lib/chain.js"
import { getAgentFeePolicy, getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { loadMyAgentService } from "../lib/agentCatalog.js"
import { AddressLink, JobStatePill, JobTypePill, EmptyState, LoadingState, Notice } from "../components/ui.jsx"

const DASHBOARD_CONTENT_TABS = ["overview", "jobs", "services", "nodes"]

export default function Dashboard() {
  const { address, dashboard, jobs, isLoadingDashboard, refreshDashboard, loadJobs, loadRewards, lang } = useStore()
  const t = useT(lang)
  const agentFeePolicy = getAgentFeePolicy()
  const [tab, setTab] = useState("overview")

  usePolling(refreshDashboard, 15000, true)
  usePolling(loadJobs, 25000, true)
  usePolling(loadRewards, 30000, Boolean(address))

  const rewardNumber = Number.parseFloat(dashboard.pendingActiveRewards || "0") + Number.parseFloat(dashboard.pendingWorkRewards || "0")
  const activeJobs = jobs.filter((job) => [0, 1, 2, 3, 4].includes(job.state)).length
  const onlineNodes = dashboard.activeNodeCount
  const totalNodes = Math.max(onlineNodes, 1)
  const successRate = jobs.length ? ((jobs.filter((job) => job.state === 6).length / jobs.length) * 100).toFixed(1) : "100.0"
  const settledJobs = jobs.filter((job) => job.state === 6).length
  const onlineRatio = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0
  const myAgentService = useMemo(() => (address ? loadMyAgentService(address) : null), [address])
  const roleLabelMap = {
    0: t("register_role_provider"),
    1: t("register_role_verifier"),
    2: t("register_role_both"),
  }

  const filteredMyJobs = useMemo(() => jobs.slice(0, 8), [jobs])

  function exportCsv() {
    const rows = [
      ["job_id", "type", "state", "creator", "deadline", "premium_wlc"],
      ...filteredMyJobs.map((job) => [
        job.id,
        job.jobType,
        job.state,
        job.creator,
        new Date(job.deadline * 1000).toISOString(),
        job.premiumReward ? Number(job.premiumReward) / 1e18 : 0,
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = href
    anchor.download = "koinara-dashboard-jobs.csv"
    anchor.click()
    URL.revokeObjectURL(href)
  }

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t("dashboard_tag")}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("dashboard_hub_title")}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">{t("dashboard_hub_subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/bond" className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/20">
              {t("dashboard_action_bond")}
            </Link>
            <Link to="/dashboard/register" className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/20">
              {t("dashboard_action_register")}
            </Link>
            <Link to="/dashboard/rewards" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-[#0b2019] transition hover:brightness-110">
              {t("dashboard_action_rewards")}
            </Link>
          </div>
        </div>
      </section>

      <Notice>
        {t("agent_fee_policy_notice", {
          current: `${agentFeePolicy.currentBps / 100}%`,
          standard: `${agentFeePolicy.standardBps / 100}%`,
          phase: t(getPromoPhaseLabelKey(agentFeePolicy.currentPhase.name)),
        })}
      </Notice>

      {isLoadingDashboard && !address ? <LoadingState label={t("common_loading")} /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon="payments"
          label={t("dashboard_kpi_total_earnings")}
          value={`${rewardNumber.toFixed(2)} KOIN`}
          trend={t("dashboard_trend_jobs", { count: filteredMyJobs.length })}
        />
        <KpiCard
          icon="work"
          label={t("dashboard_kpi_active_jobs")}
          value={String(activeJobs)}
          trend={t("dashboard_trend_tracked", { count: jobs.length })}
        />
        <KpiCard
          icon="router"
          label={t("dashboard_kpi_nodes_online")}
          value={`${onlineNodes} / ${totalNodes}`}
          trend={t("dashboard_trend_online", { percent: onlineRatio })}
        />
        <KpiCard
          icon="verified_user"
          label={t("dashboard_kpi_success_rate")}
          value={`${successRate}%`}
          trend={t("dashboard_trend_settled", { count: settledJobs })}
        />
      </section>

      <div className="overflow-x-auto border-b border-primary/10">
        <div className="flex min-w-max gap-8">
          {DASHBOARD_CONTENT_TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 border-b-2 pb-4 pt-2 text-sm font-bold transition ${
                tab === key ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {key === "overview" ? "dashboard" : key === "jobs" ? "history" : key === "services" ? "inventory_2" : "dns"}
              </span>
              {t(`dashboard_tab_${key}`)}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <section className="space-y-6">
            <PanelCard title={t("dashboard_overview_job_history")} action={(
              <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary/15 px-3 text-xs font-bold text-slate-200 transition hover:bg-primary/10">
                <span className="material-symbols-outlined text-[18px]">download</span>
                {t("dashboard_export_csv")}
              </button>
            )}>
              {filteredMyJobs.length === 0 ? (
                <EmptyState title={t("jobs_empty")} description={t("common_no_data")} />
              ) : (
                <JobsTable jobs={filteredMyJobs} />
              )}
            </PanelCard>

            <PanelCard title={t("dashboard_network_health")}>
              <div className="rounded-2xl border border-primary/15 bg-primary/10 p-5">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-primary">monitor_heart</span>
                  <div>
                    <div className="font-bold text-white">{t("dashboard_network_health_good_title")}</div>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{t("dashboard_network_health_good_body")}</p>
                  </div>
                </div>
              </div>
            </PanelCard>
          </section>

          <aside className="space-y-6">
            <PanelCard title={t("dashboard_rewards_panel_title")}>
              <div className="grid gap-4">
                <ValueCard label={t("dashboard_kpi_active_rewards")} value={`${dashboard.pendingActiveRewards} KOIN`} />
                <ValueCard label={t("dashboard_kpi_bond")} value={`${dashboard.bondAmount} WLC`} />
              </div>
              <div className="mt-5 grid gap-3">
                <Link to="/dashboard/rewards" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-[#0b2019] transition hover:brightness-110">
                  {t("rewards_claim")}
                </Link>
                <Link to="/dashboard/bond" className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/15 px-4 text-sm font-semibold text-primary transition hover:bg-primary/10">
                  {t("bond_title")}
                </Link>
              </div>
            </PanelCard>

            <PanelCard title={t("dashboard_scaling_title")}>
              <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-transparent p-5">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined rounded-2xl bg-primary/10 p-3 text-primary">rocket_launch</span>
                  <div>
                    <div className="font-bold text-white">{t("dashboard_scaling_title")}</div>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{t("dashboard_scaling_body")}</p>
                  </div>
                </div>
              </div>
            </PanelCard>
          </aside>
        </div>
      ) : null}

      {tab === "jobs" ? (
        <PanelCard title={t("dashboard_jobs_table_title")} action={(
          <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary/15 px-3 text-xs font-bold text-slate-200 transition hover:bg-primary/10">
            <span className="material-symbols-outlined text-[18px]">download</span>
            {t("dashboard_export_csv")}
          </button>
        )}>
          {filteredMyJobs.length === 0 ? <EmptyState title={t("jobs_empty")} description={t("common_no_data")} /> : <JobsTable jobs={filteredMyJobs} showCreator={false} />}
        </PanelCard>
      ) : null}

      {tab === "services" ? (
        <PanelCard title={t("dashboard_agent_services_title")} subtitle={t("dashboard_agent_services_subtitle")}>
          {myAgentService ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-primary/15 bg-white/5 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("agent_register_service_name")}</div>
                <h3 className="mt-2 text-2xl font-black text-white">{myAgentService.name || t("agent_register_preview_name")}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">{myAgentService.description || t("dashboard_agent_services_empty_body")}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="rounded-full border border-primary/10 px-3 py-1">{myAgentService.category || "custom"}</span>
                  <span className="rounded-full border border-primary/10 px-3 py-1">{myAgentService.gpu || "GPU n/a"}</span>
                  <span className="rounded-full border border-primary/10 px-3 py-1">{myAgentService.ram || "RAM n/a"}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-primary/15 bg-[#0b1713]/70 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("dashboard_service_pricing_title")}</div>
                <div className="mt-4 space-y-3">
                  {Object.entries(myAgentService.pricing || {}).map(([tier, config]) => (
                    <div key={tier} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{tier}</div>
                        <div className="text-xs text-slate-500">{config.description || "-"}</div>
                      </div>
                      <div className="font-bold text-primary">{config.price || "0 WLC"}</div>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard/agent-service" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-[#0b2019] transition hover:brightness-110">
                  {t("dashboard_agent_services_edit")}
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState title={t("dashboard_agent_services_empty_title")} description={t("dashboard_agent_services_empty_body")} />
          )}
        </PanelCard>
      ) : null}

      {tab === "nodes" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelCard title={t("dashboard_node_status")}>
            <div className="grid gap-4">
              <NodeValue label={t("dashboard_wallet")} value={address ? <AddressLink address={address} /> : t("common_connect_wallet")} />
              <NodeValue label={t("dashboard_registration")} value={dashboard.nodeRegistered ? t("common_registered") : t("common_not_registered")} />
              <NodeValue label={t("dashboard_role")} value={dashboard.nodeRole != null ? roleLabelMap[dashboard.nodeRole] : "-"} />
              <NodeValue label={t("dashboard_last_epoch")} value={dashboard.nodeLastHeartbeatEpoch != null ? String(dashboard.nodeLastHeartbeatEpoch) : "-"} />
              <NodeValue label={t("dashboard_min_bond")} value={`${dashboard.minBond} WLC`} />
            </div>
          </PanelCard>

          <PanelCard title={t("dashboard_contracts")} subtitle={t("dashboard_public_manifest_note")}>
            <div className="grid gap-3">
              {Object.entries(ADDRESSES).map(([key, value]) => (
                <NodeValue key={key} label={key} value={<AddressLink address={value} />} />
              ))}
            </div>
          </PanelCard>
        </div>
      ) : null}
    </div>
  )
}

function KpiCard({ icon, label, value, trend }) {
  return (
    <div className="rounded-[24px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined rounded-2xl bg-primary/10 p-3 text-primary">{icon}</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{trend}</span>
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-white">{value}</div>
    </div>
  )
}

function PanelCard({ title, subtitle = null, action = null, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm leading-7 text-slate-400">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function JobsTable({ jobs, showCreator = true }) {
  const { lang } = useStore()
  const t = useT(lang)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-primary/5 text-slate-400">
            <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_job_id")}</th>
            <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_type")}</th>
            <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_status")}</th>
            <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_when")}</th>
            <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-right">{t("agent_profile_reward")}</th>
            <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-right">{t("dashboard_fee")}</th>
            {showCreator ? <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("job_detail_requester")}</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {jobs.map((job) => (
            <tr key={job.id} className="transition-colors hover:bg-primary/5">
              <td className="px-5 py-4 font-mono text-xs text-primary">#{job.id}</td>
              <td className="px-5 py-4"><JobTypePill type={job.jobType} /></td>
              <td className="px-5 py-4"><JobStatePill state={job.state} /></td>
              <td className="px-5 py-4 text-slate-400">{formatDateTime(job.deadline)}</td>
              <td className="px-5 py-4 text-right font-bold text-white">{formatTokenAmount(job.premiumReward, 2)} WLC</td>
              <td className="px-5 py-4 text-right text-slate-500">{`${formatTokenAmount(job.portalFee?.feeWei, 4)} WLC`}</td>
              {showCreator ? <td className="px-5 py-4"><AddressLink address={job.creator} /></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ValueCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0b1713]/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-primary">{value}</div>
    </div>
  )
}

function NodeValue({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#0b1713]/60 px-4 py-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
