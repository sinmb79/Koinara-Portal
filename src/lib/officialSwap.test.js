import { describe, it } from "node:test"
import assert from "node:assert/strict"

import {
  assembleDisclosure,
  checkForbiddenFraming,
  getDirectionAssets,
  getDirectionLabel,
  getSwapReadiness,
  validateSwapNetwork,
} from "./officialSwap.js"

describe("getDirectionLabel", () => {
  it("returns BUY direction label", () => {
    assert.equal(getDirectionLabel("BUY"), "WLC \u2192 KOIN")
  })

  it("returns SELL direction label", () => {
    assert.equal(getDirectionLabel("SELL"), "KOIN \u2192 WLC")
  })

  it("uses the same arrow label for Korean", () => {
    assert.equal(getDirectionLabel("BUY", "ko"), "WLC \u2192 KOIN")
    assert.equal(getDirectionLabel("SELL", "ko"), "KOIN \u2192 WLC")
  })

  it("defaults unknown directions to BUY", () => {
    assert.equal(getDirectionLabel("INVALID"), "WLC \u2192 KOIN")
  })
})

describe("getDirectionAssets", () => {
  it("maps BUY from WLC to KOIN", () => {
    assert.deepEqual(getDirectionAssets("BUY"), { from: "WLC", to: "KOIN" })
  })

  it("maps SELL from KOIN to WLC", () => {
    assert.deepEqual(getDirectionAssets("SELL"), { from: "KOIN", to: "WLC" })
  })
})

describe("validateSwapNetwork", () => {
  it("accepts worldland", () => {
    assert.deepEqual(validateSwapNetwork("worldland"), { ok: true, message: "" })
  })

  it("rejects base", () => {
    const result = validateSwapNetwork("base")
    assert.equal(result.ok, false)
    assert.ok(result.message.includes("Worldland"))
  })

  it("rejects empty network", () => {
    assert.equal(validateSwapNetwork("").ok, false)
  })

  it("rejects null network", () => {
    assert.equal(validateSwapNetwork(null).ok, false)
  })
})

describe("getSwapReadiness", () => {
  it("stays not live until pool and venue are configured", () => {
    assert.deepEqual(getSwapReadiness({ connected: true, network: "worldland" }), {
      ready: false,
      reason: "not_live",
    })
  })

  it("does not claim readiness for disconnected wallets", () => {
    const result = getSwapReadiness({ connected: false, network: "" })
    assert.equal(result.ready, false)
    assert.ok(["not_live", "disconnected"].includes(result.reason))
  })
})

describe("assembleDisclosure", () => {
  it("includes required English disclosure fields", () => {
    const disclosure = assembleDisclosure("en")
    assert.equal(disclosure.title, "Official KOIN/WLC Market")
    assert.equal(disclosure.networkLabel, "Worldland Mainnet")
    assert.ok(disclosure.liquidityWarning.includes("Bootstrap"))
    assert.ok(disclosure.canonicalNote.includes("canonical"))
    assert.ok(disclosure.complianceNote.includes("compliance"))
  })

  it("includes required Korean disclosure fields", () => {
    const disclosure = assembleDisclosure("ko")
    assert.equal(disclosure.title, "\uacf5\uc2dd KOIN/WLC \ub9c8\ucf13")
    assert.ok(disclosure.liquidityWarning.includes("\ubd80\ud2b8\uc2a4\ud2b8\ub7a9"))
    assert.ok(disclosure.canonicalNote.includes("Worldland KOIN"))
  })

  it("shows not yet disclosed pool address before launch", () => {
    const disclosure = assembleDisclosure("en")
    assert.equal(disclosure.poolAddress, "Not yet disclosed")
  })
})

describe("checkForbiddenFraming", () => {
  it("returns an empty array for clean copy", () => {
    assert.deepEqual(checkForbiddenFraming("Official KOIN/WLC market on Worldland"), [])
  })

  it("detects launch token framing", () => {
    assert.ok(checkForbiddenFraming("Buy the launch token now!").includes("launch token"))
  })

  it("detects bonding curve framing", () => {
    assert.ok(checkForbiddenFraming("Price follows a bonding curve").includes("bonding curve"))
  })

  it("detects graduation framing", () => {
    assert.ok(checkForbiddenFraming("Token graduation is complete").includes("graduation"))
  })

  it("detects fair-launch framing", () => {
    assert.ok(checkForbiddenFraming("This is a fair-launch distribution").includes("fair-launch distribution"))
  })

  it("detects multiple forbidden patterns", () => {
    assert.equal(checkForbiddenFraming("A launch token with bonding curve graduation").length, 3)
  })
})
