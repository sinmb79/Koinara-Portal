import { useEffect, useMemo, useState } from "react"
import { ethers } from "ethers"
import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { JOB_TYPE_OPTIONS } from "../lib/chain.js"
import { calcRequesterFee, getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { Eyebrow, Panel, Button, Field, Notice, TxLink } from "../components/ui.jsx"

const CREATE_JOB_DRAFT_KEY = "koinara_create_job_draft"

export default function CreateJob() {
  const { lang, address, isCorrectChain, createJob } = useStore()
  const t = useT(lang)
  const [requestText, setRequestText] = useState("")
  const [schemaText, setSchemaText] = useState("text/plain")
  const [jobType, setJobType] = useState(1)
  const [deadlineHours, setDeadlineHours] = useState(24)
  const [premiumWlc, setPremiumWlc] = useState("0")
  const [result, setResult] = useState(null)
  const [partialFailure, setPartialFailure] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(CREATE_JOB_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (typeof draft.requestText === "string") setRequestText(draft.requestText)
      if (typeof draft.schemaText === "string") setSchemaText(draft.schemaText)
      if (typeof draft.jobType === "number") setJobType(draft.jobType)
      if (typeof draft.deadlineHours === "number") setDeadlineHours(draft.deadlineHours)
      if (typeof draft.premiumWlc === "string") setPremiumWlc(draft.premiumWlc)
    } catch {
      // Ignore invalid draft payloads.
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(
      CREATE_JOB_DRAFT_KEY,
      JSON.stringify({
        requestText,
        schemaText,
        jobType,
        deadlineHours,
        premiumWlc,
      }),
    )
  }, [deadlineHours, jobType, premiumWlc, requestText, schemaText])

  const premiumWei = useMemo(() => {
    try {
      return ethers.parseEther(String(premiumWlc || "0"))
    } catch {
      return 0n
    }
  }, [premiumWlc])

  const { fee: feeWei, total: totalWei, currentPhase } = useMemo(
    () => calcRequesterFee(premiumWei),
    [premiumWei],
  )
  const feePercent = currentPhase.requesterBps / 100
  const isPromo = currentPhase.name !== "standard"
  const phaseLabel = t(getPromoPhaseLabelKey(currentPhase.name))

  async function handleSubmit() {
    if (!requestText.trim()) return toast.error(t("create_missing_request"))
    if (!address) return toast.error(t("common_wallet_required"))
    if (!isCorrectChain) return toast.error(t("common_wrong_chain"))

    setLoading(true)
    setResult(null)
    setPartialFailure(null)
    const toastId = toast.loading(feeWei > 0n ? t("create_fee_step1") : t("create_fee_step2"))

    try {
      const response = await createJob({
        requestText,
        schemaText,
        jobType,
        deadlineHours,
        premiumWlc,
        onProgress: (step) => {
          toast.loading(step === "fee" ? t("create_fee_step1") : t("create_fee_step2"), { id: toastId })
        },
      })

      setResult(response)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CREATE_JOB_DRAFT_KEY)
      }
      toast.success(t("create_success"), { id: toastId })
    } catch (error) {
      if (error.portalFeeSent) {
        setPartialFailure({
          feeTxHash: error.feeTxHash,
          message: error.reason || error.message,
        })
        toast.error(t("create_fee_partial_warning"), { id: toastId })
      } else {
        toast.error(error.reason || error.message, { id: toastId })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <Eyebrow>{t("create_tag")}</Eyebrow>
      <h1 className="page-title">{t("create_title")}</h1>
      <p className="page-subtitle">{t("create_subtitle")}</p>

      <div className="two-col-grid" style={{ marginTop: 28 }}>
        <Panel title={t("create_job_type")} subtitle={t("create_job_type_note")}>
          <div className="jobs-list">
            {JOB_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="job-card"
                onClick={() => setJobType(option.value)}
                style={{ borderColor: jobType === option.value ? "rgba(0,255,180,0.35)" : undefined }}
              >
                <div className="job-card-header">
                  <strong>{option.label}</strong>
                  <span className="mono subtle">{`w${option.weight} / q${option.quorum}`}</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={t("create_title")} subtitle={t("create_registry_note")}>
          <Field label={t("create_request")} hint={t("create_request_hint")}>
            <textarea rows={8} value={requestText} onChange={(event) => setRequestText(event.target.value)} />
          </Field>
          <Field label={t("create_schema")}>
            <input value={schemaText} onChange={(event) => setSchemaText(event.target.value)} />
          </Field>
          <div className="two-col-grid">
            <Field label={t("create_deadline")}>
              <input type="number" min="1" value={deadlineHours} onChange={(event) => setDeadlineHours(Number(event.target.value))} />
            </Field>
            <Field label={t("create_premium")}>
              <input type="number" min="0" step="0.001" value={premiumWlc} onChange={(event) => setPremiumWlc(event.target.value)} />
            </Field>
          </div>

          <div
            style={{
              background: "rgba(0,255,180,0.06)",
              border: "1px solid rgba(0,255,180,0.15)",
              borderRadius: 8,
              padding: "12px 16px",
              marginTop: 12,
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{t("create_premium")}</span>
              <span className="mono">{Number(ethers.formatEther(premiumWei)).toFixed(4)} WLC</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                {t("create_fee_label")} ({feePercent}%)
                {isPromo ? (
                  <span style={{ color: "#00ffb4", marginLeft: 6, fontSize: 11 }}>
                    {t("create_fee_promo")} - {phaseLabel}
                  </span>
                ) : null}
              </span>
              <span className="mono">{Number(ethers.formatEther(feeWei)).toFixed(4)} WLC</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                paddingTop: 6,
                fontWeight: 600,
              }}
            >
              <span>{t("create_total")}</span>
              <span className="mono">{Number(ethers.formatEther(totalWei)).toFixed(4)} WLC</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 8, marginBottom: 0 }}>
              {t("create_fee_note")}
            </p>
          </div>

          <Notice>{`${t("create_estimated_gas")}: ${t("create_gas_dynamic")}`}</Notice>

          {partialFailure ? (
            <Notice>
              <div style={{ display: "grid", gap: 8 }}>
                <strong>{t("create_fee_partial_warning")}</strong>
                <span>{t("create_fee_partial_retry")}</span>
                {partialFailure.feeTxHash ? (
                  <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span>{t("create_fee_tx")}:</span>
                    <TxLink hash={partialFailure.feeTxHash} />
                  </span>
                ) : null}
              </div>
            </Notice>
          ) : null}

          <div className="row-actions" style={{ marginTop: 18 }}>
            <Button onClick={handleSubmit} loading={loading}>{t("create_submit")}</Button>
            {result?.feeTxHash ? (
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <span>{t("create_fee_tx")}:</span>
                <TxLink hash={result.feeTxHash} />
              </span>
            ) : null}
            {result?.hash ? (
              <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <span>{t("create_job_tx")}:</span>
                <TxLink hash={result.hash} />
              </span>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}
