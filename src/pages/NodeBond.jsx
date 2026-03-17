import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { usePolling } from "../hooks/usePolling.js"
import { useT } from "../lib/i18n.js"
import { formatDateTime, formatRelativeCountdown } from "../lib/chain.js"
import { Button, StatusPill } from "../components/ui.jsx"

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
  const bondStateLabel =
    dashboard.bondStatus === "active"
      ? t("bond_active")
      : dashboard.bondStatus === "pending"
        ? t("bond_pending")
        : t("bond_none")
  const bondStateTone =
    dashboard.bondStatus === "active" ? "success" : dashboard.bondStatus === "pending" ? "warn" : "dim"

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("bond_tag")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("bond_title")}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">{t("bond_subtitle")}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard title={t("bond_status")} subtitle={t("bond_contract_fixed_note")}>
          <div className="space-y-5">
            <div className="grid gap-3">
              <ValueRow label={t("bond_status")} value={<StatusPill tone={bondStateTone}>{bondStateLabel}</StatusPill>} />
              <ValueRow label={t("bond_amount")} value={`${dashboard.bondAmount} WLC`} />
              <ValueRow label={t("bond_minimum")} value={`${dashboard.minBond} WLC`} />
              <ValueRow
                label={t("bond_release_period")}
                value={t("bond_days", { days: dashboard.bondReleasePeriodDays })}
              />
              <ValueRow
                label={t("bond_release_ready")}
                value={
                  dashboard.bondReadyAt
                    ? `${formatDateTime(dashboard.bondReadyAt)} (${releaseCountdownLabel || "-"})`
                    : "-"
                }
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => run(postBond)} disabled={dashboard.bondStatus !== "none"}>
                {t("bond_post")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => run(requestBondRelease)}
                disabled={dashboard.bondStatus !== "active"}
              >
                {t("bond_request_release")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => run(withdrawBond)}
                disabled={!dashboard.bondReadyAt || releaseCountdown !== "Ready now"}
              >
                {t("bond_withdraw")}
              </Button>
            </div>
          </div>
        </PanelCard>

        <PanelCard title={t("bond_lifecycle_title")} subtitle={t("bond_lifecycle_note")}>
          <div className="space-y-5">
            <div className="grid gap-4">
              <StepCard step={t("register_step1")} body={t("bond_step1")} icon="lock" />
              <StepCard step={t("register_step2")} body={t("bond_step2")} icon="hub" />
              <StepCard step={t("register_step3")} body={t("bond_step3")} icon="payments" />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 px-4 py-4">
              <span className="text-sm text-slate-300">{t("bond_status")}</span>
              <StatusPill tone={bondStateTone}>{bondStateLabel}</StatusPill>
            </div>
          </div>
        </PanelCard>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-300">
        {t("bond_no_penalties")}
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

function StepCard({ step, body, icon }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/5 bg-[#10261f]/70 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{step}</div>
        <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>
      </div>
    </div>
  )
}
