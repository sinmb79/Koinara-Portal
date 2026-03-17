import { useMemo } from "react"
import { useParams } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { JobStatePill, JobTypePill, AddressLink, EmptyState, StatusPill } from "../components/ui.jsx"
import { formatDateTime, formatTokenAmount } from "../lib/chain.js"

export default function JobDetail() {
  const { id } = useParams()
  const { lang, jobs } = useStore()
  const t = useT(lang)
  const job = useMemo(() => jobs.find((item) => String(item.id) === String(id)), [jobs, id])

  const timeline = useMemo(() => {
    if (!job) return []
    const record = job.verifierRecord
    const state = Number(job.state)
    const rejected = Boolean(record?.rejected || state === 5)
    return [
      { key: "created", label: t("timeline_created"), complete: true },
      { key: "submitted", label: t("timeline_submitted"), complete: Boolean(job.submission) },
      { key: "verified", label: t("timeline_verified"), complete: Boolean(record && record.approvals > 0) },
      {
        key: "accepted",
        label: rejected ? t("timeline_rejected") : t("timeline_accepted"),
        complete: rejected || state >= 4 || Boolean(record?.verificationPass),
      },
      { key: "settled", label: t("timeline_settled"), complete: state === 6 },
    ]
  }, [job, t])

  const checks = job?.verifierRecord
    ? [
        ["validJob", t("job_detail_check_valid_job")],
        ["withinDeadline", t("job_detail_check_within_deadline")],
        ["formatPass", t("job_detail_check_format_pass")],
        ["nonEmptyResponse", t("job_detail_check_non_empty")],
        ["verificationPass", t("job_detail_check_verification_pass")],
      ]
    : []

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("job_detail_tag")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("job_detail_title")}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">{t("job_detail_subtitle", { id })}</p>
      </section>

      {!job ? (
        <EmptyState title={t("job_detail_not_found")} description={t("common_no_data")} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <PanelCard title={t("job_detail_timeline")} subtitle={t("job_detail_timeline_note")}>
            <div className="space-y-6">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}
              >
                {timeline.map((step, index) => (
                  <div key={step.key} className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 shrink-0 rounded-full ${
                          step.complete ? "bg-primary shadow-[0_0_18px_rgba(0,255,180,0.35)]" : "bg-slate-600"
                        }`}
                      />
                      {index < timeline.length - 1 ? (
                        <div className={`h-0.5 flex-1 ${step.complete ? "bg-primary/35" : "bg-slate-700"}`} />
                      ) : null}
                    </div>
                    <div className={`text-sm ${step.complete ? "text-white" : "text-slate-500"}`}>{step.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <ValueRow label={t("job_detail_state")} value={<JobStatePill state={job.state} />} />
                <ValueRow label={t("job_detail_type")} value={<JobTypePill type={job.jobType} />} />
                <ValueRow label={t("job_detail_deadline")} value={formatDateTime(job.deadline)} />
                <ValueRow label={t("job_detail_requester")} value={<AddressLink address={job.creator} />} />
              </div>
            </div>
          </PanelCard>

          <PanelCard title={t("job_detail_submission")} subtitle={t("job_detail_submission_note")}>
            {!job.submission && !job.verifierRecord ? (
              <EmptyState title={t("job_detail_no_submission")} description={t("common_no_data")} />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-3">
                  <ValueRow
                    label={t("job_detail_provider")}
                    value={<AddressLink address={job.submission?.provider || job.verifierRecord?.provider} />}
                  />
                  <ValueRow
                    label={t("job_detail_submitted_at")}
                    value={
                      job.submission?.submittedAt
                        ? formatDateTime(job.submission.submittedAt)
                        : job.verifierRecord?.submittedAt
                          ? formatDateTime(job.verifierRecord.submittedAt)
                          : "-"
                    }
                  />
                  <ValueRow
                    label={t("job_detail_response_hash")}
                    value={
                      <span className="font-mono text-xs text-slate-500">
                        {job.submission?.responseHash || job.verifierRecord?.responseHash || "-"}
                      </span>
                    }
                  />
                  <ValueRow label={t("job_detail_approvals")} value={job.verifierRecord ? `${job.verifierRecord.approvals}` : "-"} />
                  <ValueRow label={t("job_detail_quorum")} value={job.verifierRecord ? `${job.verifierRecord.quorum}` : "-"} />
                  <ValueRow
                    label={t("job_detail_finalized_at")}
                    value={job.verifierRecord?.finalizedAt ? formatDateTime(job.verifierRecord.finalizedAt) : "-"}
                  />
                  <ValueRow
                    label={t("job_detail_poi_hash")}
                    value={
                      <span className="font-mono text-xs text-slate-500">
                        {job.verifierRecord?.poiHash &&
                        job.verifierRecord.poiHash !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                          ? job.verifierRecord.poiHash
                          : "-"}
                      </span>
                    }
                  />
                </div>

                {job.verifierRecord ? (
                  <>
                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("job_detail_checks")}</div>
                      <div className="flex flex-wrap gap-2.5">
                        {checks.map(([key, label]) => (
                          <StatusPill key={key} tone={job.verifierRecord[key] ? "success" : "danger"}>
                            {label}: {job.verifierRecord[key] ? t("job_detail_check_pass") : t("job_detail_check_fail")}
                          </StatusPill>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        {t("job_detail_approved_verifiers")}
                      </div>
                      {job.approvedVerifiers?.length ? (
                        <div className="flex flex-wrap gap-2.5">
                          {job.approvedVerifiers.map((verifier) => (
                            <StatusPill key={verifier} tone="info">
                              <AddressLink address={verifier} />
                            </StatusPill>
                          ))}
                        </div>
                      ) : (
                        <EmptyState title={t("job_detail_no_verifiers")} description={t("common_no_data")} />
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </PanelCard>

          <PanelCard title={t("job_detail_rewards")} subtitle={t("job_detail_rewards_note")}>
            <div className="space-y-4">
              <div className="grid gap-3">
                <ValueRow label={t("job_detail_premium")} value={`${formatTokenAmount(job.premiumReward, 4)} WLC`} />
                <ValueRow
                  label={t("job_detail_portal_fee")}
                  value={job.portalFee?.feeWei ? `${formatTokenAmount(job.portalFee.feeWei, 4)} WLC` : "-"}
                />
                <ValueRow
                  label={t("job_detail_portal_total")}
                  value={job.portalFee?.totalWei ? `${formatTokenAmount(job.portalFee.totalWei, 4)} WLC` : "-"}
                />
                <ValueRow
                  label={t("job_detail_portal_phase")}
                  value={job.portalFee?.phaseName ? t(getPromoPhaseLabelKey(job.portalFee.phaseName)) : "-"}
                />
                <ValueRow
                  label={t("job_detail_provider_reward")}
                  value={job.rewardBreakdown ? `${formatTokenAmount(job.rewardBreakdown.providerReward, 2)} KOIN` : "-"}
                />
                <ValueRow
                  label={t("job_detail_verifier_reward_total")}
                  value={
                    job.rewardBreakdown ? `${formatTokenAmount(job.rewardBreakdown.verifierRewardTotal, 2)} KOIN` : "-"
                  }
                />
              </div>
              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-300">
                {t("job_detail_portal_fee_note")}
              </div>
            </div>
          </PanelCard>
        </div>
      )}
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
