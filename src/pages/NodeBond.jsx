import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { usePolling } from "../hooks/usePolling.js"
import { useT } from "../lib/i18n.js"
import { formatDateTime, formatRelativeCountdown } from "../lib/chain.js"
import { Eyebrow, Panel, Button, DashboardTabs, Notice, StatusPill } from "../components/ui.jsx"

export default function NodeBond() {
  const { address, isCorrectChain, dashboard, refreshDashboard, postBond, requestBondRelease, withdrawBond, lang } = useStore()
  const t = useT(lang)

  usePolling(refreshDashboard, 15000, true)

  async function run(action) {
    if (!address) return toast.error(t("common_wallet_required"))
    if (!isCorrectChain) return toast.error(t("common_wrong_chain"))
    try {
      await action()
      toast.success(t("bond_action_success"))
    } catch (error) {
      toast.error(error.reason || error.message)
    }
  }

  const releaseCountdown = formatRelativeCountdown(dashboard.bondReadyAt)
  const releaseCountdownLabel = releaseCountdown === "Ready now" ? t("bond_ready_now") : releaseCountdown

  return (
    <div className="page-shell">
      <Eyebrow>{t("bond_tag")}</Eyebrow>
      <h1 className="page-title">{t("bond_title")}</h1>
      <p className="page-subtitle">{t("bond_subtitle")}</p>
      <DashboardTabs />

      <div className="two-col-grid">
        <Panel title={t("bond_status")} subtitle={t("bond_contract_fixed_note")}>
          <div className="value-list">
            <Value label={t("bond_status")} value={dashboard.bondStatus === "active" ? t("bond_active") : dashboard.bondStatus === "pending" ? t("bond_pending") : t("bond_none")} />
            <Value label={t("bond_amount")} value={`${dashboard.bondAmount} WLC`} />
            <Value label={t("bond_minimum")} value={`${dashboard.minBond} WLC`} />
            <Value label={t("bond_release_period")} value={t("bond_days", { days: dashboard.bondReleasePeriodDays })} />
            <Value
              label={t("bond_release_ready")}
              value={dashboard.bondReadyAt ? `${formatDateTime(dashboard.bondReadyAt)} (${releaseCountdownLabel || "-"})` : "-"}
            />
          </div>
          <div className="row-actions" style={{ marginTop: 20 }}>
            <Button onClick={() => run(postBond)} disabled={dashboard.bondStatus !== "none"}>{t("bond_post")}</Button>
            <Button variant="secondary" onClick={() => run(requestBondRelease)} disabled={dashboard.bondStatus !== "active"}>{t("bond_request_release")}</Button>
            <Button
              variant="secondary"
              onClick={() => run(withdrawBond)}
              disabled={!dashboard.bondReadyAt || releaseCountdown !== "Ready now"}
            >
              {t("bond_withdraw")}
            </Button>
          </div>
        </Panel>

        <Panel title={t("bond_lifecycle_title")} subtitle={t("bond_lifecycle_note")}>
          <div className="value-list">
            <Value label={t("register_step1")} value={t("bond_step1")} />
            <Value label={t("register_step2")} value={t("bond_step2")} />
            <Value label={t("register_step3")} value={t("bond_step3")} />
          </div>
          <div style={{ marginTop: 18 }}>
            <StatusPill tone={dashboard.bondStatus === "active" ? "success" : dashboard.bondStatus === "pending" ? "warn" : "dim"}>
              {dashboard.bondStatus === "active" ? t("bond_active") : dashboard.bondStatus === "pending" ? t("bond_pending") : t("bond_none")}
            </StatusPill>
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: 24 }}>
        <Notice>{t("bond_no_penalties")}</Notice>
      </div>
    </div>
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
