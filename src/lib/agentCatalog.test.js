import test from "node:test"
import assert from "node:assert/strict"

import { buildAgentIdentitySnapshot, enrichAgentWithChainData } from "./agentCatalog.js"

test("buildAgentIdentitySnapshot keeps canonical owner metadata for registered agents", () => {
  const snapshot = buildAgentIdentitySnapshot({
    registered: true,
    identityRef: "0x" + "12".repeat(32),
    metadataURI: "ipfs://agent-id-card/example",
    owner: "0x59816544dcD2B96fB35e7Eac67BA26510e11B996",
    pendingOwner: "0x26ce295f8DD8866C46d6355A7fDDe5CaEB76f3AC",
    relinkNonce: 2,
  })

  assert.deepEqual(snapshot, {
    registered: true,
    identityRef: "0x" + "12".repeat(32),
    metadataURI: "ipfs://agent-id-card/example",
    owner: "0x59816544dcD2B96fB35e7Eac67BA26510e11B996",
    pendingOwner: "0x26ce295f8DD8866C46d6355A7fDDe5CaEB76f3AC",
    relinkNonce: 2,
  })
})

test("buildAgentIdentitySnapshot ignores empty registration state", () => {
  assert.equal(
    buildAgentIdentitySnapshot({
      registered: false,
      identityRef: null,
      metadataURI: "",
      owner: null,
      pendingOwner: null,
      relinkNonce: 0,
    }),
    null,
  )
})

test("Torqr bridge lookup failure does not erase Koinara chain enrichment", async () => {
  const baseAgent = {
    address: "0x71C94bA3F63C6CE0A6FCE7B67bCA0bC79eaf93A2",
    online: false,
    bond: "500 WLC",
    bondValue: 500,
    verified: false,
    torqrTokenAddress: null,
  }

  const enriched = await enrichAgentWithChainData(
    baseAgent,
    baseAgent.address,
    {
      nodeRegistry: {
        getNode: async () => ({
          registeredAt: 1,
          active: true,
          lastHeartbeatEpoch: 12,
          role: 0,
          metadataHash: "0x" + "11".repeat(32),
        }),
        currentEpoch: async () => 12,
      },
      nodeStaking: {
        getStake: async () => ({
          amount: 2_000_000_000_000_000_000n,
        }),
      },
      torqrBridge: {
        getTokenForAgent: async () => {
          throw new Error("Torqr bridge unavailable")
        },
      },
    },
  )

  assert.equal(enriched.registered, true)
  assert.equal(enriched.online, true)
  assert.equal(enriched.verified, true)
  assert.equal(enriched.bond, "2.00 WLC")
  assert.equal(enriched.bondValue, 2)
  assert.equal(enriched.torqrTokenAddress, null)
  assert.equal(enriched.nodeRole, 0)
})

test("Torqr bridge timeout does not block Koinara chain enrichment", async () => {
  const baseAgent = {
    address: "0x71C94bA3F63C6CE0A6FCE7B67bCA0bC79eaf93A2",
    online: false,
    bond: "500 WLC",
    bondValue: 500,
    verified: false,
    torqrTokenAddress: null,
  }

  const startedAt = Date.now()
  const enriched = await enrichAgentWithChainData(
    baseAgent,
    baseAgent.address,
    {
      nodeRegistry: {
        getNode: async () => ({
          registeredAt: 1,
          active: true,
          lastHeartbeatEpoch: 12,
          role: 0,
          metadataHash: "0x" + "22".repeat(32),
        }),
        currentEpoch: async () => 12,
      },
      nodeStaking: {
        getStake: async () => ({
          amount: 1_000_000_000_000_000_000n,
        }),
      },
      torqrBridge: {
        getTokenForAgent: async () => new Promise(() => {}),
      },
      torqrTimeoutMs: 5,
      torqrCache: new Map(),
    },
  )

  assert.ok(Date.now() - startedAt < 250)
  assert.equal(enriched.registered, true)
  assert.equal(enriched.online, true)
  assert.equal(enriched.bond, "1.00 WLC")
  assert.equal(enriched.torqrTokenAddress, null)
})

test("Torqr bridge token lookups are cached per agent address", async () => {
  const baseAgent = {
    address: "0x71C94bA3F63C6CE0A6FCE7B67bCA0bC79eaf93A2",
    online: false,
    bond: "500 WLC",
    bondValue: 500,
    verified: false,
    torqrTokenAddress: null,
  }

  let lookupCount = 0
  const torqrCache = new Map()
  const params = {
    nodeRegistry: {
      getNode: async () => ({
        registeredAt: 1,
        active: true,
        lastHeartbeatEpoch: 12,
        role: 0,
        metadataHash: "0x" + "33".repeat(32),
      }),
      currentEpoch: async () => 12,
    },
    nodeStaking: {
      getStake: async () => ({
        amount: 0n,
      }),
    },
    torqrBridge: {
      getTokenForAgent: async () => {
        lookupCount += 1
        return "0x1234567890abcdef1234567890abcdef12345678"
      },
    },
    torqrCache,
    torqrTimeoutMs: 20,
  }

  const first = await enrichAgentWithChainData(baseAgent, baseAgent.address, params)
  const second = await enrichAgentWithChainData(baseAgent, baseAgent.address, params)

  assert.equal(lookupCount, 1)
  assert.equal(first.torqrTokenAddress, "0x1234567890AbcdEF1234567890aBcdef12345678")
  assert.equal(second.torqrTokenAddress, "0x1234567890AbcdEF1234567890aBcdef12345678")
})
