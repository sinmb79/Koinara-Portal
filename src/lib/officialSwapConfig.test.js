import { describe, it } from "node:test"
import assert from "node:assert/strict"

import {
  getOfficialSwapConfig,
  isCanonicalSwapNetwork,
  isSwapLive,
} from "./officialSwapConfig.js"

// ═══════════════════════════════════════════════════════════════
// getOfficialSwapConfig
// ═══════════════════════════════════════════════════════════════

describe("getOfficialSwapConfig", () => {
  it("returns worldland as the network", () => {
    assert.equal(getOfficialSwapConfig().network, "worldland")
  })

  it("pair is KOIN/WLC", () => {
    assert.equal(getOfficialSwapConfig().pair, "KOIN/WLC")
  })

  it("includes a liquidityDisclosure string", () => {
    const cfg = getOfficialSwapConfig()
    assert.ok(cfg.liquidityDisclosure.length > 0)
    assert.ok(cfg.liquidityDisclosure.includes("Bootstrap"))
  })

  it("pool and venue start empty (pre-launch)", () => {
    const cfg = getOfficialSwapConfig()
    assert.equal(cfg.poolAddress, "")
    assert.equal(cfg.venueName, "")
    assert.equal(cfg.venueUrl, "")
  })
})

// ═══════════════════════════════════════════════════════════════
// isCanonicalSwapNetwork
// ═══════════════════════════════════════════════════════════════

describe("isCanonicalSwapNetwork", () => {
  it("worldland is canonical", () => {
    assert.equal(isCanonicalSwapNetwork("worldland"), true)
  })

  it("base is NOT canonical", () => {
    assert.equal(isCanonicalSwapNetwork("base"), false)
  })

  it("empty string is NOT canonical", () => {
    assert.equal(isCanonicalSwapNetwork(""), false)
  })
})

// ═══════════════════════════════════════════════════════════════
// isSwapLive
// ═══════════════════════════════════════════════════════════════

describe("isSwapLive", () => {
  it("swap is not live when pool/venue are empty", () => {
    assert.equal(isSwapLive(), false)
  })
})
