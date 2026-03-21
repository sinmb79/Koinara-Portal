import test from "node:test"
import assert from "node:assert/strict"

import { PROJECTS, getActiveProjectId } from "./ecosystemProjects.js"

test("ecosystem rail exposes a direct Koinara home destination", () => {
  const home = PROJECTS.find((item) => item.id === "ecosystem")

  assert.ok(home)
  assert.equal(home.internal, true)
  assert.equal(home.href, "/ecosystem")
})

test("Torqr project is now an active internal ecosystem destination", () => {
  const torqr = PROJECTS.find((item) => item.id === "torqr")

  assert.ok(torqr)
  assert.equal(torqr.internal, true)
  assert.equal(torqr.href, "/torqr")
  assert.equal(torqr.disabled, undefined)
})

test("getActiveProjectId highlights Torqr hub route", () => {
  assert.equal(getActiveProjectId("/torqr"), "torqr")
})

test("getActiveProjectId highlights ecosystem home route", () => {
  assert.equal(getActiveProjectId("/ecosystem"), "ecosystem")
})

test("getActiveProjectId keeps OpenClaw routes mapped to flagship", () => {
  assert.equal(getActiveProjectId("/agents"), "openclaw")
})
