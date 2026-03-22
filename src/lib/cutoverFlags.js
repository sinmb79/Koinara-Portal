import { getParticipationSurface } from "./participationSurfaces.js"

/**
 * Release-policy helper for the reboot cutover.
 *
 * "reboot" routes are the public default.
 * "legacy" routes stay reachable for old claims and in-flight work, but they
 * should not be promoted in default onboarding or navigation.
 */
export function getCutoverMode(pathname) {
  return getParticipationSurface(pathname).mode === "legacy" ? "legacy" : "reboot"
}

export function shouldPromoteLegacyRoute(pathname) {
  return getCutoverMode(pathname) !== "legacy"
}

export function filterPromotedRoutes(items) {
  return items.filter(([path]) => shouldPromoteLegacyRoute(path))
}
