import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import {
  clearAILAuthState,
  exchangeAuthCode,
  getAILAuthState,
  storeAILCredential,
} from "../lib/ail.js"
import { LoadingState, Notice } from "../components/ui.jsx"

const AIL_POPUP_SUCCESS = "ail:oauth-complete"
const AIL_POPUP_ERROR = "ail:oauth-error"

export default function AILCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { lang } = useStore()
  const t = useT(lang)
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true

    async function finishOAuth() {
      const code = searchParams.get("code")
      const state = searchParams.get("state")
      const error = searchParams.get("error")
      const expectedState = getAILAuthState()

      if (error) {
        throw new Error(error)
      }
      if (!code) {
        throw new Error(t("agent_id_callback_missing_code"))
      }
      if (!state || !expectedState || state !== expectedState) {
        throw new Error(t("agent_id_state_mismatch"))
      }

      const credential = await exchangeAuthCode(code, { state })
      const stored = storeAILCredential(credential)
      clearAILAuthState()

      if (!active) return

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: AIL_POPUP_SUCCESS, credential: stored },
          window.location.origin,
        )
        setStatus("success")
        setMessage(t("agent_id_oauth_success"))
        window.setTimeout(() => window.close(), 250)
        return
      }

      setStatus("success")
      setMessage(t("agent_id_oauth_success"))
      window.setTimeout(() => navigate("/dashboard/agent-id", { replace: true }), 400)
    }

    finishOAuth().catch((error) => {
      clearAILAuthState()
      if (!active) return

      const nextMessage = error?.message || t("agent_id_oauth_error")
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: AIL_POPUP_ERROR, error: nextMessage },
          window.location.origin,
        )
      }
      setStatus("error")
      setMessage(nextMessage)
    })

    return () => {
      active = false
    }
  }, [navigate, searchParams, t])

  return (
    <div className="page-shell py-16">
      <div className="mx-auto max-w-2xl space-y-6 rounded-[28px] border border-primary/10 bg-white/5 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{t("agent_id_tag")}</div>
          <h1 className="mt-2 text-3xl font-black text-white">{t("agent_id_callback_title")}</h1>
        </div>

        {status === "loading" ? <LoadingState label={t("agent_id_callback_processing")} /> : null}
        {status === "success" ? <Notice>{message}</Notice> : null}
        {status === "error" ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard/agent-id"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/15 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:border-primary/30 hover:text-primary"
          >
            {t("agent_id_return_to_register")}
          </Link>
        </div>
      </div>
    </div>
  )
}
