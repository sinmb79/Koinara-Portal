import test from "node:test"
import assert from "node:assert/strict"

import { PROJECTS, getActiveProjectId } from "./ecosystemProjects.js"

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

test("getActiveProjectId keeps OpenClaw routes mapped to flagship", () => {
  assert.equal(getActiveProjectId("/agents"), "openclaw")
})
