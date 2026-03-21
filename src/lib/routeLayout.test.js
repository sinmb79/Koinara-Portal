import test from "node:test"
import assert from "node:assert/strict"

import { isStandaloneRoute } from "./routeLayout.js"

test("Torqr route uses standalone layout", () => {
  assert.equal(isStandaloneRoute("/torqr"), true)
})

test("Marketplace routes keep the shared Koinara shell", () => {
  assert.equal(isStandaloneRoute("/agents"), false)
})
