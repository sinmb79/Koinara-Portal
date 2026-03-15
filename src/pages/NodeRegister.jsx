import { useState } from "react"
import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { Eyebrow, Panel, Button, DashboardTabs, Field, StatusPill } from "../components/ui.jsx"

export default function NodeRegister() {
  const { address, isCorrectChain, dashboard, postBond, registerNode, lang } = useStore()
  const t = useT(lang)
  const [role, setRole] = useState(0)
  const [metadata, setMetadata] = useState("Worldland + OpenClaw + Koinara")

  async function handleBond() {
    if (!address) return toast.error(t("common_wallet_required"))
    if (!isCorrectChain) return toast.error(t("common_wrong_chain"))
    try {
      await postBond()
      toast.success(t("bond_action_success"))
    } catch (error) {
      toast.error(error.reason || error.message)
    }
  }

  async function handleRegister() {
    if (!address) return toast.error(t("common_wallet_required"))
    if (!isCorrectChain) return toast.error(t("common_wrong_chain"))
    try {
      await registerNode({ role, metadata })
      toast.success(t("register_complete"))
    } catch (error) {
      toast.error(error.reason || error.message)
    }
  }

  const roleOptions = [
    { value: 0, title: t("register_role_provider"), desc: t("register_role_provider_desc") },
    { value: 1, title: t("register_role_verifier"), desc: t("register_role_verifier_desc") },
    { value: 2, title: t("register_role_both"), desc: t("register_role_both_desc") },
  ]

  return (
    <div className="page-shell">
      <Eyebrow>{t("register_tag")}</Eyebrow>
      <h1 className="page-title">{t("register_title")}</h1>
      <p className="page-subtitle">{t("register_subtitle")}</p>
      <DashboardTabs />

      <div className="three-col-grid">
        <Panel title={t("register_step1")} subtitle={`${t("register_wallet_balance")}: ${dashboard.wlcBalance} WLC`}>
          <div className="value-list">
            <Value label={t("bond_minimum")} value={`${dashboard.minBond} WLC`} />
            <Value label={t("bond_status")} value={dashboard.bondStatus === "active" ? t("bond_active") : dashboard.bondStatus === "pending" ? t("bond_pending") : t("bond_none")} />
          </div>
          <div style={{ marginTop: 18 }}>
            <Button onClick={handleBond} disabled={dashboard.bondStatus !== "none"} full>
              {t("bond_post")}
            </Button>
          </div>
        </Panel>

        <Panel title={t("register_step2")} subtitle={t("register_step2_note")}>
          <Field label={t("register_role")}>
            <select value={role} onChange={(event) => setRole(Number(event.target.value))}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="notice" style={{ marginTop: 14 }}>
            {roleOptions.find((option) => option.value === role)?.desc}
          </div>
          <Field label={t("register_metadata")} hint={t("register_metadata_hint")}>
            <textarea rows={4} value={metadata} onChange={(event) => setMetadata(event.target.value)} />
          </Field>
          <div style={{ marginTop: 18 }}>
            <Button variant="secondary" onClick={handleRegister} disabled={dashboard.bondStatus !== "active" || dashboard.nodeRegistered} full>
              {t("register_now")}
            </Button>
          </div>
        </Panel>

        <Panel title={t("register_step3")} subtitle={t("register_step3_note")}>
          <div className="value-list">
            <Value label={t("dashboard_registration")} value={dashboard.nodeRegistered ? t("common_registered") : t("common_pending")} />
            <Value label={t("dashboard_role")} value={dashboard.nodeRole != null ? roleOptions.find((option) => option.value === dashboard.nodeRole)?.title : "-"} />
          </div>
          <div style={{ marginTop: 18 }}>
            <StatusPill tone={dashboard.nodeRegistered ? "success" : "dim"}>
              {dashboard.nodeRegistered ? t("register_complete") : t("register_waiting")}
            </StatusPill>
          </div>
        </Panel>
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
