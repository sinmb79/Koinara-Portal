import test from "node:test"
import assert from "node:assert/strict"

import { getMainNavItems, getSecondaryNavItems } from "./navigation.js"

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
