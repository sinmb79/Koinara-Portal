/**
 * Participation surface policy for the wallet-first reboot.
 *
 * Every portal route is classified as either "default" (wallet-first) or
 * "legacy" (node/bond/operator).  Legacy routes stay reachable but are no
 * longer presented as the normal join path.
 */

const LEGACY_ROUTES = [
  "/dashboard/register",
  "/dashboard/bond",
  "/dashboard/rewards",
  "/providers",
]

const LEGACY_PREFIX = [
  "/dashboard/register",
  "/dashboard/bond",
]

/**
 * @param {string} pathname
 * @returns {{ mode: "default" | "legacy", badge: string | null, docsTrack: string }}
 */
export function getParticipationSurface(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/"

  const isLegacy =
    LEGACY_ROUTES.includes(normalized) ||
    LEGACY_PREFIX.some((prefix) => normalized.startsWith(prefix + "/"))

  if (isLegacy) {
    return {
      mode: "legacy",
      badge: "Legacy",
      docsTrack: "legacy-node-guide",
    }
  }

  return {
    mode: "default",
    badge: null,
    docsTrack: "getting-started",
  }
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isLegacyParticipationRoute(pathname) {
  return getParticipationSurface(pathname).mode === "legacy"
}
