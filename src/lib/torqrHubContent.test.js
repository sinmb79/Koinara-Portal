import test from "node:test"
import assert from "node:assert/strict"

import { TORQR_GUIDE_SECTIONS, TORQR_HUB_COPY } from "./torqrHubContent.js"

test("Torqr hub copy reflects the prepared launchpad experience", () => {
  assert.equal(TORQR_HUB_COPY.gateTitle, "Restricted Jurisdictions")
  assert.equal(TORQR_HUB_COPY.createButton, "Create Token")
  assert.equal(TORQR_HUB_COPY.connectWallet, "Connect Wallet")
})

test("Torqr guide content explains fees, bonding, and AMM behavior", () => {
  assert.equal(TORQR_HUB_COPY.guideButton, "Guide")
  assert.ok(TORQR_GUIDE_SECTIONS.some((section) => section.title === "Core Fees"))
  assert.ok(TORQR_GUIDE_SECTIONS.some((section) => section.body.includes("1 WLC creation fee")))
  assert.ok(TORQR_GUIDE_SECTIONS.some((section) => section.body.includes("1% trading fee")))
  assert.ok(TORQR_GUIDE_SECTIONS.some((section) => section.body.includes("10 WLC reserve")))
  assert.ok(TORQR_GUIDE_SECTIONS.some((section) => section.body.includes("80%")))
  assert.ok(TORQR_GUIDE_SECTIONS.some((section) => section.body.includes("20% creator allocation")))
})
