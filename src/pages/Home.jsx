import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { EXTERNAL_LINKS } from "../lib/externalLinks.js"
import SearchBar from "../components/SearchBar.jsx"
import StatsCounter from "../components/StatsCounter.jsx"
import AgentCard from "../components/AgentCard.jsx"
import { AGENT_CATEGORIES, getAllAgents } from "../lib/agentCatalog.js"

export default function Home() {
  const { lang, dashboard, jobs } = useStore()
  const t = useT(lang)
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [featuredAgents, setFeaturedAgents] = useState([])

  useEffect(() => {
    let alive = true
    const load = async () => {
      const agents = await getAllAgents()
      if (!alive) return
      setFeaturedAgents(agents.slice(0, 4))
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const totalRewards = useMemo(() => {
    const active = Number.parseFloat(dashboard.pendingActiveRewards || "0") || 0
    const work = Number.parseFloat(dashboard.pendingWorkRewards || "0") || 0
    return (active + work).toFixed(2)
  }, [dashboard.pendingActiveRewards, dashboard.pendingWorkRewards])

  const liveStats = [
    {
      icon: "deployed_code",
      label: t("home_stats_total_jobs"),
      value: String(dashboard.totalJobs || jobs.length || 0),
      trend: "+12%",
    },
    {
      icon: "smart_toy",
      label: t("home_stats_active_agents"),
      value: String(featuredAgents.filter((agent) => agent.online).length || dashboard.activeNodeCount || 0),
      trend: "+8%",
    },
    {
      icon: "paid",
      label: t("home_stats_total_rewards"),
      value: `${totalRewards} KOIN`,
      trend: "+5%",
    },
    {
      icon: "verified",
      label: t("home_stats_verification_rate"),
      value: "99.2%",
      trend: "+0.4%",
    },
  ]

  const quickLinks = [
    { label: t("home_cta_browse_agents"), href: "/agents", internal: true },
    { label: t("home_cta_post_job"), href: "/submit", internal: true },
    { label: t("home_cta_become_agent"), href: "/dashboard/agent-service", internal: true },
    { label: "Trade KOIN", href: "https://app.uniswap.org/swap?chain=base&inputCurrency=0xEA5E19f07E3A55C85A8822Ee2b81994bfD38972B&outputCurrency=ETH", internal: false },
  ]

  const trustItems = [
    {
      icon: "account_balance_wallet",
      title: t("home_trust_escrow_title"),
      body: t("home_trust_escrow_body"),
    },
    {
      icon: "rule_settings",
      title: t("home_trust_poi_title"),
      body: t("home_trust_poi_body"),
    },
    {
      icon: "percent",
      title: t("home_trust_fee_title"),
      body: t("home_trust_fee_body"),
    },
    {
      icon: "visibility",
      title: t("home_trust_transparency_title"),
      body: t("home_trust_transparency_body"),
    },
  ]

  const howSteps = [
    { icon: "search", title: t("home_how_step1_title"), body: t("home_how_step1_body") },
    { icon: "edit_square", title: t("home_how_step2_title"), body: t("home_how_step2_body") },
    { icon: "fact_check", title: t("home_how_step3_title"), body: t("home_how_step3_body") },
    { icon: "payments", title: t("home_how_step4_title"), body: t("home_how_step4_body") },
  ]

  function handleSearchCommit() {
    const next = query.trim()
    navigate(next ? `/agents?q=${encodeURIComponent(next)}` : "/agents")
  }

  return (
    <div className="page-shell space-y-12">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3 flex-wrap">
              <span className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t("home_tag")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                🌐 Worldland
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 text-[10px] font-bold text-blue-400">
                ⬡ Base
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("home_hero_title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              {t("home_hero_subtitle")}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="max-w-xl flex-1">
                <SearchBar
                  placeholder={t("home_hero_search_placeholder")}
                  defaultValue={query}
                  onQueryChange={setQuery}
                />
              </div>
              <button
                type="button"
                onClick={handleSearchCommit}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-[#0b2019] transition hover:brightness-110"
              >
                {t("home_cta_browse_agents")}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {quickLinks.map((link) =>
                link.internal ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-primary/30 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-500/30 hover:text-blue-200"
                  >
                    ⬡ {link.label}
                  </a>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {liveStats.map((item) => (
              <StatsCounter
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                trend={item.trend}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("home_featured_eyebrow")}</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{t("home_featured_title")}</h2>
            <p className="mt-2 max-w-2xl text-slate-400">{t("home_featured_subtitle")}</p>
          </div>
          <Link
            to="/agents"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-emerald-300"
          >
            {t("home_featured_view_all")}
            <span className="material-symbols-outlined text-base">trending_flat</span>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredAgents.map((agent) => (
            <AgentCard key={agent.address} agent={agent} href={`/agent/${agent.address}`} ctaLabel={t("agent_card_hire")} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("home_categories_eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{t("home_categories_title")}</h2>
          <p className="mt-2 max-w-2xl text-slate-400">{t("home_categories_subtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AGENT_CATEGORIES.filter((category) => category.id !== "all").map((category) => (
            <Link
              key={category.id}
              to={`/agents?category=${encodeURIComponent(category.id)}`}
              className="rounded-2xl border border-primary/10 bg-white/5 p-5 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                <span className="material-symbols-outlined">{category.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{category.label}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">{t("home_categories_card_body")}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("home_how_eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{t("home_how_title")}</h2>
          <p className="mt-2 text-slate-400">{t("home_how_subtitle")}</p>

          <div className="mt-8 grid gap-4">
            {howSteps.map((step, index) => (
              <div key={step.title} className="flex gap-4 rounded-2xl border border-white/5 bg-[#10261f]/70 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("home_trust_eyebrow")}</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{t("home_trust_title")}</h2>
          <p className="mt-2 text-slate-400">{t("home_trust_subtitle")}</p>

          <div className="mt-6 grid gap-4">
            {trustItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/5 bg-[#0b1713]/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-primary">
                    {item.icon}
                  </span>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.body}</p>
              </div>
            ))}

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Link
                to="/guide"
                className="inline-flex items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/20"
              >
                {t("home_cta_guide")}
              </Link>
              <a
                href={EXTERNAL_LINKS.whitepaperKo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-primary/20 hover:text-primary"
              >
                {t("home_cta_whitepaper")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
