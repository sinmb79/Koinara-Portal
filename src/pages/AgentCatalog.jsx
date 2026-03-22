import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import AgentCard from "../components/AgentCard.jsx"
import FilterBar from "../components/FilterBar.jsx"
import { EmptyState, LoadingState } from "../components/ui.jsx"
import { AGENT_CATEGORIES, searchAgents } from "../lib/agentCatalog.js"

const SORT_OPTIONS = [
  { value: "rating", key: "agent_sort_rating" },
  { value: "price-asc", key: "agent_sort_price_asc" },
  { value: "price-desc", key: "agent_sort_price_desc" },
  { value: "jobs", key: "agent_sort_jobs" },
  { value: "bond", key: "agent_sort_bond" },
]

const MAX_PRICE = 50

export default function AgentCatalog() {
  const { lang } = useStore()
  const t = useT(lang)
  const [searchParams] = useSearchParams()
  const [agents, setAgents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [sortBy, setSortBy] = useState("rating")
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)

  useEffect(() => {
    const nextQuery = searchParams.get("q") || ""
    const nextCategory = searchParams.get("category") || "all"
    setQuery(nextQuery)
    setCategory(nextCategory)
  }, [searchParams])

  useEffect(() => {
    let alive = true
    const load = async () => {
      setIsLoading(true)
      const result = await searchAgents({ query, category, maxPrice, sortBy, onlineOnly })
      if (!alive) return
      setAgents(result)
      setIsLoading(false)
    }
    load()
    return () => {
      alive = false
    }
  }, [category, maxPrice, onlineOnly, query, sortBy])

  const categoryOptions = useMemo(
    () => AGENT_CATEGORIES.map((item) => ({ value: item.id, label: item.id === "all" ? t("agent_filter_all") : item.label })),
    [t],
  )
  const sortOptions = useMemo(
    () => SORT_OPTIONS.map((item) => ({ value: item.value, label: t(item.key) })),
    [t],
  )

  return (
    <div className="page-shell">
      <section className="space-y-4">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t("agent_catalog_eyebrow")}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("agent_catalog_title")}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-400">{t("agent_catalog_subtitle")}</p>
        </div>

        <FilterBar
          searchPlaceholder={t("agent_catalog_search")}
          defaultQuery={query}
          onQueryChange={setQuery}
          categoryLabel={t("agent_filter_category")}
          categoryOptions={categoryOptions}
          categoryValue={category}
          onCategoryChange={setCategory}
          sortLabel={t("agent_filter_sort")}
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          extra={
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-w-[220px] items-center gap-3 rounded-xl border border-primary/10 bg-[#10261f]/90 px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("agent_filter_price")}</span>
                <input
                  type="range"
                  min="5"
                  max={String(MAX_PRICE)}
                  step="1"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="h-1.5 flex-1 accent-primary"
                />
                <span className="min-w-[52px] text-right text-sm font-semibold text-slate-200">{maxPrice} WLC</span>
              </label>

              <button
                type="button"
                onClick={() => setOnlineOnly((value) => !value)}
                className={`inline-flex h-11 items-center rounded-xl border px-4 text-sm font-semibold transition-colors ${
                  onlineOnly ? "border-primary/40 bg-primary/10 text-primary" : "border-primary/10 bg-[#10261f]/90 text-slate-300"
                }`}
              >
                {onlineOnly ? t("agent_filter_online_only") : t("agent_filter_all_status")}
              </button>
            </div>
          }
        />
      </section>

      <section className="mt-8">
        {isLoading ? (
          <LoadingState label={t("common_loading")} />
        ) : agents.length === 0 ? (
          <EmptyState title={t("agent_catalog_empty_title")} description={t("agent_catalog_empty_body")} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {agents.map((agent) => (
              <AgentCard key={agent.address} agent={agent} href={`/agent/${agent.address}`} ctaLabel={t("agent_card_hire")} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 border-t border-white/5 pt-16 text-center">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-primary/10 bg-white/5">
          <span className="material-symbols-outlined text-4xl text-slate-600">person_search</span>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-white">{t("agent_catalog_cta_title")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">{t("agent_catalog_cta_body")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/dashboard/agent-id"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
          >
            {t("agent_catalog_cta_register")}
            <span className="material-symbols-outlined text-base">trending_flat</span>
          </Link>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-primary/20 hover:text-white"
          >
            {t("agent_catalog_cta_open_job")}
          </Link>
        </div>
      </section>
    </div>
  )
}
