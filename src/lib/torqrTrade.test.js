import test from "node:test"
import assert from "node:assert/strict"

import {
  calculateMinimumBuyGrossWlc,
  estimateBuyTokensForWlc,
  getTorqrSwapPrimaryActionLabel,
  getTorqrTradePrimaryActionLabel,
} from "./torqrTrade.js"
import {
  TORQR_BONDING_CURVE_ABI,
  TORQR_FACTORY_ABI,
  TORQR_POOL_ABI,
  TORQR_TOKEN_ABI,
} from "./torqrIntegration.js"

test("estimateBuyTokensForWlc returns the highest token amount within budget", async () => {
  const result = await estimateBuyTokensForWlc({
    budgetWlc: 3n * 10n ** 18n,
    remainingSupply: 10n * 10n ** 18n,
    getBuyPrice: async (amount) => amount,
  })

  assert.equal(result, 3n * 10n ** 18n)
})

test("calculateMinimumBuyGrossWlc grosses one-token price up for trading fees", () => {
  assert.equal(
    calculateMinimumBuyGrossWlc({
      oneTokenNetCostWei: 2333333333333333433n,
      tradingFeeBps: 100,
    }),
    2356902356902357004n,
  )
})

test("getTorqrTradePrimaryActionLabel reflects chain, approval, and busy states", () => {
  assert.equal(
    getTorqrTradePrimaryActionLabel({
      isConnected: false,
      isCorrectChain: false,
      isBusy: false,
      tradeMode: "buy",
      requiresApproval: false,
      txAction: null,
    }),
    "Connect Wallet",
  )

  assert.equal(
    getTorqrTradePrimaryActionLabel({
      isConnected: true,
      isCorrectChain: false,
      isBusy: false,
      tradeMode: "buy",
      requiresApproval: false,
      txAction: null,
    }),
    "Switch Worldland",
  )

  assert.equal(
    getTorqrTradePrimaryActionLabel({
      isConnected: true,
      isCorrectChain: true,
      isBusy: false,
      tradeMode: "sell",
      requiresApproval: true,
      txAction: null,
    }),
    "Approve Tokens",
  )

  assert.equal(
    getTorqrTradePrimaryActionLabel({
      isConnected: true,
      isCorrectChain: true,
      isBusy: true,
      tradeMode: "buy",
      requiresApproval: false,
      txAction: "buy",
    }),
    "Buying...",
  )
})

test("getTorqrSwapPrimaryActionLabel reflects approval and busy states", () => {
  assert.equal(
    getTorqrSwapPrimaryActionLabel({
      isConnected: true,
      isCorrectChain: true,
      isBusy: false,
      requiresApproval: true,
      txAction: null,
    }),
    "Approve Tokens",
  )

  assert.equal(
    getTorqrSwapPrimaryActionLabel({
      isConnected: true,
      isCorrectChain: true,
      isBusy: true,
      requiresApproval: false,
      txAction: "swap",
    }),
    "Swapping...",
  )
})

test("Torqr integration ABIs expose the functions needed for live trading", () => {
  assert.ok(TORQR_FACTORY_ABI.some((item) => item.includes("getPool(address token)")))
  assert.ok(TORQR_BONDING_CURVE_ABI.some((item) => item.includes("buy(address token")))
  assert.ok(TORQR_BONDING_CURVE_ABI.some((item) => item.includes("sell(address token")))
  assert.ok(TORQR_BONDING_CURVE_ABI.some((item) => item.includes("getBuyPrice(address token")))
  assert.ok(TORQR_BONDING_CURVE_ABI.some((item) => item.includes("getSellPrice(address token")))
  assert.ok(TORQR_POOL_ABI.some((item) => item.includes("getAmountOut(bool wlcIn")))
  assert.ok(TORQR_POOL_ABI.some((item) => item.includes("swap(bool wlcIn")))
  assert.ok(TORQR_TOKEN_ABI.some((item) => item.includes("balanceOf(address owner)")))
  assert.ok(TORQR_TOKEN_ABI.some((item) => item.includes("approve(address spender")))
  assert.ok(TORQR_TOKEN_ABI.some((item) => item.includes("description()")))
  assert.ok(TORQR_TOKEN_ABI.some((item) => item.includes("imageURI()")))
})
