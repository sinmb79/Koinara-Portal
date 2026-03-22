import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { getAllAgents } from "../lib/agentCatalog.js"
import AgentCard from "../components/AgentCard.jsx"
import { LegacyNotice, Notice } from "../components/ui.jsx"

export default function Providers() {
  const { dashboard, lang, jobs } = useStore()
  const t = useT(lang)
  const [agents, setAgents] = useState([])

  useEffect(() => {
    let alive = true
    const load = async () => {
      const next = await getAllAgents()
      if (!alive) return
      setAgents(next)
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const totalBond = useMemo(() => {
    return agents.reduce((sum, agent) => sum + Number(agent.bondValue || 0), 0)
  }, [agents])

  const onlineAgents = useMemo(() => agents.filter((agent) => agent.online), [agents])
  const featuredAgents = useMemo(() => onlineAgents.slice(0, 3), [onlineAgents])

  return (
    <div className="page-shell space-y-8">
      <LegacyNotice t={t} />
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t("providers_tag")}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("providers_title")}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{t("providers_subtitle")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/missions" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-[#0b2019] transition hover:brightness-110">
                {t("nav_missions")}
              </Link>
              <Link to="/dashboard/agent-id" className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-5 text-sm font-semibold text-primary transition hover:bg-primary/20">
                {t("home_cta_register_agent")}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label={t("providers_active_nodes")} value={String(dashboard.activeNodeCount)} />
            <StatCard label={t("providers_total_bond")} value={`${totalBond.toFixed(0)} WLC`} />
            <StatCard label={t("providers_current_epoch")} value={String(dashboard.currentEpoch)} />
            <StatCard label={t("providers_total_jobs")} value={String(jobs.length || dashboard.totalJobs)} />
          </div>
        </div>
      </section>

      <Notice>{t("dashboard_reboot_notice")}</Notice>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("providers_network_snapshot")}</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("providers_health_title")}</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {t("providers_health_good")}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <NetworkCard
              icon="hub"
              title={t("providers_distribution_title")}
              body={t("providers_distribution_body", { online: onlineAgents.length, total: agents.length })}
            />
            <NetworkCard
              icon="savings"
              title={t("providers_bond_title")}
              body={t("providers_bond_body")}
            />
            <NetworkCard
              icon="verified"
              title={t("providers_verification_title")}
              body={t("providers_verification_body")}
            />
            <NetworkCard
              icon="bolt"
              title={t("providers_ready_title")}
              body={t("providers_ready_body")}
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("providers_leaderboard_eyebrow")}</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("providers_heading")}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">{t("providers_placeholder")}</p>

          <div className="mt-6 space-y-3">
            {agents.slice(0, 5).map((agent, index) => (
              <div key={agent.address} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#0b1713]/60 px-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">{agent.icon || "smart_toy"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-white">{agent.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{agent.bond} · {agent.jobsCompleted} jobs</div>
                </div>
                <div className={`text-xs font-semibold ${agent.online ? "text-primary" : "text-slate-500"}`}>
                  {agent.online ? t("agent_status_online") : t("agent_status_offline")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("providers_agents_eyebrow")}</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("providers_agents_title")}</h2>
          </div>
          <Link to="/agents" className="text-sm font-semibold text-primary">
            {t("home_featured_view_all")}
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {featuredAgents.map((agent) => (
            <AgentCard key={agent.address} agent={agent} href={`/agent/${agent.address}`} ctaLabel={t("agent_card_hire")} />
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  )
}

function NetworkCard({ icon, title, body }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0b1713]/60 p-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-primary">{icon}</span>
        <h3 className="font-bold text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
    </div>
  )
}
