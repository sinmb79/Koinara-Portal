export const TORQR_PAGE_MAX_WIDTH = 1520
export const TORQR_DESKTOP_RAIL_BREAKPOINT = 1280
export const TORQR_RAIL_WIDTH = 280

export function shouldShowTorqrDesktopRail(viewportWidth) {
  return Number(viewportWidth || 0) >= TORQR_DESKTOP_RAIL_BREAKPOINT
}

export function getTorqrShellGridTemplate(viewportWidth) {
  return shouldShowTorqrDesktopRail(viewportWidth)
    ? `${TORQR_RAIL_WIDTH}px minmax(0, 1fr)`
    : "1fr"
}
