import { ActionLink } from "../components/Ecosystem/ProjectRail.jsx"
import { PROJECTS } from "../lib/ecosystemProjects.js"

const NETWORKS = [
  { label: "Worldland", tone: "border-primary/20 bg-primary/10 text-primary" },
  { label: "Base", tone: "border-blue-500/20 bg-blue-500/10 text-blue-300" },
]

export default function EcosystemHome() {
  const flagship = PROJECTS[0]

  return (
    <div className="space-y-6">
      <section
        id="ecosystem-top"
        className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.10),transparent_35%),linear-gradient(180deg,rgba(11,34,28,0.94),rgba(8,14,13,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-8"
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Ecosystem Home
              </span>
              {NETWORKS.map((network) => (
                <span key={network.label} className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${network.tone}`}>
                  {network.label}
                </span>
              ))}
            </div>

            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Koinara Ecosystem
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              This sits above OpenClaw Agent Marketplace. The marketplace keeps its own Home, Dashboard, Agents, and Missions flow, while this page
              becomes the ecosystem entry that explains the wider product family.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink
                item={flagship}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-[#092018] transition hover:brightness-110"
              >
                Open OpenClaw
              </ActionLink>
              <a
                href="#proova"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-primary/25 hover:text-primary"
              >
                Jump to products
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#0d151a]/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">Flagship Surface</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{flagship.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">{flagship.summary}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Home", "Keep existing marketplace home"],
                ["Dashboard", "Wallet and operator actions stay inside OpenClaw"],
                ["Agents", "Discovery and hiring remain untouched"],
                ["Missions", "Mission Board remains the live operating flow"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {PROJECTS.map((item) => (
          <article
            key={item.id}
            id={item.id}
            className="rounded-[28px] border border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)),rgba(10,15,24,0.92)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] scroll-mt-28"
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/8 bg-gradient-to-br ${item.accent} text-lg font-black tracking-wide`}
              >
                {item.short}
              </div>
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {item.stage}
              </span>
            </div>

            <h3 className="mt-5 text-2xl font-black tracking-tight text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{item.summary}</p>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/6 pt-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {item.internal ? "Inside OpenClaw" : item.disabled ? "Coming soon" : "External launch"}
              </div>
              <ActionLink
                item={item}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/15"
              >
                {item.linkLabel}
              </ActionLink>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
