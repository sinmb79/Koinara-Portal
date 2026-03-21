import test from "node:test"
import assert from "node:assert/strict"

import {
  buildTorqrTradeSeries,
  summarizeTorqrTrades,
} from "./torqrActivity.js"

test("buildTorqrTradeSeries sorts trades oldest-first and keeps price points", () => {
  const series = buildTorqrTradeSeries([
    { timestamp: 300, priceFloat: 3 },
    { timestamp: 100, priceFloat: 1 },
    { timestamp: 200, priceFloat: 2 },
  ])

  assert.deepEqual(
    series.map((point) => [point.timestamp, point.priceFloat]),
    [
      [100, 1],
      [200, 2],
      [300, 3],
    ],
  )
})

test("summarizeTorqrTrades derives last price, range, and change from trades", () => {
  const summary = summarizeTorqrTrades([
    { timestamp: 100, priceFloat: 1.5 },
    { timestamp: 200, priceFloat: 2.5 },
    { timestamp: 300, priceFloat: 2.0 },
  ])

  assert.equal(summary.lastPrice, 2.0)
  assert.equal(summary.lowPrice, 1.5)
  assert.equal(summary.highPrice, 2.5)
  assert.equal(summary.tradeCount, 3)
  assert.equal(summary.changePct, ((2.0 - 1.5) / 1.5) * 100)
})

test("summarizeTorqrTrades falls back to current price when no trades exist", () => {
  const summary = summarizeTorqrTrades([], 0.42)

  assert.equal(summary.lastPrice, 0.42)
  assert.equal(summary.lowPrice, 0.42)
  assert.equal(summary.highPrice, 0.42)
  assert.equal(summary.tradeCount, 0)
  assert.equal(summary.series.length, 1)
  assert.equal(summary.series[0].priceFloat, 0.42)
})
