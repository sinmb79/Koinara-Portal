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

test("getMainNavItems exposes the Agent ID CARD route with default participation metadata", () => {
  const items = getMainNavItems(t)

  assert.ok(
    items.some(
      ([href, label, meta]) =>
        href === "/dashboard/agent-id" &&
        label === "nav_agent_id_card" &&
        meta?.legacy === false,
    ),
  )
})

test("getSecondaryNavItems keeps existing operational routes", () => {
  const items = getSecondaryNavItems(t)

  assert.deepEqual(items, [
    ["/jobs", "nav_jobs", { legacy: false }],
    ["/submit", "nav_create", { legacy: false }],
  ])
})

test("default navigation does not promote legacy routes", () => {
  const mainItems = getMainNavItems(t)
  const secondaryItems = getSecondaryNavItems(t)

  assert.equal(mainItems.some(([href]) => href === "/dashboard/bond"), false)
  assert.equal(secondaryItems.some(([href]) => href === "/providers"), false)
})

test("legacy routes remain available when explicitly requested", () => {
  const mainItems = getMainNavItems(t, { includeLegacy: true })
  const secondaryItems = getSecondaryNavItems(t, { includeLegacy: true })

  assert.ok(mainItems.some(([href, , meta]) => href === "/dashboard/bond" && meta?.legacy === true))
  assert.ok(secondaryItems.some(([href, , meta]) => href === "/providers" && meta?.legacy === true))
})

test("connected desktop navbar hides the compact search to prevent crowding", () => {
  assert.deepEqual(getNavbarDesktopUtilityState({ connected: true }), {
    showSearch: false,
  })

  assert.deepEqual(getNavbarDesktopUtilityState({ connected: false }), {
    showSearch: true,
  })
})
