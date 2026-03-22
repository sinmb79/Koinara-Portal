import test from "node:test"
import assert from "node:assert/strict"

import {
  findWorldlandKoinSurface,
  getWorldlandKoinSurfaces,
  WORLDLAND_KOIN_SURFACES,
} from "./tokenSurfaces.js"

test("Worldland KOIN surfaces are listed in a stable role order", () => {
  assert.deepEqual(
    getWorldlandKoinSurfaces().map((entry) => entry.id),
    ["legacy-node-v2", "portal-v3", "mission-market"],
  )
})

test("legacy node reward KOIN points to the documented v2 runtime address", () => {
  const surface = findWorldlandKoinSurface("0x7749473E36a8d6E741d9E581106E81CacAb7832a")

  assert.equal(surface?.id, "legacy-node-v2")
  assert.equal(surface?.label, "Legacy node reward KOIN (v2)")
})

test("portal v3 KOIN address is labeled separately from legacy rewards", () => {
  const surface = findWorldlandKoinSurface("0x029F7EfE08F37d987c2eDeD3de4Ba4a2b9BA422B")

  assert.equal(surface?.id, "portal-v3")
  assert.equal(surface?.label, "Portal KOIN reference (v3)")
})

test("mission market KOIN address is labeled separately from legacy rewards", () => {
  const surface = findWorldlandKoinSurface("0x1d22f43A5105C9dc540DbC9F9d94E0CA4bF0Ec08")

  assert.equal(surface?.id, "mission-market")
  assert.equal(surface?.label, "Mission / swap KOIN surface")
})

test("unknown KOIN-like addresses are not treated as known public surfaces", () => {
  assert.equal(findWorldlandKoinSurface("0xd5B93084a6C2263C52ed0C8096CB6bC235E726b5"), null)
})

test("surface objects keep the exact public addresses", () => {
  assert.deepEqual(
    WORLDLAND_KOIN_SURFACES.map((entry) => entry.address),
    [
      "0x7749473E36a8d6E741d9E581106E81CacAb7832a",
      "0x029F7EfE08F37d987c2eDeD3de4Ba4a2b9BA422B",
      "0x1d22f43A5105C9dc540DbC9F9d94E0CA4bF0Ec08",
    ],
  )
})
