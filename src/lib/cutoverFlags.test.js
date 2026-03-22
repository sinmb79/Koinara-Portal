import test from "node:test"
import assert from "node:assert/strict"

import { filterPromotedRoutes, getCutoverMode, shouldPromoteLegacyRoute } from "./cutoverFlags.js"

test("missions stay on the reboot path after cutover", () => {
  assert.equal(getCutoverMode("/missions"), "reboot")
})

test("legacy node register route is never promoted by default", () => {
  assert.equal(shouldPromoteLegacyRoute("/dashboard/register"), false)
})

test("providers remain legacy after the cutover", () => {
  assert.equal(getCutoverMode("/providers"), "legacy")
  assert.equal(shouldPromoteLegacyRoute("/providers"), false)
})

test("filterPromotedRoutes removes legacy routes but preserves reboot routes", () => {
  assert.deepEqual(
    filterPromotedRoutes([
      ["/missions", "Missions"],
      ["/dashboard/register", "Register"],
      ["/providers", "Providers"],
      ["/guide", "Docs"],
    ]),
    [
      ["/missions", "Missions"],
      ["/guide", "Docs"],
    ],
  )
})
