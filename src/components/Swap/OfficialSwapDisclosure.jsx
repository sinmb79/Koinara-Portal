import { assembleDisclosure } from "../../lib/officialSwap.js"
import { StatusPill } from "../ui.jsx"

export default function OfficialSwapDisclosure({ lang = "en" }) {
  const disclosure = assembleDisclosure(lang)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {lang === "ko" ? "\ud480 \uc8fc\uc18c" : "Pool Address"}
        </div>
        <div className="mt-1 font-mono text-sm text-slate-300">
          {disclosure.poolExplorerUrl ? (
            <a
              href={disclosure.poolExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-primary"
            >
              {disclosure.poolAddress}
            </a>
          ) : (
            <span className="text-slate-500">{disclosure.poolAddress}</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {lang === "ko" ? "\uac70\ub798\uc18c / \ub77c\uc6b0\ud130" : "Venue / Router"}
        </div>
        <div className="mt-1 text-sm text-slate-300">
          {disclosure.venueUrl ? (
            <a href={disclosure.venueUrl} target="_blank" rel="noreferrer" className="transition hover:text-primary">
              {disclosure.venue}
            </a>
          ) : (
            <span className="text-slate-500">{disclosure.venue}</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4">
        <div className="flex items-center gap-2">
          <StatusPill tone="warn">
            {lang === "ko" ? "\ubd80\ud2b8\uc2a4\ud2b8\ub7a9 \uc720\ub3d9\uc131" : "Bootstrap Liquidity"}
          </StatusPill>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-amber-100/80">{disclosure.liquidityWarning}</p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {lang === "ko" ? "\uacf5\uc2dd \uc790\uc0b0" : "Canonical Asset"}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{disclosure.canonicalNote}</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4">
        <p className="text-[11px] leading-relaxed text-slate-500">{disclosure.complianceNote}</p>
      </div>
    </div>
  )
}
