import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const dashboardSource = fs.readFileSync(new URL("../pages/Dashboard.jsx", import.meta.url), "utf8")
const rewardsSource = fs.readFileSync(new URL("../pages/Rewards.jsx", import.meta.url), "utf8")
const indexCssSource = fs.readFileSync(new URL("../index.css", import.meta.url), "utf8")

test("dashboard overview uses a dedicated shell-aware layout class", () => {
  assert.equal(dashboardSource.includes("dashboard-overview-layout"), true)
  assert.equal(dashboardSource.includes("dashboard-overview-aside"), true)
})

test("rewards history uses a dedicated shell-aware layout class", () => {
  assert.equal(rewardsSource.includes("rewards-history-layout"), true)
})

test("index.css defines the shell-aware layout breakpoints", () => {
  assert.equal(indexCssSource.includes(".dashboard-overview-layout"), true)
  assert.equal(indexCssSource.includes(".dashboard-overview-aside"), true)
  assert.equal(indexCssSource.includes(".rewards-history-layout"), true)
})
