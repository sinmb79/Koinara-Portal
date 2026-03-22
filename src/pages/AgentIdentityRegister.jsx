import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import {
  AIL_BADGE_SCRIPT_URL,
  AIL_WIDGET_SCRIPT_URL,
  clearAILAuthState,
  createAILAuthState,
  getAgentProfileUrl,
  getStoredAILCredential,
  loadAILExternalScript,
  openAILVerificationPopup,
  saveAILAuthState,
  storeAILCredential,
} from "../lib/ail.js"
import {
  extractAILIdentity,
  normalizeIdentityBinding,
  validateOwnerWalletMatch,
} from "../lib/agentIdentity.js"
import { Button, Notice, StatusPill } from "../components/ui.jsx"
import { shortAddress } from "../lib/chain.js"

const AIL_POPUP_SUCCESS = "ail:oauth-complete"
const AIL_POPUP_ERROR = "ail:oauth-error"

function shortHash(value, head = 10, tail = 8) {
  if (!value) return "-"
  const text = String(value)
  if (text.length <= head + tail) return text
  return `${text.slice(0, head)}...${text.slice(-tail)}`
}

export default function AgentIdentityRegister() {
  const {
    address,
    lang,
    agentIdentity,
    loadAgentIdentity,
    lookupAgentIdentityOwner,
    registerAgentIdentity,
    requestAgentIdentityRelink,
  } = useStore()
  const t = useT(lang)

  const [metadataURI, setMetadataURI] = useState("")
  const [credential, setCredential] = useState(null)
  const [existingOwner, setExistingOwner] = useState(null)
  const [relinkOwner, setRelinkOwner] = useState("")
  const [busyAction, setBusyAction] = useState("")
  const [message, setMessage] = useState("")
  const [messageTone, setMessageTone] = useState("info")
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [scriptError, setScriptError] = useState(false)

  useEffect(() => {
    if (!address) {
      setCredential(null)
      setExistingOwner(null)
      return
    }

    void loadAgentIdentity()

    const saved = getStoredAILCredential()
    if (saved) {
      setCredential(saved)
    }
  }, [address, loadAgentIdentity])

  useEffect(() => {
    let active = true

    Promise.all([
      loadAILExternalScript(AIL_WIDGET_SCRIPT_URL, { id: "ail-widget-script" }),
      loadAILExternalScript(AIL_BADGE_SCRIPT_URL, { id: "ail-badge-script" }),
    ])
      .then(() => {
        if (!active) return
        setScriptsLoaded(true)
      })
      .catch(() => {
        if (!active) return
        setScriptError(true)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return
      if (!event.data || typeof event.data !== "object") return

      if (event.data.type === AIL_POPUP_SUCCESS && event.data.credential) {
        const nextCredential = storeAILCredential(event.data.credential)
        setCredential(nextCredential)
        setMessageTone("success")
        setMessage(t("agent_id_oauth_success"))
      }

      if (event.data.type === AIL_POPUP_ERROR) {
        setMessageTone("error")
        setMessage(event.data.error || t("agent_id_oauth_error"))
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [t])

  const identity = useMemo(() => extractAILIdentity(credential), [credential])

  const binding = useMemo(() => {
    if (!identity || !address) return null
    try {
      return normalizeIdentityBinding({
        credential: identity,
        ownerWallet: address,
        metadataURI,
      })
    } catch {
      return null
    }
  }, [address, identity, metadataURI])

  const ownerMatch = useMemo(() => {
    if (!binding || !address) {
      return {
        valid: false,
        reason: t("agent_id_wallet_mismatch"),
      }
    }
    return validateOwnerWalletMatch(address, binding.ownerWallet)
  }, [address, binding, t])

  useEffect(() => {
    let alive = true

    async function resolveExistingOwner() {
      if (!binding?.identityRef) {
        setExistingOwner(null)
        return
      }

      try {
        const owner = await lookupAgentIdentityOwner(binding.identityRef)
        if (!alive) return
        setExistingOwner(owner)
      } catch {
        if (!alive) return
        setExistingOwner(null)
      }
    }

    void resolveExistingOwner()
    return () => {
      alive = false
    }
  }, [binding?.identityRef, lookupAgentIdentityOwner])

  async function withAction(actionKey, fn) {
    setBusyAction(actionKey)
    setMessage("")
    try {
      await fn()
    } catch (error) {
      setMessageTone("error")
      setMessage(error?.message || t("agent_register_error"))
    } finally {
      setBusyAction("")
    }
  }

  function setSuccess(nextMessage) {
    setMessageTone("success")
    setMessage(nextMessage)
  }

  async function handleStartVerification() {
    await withAction("open-oauth", async () => {
      if (!address) {
        throw new Error(t("common_wallet_required"))
      }

      const state = createAILAuthState()
      saveAILAuthState(state)

      try {
        openAILVerificationPopup({ state })
      } catch {
        clearAILAuthState()
        throw new Error(t("agent_id_popup_blocked"))
      }

      setSuccess(t("agent_id_popup_opened"))
    })
  }

  async function handleBindIdentity() {
    await withAction("bind-identity", async () => {
      if (!binding) {
        throw new Error(t("agent_id_identity_missing"))
      }
      if (!ownerMatch.valid) {
        throw new Error(ownerMatch.reason || t("agent_id_wallet_mismatch"))
      }
      if (existingOwner && existingOwner.toLowerCase() !== address?.toLowerCase()) {
        throw new Error(t("agent_id_claimed_elsewhere"))
      }

      await registerAgentIdentity({
        identityRef: binding.identityRef,
        metadataURI: binding.metadataURI,
      })
      await loadAgentIdentity()
      setSuccess(t("agent_id_registered_body"))
    })
  }

  async function handleRequestRelink() {
    await withAction("request-relink", async () => {
      await requestAgentIdentityRelink(relinkOwner.trim())
      await loadAgentIdentity()
      setSuccess(t("agent_id_relink_requested"))
    })
  }

  const registryUnavailable = !agentIdentity.available
  const alreadyBoundElsewhere = Boolean(existingOwner && existingOwner.toLowerCase() !== address?.toLowerCase())
  const alreadyBoundHere = Boolean(existingOwner && existingOwner.toLowerCase() === address?.toLowerCase())
  const canBindIdentity =
    Boolean(binding && address && agentIdentity.available) &&
    !alreadyBoundElsewhere &&
    !alreadyBoundHere &&
    !agentIdentity.registered

  const statusLabel = agentIdentity.registered
    ? t("agent_id_status_verified")
    : binding
      ? alreadyBoundElsewhere
        ? t("agent_id_status_pending")
        : t("agent_id_status_ready")
      : agentIdentity.pendingOwner
        ? t("agent_id_status_pending")
        : t("agent_id_status_unlinked")

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("agent_id_tag")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("agent_id_title")}</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-300">{t("agent_id_subtitle")}</p>
        <div className="mt-6">
          <Notice>{t("agent_id_cost_note")}</Notice>
        </div>
      </section>

      {!address ? <Notice>{t("agent_id_connect_wallet_notice")}</Notice> : null}
      {registryUnavailable ? <Notice>{t("agent_id_unavailable")}</Notice> : null}
      {scriptError ? <Notice>{t("agent_id_widget_unavailable")}</Notice> : null}
      {message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${
          messageTone === "success"
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-rose-400/20 bg-rose-400/10 text-rose-200"
        }`}>
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-6">
          <StepCard
            step="01"
            title={t("agent_id_verify_with_card")}
            subtitle={t("agent_id_step_auth_body")}
            status={identity ? t("agent_id_status_verified") : t("agent_id_status_unlinked")}
            tone={identity ? "success" : "dim"}
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                loading={busyAction === "open-oauth"}
                disabled={!address}
                onClick={handleStartVerification}
              >
                {t("agent_id_verify_with_card")}
              </Button>
              {scriptsLoaded ? <StatusPill tone="success">{t("agent_id_widget_ready")}</StatusPill> : null}
              {identity ? (
                <a
                  href={getAgentProfileUrl(identity.ail_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/15 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:border-primary/30 hover:text-primary"
                >
                  {t("agent_id_open_profile")}
                </a>
              ) : null}
            </div>
          </StepCard>

          <StepCard
            step="02"
            title={t("agent_id_identity_ready")}
            subtitle={t("agent_id_step_prepare_body")}
            status={binding ? t("agent_id_status_ready") : t("agent_id_status_unlinked")}
            tone={binding ? "info" : "dim"}
          >
            {identity ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/10 bg-[#10261f]/90 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("agent_id_profile_badge")}</div>
                      <div className="mt-2 text-2xl font-black text-white">{identity.display_name}</div>
                      <div className="mt-2 text-sm text-slate-400">
                        {identity.ail_id}
                        {identity.role ? ` · ${identity.role}` : ""}
                        {identity.owner_org ? ` · ${identity.owner_org}` : ""}
                      </div>
                    </div>
                    <div className="min-h-[48px] min-w-[220px] rounded-xl border border-white/5 bg-black/10 p-3">
                      <div data-ail-id={identity.ail_id} data-ail-badge className="ail-badge" />
                    </div>
                  </div>
                </div>
                <StatusPill tone="success">{t("agent_id_verification_saved")}</StatusPill>
              </div>
            ) : (
              <Notice>{t("agent_id_identity_missing")}</Notice>
            )}
          </StepCard>

          <StepCard
            step="03"
            title={t("agent_id_register")}
            subtitle={t("agent_id_step_bind_body")}
            status={agentIdentity.registered || alreadyBoundHere ? t("agent_id_status_verified") : t("agent_id_status_unlinked")}
            tone={agentIdentity.registered || alreadyBoundHere ? "success" : "dim"}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("agent_id_metadata_uri")}</span>
              <input
                value={metadataURI}
                onChange={(event) => setMetadataURI(event.target.value)}
                className="h-11 w-full rounded-xl border border-primary/10 bg-[#10261f]/90 px-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="ipfs://..."
              />
            </label>

            {alreadyBoundElsewhere ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {t("agent_id_claimed_elsewhere")}
              </div>
            ) : null}

            {alreadyBoundHere || agentIdentity.registered ? (
              <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {t("agent_id_registered_body")}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                loading={busyAction === "bind-identity"}
                disabled={!canBindIdentity}
                onClick={handleBindIdentity}
              >
                {t("agent_id_register")}
              </Button>
              <Link
                to="/dashboard/agent-service"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/15 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:border-primary/30 hover:text-primary"
              >
                {t("agent_id_continue_to_service")}
              </Link>
            </div>
          </StepCard>
        </section>

        <aside className="space-y-6">
          <SummaryCard title={t("agent_id_summary_title")}>
            <SummaryRow label={t("agent_id_status_label")} value={statusLabel} />
            <SummaryRow label={t("agent_id_owner_wallet_label")} value={address ? shortAddress(address, 8, 6) : "-"} mono />
            <SummaryRow label={t("agent_id_identity_ref_label")} value={binding ? shortHash(binding.identityRef) : "-"} mono />
            <SummaryRow label={t("agent_id_existing_owner_label")} value={existingOwner ? shortAddress(existingOwner, 8, 6) : "-"} mono />
            <SummaryRow label={t("agent_id_metadata_uri")} value={binding?.metadataURI || agentIdentity.metadataURI || "-"} />
          </SummaryCard>

          <SummaryCard title={t("agent_id_registered_title")}>
            <p className="text-sm leading-7 text-slate-300">
              {agentIdentity.registered || alreadyBoundHere ? t("agent_id_registered_body") : t("agent_id_identity_ready")}
            </p>
            {agentIdentity.pendingOwner ? (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {t("agent_id_pending_notice", { owner: shortAddress(agentIdentity.pendingOwner, 8, 6) })}
              </div>
            ) : null}
          </SummaryCard>

          <SummaryCard title={t("agent_id_relink_title")}>
            <p className="text-sm leading-7 text-slate-400">{t("agent_id_relink_placeholder")}</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("agent_id_relink_new_owner")}</span>
                <input
                  value={relinkOwner}
                  onChange={(event) => setRelinkOwner(event.target.value)}
                  className="h-11 w-full rounded-xl border border-primary/10 bg-[#10261f]/90 px-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="0x..."
                />
              </label>
              <Button
                variant="ghost"
                loading={busyAction === "request-relink"}
                disabled={!agentIdentity.registered || !relinkOwner.trim()}
                onClick={handleRequestRelink}
              >
                {t("agent_id_relink_request")}
              </Button>
            </div>
          </SummaryCard>
        </aside>
      </div>
    </div>
  )
}

function StepCard({ step, title, subtitle, status, tone = "dim", children }) {
  return (
    <section className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{step}</div>
          <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">{subtitle}</p>
        </div>
        <StatusPill tone={tone}>{status}</StatusPill>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function SummaryCard({ title, children }) {
  return (
    <section className="rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#10261f]/70 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className={`mt-2 text-sm text-slate-100 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  )
}
