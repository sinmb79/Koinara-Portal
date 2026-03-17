import { useEffect, useMemo, useState } from "react"
import { ethers } from "ethers"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { JOB_TYPE_OPTIONS } from "../lib/chain.js"
import { calcRequesterFee, getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { getAllAgents, PRICING_TIERS } from "../lib/agentCatalog.js"
import SearchBar from "../components/SearchBar.jsx"

const CREATE_JOB_DRAFT_KEY = "koinara_create_job_draft"

export default function CreateJob() {
  const { lang, address, isCorrectChain, createJob } = useStore()
  const t = useT(lang)
  const [searchParams] = useSearchParams()
  const requestedAgent = searchParams.get("agent")

  const [requestText, setRequestText] = useState("")
  const [schemaText, setSchemaText] = useState("text/plain")
  const [jobType, setJobType] = useState(1)
  const [deadlineHours, setDeadlineHours] = useState(24)
  const [premiumWlc, setPremiumWlc] = useState("0")
  const [result, setResult] = useState(null)
  const [partialFailure, setPartialFailure] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState(requestedAgent ? "hire" : "open")
  const [agentQuery, setAgentQuery] = useState("")
  const [agents, setAgents] = useState([])
  const [selectedAgentAddress, setSelectedAgentAddress] = useState(requestedAgent || "")
  const [selectedServiceId, setSelectedServiceId] = useState("")
  const [selectedTier, setSelectedTier] = useState("standard")

  useEffect(() => {
    if (requestedAgent) {
      setTab("hire")
      setSelectedAgentAddress(requestedAgent)
    }
  }, [requestedAgent])

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
      if (typeof draft.tab === "string") setTab(draft.tab)
      if (typeof draft.selectedAgentAddress === "string" && !requestedAgent) setSelectedAgentAddress(draft.selectedAgentAddress)
      if (typeof draft.selectedServiceId === "string") setSelectedServiceId(draft.selectedServiceId)
      if (typeof draft.selectedTier === "string") setSelectedTier(draft.selectedTier)
    } catch {
      // Ignore invalid draft payloads.
    }
  }, [requestedAgent])

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
        tab,
        selectedAgentAddress,
        selectedServiceId,
        selectedTier,
      }),
    )
  }, [deadlineHours, jobType, premiumWlc, requestText, schemaText, selectedAgentAddress, selectedServiceId, selectedTier, tab])

  useEffect(() => {
    let alive = true
    const load = async () => {
      const data = await getAllAgents()
      if (!alive) return
      setAgents(data)
    }
    load()
    return () => {
      alive = false
    }
  }, [])

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

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.address.toLowerCase() === String(selectedAgentAddress || "").toLowerCase()) || null,
    [agents, selectedAgentAddress],
  )

  const selectedService = useMemo(() => {
    if (!selectedAgent) return null
    return (
      selectedAgent.services.find((service) => service.id === selectedServiceId) ||
      selectedAgent.services[0] ||
      null
    )
  }, [selectedAgent, selectedServiceId])

  const filteredAgents = useMemo(() => {
    const normalized = agentQuery.trim().toLowerCase()
    if (!normalized) return agents
    return agents.filter((agent) => {
      return (
        agent.name.toLowerCase().includes(normalized) ||
        agent.address.toLowerCase().includes(normalized) ||
        (agent.models || []).some((model) => model.toLowerCase().includes(normalized))
      )
    })
  }, [agentQuery, agents])

  useEffect(() => {
    if (!selectedAgent) return
    if (!selectedServiceId || !selectedAgent.services.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(selectedAgent.services[0]?.id || "")
    }
  }, [selectedAgent, selectedServiceId])

  useEffect(() => {
    if (!selectedService) return
    const tier = selectedService.tiers?.[selectedTier]
    if (!tier?.price) return
    const normalized = String(tier.price).replace(/[^\d.]/g, "")
    if (normalized) {
      setPremiumWlc(normalized)
    }
  }, [selectedService, selectedTier])

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

      setResult({
        ...response,
        selectedAgentName: selectedAgent?.name || null,
        selectedTier,
      })
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
    <div className="page-shell space-y-10">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t("create_tag")}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              {t("create_page_title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              {t("create_page_subtitle")}
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <TabButton active={tab === "hire"} onClick={() => setTab("hire")} title={t("create_tab_hire")} body={t("create_tab_hire_body")} />
            <TabButton active={tab === "open"} onClick={() => setTab("open")} title={t("create_tab_open")} body={t("create_tab_open_body")} />
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {tab === "hire" ? (
            <section className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("create_hire_eyebrow")}</div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("create_hire_title")}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{t("create_hire_subtitle")}</p>
                </div>
                <div className="w-full max-w-xl">
                  <SearchBar
                    placeholder={t("create_select_agent")}
                    defaultValue={agentQuery}
                    onQueryChange={setAgentQuery}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {filteredAgents.slice(0, 4).map((agent) => (
                  <div
                    key={agent.address}
                    className={`rounded-2xl border p-5 transition ${
                      selectedAgent?.address === agent.address
                        ? "border-primary/40 bg-primary/5"
                        : "border-primary/10 bg-transparent hover:border-primary/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-3xl">{agent.icon || "smart_toy"}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white">{agent.name}</h3>
                            <span className={`h-2.5 w-2.5 rounded-full ${agent.online ? "bg-primary" : "bg-slate-500"}`} />
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{agent.models.join(" • ")}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{agent.bond}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{agent.price} WLC</div>
                        <div className="text-xs text-slate-500">{agent.jobsCompleted} jobs</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Link to={`/agent/${agent.address}`} className="text-sm font-semibold text-primary">
                        {t("create_view_profile")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelectedAgentAddress(agent.address)}
                        className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition ${
                          selectedAgent?.address === agent.address
                            ? "bg-primary text-[#0b2019]"
                            : "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {selectedAgent?.address === agent.address ? t("create_selected_agent") : t("create_select_this_agent")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedAgent ? (
                <div className="mt-6 space-y-4 rounded-2xl border border-primary/15 bg-[#0d1b17]/80 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("create_selected_agent")}</div>
                      <h3 className="mt-2 text-xl font-bold text-white">{selectedAgent.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{selectedAgent.models.join(" • ")}</p>
                    </div>
                    <Link to={`/agent/${selectedAgent.address}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      {t("create_view_profile")}
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                    </Link>
                  </div>

                  {selectedService ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{selectedService.name}</div>
                        <p className="mt-1 text-sm leading-7 text-slate-400">{selectedService.description}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {PRICING_TIERS.map((tier) => {
                          const value = selectedService.tiers?.[tier]
                          if (!value) return null
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => setSelectedTier(tier)}
                              className={`rounded-2xl border px-4 py-4 text-left transition ${
                                selectedTier === tier
                                  ? "border-primary bg-primary/10 text-white"
                                  : "border-white/5 bg-black/20 text-slate-300 hover:border-primary/20"
                              }`}
                            >
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t(`agent_tier_${tier}`)}</div>
                              <div className="mt-2 text-lg font-bold text-primary">{value.price}</div>
                              <div className="mt-2 text-sm text-slate-400">{value.description}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : (
            <section className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("create_open_eyebrow")}</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("create_open_title")}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">{t("create_open_subtitle")}</p>
            </section>
          )}

          <section className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("create_form_eyebrow")}</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("create_form_title")}</h2>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-300">
                {t("create_registry_note")}
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-200">{t("create_request")}</span>
                <textarea
                  rows={8}
                  value={requestText}
                  onChange={(event) => setRequestText(event.target.value)}
                  className="rounded-2xl border border-primary/10 bg-[#10261f]/90 px-4 py-3 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={tab === "hire" ? t("create_request_placeholder_hire") : t("create_request_placeholder_open")}
                />
                <span className="text-xs text-slate-500">{t("create_request_hint")}</span>
              </label>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-200">{t("create_schema")}</span>
                  <input
                    value={schemaText}
                    onChange={(event) => setSchemaText(event.target.value)}
                    className="h-12 rounded-2xl border border-primary/10 bg-[#10261f]/90 px-4 text-sm text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-200">{t("create_job_type")}</span>
                  <select
                    value={jobType}
                    onChange={(event) => setJobType(Number(event.target.value))}
                    className="h-12 rounded-2xl border border-primary/10 bg-[#10261f]/90 px-4 text-sm text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {JOB_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-200">{t("create_deadline")}</span>
                  <input
                    type="number"
                    min="1"
                    value={deadlineHours}
                    onChange={(event) => setDeadlineHours(Number(event.target.value))}
                    className="h-12 rounded-2xl border border-primary/10 bg-[#10261f]/90 px-4 text-sm text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-200">{t("create_premium")}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={premiumWlc}
                    onChange={(event) => setPremiumWlc(event.target.value)}
                    className="h-12 rounded-2xl border border-primary/10 bg-[#10261f]/90 px-4 text-sm text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-[#0d1b17]/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm leading-6 text-slate-400">
                  {address
                    ? isCorrectChain
                      ? t("create_registry_note")
                      : t("common_wrong_chain")
                    : t("common_wallet_required")}
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black uppercase tracking-[0.18em] text-[#0b2019] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? t("common_loading") : t("create_submit")}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("create_fee_eyebrow")}</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("create_fee_title")}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">{t("create_fee_note")}</p>

            <div className="mt-6 space-y-3 rounded-2xl border border-primary/10 bg-[#10261f]/80 p-5">
              <FeeRow label={t("create_premium")} value={`${Number(ethers.formatEther(premiumWei)).toFixed(4)} WLC`} />
              <FeeRow
                label={`${t("create_fee_label")} (${feePercent}%)`}
                value={`${Number(ethers.formatEther(feeWei)).toFixed(4)} WLC`}
                hint={isPromo ? `${t("create_fee_promo")} · ${phaseLabel}` : null}
              />
              <div className="border-t border-white/10 pt-3">
                <FeeRow strong label={t("create_total")} value={`${Number(ethers.formatEther(totalWei)).toFixed(4)} WLC`} />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm leading-7 text-slate-400">
              {t("create_estimated_gas")}: {t("create_gas_dynamic")}
            </div>

            {partialFailure ? (
              <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                <div className="font-semibold">{t("create_fee_partial_warning")}</div>
                <div className="mt-2">{t("create_fee_partial_retry")}</div>
                {partialFailure.feeTxHash ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span>{t("create_fee_tx")}:</span>
                    <a
                      href={`https://scan.worldland.foundation/tx/${partialFailure.feeTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-primary underline-offset-4 hover:underline"
                    >
                      {partialFailure.feeTxHash.slice(0, 10)}...
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black uppercase tracking-[0.18em] text-[#0b2019] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? t("common_loading") : t("create_submit")}
              </button>

              {result?.feeTxHash ? (
                <MetaRow label={t("create_fee_tx")} value={result.feeTxHash} href={`https://scan.worldland.foundation/tx/${result.feeTxHash}`} />
              ) : null}
              {result?.hash ? (
                <MetaRow label={t("create_job_tx")} value={result.hash} href={`https://scan.worldland.foundation/tx/${result.hash}`} />
              ) : null}
              {result?.jobId ? (
                <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-200">
                  {t("create_success_summary", {
                    id: result.jobId,
                    agent: result.selectedAgentName || t("create_open_job_label"),
                    tier: selectedTier,
                  })}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("create_flow_eyebrow")}</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{t("create_flow_title")}</h2>
            <div className="mt-5 grid gap-3">
              {[t("create_flow_step1"), t("create_flow_step2"), t("create_flow_step3"), t("create_flow_step4")].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-white/5 bg-[#0b1713]/60 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, title, body }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ? "border-primary bg-primary/10 text-white" : "border-primary/10 bg-white/5 text-slate-300 hover:border-primary/20"
      }`}
    >
      <div className="text-sm font-bold">{title}</div>
      <div className="mt-2 text-xs leading-6 text-slate-400">{body}</div>
    </button>
  )
}

function FeeRow({ label, value, hint = null, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className={`${strong ? "font-semibold text-white" : "text-slate-400"}`}>{label}</div>
        {hint ? <div className="mt-1 text-xs text-primary">{hint}</div> : null}
      </div>
      <div className={`font-mono ${strong ? "font-semibold text-white" : "text-slate-200"}`}>{value}</div>
    </div>
  )
}

function MetaRow({ label, value, href }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <a href={href} target="_blank" rel="noreferrer" className="font-mono text-primary underline-offset-4 hover:underline">
        {value.slice(0, 12)}...
      </a>
    </div>
  )
}
