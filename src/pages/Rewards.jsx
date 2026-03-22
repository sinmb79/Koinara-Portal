import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { usePolling } from "../hooks/usePolling.js"
import { useT } from "../lib/i18n.js"
import { getAgentFeePolicy, getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { classifyMissionReward } from "../lib/missionParticipation.js"
import { Button, EmptyState, StatusPill, LegacyNotice, Notice } from "../components/ui.jsx"

export default function Rewards() {
  const {
    address,
    rewardHistory,
    workRewards,
    dashboard,
    loadRewards,
    refreshDashboard,
    claimActiveReward,
    claimWorkReward,
    lang,
  } = useStore()
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
    <div className="page-shell space-y-8">
      <LegacyNotice t={t} />
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("rewards_tag")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("rewards_title")}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">{t("rewards_subtitle")}</p>
      </section>

      <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-300">
        {t("agent_fee_policy_notice", {
          current: `${agentFeePolicy.currentBps / 100}%`,
          standard: `${agentFeePolicy.standardBps / 100}%`,
          phase: t(getPromoPhaseLabelKey(agentFeePolicy.currentPhase.name)),
        })}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon="schedule" label={t("rewards_current_epoch")} value={dashboard.currentEpoch} trend="Live" />
        <KpiCard
          icon="payments"
          label={t("dashboard_kpi_mission_rewards")}
          value={`${dashboard.pendingMissionRewards} KOIN`}
          trend={t("mission_verdict_driven")}
        />
        <KpiCard
          icon="fact_check"
          label={t("dashboard_kpi_verification_rewards")}
          value={`${dashboard.pendingVerificationRewards} KOIN`}
          trend="Verifier"
        />
        <KpiCard
          icon="workspace_premium"
          label={t("dashboard_kpi_active_rewards_legacy")}
          value={`${dashboard.pendingActiveRewards} KOIN`}
          trend="Legacy"
        />
      </section>

      <Notice>{t("rewards_active_legacy_note")}</Notice>

      <div className="rewards-history-layout">
        <PanelCard title={t("rewards_active_history")} subtitle={t("rewards_active_legacy_note")}>
          {rewardHistory.length === 0 ? (
            <EmptyState title={t("rewards_no_active")} description={t("common_no_data")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-primary/5 text-slate-400">
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("rewards_epoch")}</th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("rewards_active_nodes")}</th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("rewards_weight")}</th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">{t("rewards_estimated")}</th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rewardHistory.map((item) => (
                    <tr key={item.epoch} className="transition-colors hover:bg-primary/5">
                      <td className="px-5 py-4 font-mono text-xs text-primary">{item.epoch}</td>
                      <td className="px-5 py-4 text-white">{item.activeNodes}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {item.addressWeight} / {item.totalWeight}
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">
                        {Number(item.estimatedActiveReward ? Number(item.estimatedActiveReward) / 1e18 : 0).toFixed(2)} KOIN
                      </td>
                      <td className="px-5 py-4 text-right">
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
            </div>
          )}
        </PanelCard>

        <PanelCard title={t("rewards_work_history")} subtitle={t("rewards_work_history_note")}>
          {workRewards.length === 0 ? (
            <EmptyState title={t("rewards_no_work")} description={t("common_no_data")} />
          ) : (
            <div className="grid gap-4">
              {workRewards.map((item) => (
                <div
                  key={`${item.role}-${item.jobId}`}
                  className="rounded-2xl border border-white/5 bg-[#0b1713]/60 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <StatusPill tone={classifyMissionReward({ source: item.source }).type === "mission" ? "success" : "info"}>
                        {item.role === "provider" ? t("rewards_role_provider") : t("rewards_role_verifier")}
                      </StatusPill>
                      <h3 className="text-xl font-black text-white">Job #{item.jobId}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {t("rewards_claim")}
                      </div>
                      <div className="mt-2 text-2xl font-black text-primary">
                        {Number(item.amount ? Number(item.amount) / 1e18 : 0).toFixed(2)} KOIN
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Button variant="secondary" onClick={() => claimWork(item)}>
                      {t("rewards_claim")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

function KpiCard({ icon, label, value, trend }) {
  return (
    <div className="rounded-[24px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined rounded-2xl bg-primary/10 p-3 text-primary">{icon}</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{trend}</span>
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-white">{value}</div>
    </div>
  )
}
