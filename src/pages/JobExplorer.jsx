import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import useStore from "../lib/store.js"
import { usePolling } from "../hooks/usePolling.js"
import { useT } from "../lib/i18n.js"
import FilterBar from "../components/FilterBar.jsx"
import { AddressLink, JobStatePill, JobTypePill, EmptyState } from "../components/ui.jsx"
import { formatDateTime, formatTokenAmount } from "../lib/chain.js"

const STATE_OPTIONS = [
  { value: "all", key: "jobs_filter_all" },
  { value: "open", key: "jobs_filter_open" },
  { value: "settled", key: "jobs_filter_settled" },
  { value: "expired", key: "jobs_filter_expired" },
]

const SORT_OPTIONS = [
  { value: "newest", key: "jobs_sort_newest" },
  { value: "premium-desc", key: "jobs_sort_reward_desc" },
  { value: "premium-asc", key: "jobs_sort_reward_asc" },
]

export default function JobExplorer() {
  const { lang, jobs, loadJobs } = useStore()
  const t = useT(lang)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [maxReward, setMaxReward] = useState("all")
  const [view, setView] = useState("cards")

  usePolling(loadJobs, 20000, true)

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const next = jobs.filter((job) => {
      const typeLabel = job.jobType === 2 ? "collective" : job.jobType === 1 ? "general" : "simple"
      const rewardValue = Number(formatTokenAmount(job.premiumReward, 4))
      const matchesQuery =
        !normalized ||
        String(job.id).includes(normalized) ||
        String(job.creator || "").toLowerCase().includes(normalized) ||
        String(job.requestHash || "").toLowerCase().includes(normalized) ||
        typeLabel.includes(normalized)
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "open"
            ? [0, 1, 2, 3, 4].includes(job.state)
            : filter === "settled"
              ? job.state === 6
              : [5, 7].includes(job.state)
      const matchesReward =
        maxReward === "all" ||
        (maxReward === "10" && rewardValue <= 10) ||
        (maxReward === "50" && rewardValue <= 50) ||
        (maxReward === "50+" && rewardValue > 50)

      return matchesQuery && matchesFilter && matchesReward
    })

    next.sort((left, right) => {
      const leftReward = Number(formatTokenAmount(left.premiumReward, 8))
      const rightReward = Number(formatTokenAmount(right.premiumReward, 8))
      if (sortBy === "premium-desc") return rightReward - leftReward
      if (sortBy === "premium-asc") return leftReward - rightReward
      return right.id - left.id
    })

    return next
  }, [filter, jobs, maxReward, query, sortBy])

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_30%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t("jobs_tag")}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("jobs_title")}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">{t("jobs_subtitle")}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label={t("jobs_total", { count: jobs.length })} value={String(jobs.length)} />
            <MetricCard label={t("jobs_filter_open")} value={String(jobs.filter((job) => [0, 1, 2, 3, 4].includes(job.state)).length)} />
            <MetricCard label={t("jobs_filter_settled")} value={String(jobs.filter((job) => job.state === 6).length)} />
          </div>
        </div>
      </section>

      <FilterBar
        searchPlaceholder={t("jobs_search")}
        defaultQuery={query}
        onQueryChange={setQuery}
        categoryLabel={t("jobs_filters_state")}
        categoryOptions={STATE_OPTIONS.map((option) => ({ value: option.value, label: t(option.key) }))}
        categoryValue={filter}
        onCategoryChange={setFilter}
        sortLabel={t("jobs_filters_sort")}
        sortOptions={SORT_OPTIONS.map((option) => ({ value: option.value, label: t(option.key) }))}
        sortValue={sortBy}
        onSortChange={setSortBy}
        extra={(
          <>
            <label className="min-w-[150px]">
              <span className="sr-only">{t("jobs_filters_reward")}</span>
              <select value={maxReward} onChange={(event) => setMaxReward(event.target.value)} className="h-11 rounded-xl border border-primary/10 bg-[#10261f]/90 px-3 text-sm text-slate-200">
                <option value="all">{t("jobs_reward_all")}</option>
                <option value="10">{t("jobs_reward_under_10")}</option>
                <option value="50">{t("jobs_reward_under_50")}</option>
                <option value="50+">{t("jobs_reward_over_50")}</option>
              </select>
            </label>
            <div className="inline-flex rounded-xl border border-primary/10 bg-[#10261f]/90 p-1">
              {[
                ["cards", "grid_view"],
                ["table", "table_rows"],
              ].map(([value, icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  className={`inline-flex h-9 w-10 items-center justify-center rounded-lg transition ${
                    view === value ? "bg-primary text-[#0b2019]" : "text-slate-400 hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{icon}</span>
                </button>
              ))}
            </div>
          </>
        )}
      />

      {filteredJobs.length === 0 ? (
        <div className="rounded-[28px] border border-primary/10 bg-white/5 p-10 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <EmptyState title={t("jobs_empty")} description={t("common_no_data")} />
        </div>
      ) : view === "cards" ? (
        <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredJobs.map((job) => (
            <article key={job.id} className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <JobTypePill type={job.jobType} />
                    <JobStatePill state={job.state} />
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-white">Job #{job.id}</h2>
                  <p className="mt-2 text-sm text-slate-400">{t("jobs_card_subtitle", { address: job.creator?.slice(0, 8) || "-" })}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("create_premium")}</div>
                  <div className="mt-2 text-2xl font-black text-primary">{formatTokenAmount(job.premiumReward, 4)} WLC</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoCard label={t("job_detail_deadline")} value={formatDateTime(job.deadline)} />
                <InfoCard label={t("job_detail_requester")} value={<AddressLink address={job.creator} />} />
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500">{t("jobs_discovery_note")}</span>
                <Link
                  to={`/job/${job.id}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-[#0b2019] transition hover:brightness-110"
                >
                  {t("common_open")}
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-primary/5 text-slate-400">
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_job_id")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_type")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_status")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("job_detail_requester")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_reward")}</th>
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("agent_profile_when")}</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="transition-colors hover:bg-primary/5">
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">#{job.id}</td>
                    <td className="px-5 py-4"><JobTypePill type={job.jobType} /></td>
                    <td className="px-5 py-4"><JobStatePill state={job.state} /></td>
                    <td className="px-5 py-4"><AddressLink address={job.creator} /></td>
                    <td className="px-5 py-4 font-bold text-primary">{formatTokenAmount(job.premiumReward, 4)} WLC</td>
                    <td className="px-5 py-4 text-slate-400">{formatDateTime(job.deadline)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/job/${job.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/15 px-3 text-sm font-semibold text-primary transition hover:bg-primary/10">
                        {t("common_open")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white/5 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0b1713]/60 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm text-slate-200">{value}</div>
    </div>
  )
}
