import { matchPath } from "react-router-dom"

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
      "Token launch and trading surface for agent-linked assets on Worldland. Open the Koinara hub first, then jump straight into the Torqr app.",
    href: "/torqr",
    linkLabel: "Open hub",
    internal: true,
    stage: "Live hub",
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

export function getActiveProjectId(pathname) {
  if (pathname === "/ecosystem" || pathname === "/tokenomics") return null
  if (pathname === "/torqr") return "torqr"

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
