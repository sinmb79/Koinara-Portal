import { useMemo } from "react"
import { useParams } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { Eyebrow, Panel, JobStatePill, JobTypePill, AddressLink, EmptyState, StatusPill } from "../components/ui.jsx"
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
      { key: "accepted", label: rejected ? t("timeline_rejected") : t("timeline_accepted"), complete: rejected || state >= 4 || Boolean(record?.verificationPass) },
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
    <div className="page-shell">
      <Eyebrow>{t("job_detail_tag")}</Eyebrow>
      <h1 className="page-title">{t("job_detail_title")}</h1>
      <p className="page-subtitle">{t("job_detail_subtitle", { id })}</p>

      {!job ? (
        <EmptyState title={t("job_detail_not_found")} description={t("common_no_data")} />
      ) : (
        <div className="two-col-grid" style={{ marginTop: 28 }}>
          <Panel title={t("job_detail_timeline")} subtitle={t("job_detail_timeline_note")}>
            <div style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${timeline.length}, 1fr)`, gap: 12 }}>
                {timeline.map((step, index) => (
                  <div key={step.key} style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          background: step.complete ? "var(--brand-neon-mint)" : "rgba(122,140,173,0.25)",
                          boxShadow: step.complete ? "0 0 18px rgba(0,255,180,0.3)" : "none",
                          flexShrink: 0,
                        }}
                      />
                      {index < timeline.length - 1 ? (
                        <div style={{ flex: 1, height: 2, background: step.complete ? "rgba(0,255,180,0.35)" : "rgba(122,140,173,0.18)" }} />
                      ) : null}
                    </div>
                    <div style={{ fontSize: 13, color: step.complete ? "var(--text-primary)" : "var(--text-secondary)" }}>{step.label}</div>
                  </div>
                ))}
              </div>

              <div className="value-list">
                <div className="value-row"><span className="subtle">{t("job_detail_state")}</span><JobStatePill state={job.state} /></div>
                <div className="value-row"><span className="subtle">{t("job_detail_type")}</span><JobTypePill type={job.jobType} /></div>
                <div className="value-row"><span className="subtle">{t("job_detail_deadline")}</span><span>{formatDateTime(job.deadline)}</span></div>
                <div className="value-row"><span className="subtle">{t("job_detail_requester")}</span><AddressLink address={job.creator} /></div>
              </div>
            </div>
          </Panel>

          <Panel title={t("job_detail_submission")} subtitle={t("job_detail_submission_note")}>
            {!job.submission && !job.verifierRecord ? (
              <EmptyState title={t("job_detail_no_submission")} description={t("common_no_data")} />
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                <div className="value-list">
                  <div className="value-row"><span className="subtle">{t("job_detail_provider")}</span><AddressLink address={job.submission?.provider || job.verifierRecord?.provider} /></div>
                  <div className="value-row"><span className="subtle">{t("job_detail_submitted_at")}</span><span>{job.submission?.submittedAt ? formatDateTime(job.submission.submittedAt) : job.verifierRecord?.submittedAt ? formatDateTime(job.verifierRecord.submittedAt) : "-"}</span></div>
                  <div className="value-row"><span className="subtle">{t("job_detail_response_hash")}</span><span className="mono subtle">{job.submission?.responseHash || job.verifierRecord?.responseHash || "-"}</span></div>
                  <div className="value-row"><span className="subtle">{t("job_detail_approvals")}</span><span>{job.verifierRecord ? `${job.verifierRecord.approvals}` : "-"}</span></div>
                  <div className="value-row"><span className="subtle">{t("job_detail_quorum")}</span><span>{job.verifierRecord ? `${job.verifierRecord.quorum}` : "-"}</span></div>
                  <div className="value-row"><span className="subtle">{t("job_detail_finalized_at")}</span><span>{job.verifierRecord?.finalizedAt ? formatDateTime(job.verifierRecord.finalizedAt) : "-"}</span></div>
                  <div className="value-row"><span className="subtle">{t("job_detail_poi_hash")}</span><span className="mono subtle">{job.verifierRecord?.poiHash && job.verifierRecord.poiHash !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? job.verifierRecord.poiHash : "-"}</span></div>
                </div>

                {job.verifierRecord ? (
                  <>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div className="panel-subtitle" style={{ marginBottom: 0 }}>{t("job_detail_checks")}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {checks.map(([key, label]) => (
                          <StatusPill key={key} tone={job.verifierRecord[key] ? "success" : "danger"}>
                            {label}: {job.verifierRecord[key] ? t("job_detail_check_pass") : t("job_detail_check_fail")}
                          </StatusPill>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <div className="panel-subtitle" style={{ marginBottom: 0 }}>{t("job_detail_approved_verifiers")}</div>
                      {job.approvedVerifiers?.length ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
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
          </Panel>

          <Panel title={t("job_detail_rewards")} subtitle={t("job_detail_rewards_note")}>
            <div className="value-list">
              <div className="value-row"><span className="subtle">{t("job_detail_premium")}</span><span>{formatTokenAmount(job.premiumReward, 4)} WLC</span></div>
              <div className="value-row"><span className="subtle">{t("job_detail_portal_fee")}</span><span>{job.portalFee?.feeWei ? `${formatTokenAmount(job.portalFee.feeWei, 4)} WLC` : "-"}</span></div>
              <div className="value-row"><span className="subtle">{t("job_detail_portal_total")}</span><span>{job.portalFee?.totalWei ? `${formatTokenAmount(job.portalFee.totalWei, 4)} WLC` : "-"}</span></div>
              <div className="value-row"><span className="subtle">{t("job_detail_portal_phase")}</span><span>{job.portalFee?.phaseName ? t(getPromoPhaseLabelKey(job.portalFee.phaseName)) : "-"}</span></div>
              <div className="value-row"><span className="subtle">{t("job_detail_provider_reward")}</span><span>{job.rewardBreakdown ? `${formatTokenAmount(job.rewardBreakdown.providerReward, 2)} KOIN` : "-"}</span></div>
              <div className="value-row"><span className="subtle">{t("job_detail_verifier_reward_total")}</span><span>{job.rewardBreakdown ? `${formatTokenAmount(job.rewardBreakdown.verifierRewardTotal, 2)} KOIN` : "-"}</span></div>
            </div>
            <div style={{ marginTop: 16 }}>
              <StatusPill tone="dim">{t("job_detail_portal_fee_note")}</StatusPill>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
