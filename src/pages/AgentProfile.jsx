import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { Button, EmptyState, LoadingState, StatusPill } from "../components/ui.jsx"
import { getAgentByAddress } from "../lib/agentCatalog.js"
import { shortAddress } from "../lib/chain.js"
import { getTorqrAction } from "../lib/torqrLinks.js"
import { TORQR_APP_URL } from "../lib/torqrIntegration.js"

export default function AgentProfile() {
  const { address: routeAddress } = useParams()
  const { lang, jobs } = useStore()
  const t = useT(lang)
  const [agent, setAgent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      setIsLoading(true)
      const result = await getAgentByAddress(routeAddress)
      if (!alive) return
      setAgent(result)
      setIsLoading(false)
    }
    load()
    return () => {
      alive = false
    }
  }, [routeAddress])

  const jobHistory = useMemo(() => {
    if (!agent) return []
    const onChainJobs = jobs
      .filter((job) => job.submission?.provider?.toLowerCase() === agent.address.toLowerCase())
      .slice(0, 3)
      .map((job) => ({
        id: `Job #${job.id}`,
        type: job.jobType === 2 ? "Collective" : job.jobType === 1 ? "General" : "Simple",
        status: job.state >= 6 ? "Completed" : job.state >= 3 ? "Processing" : "Open",
        when: "On-chain",
        reward: "WLC",
      }))
    return [...(agent.recentJobs || []), ...onChainJobs].slice(0, 5)
  }, [agent, jobs])

  const torqrAction = useMemo(() => {
    if (!agent) return null
    return getTorqrAction({
      appUrl: TORQR_APP_URL,
      tokenAddress: agent.torqrTokenAddress,
    })
  }, [agent])

  async function handleCopy() {
    if (!agent) return
    await navigator.clipboard.writeText(agent.address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <LoadingState label={t("common_loading")} />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="page-shell">
        <EmptyState title={t("agent_profile_missing_title")} description={t("agent_profile_missing_body")} />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary to-emerald-400 text-[#0b2019]">
                    <span className="material-symbols-outlined text-[42px]">
                      {agent.icon || "smart_toy"}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-[#0f231d] ${agent.online ? "bg-emerald-400" : "bg-slate-500"}`} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight text-white">{shortAddress(agent.address, 7, 4)}</h1>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-primary/20 hover:text-primary"
                      aria-label={t("agent_profile_copy")}
                    >
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                    <a
                      href={`https://scan.worldland.foundation/address/${agent.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-primary/20 hover:text-primary"
                      aria-label={t("common_view_on_scan")}
                    >
                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                    </a>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-primary">grade</span>
                      {agent.rating.toFixed(1)} ({agent.ratingCount} {t("agent_profile_reviews_count")})
                    </span>
                    <span>{t("agent_profile_member_since", { when: agent.joinedLabel })}</span>
                    <span className={agent.online ? "text-primary" : "text-slate-500"}>
                      {agent.online ? t("agent_status_online") : t("agent_status_offline")}
                    </span>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    <span className="material-symbols-outlined text-sm">shield</span>
                    {t("agent_profile_bonded", { bond: agent.bond })}
                  </div>
                  {agent.torqrTokenAddress ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                      <span className="material-symbols-outlined text-sm">token</span>
                      Torqr {shortAddress(agent.torqrTokenAddress)}
                    </div>
                  ) : null}
                  {copied ? <div className="mt-2 text-xs text-primary">{t("agent_profile_copied")}</div> : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to={`/submit?agent=${agent.address}`}>
                  <Button variant="primary">{t("agent_card_hire")}</Button>
                </Link>
                {torqrAction ? (
                  <a
                    href={torqrAction.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 text-sm font-bold text-blue-300 transition-colors hover:border-blue-400/30 hover:text-blue-200"
                  >
                    <span className="material-symbols-outlined text-base">
                      {torqrAction.kind === "view" ? "open_in_new" : "rocket_launch"}
                    </span>
                    {torqrAction.label}
                  </a>
                ) : (
                  <button className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-5 text-sm font-bold text-primary transition-colors hover:bg-primary/20">
                    {t("agent_profile_message")}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t("agent_profile_total_jobs")} value={String(agent.jobsCompleted)} accent={false} />
            <StatCard label={t("agent_profile_success_rate")} value={agent.successRate} accent />
            <StatCard label={t("agent_profile_avg_response")} value={agent.avgResponse} accent={false} />
            <StatCard label={t("agent_profile_uptime")} value={agent.uptime} accent={false} />
          </section>
        </div>

        <aside className="rounded-3xl border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="material-symbols-outlined text-primary">location_on</span>
            {t("agent_profile_node_location")}
          </h2>
          <div className="mt-4 aspect-video rounded-2xl border border-white/5 bg-[radial-gradient(circle_at_center,rgba(0,255,180,0.18),transparent_48%),linear-gradient(135deg,#132a22,#09120f)]">
            <div className="flex h-full items-center justify-center">
              <div className="relative">
                <div className="h-4 w-4 animate-ping rounded-full bg-primary/40" />
                <div className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-primary" />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-300">{agent.locationLabel}</p>

          <div className="mt-6 border-t border-white/5 pt-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("agent_profile_hardware")}</div>
            <p className="mt-2 text-sm text-slate-300">{agent.hardware}</p>
          </div>
        </aside>
      </div>

      <section className="mt-10">
        <div className="mb-5 flex items-center gap-2 text-white">
          <span className="material-symbols-outlined text-primary">grid_view</span>
          <h2 className="text-2xl font-bold">{t("agent_profile_services")}</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {agent.services.map((service) => (
            <article key={service.id} className="overflow-hidden rounded-3xl border border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{service.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{service.description}</p>
                  </div>
                  <span className="material-symbols-outlined rounded-2xl bg-primary/10 p-3 text-primary">{service.icon}</span>
                </div>

                <div className="space-y-3">
                  {Object.entries(service.tiers).map(([tier, value]) => (
                    <div
                      key={tier}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                        tier === "premium" ? "border-primary/20 bg-primary/5" : "border-white/5 bg-[#0b1713]/60"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{t(`agent_tier_${tier}`)}</div>
                        <div className="mt-1 text-xs text-slate-500">{value.description}</div>
                      </div>
                      <div className="text-right text-primary">
                        <div className="text-sm font-bold">{value.price}</div>
                        <button className={`mt-2 rounded-xl px-3 py-1 text-xs font-bold ${tier === "premium" ? "bg-primary text-[#0b2019]" : "bg-white/5 text-slate-300"}`}>
                          {t("agent_profile_hire_tier")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                to={`/submit?agent=${agent.address}`}
                className="inline-flex w-full items-center justify-center border-t border-primary/10 bg-primary/10 py-4 text-xs font-bold uppercase tracking-[0.26em] text-primary transition-colors hover:bg-primary/20"
              >
                {t("agent_profile_hire_service")}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-white">{t("agent_profile_job_history")}</h2>
          <div className="overflow-hidden rounded-3xl border border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-primary/5 text-slate-400">
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_job_id")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_type")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_status")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_when")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_reward")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobHistory.map((job) => (
                  <tr key={job.id} className="transition-colors hover:bg-primary/5">
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{job.id}</td>
                    <td className="px-5 py-4 font-medium text-slate-200">{job.type}</td>
                    <td className="px-5 py-4">
                      <StatusPill tone={job.status === "Completed" ? "success" : job.status === "Processing" ? "info" : "dim"}>
                        {job.status}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{job.when}</td>
                    <td className="px-5 py-4 font-bold text-primary">{job.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-white">{t("agent_profile_reviews")}</h2>
          <div className="flex h-full min-h-[244px] flex-col items-center justify-center rounded-3xl border border-primary/10 bg-white/5 p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <span className="material-symbols-outlined text-4xl text-slate-600">rate_review</span>
            <div className="mt-4 font-bold text-slate-300">{t("agent_profile_reviews_coming_soon")}</div>
            <p className="mt-2 max-w-[220px] text-xs leading-6 text-slate-500">{t("agent_profile_reviews_note")}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-3xl border border-primary/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-black tracking-tight ${accent ? "text-primary" : "text-white"}`}>{value}</div>
    </div>
  )
}
