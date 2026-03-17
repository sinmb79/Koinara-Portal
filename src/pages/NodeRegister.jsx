import { useState } from "react"
import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { Button, StatusPill } from "../components/ui.jsx"

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

  const bondStateLabel =
    dashboard.bondStatus === "active"
      ? t("bond_active")
      : dashboard.bondStatus === "pending"
        ? t("bond_pending")
        : t("bond_none")
  const currentRole =
    dashboard.nodeRole != null ? roleOptions.find((option) => option.value === dashboard.nodeRole)?.title || "-" : "-"

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("register_tag")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("register_title")}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">{t("register_subtitle")}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelCard title={t("register_step1")} subtitle={`${t("register_wallet_balance")}: ${dashboard.wlcBalance} WLC`}>
          <div className="space-y-5">
            <div className="grid gap-3">
              <ValueRow label={t("bond_minimum")} value={`${dashboard.minBond} WLC`} />
              <ValueRow label={t("bond_status")} value={bondStateLabel} />
            </div>
            <Button onClick={handleBond} disabled={dashboard.bondStatus !== "none"} full>
              {t("bond_post")}
            </Button>
          </div>
        </PanelCard>

        <PanelCard title={t("register_step2")} subtitle={t("register_step2_note")}>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">{t("register_role")}</label>
              <select
                value={role}
                onChange={(event) => setRole(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-primary/10 bg-[#10261f]/90 px-4 text-sm text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.title}
                  </option>
                ))}
              </select>
              <div className="mt-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-300">
                {roleOptions.find((option) => option.value === role)?.desc}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">{t("register_metadata")}</label>
              <textarea
                rows={4}
                value={metadata}
                onChange={(event) => setMetadata(event.target.value)}
                className="w-full rounded-xl border border-primary/10 bg-[#10261f]/90 px-4 py-3 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-2 text-sm leading-6 text-slate-500">{t("register_metadata_hint")}</div>
            </div>

            <Button
              variant="secondary"
              onClick={handleRegister}
              disabled={dashboard.bondStatus !== "active" || dashboard.nodeRegistered}
              full
            >
              {t("register_now")}
            </Button>
          </div>
        </PanelCard>

        <PanelCard title={t("register_step3")} subtitle={t("register_step3_note")}>
          <div className="space-y-5">
            <div className="grid gap-3">
              <ValueRow
                label={t("dashboard_registration")}
                value={dashboard.nodeRegistered ? t("common_registered") : t("common_pending")}
              />
              <ValueRow label={t("dashboard_role")} value={currentRole} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 px-4 py-4">
              <span className="text-sm text-slate-300">{t("common_ready")}</span>
              <StatusPill tone={dashboard.nodeRegistered ? "success" : "dim"}>
                {dashboard.nodeRegistered ? t("register_complete") : t("register_waiting")}
              </StatusPill>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  )
}

function PanelCard({ title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/5 px-6 py-5">
        <h2 className="text-xl font-black text-white">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-7 text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function ValueRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#0b1713]/60 px-4 py-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
