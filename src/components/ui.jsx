import { NavLink } from "react-router-dom"
import { addrUrl, txUrl, shortAddress } from "../lib/chain.js"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"

export function Button({ children, variant = "primary", full = false, loading = false, ...props }) {
  const className = `button button-${variant}${full ? " button-full" : ""}`
  return (
    <button className={className} {...props}>
      {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : null}
      {children}
    </button>
  )
}

export function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>
}

export function Panel({ title, subtitle, action, children }) {
  return (
    <section className="panel">
      <div className="panel-body">
        {(title || subtitle || action) && (
          <header className="panel-header">
            <div>
              {title ? <h2 className="panel-title">{title}</h2> : null}
              {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
            </div>
            {action}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}

export function MetricCard({ label, value, footnote }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <div className="metric-value">{value}</div>
      {footnote ? <div className="metric-footnote">{footnote}</div> : null}
    </div>
  )
}

export function StatusPill({ tone = "dim", children }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

export function Field({ label, hint, children }) {
  return (
    <div className="field-group">
      {label ? <label className="field-label">{label}</label> : null}
      {children}
      {hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  )
}

export function AddressLink({ address }) {
  if (!address) return <span className="mono subtle">-</span>
  return (
    <a className="mono muted" href={addrUrl(address)} target="_blank" rel="noreferrer">
      {shortAddress(address)}
    </a>
  )
}

export function TxLink({ hash }) {
  if (!hash) return null
  return (
    <a className="mono" href={txUrl(hash)} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ice-blue)" }}>
      {shortAddress(hash, 10, 6)}
    </a>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="icon-chip">
        <img src="/icons/icon-broker.png" alt="" />
      </div>
      <strong>{title}</strong>
      <div>{description}</div>
    </div>
  )
}

export function LoadingState({ label }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <div>{label}</div>
    </div>
  )
}

export function Notice({ children }) {
  return <div className="notice">{children}</div>
}

export function DashboardTabs() {
  const { lang } = useStore()
  const t = useT(lang)
  const items = [
    ["/dashboard", t("tab_overview")],
    ["/dashboard/bond", t("tab_bond")],
    ["/dashboard/register", t("tab_register")],
    ["/dashboard/rewards", t("tab_rewards")],
  ]

  return (
    <div className="dashboard-tabs">
      {items.map(([to, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => `dashboard-tab${isActive ? " active" : ""}`}>
          {label}
        </NavLink>
      ))}
    </div>
  )
}

export function JobStatePill({ state }) {
  const { lang } = useStore()
  const t = useT(lang)
  const map = {
    0: [t("timeline_created"), "dim"],
    1: [t("job_state_open"), "info"],
    2: [t("timeline_submitted"), "info"],
    3: [t("job_state_under_verification"), "warn"],
    4: [t("timeline_accepted"), "success"],
    5: [t("timeline_rejected"), "danger"],
    6: [t("timeline_settled"), "success"],
    7: [t("job_state_expired"), "dim"],
  }
  const [label, tone] = map[state] || [t("job_state_unknown"), "dim"]
  return <StatusPill tone={tone}>{label}</StatusPill>
}

export function JobTypePill({ type }) {
  const { lang } = useStore()
  const t = useT(lang)
  void lang
  const map = {
    0: [t("job_type_simple"), "success"],
    1: [t("job_type_general"), "info"],
    2: [t("job_type_collective"), "warn"],
  }
  const [label, tone] = map[type] || [t("job_type_unknown"), "dim"]
  return <StatusPill tone={tone}>{label}</StatusPill>
}
