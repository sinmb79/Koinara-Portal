export function getMainNavItems(t) {
  return [
    ["/ecosystem", "Ecosystem"],
    ["/", t("nav_home")],
    ["/dashboard", t("nav_dashboard")],
    ["/agents", t("nav_agents")],
    ["/torqr", "Torqr"],
    ["/missions", "Missions"],
    ["/tokenomics", "Tokenomics"],
    ["/dashboard/bond", t("nav_staking")],
    ["/guide", t("nav_docs")],
  ]
}

export function getSecondaryNavItems(t) {
  return [
    ["/jobs", t("nav_jobs")],
    ["/submit", t("nav_create")],
    ["/providers", t("nav_providers")],
  ]
}
