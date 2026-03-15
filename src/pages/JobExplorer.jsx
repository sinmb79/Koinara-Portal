import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import useStore from "../lib/store.js"
import { usePolling } from "../hooks/usePolling.js"
import { useT } from "../lib/i18n.js"
import { Eyebrow, Panel, Button, JobStatePill, JobTypePill, AddressLink, EmptyState } from "../components/ui.jsx"
import { formatDateTime, formatTokenAmount } from "../lib/chain.js"

export default function JobExplorer() {
  const { lang, jobs, loadJobs } = useStore()
  const t = useT(lang)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")

  usePolling(loadJobs, 20000, true)

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesQuery = !query || String(job.id).includes(query.trim())
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "open"
            ? [0, 1, 2, 3, 4].includes(job.state)
            : filter === "settled"
              ? job.state === 6
              : [5, 7].includes(job.state)
      return matchesQuery && matchesFilter
    })
  }, [jobs, filter, query])

  return (
    <div className="page-shell">
      <Eyebrow>{t("jobs_tag")}</Eyebrow>
      <h1 className="page-title">{t("jobs_title")}</h1>
      <p className="page-subtitle">{t("jobs_subtitle")}</p>

      <div className="two-col-grid" style={{ marginTop: 28, marginBottom: 24 }}>
        <Panel title={t("jobs_search")}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("jobs_search")} />
        </Panel>
        <Panel title={t("jobs_total", { count: jobs.length })}>
          <div className="row-actions">
            {[
              ["all", t("jobs_filter_all")],
              ["open", t("jobs_filter_open")],
              ["settled", t("jobs_filter_settled")],
              ["expired", t("jobs_filter_expired")],
            ].map(([key, label]) => (
              <Button key={key} variant={filter === key ? "primary" : "secondary"} onClick={() => setFilter(key)}>
                {label}
              </Button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={t("jobs_total", { count: filteredJobs.length })} subtitle={t("jobs_discovery_note")}>
        {filteredJobs.length === 0 ? (
          <EmptyState title={t("jobs_empty")} description={t("common_no_data")} />
        ) : (
          <div className="jobs-list">
            {filteredJobs.map((job) => (
              <div className="job-card" key={job.id}>
                <div className="job-card-header">
                  <div>
                    <div className="job-card-meta">
                      <JobTypePill type={job.jobType} />
                      <JobStatePill state={job.state} />
                    </div>
                    <h3 className="job-card-title">Job #{job.id}</h3>
                  </div>
                  <Link to={`/job/${job.id}`}>
                    <Button variant="secondary">{t("common_open")}</Button>
                  </Link>
                </div>
                <div className="job-card-footer" style={{ marginTop: 16 }}>
                  <AddressLink address={job.creator} />
                  <span className="mono subtle">{formatDateTime(job.deadline)}</span>
                  <span className="mono">{formatTokenAmount(job.premiumReward, 4)} WLC</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
