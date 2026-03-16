import clsx from "clsx"

export default function StatsCounter({ icon, label, value, trend, tone = "positive", footnote }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-primary">
          {icon}
        </span>
        {trend ? (
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              tone === "positive"
                ? "bg-emerald-400/10 text-emerald-300"
                : tone === "negative"
                  ? "bg-rose-400/10 text-rose-300"
                  : "bg-white/10 text-slate-300",
            )}
          >
            {trend}
          </span>
        ) : null}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-100">{value}</p>
      {footnote ? <p className="mt-2 text-sm text-slate-400">{footnote}</p> : null}
    </div>
  )
}
