import test from "node:test"
import assert from "node:assert/strict"

import { getMainNavItems, getNavbarDesktopUtilityState, getSecondaryNavItems } from "./navigation.js"

function t(key) {
  return key
}

test("getMainNavItems includes Torqr hub in the top navigation", () => {
  const items = getMainNavItems(t)

  assert.ok(
    items.some(([href, label]) => href === "/torqr" && label === "Torqr"),
  )
})

test("getSecondaryNavItems keeps existing operational routes", () => {
  const items = getSecondaryNavItems(t)

  assert.deepEqual(items, [
    ["/jobs", "nav_jobs"],
    ["/submit", "nav_create"],
    ["/providers", "nav_providers"],
  ])
})

test("connected desktop navbar hides the compact search to prevent crowding", () => {
  assert.deepEqual(getNavbarDesktopUtilityState({ connected: true }), {
    showSearch: false,
  })

  assert.deepEqual(getNavbarDesktopUtilityState({ connected: false }), {
    showSearch: true,
  })
})
