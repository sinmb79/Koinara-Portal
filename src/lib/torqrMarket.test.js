import test from "node:test"
import assert from "node:assert/strict"
import { ethers } from "ethers"
import { TORQR_FACTORY_ABI } from "./torqrIntegration.js"

import {
  applyTorqrTokenFilters,
  buildTorqrStatsSnapshot,
  findTorqrDuplicateTokenInList,
  getTorqrApiQuery,
  normalizeTorqrListToken,
  resolveTorqrApiBaseUrl,
} from "./torqrMarket.js"

const SAMPLE_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678"
const SAMPLE_CREATOR = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"

test("resolveTorqrApiBaseUrl prefers explicit indexer api url", () => {
  assert.equal(
    resolveTorqrApiBaseUrl({
      apiBaseUrl: " https://api.torqr.example/ ",
      appUrl: "https://app.torqr.example",
    }),
    "https://api.torqr.example",
  )
})

test("getTorqrApiQuery maps graduated tab to AMM filter", () => {
  assert.deepEqual(getTorqrApiQuery("graduated"), {
    sort: "mcap",
    graduated: true,
  })
})

test("normalizeTorqrListToken keeps real token metadata intact", () => {
  const token = normalizeTorqrListToken({
    address: SAMPLE_ADDRESS,
    name: "22b",
    symbol: "22B",
    creator: SAMPLE_CREATOR,
    description: "real token",
    imageUri: "",
    createdAt: 1710000000,
    createdAgo: "just now",
    graduated: false,
    poolAddress: null,
    reserveWlc: "1.25",
    soldSupply: "2500000000000000000",
    currentPrice: "0.1",
    currentPriceRaw: "100000000000000000",
    progress: 22.4,
    mcap: "1.25",
    volume24h: "0",
  })

  assert.equal(token.address, ethers.getAddress(SAMPLE_ADDRESS))
  assert.equal(token.name, "22b")
  assert.equal(token.symbol, "22B")
  assert.equal(token.badge, "22")
  assert.equal(token.progress, 22.4)
  assert.equal(token.mcapDisplay, "1.25")
})

test("applyTorqrTokenFilters sorts newest tokens first for new tab", () => {
  const older = normalizeTorqrListToken({
    address: "0x0000000000000000000000000000000000000011",
    name: "Old",
    symbol: "OLD",
    creator: SAMPLE_CREATOR,
    createdAt: 1710000000,
    graduated: false,
    progress: 10,
    mcap: "1",
    volume24h: "1",
  })
  const newer = normalizeTorqrListToken({
    address: "0x0000000000000000000000000000000000000022",
    name: "22b",
    symbol: "22B",
    creator: SAMPLE_CREATOR,
    createdAt: 1710000100,
    graduated: false,
    progress: 20,
    mcap: "2",
    volume24h: "2",
  })

  const filtered = applyTorqrTokenFilters([older, newer], {
    tab: "new",
    search: "22b",
  })

  assert.deepEqual(filtered.map((item) => item.symbol), ["22B"])
})

test("buildTorqrStatsSnapshot derives totals when indexer stats are unavailable", () => {
  const tokens = [
    normalizeTorqrListToken({
      address: "0x0000000000000000000000000000000000000011",
      name: "One",
      symbol: "ONE",
      creator: SAMPLE_CREATOR,
      createdAt: 1710000000,
      graduated: false,
      progress: 10,
      mcap: "1",
      volume24h: "0",
    }),
    normalizeTorqrListToken({
      address: "0x0000000000000000000000000000000000000022",
      name: "Two",
      symbol: "TWO",
      creator: SAMPLE_CREATOR,
      createdAt: 1710000100,
      graduated: true,
      progress: 100,
      mcap: "2",
      volume24h: "0",
    }),
  ]

  assert.deepEqual(buildTorqrStatsSnapshot({ tokens }), {
    totalTokens: 2,
    graduatedTokens: 1,
    volume24h: null,
    activeTraders24h: null,
  })
})

test("factory ABI uses tuple return type for getTokenInfo struct decoding", () => {
  const fragment = TORQR_FACTORY_ABI.find((item) => item.includes("getTokenInfo"))
  assert.ok(fragment)
  assert.match(fragment, /tuple\(/)
})

test("findTorqrDuplicateTokenInList detects duplicate names and symbols case-insensitively", () => {
  const tokens = [
    normalizeTorqrListToken({
      address: SAMPLE_ADDRESS,
      name: "22b",
      symbol: "22B",
      creator: SAMPLE_CREATOR,
      createdAt: 1710000000,
      graduated: false,
      progress: 0,
      mcap: "1",
      volume24h: "0",
    }),
  ]

  assert.deepEqual(
    findTorqrDuplicateTokenInList(tokens, {
      name: " 22B ",
      symbol: "22b",
    }),
    {
      field: "name",
      token: tokens[0],
    },
  )
})
