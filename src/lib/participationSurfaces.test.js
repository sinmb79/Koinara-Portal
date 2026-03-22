import test from "node:test"
import assert from "node:assert/strict"
import { getParticipationSurface, isLegacyParticipationRoute } from "./participationSurfaces.js"

// --- Legacy routes ---

test("node registration route is legacy participation", () => {
  assert.equal(isLegacyParticipationRoute("/dashboard/register"), true)
})

test("bond route is legacy participation", () => {
  assert.equal(isLegacyParticipationRoute("/dashboard/bond"), true)
})

test("rewards route is legacy participation", () => {
  assert.equal(isLegacyParticipationRoute("/dashboard/rewards"), true)
})

test("providers route is legacy participation", () => {
  assert.equal(isLegacyParticipationRoute("/providers"), true)
})

test("legacy route returns badge and docsTrack", () => {
  const surface = getParticipationSurface("/dashboard/register")
  assert.equal(surface.mode, "legacy")
  assert.equal(surface.badge, "Legacy")
  assert.equal(surface.docsTrack, "legacy-node-guide")
})

// --- Default (wallet-first) routes ---

test("missions route stays in the default wallet-first path", () => {
  assert.equal(getParticipationSurface("/missions").mode, "default")
})

test("home route is default", () => {
  assert.equal(getParticipationSurface("/").mode, "default")
})

test("ecosystem route is default", () => {
  assert.equal(getParticipationSurface("/ecosystem").mode, "default")
})

test("agents route is default", () => {
  assert.equal(getParticipationSurface("/agents").mode, "default")
})

test("dashboard root is default", () => {
  assert.equal(getParticipationSurface("/dashboard").mode, "default")
})

test("guide route is default", () => {
  assert.equal(getParticipationSurface("/guide").mode, "default")
})

test("default route returns null badge", () => {
  const surface = getParticipationSurface("/missions")
  assert.equal(surface.badge, null)
  assert.equal(surface.docsTrack, "getting-started")
})

// --- Trailing slash normalization ---

test("trailing slash is ignored", () => {
  assert.equal(isLegacyParticipationRoute("/dashboard/register/"), true)
  assert.equal(isLegacyParticipationRoute("/missions/"), false)
})
