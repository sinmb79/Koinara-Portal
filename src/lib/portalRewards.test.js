import assert from "node:assert/strict"
import test from "node:test"

import { BASE, WORLDLAND } from "./chain.js"
import { ADDRESSES, BASE_ADDRESSES } from "../abi/index.js"
import {
  estimateActiveEpochReward,
  getKoinBalanceAddress,
  supportsActiveEpochRewards,
} from "./portalRewards.js"

test("estimateActiveEpochReward uses address weight instead of active node count", () => {
  assert.equal(
    estimateActiveEpochReward({
      emission: 1000n,
      addressWeight: 2n,
      totalWeight: 5n,
      activeAt: true,
    }),
    400n,
  )
})

test("estimateActiveEpochReward returns zero when the address has no accepted weight", () => {
  assert.equal(
    estimateActiveEpochReward({
      emission: 1000n,
      addressWeight: 0n,
      totalWeight: 5n,
      activeAt: true,
    }),
    0n,
  )
})

test("active epoch rewards stay enabled on Worldland and disabled on Base", () => {
  assert.equal(supportsActiveEpochRewards(WORLDLAND.chainId), true)
  assert.equal(supportsActiveEpochRewards(BASE.chainId), false)
})

test("getKoinBalanceAddress resolves the current chain token contract", () => {
  assert.equal(getKoinBalanceAddress(WORLDLAND.chainId), ADDRESSES.koin)
  assert.equal(getKoinBalanceAddress(BASE.chainId), BASE_ADDRESSES.missionKoin)
})
