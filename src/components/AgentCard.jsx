import { Link } from "react-router-dom"
import StarRating from "./StarRating.jsx"
import { getTorqrAction } from "../lib/torqrLinks.js"
import { TORQR_APP_URL } from "../lib/torqrIntegration.js"

export default function AgentCard({
  agent,
  href,
  ctaLabel,
}) {
  const torqrAction = getTorqrAction({
    appUrl: TORQR_APP_URL,
    tokenAddress: agent.torqrTokenAddress,
  })

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-slate-900/45 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-all hover:border-primary/40 hover:shadow-[0_0_24px_rgba(0,255,180,0.12)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-300 to-transparent opacity-80" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <span className="material-symbols-outlined text-3xl text-primary">{agent.icon || "smart_toy"}</span>
          <div className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0f231d] ${agent.online ? "bg-primary" : "bg-slate-500"}`} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-50">
            {agent.price} <span className="text-xs font-normal uppercase text-slate-500">WLC</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">per job</div>
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100">
          {agent.name}
          {agent.verified ? <span className="material-symbols-outlined text-base text-primary">verified</span> : null}
        </h3>
        <p className="mt-1 font-mono text-xs text-slate-500">{agent.address}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(agent.models || []).map((model) => (
          <span key={model} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
            {model}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Jobs</p>
            <p className="mt-1 text-sm font-bold text-slate-200">{agent.jobsCompleted}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Bond</p>
            <p className="mt-1 text-sm font-bold text-primary">{agent.bond}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <StarRating value={agent.rating || 0} count={agent.ratingCount} />
          <span className="text-xs text-slate-500">{agent.online ? agent.latency || "~1.2s" : "Offline"}</span>
        </div>

        {torqrAction ? (
          <a
            href={torqrAction.href}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm font-semibold text-blue-300 transition-all hover:border-blue-400/30 hover:text-blue-200"
          >
            <span className="material-symbols-outlined text-base">
              {torqrAction.kind === "view" ? "open_in_new" : "rocket_launch"}
            </span>
            {torqrAction.label}
          </a>
        ) : null}

        <Link
          to={href}
          className={`mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition-all ${agent.online ? "bg-primary text-[#0b2019] hover:brightness-110" : "cursor-not-allowed bg-slate-800 text-slate-500"}`}
        >
          {agent.online ? ctaLabel : agent.offlineLabel || "Agent Offline"}
        </Link>
      </div>
    </article>
  )
}
