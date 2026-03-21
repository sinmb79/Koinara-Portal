import { Link, useLocation } from "react-router-dom"
import { PROJECTS, getActiveProjectId } from "../../lib/ecosystemProjects.js"

export function ActionLink({ item, className, children }) {
  if (item.disabled) {
    return (
      <span className={`${className} cursor-default border-amber-400/15 bg-amber-400/10 text-amber-200`}>
        {children}
      </span>
    )
  }

  if (item.internal) {
    return (
      <Link className={className} to={item.href}>
        {children}
      </Link>
    )
  }

  return (
    <a className={className} href={item.href} rel="noreferrer" target="_blank">
      {children}
    </a>
  )
}

export default function ProjectRail() {
  const { pathname } = useLocation()
  const activeProjectId = getActiveProjectId(pathname)

  return (
    <aside className="ecosystem-project-rail xl:sticky xl:top-[108px] xl:self-start">
      <div className="rounded-[28px] border border-primary/10 bg-[linear-gradient(180deg,rgba(9,17,29,0.98),rgba(7,11,20,0.96))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="px-2 pb-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">Koinara Ecosystem</div>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            A quick-launch rail for products that belong under the Koinara umbrella.
          </p>
        </div>

        <div className="mt-2 grid gap-2 max-xl:grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1">
          {PROJECTS.map((item) => {
            const isActive = activeProjectId === item.id
            const railItemClass = `group flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
              isActive
                ? "border-primary/30 bg-primary/[0.08]"
                : "border-white/6 bg-white/[0.03] hover:border-primary/25 hover:bg-primary/[0.05]"
            }`
            const labelClass = `truncate text-sm font-bold ${isActive ? "text-primary" : "text-white group-hover:text-primary"}`

            const content = (
              <>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/6 bg-gradient-to-br ${item.accent} font-black tracking-wide`}
                >
                  {item.short}
                </div>
                <div className="min-w-0">
                  <div className={labelClass}>{item.railLabel}</div>
                  <div className="truncate text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.stage}</div>
                </div>
              </>
            )

            if (item.disabled) {
              return (
                <span key={item.id} className={railItemClass}>
                  {content}
                </span>
              )
            }

            if (item.internal) {
              return (
                <Link key={item.id} to={item.href} className={railItemClass}>
                  {content}
                </Link>
              )
            }

            return (
              <a key={item.id} href={item.href} rel="noreferrer" target="_blank" className={railItemClass}>
                {content}
              </a>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
