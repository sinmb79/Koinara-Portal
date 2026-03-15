import { Link } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { usePolling } from "../hooks/usePolling.js"
import { ADDRESSES } from "../abi/index.js"
import { formatDateTime } from "../lib/chain.js"
import { getAgentFeePolicy, getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { Eyebrow, Panel, MetricCard, Button, DashboardTabs, AddressLink, JobStatePill, JobTypePill, EmptyState, LoadingState, Notice } from "../components/ui.jsx"

export default function Dashboard() {
  const { address, dashboard, jobs, isLoadingDashboard, refreshDashboard, loadJobs, loadRewards, lang } = useStore()
  const t = useT(lang)
  const agentFeePolicy = getAgentFeePolicy()

  usePolling(refreshDashboard, 15000, true)
  usePolling(loadJobs, 25000, true)
  usePolling(loadRewards, 30000, Boolean(address))

  const recentJobs = jobs.slice(0, 5)
  const roleLabelMap = {
    0: t("register_role_provider"),
    1: t("register_role_verifier"),
    2: t("register_role_both"),
  }

  return (
    <div className="page-shell">
      <Eyebrow>{t("dashboard_tag")}</Eyebrow>
      <h1 className="page-title">{t("dashboard_title")}</h1>
      <p className="page-subtitle">{t("dashboard_subtitle")}</p>

      <DashboardTabs />
      <div style={{ marginBottom: 24 }}>
        <Notice>
          {t("agent_fee_policy_notice", {
            current: `${agentFeePolicy.currentBps / 100}%`,
            standard: `${agentFeePolicy.standardBps / 100}%`,
            phase: t(getPromoPhaseLabelKey(agentFeePolicy.currentPhase.name)),
          })}
        </Notice>
      </div>

      {isLoadingDashboard && !address ? <LoadingState label={t("common_loading")} /> : null}

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <MetricCard label={t("dashboard_kpi_wlc")} value={`${dashboard.wlcBalance} WLC`} footnote={t("dashboard_wallet")} />
        <MetricCard label={t("dashboard_kpi_koin")} value={`${dashboard.koinBalance} KOIN`} footnote={t("dashboard_current_epoch")} />
        <MetricCard
          label={t("dashboard_kpi_bond")}
          value={`${dashboard.bondAmount} WLC`}
          footnote={dashboard.bondStatus === "active" ? t("bond_active") : dashboard.bondStatus === "pending" ? t("bond_pending") : t("bond_none")}
        />
        <MetricCard
          label={t("dashboard_kpi_active_rewards")}
          value={`${dashboard.pendingActiveRewards} KOIN`}
          footnote={`${t("rewards_epoch")} ${dashboard.currentEpoch}`}
        />
        <MetricCard
          label={t("dashboard_kpi_work_rewards")}
          value={`${dashboard.pendingWorkRewards} KOIN`}
          footnote={t("dashboard_jobs_count", { count: dashboard.totalJobs })}
        />
      </div>

      <div className="action-grid" style={{ marginBottom: 24 }}>
        <ActionLink
          to="/dashboard/bond"
          title={t("dashboard_action_bond")}
          text={t("dashboard_bond_manage_note", { bond: dashboard.minBond })}
          icon="/icons/icon-bond.png"
        />
        <ActionLink
          to="/dashboard/register"
          title={t("dashboard_action_register")}
          text={dashboard.nodeRegistered ? t("dashboard_register_done_note") : t("dashboard_register_ready_note")}
          icon="/icons/icon-node.png"
        />
        <ActionLink
          to="/dashboard/rewards"
          title={t("dashboard_action_rewards")}
          text={t("dashboard_rewards_ready_note", {
            active: dashboard.pendingActiveRewards,
            work: dashboard.pendingWorkRewards,
          })}
          icon="/icons/icon-rewards.png"
        />
        <ActionLink
          to="/submit"
          title={t("dashboard_action_create")}
          text={t("dashboard_create_note")}
          icon="/icons/icon-create-job.png"
        />
      </div>

      <div className="two-col-grid">
        <Panel title={t("dashboard_node_status")} subtitle={address ? t("dashboard_node_signing_note") : t("dashboard_not_connected")}>
          <div className="value-list">
            <Value label={t("dashboard_wallet")} value={address ? <AddressLink address={address} /> : t("common_connect_wallet")} />
            <Value label={t("dashboard_registration")} value={dashboard.nodeRegistered ? t("common_registered") : t("common_not_registered")} />
            <Value label={t("dashboard_role")} value={dashboard.nodeRole != null ? roleLabelMap[dashboard.nodeRole] : "-"} />
            <Value label={t("dashboard_last_epoch")} value={dashboard.nodeLastHeartbeatEpoch != null ? String(dashboard.nodeLastHeartbeatEpoch) : "-"} />
            <Value label={t("dashboard_min_bond")} value={`${dashboard.minBond} WLC`} />
          </div>
        </Panel>

        <Panel title={t("dashboard_contracts")} subtitle={t("dashboard_public_manifest_note")}>
          <div className="value-list">
            {Object.entries(ADDRESSES).map(([key, value]) => (
              <Value key={key} label={key} value={<AddressLink address={value} />} />
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: 24 }}>
        <Panel title={t("common_recent_jobs")} subtitle={t("dashboard_recent_jobs_note")}>
          {recentJobs.length === 0 ? (
            <EmptyState title={t("jobs_empty")} description={t("common_no_data")} />
          ) : (
            <div className="jobs-list">
              {recentJobs.map((job) => (
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
                  <div className="job-card-footer" style={{ marginTop: 14 }}>
                    <span className="mono subtle">{formatDateTime(job.deadline)}</span>
                    <AddressLink address={job.creator} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function ActionLink({ to, title, text, icon }) {
  return (
    <Link to={to} className="action-card">
      <div className="icon-chip">
        <img src={icon} alt="" />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </Link>
  )
}

function Value({ label, value }) {
  return (
    <div className="value-row">
      <span className="subtle">{label}</span>
      <span>{value}</span>
    </div>
  )
}
