import { isLegacyParticipationRoute } from "./participationSurfaces.js"
import { filterPromotedRoutes } from "./cutoverFlags.js"

/**
 * Each nav item is [path, label, { legacy?: boolean }].
 * The third element is optional metadata consumed by Navbar for badge rendering.
 */
function decorateNavItems(items) {
  return items.map(([path, label, meta]) => [
    path,
    label,
    { ...meta, legacy: isLegacyParticipationRoute(path) },
  ])
}

export function getMainNavItems(t, { includeLegacy = false } = {}) {
  const items = decorateNavItems([
    ["/ecosystem", "Ecosystem"],
    ["/", t("nav_home")],
    ["/dashboard", t("nav_dashboard")],
    ["/dashboard/agent-id", t("nav_agent_id_card")],
    ["/agents", t("nav_agents")],
    ["/torqr", "Torqr"],
    ["/missions", "Missions"],
    ["/tokenomics", "Tokenomics"],
    ["/swap", "Swap"],
    ["/dashboard/bond", t("nav_staking")],
    ["/guide", t("nav_docs")],
  ])

  return includeLegacy ? items : filterPromotedRoutes(items)
}

export function getNavbarDesktopUtilityState({ connected = false } = {}) {
  return {
    showSearch: !connected,
  }
}

export function getSecondaryNavItems(t, { includeLegacy = false } = {}) {
  const items = decorateNavItems([
    ["/jobs", t("nav_jobs")],
    ["/submit", t("nav_create")],
    ["/providers", t("nav_providers")],
  ])

  return includeLegacy ? items : filterPromotedRoutes(items)
}
