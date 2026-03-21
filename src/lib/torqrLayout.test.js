import test from "node:test"
import assert from "node:assert/strict"

import {
  TORQR_DESKTOP_RAIL_BREAKPOINT,
  TORQR_PAGE_MAX_WIDTH,
  getTorqrShellGridTemplate,
  shouldShowTorqrDesktopRail,
} from "./torqrLayout.js"

test("Torqr page uses expanded max width to fit ecosystem rail and market content", () => {
  assert.equal(TORQR_PAGE_MAX_WIDTH, 1520)
})

test("Torqr shell keeps left rail on desktop widths", () => {
  assert.equal(shouldShowTorqrDesktopRail(TORQR_DESKTOP_RAIL_BREAKPOINT), true)
  assert.equal(getTorqrShellGridTemplate(TORQR_DESKTOP_RAIL_BREAKPOINT), "280px minmax(0, 1fr)")
})

test("Torqr shell stacks below the desktop rail breakpoint", () => {
  assert.equal(shouldShowTorqrDesktopRail(TORQR_DESKTOP_RAIL_BREAKPOINT - 1), false)
  assert.equal(getTorqrShellGridTemplate(TORQR_DESKTOP_RAIL_BREAKPOINT - 1), "1fr")
})
