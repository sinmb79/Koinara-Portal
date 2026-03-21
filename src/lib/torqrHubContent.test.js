import test from "node:test"
import assert from "node:assert/strict"

import { TORQR_HUB_COPY } from "./torqrHubContent.js"

test("Torqr hub copy reflects the prepared launchpad experience", () => {
  assert.equal(TORQR_HUB_COPY.gateTitle, "Restricted Jurisdictions")
  assert.equal(TORQR_HUB_COPY.createButton, "Create Token")
  assert.equal(TORQR_HUB_COPY.connectWallet, "Connect Wallet")
})
