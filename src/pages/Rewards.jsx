import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { usePolling } from "../hooks/usePolling.js"
import { useT } from "../lib/i18n.js"
import { getAgentFeePolicy, getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { Eyebrow, Panel, Button, DashboardTabs, EmptyState, StatusPill } from "../components/ui.jsx"

export default function Rewards() {
  const { address, rewardHistory, workRewards, dashboard, loadRewards, refreshDashboard, claimActiveReward, claimWorkReward, lang } = useStore()
  const t = useT(lang)
  const agentFeePolicy = getAgentFeePolicy()

  usePolling(loadRewards, 20000, Boolean(address))
  usePolling(refreshDashboard, 20000, true)

  async function claimEpoch(epoch) {
    try {
      await claimActiveReward(epoch)
      toast.success(t("rewards_claim_success"))
    } catch (error) {
      toast.error(error.reason || error.message)
    }
  }

  async function claimWork(item) {
    try {
      await claimWorkReward(item.jobId, item.role)
      toast.success(t("rewards_claim_success"))
    } catch (error) {
      toast.error(error.reason || error.message)
    }
  }

  return (
    <div className="page-shell">
      <Eyebrow>{t("rewards_tag")}</Eyebrow>
      <h1 className="page-title">{t("rewards_title")}</h1>
      <p className="page-subtitle">{t("rewards_subtitle")}</p>
      <DashboardTabs />
      <div style={{ marginBottom: 24 }}>
        <div className="notice">
          {t("agent_fee_policy_notice", {
            current: `${agentFeePolicy.currentBps / 100}%`,
            standard: `${agentFeePolicy.standardBps / 100}%`,
            phase: t(getPromoPhaseLabelKey(agentFeePolicy.currentPhase.name)),
          })}
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card">
          <span className="metric-label">{t("rewards_current_epoch")}</span>
          <div className="metric-value">{dashboard.currentEpoch}</div>
        </div>
        <div className="metric-card">
          <span className="metric-label">{t("dashboard_kpi_active_rewards")}</span>
          <div className="metric-value">{dashboard.pendingActiveRewards} KOIN</div>
        </div>
        <div className="metric-card">
          <span className="metric-label">{t("dashboard_kpi_work_rewards")}</span>
          <div className="metric-value">{dashboard.pendingWorkRewards} KOIN</div>
        </div>
      </div>

      <div className="two-col-grid">
        <Panel title={t("rewards_active_history")} subtitle={t("rewards_active_history_note")}>
          {rewardHistory.length === 0 ? (
            <EmptyState title={t("rewards_no_active")} description={t("common_no_data")} />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("rewards_epoch")}</th>
                  <th>{t("rewards_active_nodes")}</th>
                  <th>{t("rewards_weight")}</th>
                  <th>{t("rewards_estimated")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rewardHistory.map((item) => (
                  <tr key={item.epoch}>
                    <td className="mono">{item.epoch}</td>
                    <td>{item.activeNodes}</td>
                    <td>{item.addressWeight} / {item.totalWeight}</td>
                    <td>{Number(item.estimatedActiveReward ? Number(item.estimatedActiveReward) / 1e18 : 0).toFixed(2)} KOIN</td>
                    <td>
                      {item.claimed ? (
                        <StatusPill tone="success">{t("rewards_claimed")}</StatusPill>
                      ) : (
                        <Button variant="secondary" onClick={() => claimEpoch(item.epoch)} disabled={!item.activeAt}>
                          {t("rewards_claim")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title={t("rewards_work_history")} subtitle={t("rewards_work_history_note")}>
          {workRewards.length === 0 ? (
            <EmptyState title={t("rewards_no_work")} description={t("common_no_data")} />
          ) : (
            <div className="reward-list">
              {workRewards.map((item) => (
                <div className="job-card" key={`${item.role}-${item.jobId}`}>
                  <div className="job-card-header">
                    <div>
                      <div className="job-card-meta">
                        <StatusPill tone={item.role === "provider" ? "success" : "info"}>
                          {item.role === "provider" ? t("rewards_role_provider") : t("rewards_role_verifier")}
                        </StatusPill>
                      </div>
                      <h3 className="job-card-title">Job #{item.jobId}</h3>
                    </div>
                    <div className="mono">{Number(item.amount ? Number(item.amount) / 1e18 : 0).toFixed(2)} KOIN</div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Button variant="secondary" onClick={() => claimWork(item)}>
                      {t("rewards_claim")}
                    </Button>
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
