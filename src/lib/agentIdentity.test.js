import test from "node:test"
import assert from "node:assert/strict"
import { ethers } from "ethers"
import * as agentIdentity from "./agentIdentity.js"

test("normalizeIdentityBinding hashes the Agent ID reference into a stable identityRef", () => {
  const binding = agentIdentity.normalizeIdentityBinding({
    credential: {
      ail_id: "AIL-2026-00042",
      display_name: "Verifier One",
      role: "agent",
      owner_org: "Koinara",
    },
    ownerWallet: "0x59816544dcD2B96fB35e7Eac67BA26510e11B996",
    metadataURI: "ipfs://agent-id-card/verifier-one",
  })

  assert.equal(
    binding.identityRef,
    ethers.keccak256(ethers.toUtf8Bytes("AIL-2026-00042")),
  )
  assert.equal(binding.ownerWallet, "0x59816544dcD2B96fB35e7Eac67BA26510e11B996")
  assert.equal(binding.displayName, "Verifier One")
})

test("validateOwnerWalletMatch rejects a mismatched owner wallet", () => {
  const result = agentIdentity.validateOwnerWalletMatch(
    "0x59816544dcD2B96fB35e7Eac67BA26510e11B996",
    "0x26ce295f8DD8866C46d6355A7fDDe5CaEB76f3AC",
  )

  assert.equal(result.valid, false)
  assert.match(result.reason, /connected wallet/i)
})

test("extractAILIdentity accepts direct and nested OAuth exchange payloads", () => {
  const direct = agentIdentity.extractAILIdentity({
    ail_id: "AIL-2026-00010",
    display_name: "Verifier One",
    role: "agent",
    owner_org: "Koinara",
  })

  const nested = agentIdentity.extractAILIdentity({
    data: {
      credential: {
        ail_id: "AIL-2026-00011",
        display_name: "Verifier Two",
        role: "verifier",
        owner_org: "Koinara",
        reputation: {
          score: 97,
        },
      },
    },
  })

  assert.deepEqual(direct, {
    ail_id: "AIL-2026-00010",
    display_name: "Verifier One",
    role: "agent",
    owner_org: "Koinara",
    reputation: null,
    issued_at: null,
    expires_at: null,
  })
  assert.equal(
    nested.reputation.score,
    97,
  )
})

test("legacy owner/session helpers are removed from the public API", () => {
  assert.equal("extractAgentIdentityOwnerKeyId" in agentIdentity, false)
  assert.equal("extractAgentIdentitySessionToken" in agentIdentity, false)
  assert.equal("extractAgentIdentityCredential" in agentIdentity, false)
  assert.equal("buildRegistrationPayload" in agentIdentity, false)
})
