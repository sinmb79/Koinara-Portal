import test from "node:test"
import assert from "node:assert/strict"

import {
  normalizeTorqrAppUrl,
  getTorqrAction,
  getTorqrHubLinks,
} from "./torqrLinks.js"

test("normalizeTorqrAppUrl trims whitespace and trailing slash", () => {
  assert.equal(
    normalizeTorqrAppUrl(" https://torqr.example/ "),
    "https://torqr.example",
  )
})

test("getTorqrAction returns null when app url is not configured", () => {
  assert.equal(
    getTorqrAction({ appUrl: "", tokenAddress: null }),
    null,
  )
})

test("getTorqrAction returns launch action when agent has no token", () => {
  assert.deepEqual(
    getTorqrAction({
      appUrl: "https://torqr.example/",
      tokenAddress: null,
    }),
    {
      kind: "launch",
      href: "https://torqr.example/create",
      label: "Launch on Torqr",
    },
  )
})

test("getTorqrAction returns view action when agent already has a token", () => {
  assert.deepEqual(
    getTorqrAction({
      appUrl: "https://torqr.example/",
      tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
    }),
    {
      kind: "view",
      href: "https://torqr.example/token/0x1234567890abcdef1234567890abcdef12345678",
      label: "View Token",
    },
  )
})

test("getTorqrAction preserves subpath deployments", () => {
  assert.deepEqual(
    getTorqrAction({
      appUrl: "https://example.com/torqr/",
      tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
    }),
    {
      kind: "view",
      href: "https://example.com/torqr/token/0x1234567890abcdef1234567890abcdef12345678",
      label: "View Token",
    },
  )
})

test("getTorqrAction returns null when app url is invalid", () => {
  assert.equal(
    getTorqrAction({
      appUrl: "torqr-local",
      tokenAddress: null,
    }),
    null,
  )
})

test("getTorqrHubLinks returns app and launch links for the Torqr hub page", () => {
  assert.deepEqual(
    getTorqrHubLinks("https://example.com/torqr/"),
    {
      appHref: "https://example.com/torqr",
      createHref: "https://example.com/torqr/create",
    },
  )
})
