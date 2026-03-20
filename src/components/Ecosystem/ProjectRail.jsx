import { Link, matchPath, useLocation } from "react-router-dom"

export const PROJECTS = [
  {
    id: "openclaw",
    title: "OpenClaw Agent Marketplace",
    short: "OC",
    accent: "from-primary/25 to-primary/5 text-primary",
    railLabel: "OpenClaw",
    summary:
      "The operating product under Koinara. Home, Dashboard, Agents, Missions, and job flow continue to live here as the market surface.",
    href: "/",
    linkLabel: "Open market",
    internal: true,
    stage: "Live flagship",
  },
  {
    id: "proova",
    title: "Proova",
    short: "PR",
    accent: "from-blue-500/25 to-blue-500/5 text-blue-300",
    railLabel: "Proova",
    summary:
      "Verification layer for mission outcomes. This test page links it as an ecosystem product even before the final in-site page is settled.",
    href: "https://github.com/sinmb79/proova",
    linkLabel: "View project",
    internal: false,
    stage: "Ready",
  },
  {
    id: "agent-id-card",
    title: "Agent ID CARD",
    short: "AI",
    accent: "from-emerald-400/20 to-emerald-400/5 text-emerald-200",
    railLabel: "Agent ID",
    summary:
      "Identity and credential layer tied to participation, mission claiming, and trust signals across the ecosystem.",
    href: "https://www.agentidcard.org/",
    linkLabel: "Visit site",
    internal: false,
    stage: "Live",
  },
  {
    id: "the-4-path",
    title: "The 4 Path",
    short: "4P",
    accent: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-200",
    railLabel: "The 4 Path",
    summary:
      "Companion product in the ecosystem map. It should feel like a branded neighbor, not a disconnected external page.",
    href: "https://the4path-deploy.vercel.app/",
    linkLabel: "Visit site",
    internal: false,
    stage: "Live",
  },
  {
    id: "name-worldland",
    title: "Name-WorldLand",
    short: "NW",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-200",
    railLabel: "NameWL",
    summary:
      "Naming surface for the Worldland-facing brand stack. This test page positions it as a direct ecosystem shortcut.",
    href: "https://name-worldland.vercel.app",
    linkLabel: "Visit site",
    internal: false,
    stage: "Live",
  },
  {
    id: "torqr",
    title: "Torqr",
    short: "TQ",
    accent: "from-amber-400/20 to-amber-400/5 text-amber-200",
    railLabel: "Torqr",
    summary:
      "In development. It stays visible in the ecosystem rail so the portfolio already looks like a growing brand family.",
    href: "#torqr",
    linkLabel: "In development",
    internal: false,
    stage: "Building",
    disabled: true,
  },
]

const OPENCLAW_PATTERNS = [
  "/",
  "/agents",
  "/agent/:address",
  "/jobs",
  "/job/:id",
  "/submit",
  "/dashboard",
  "/dashboard/*",
  "/missions",
  "/missions/:id",
  "/providers",
  "/guide",
]

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

function getActiveProjectId(pathname) {
  if (pathname === "/ecosystem" || pathname === "/tokenomics") return null

  if (
    OPENCLAW_PATTERNS.some((pattern) =>
      pattern === "/"
        ? pathname === "/"
        : Boolean(matchPath({ path: pattern, end: pattern !== "/dashboard/*" }, pathname))
    )
  ) {
    return "openclaw"
  }

  return null
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
