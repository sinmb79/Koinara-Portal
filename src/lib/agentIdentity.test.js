import test from "node:test"
import assert from "node:assert/strict"
import { ethers } from "ethers"
import {
  buildRegistrationPayload,
  extractAgentIdentityCredential,
  extractAgentIdentitySessionToken,
  extractAgentIdentityOwnerKeyId,
  normalizeIdentityBinding,
  validateOwnerWalletMatch,
} from "./agentIdentity.js"

test("normalizeIdentityBinding hashes the Agent ID reference into a stable identityRef", () => {
  const binding = normalizeIdentityBinding({
    credential: {
      ail_id: "AIL-2026-00042",
      display_name: "Verifier One",
      owner_key_id: "owk_123",
      credential_token: "token-123",
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

test("buildRegistrationPayload keeps the connected owner wallet explicit", () => {
  const payload = buildRegistrationPayload({
    displayName: "Verifier One",
    ownerWallet: "0x59816544dcD2B96fB35e7Eac67BA26510e11B996",
    role: "koinara_agent",
  })

  assert.deepEqual(payload, {
    display_name: "Verifier One",
    owner_wallet: "0x59816544dcD2B96fB35e7Eac67BA26510e11B996",
    role: "koinara_agent",
  })
})

test("validateOwnerWalletMatch rejects a mismatched owner wallet", () => {
  const result = validateOwnerWalletMatch(
    "0x59816544dcD2B96fB35e7Eac67BA26510e11B996",
    "0x26ce295f8DD8866C46d6355A7fDDe5CaEB76f3AC",
  )

  assert.equal(result.valid, false)
  assert.match(result.reason, /connected wallet/i)
})

test("extractAgentIdentityOwnerKeyId accepts nested owner login responses", () => {
  assert.equal(
    extractAgentIdentityOwnerKeyId({
      owner: { key_id: "owk_nested_123" },
    }),
    "owk_nested_123",
  )
})

test("extractAgentIdentitySessionToken accepts nested verify responses", () => {
  assert.equal(
    extractAgentIdentitySessionToken({
      session: { token: "session_nested_123" },
    }),
    "session_nested_123",
  )
})

test("extractAgentIdentityCredential resolves direct and nested registration payloads", () => {
  const direct = {
    ail_id: "AIL-2026-00009",
    owner_key_id: "owk_direct",
    credential_token: "credential_direct",
  }

  const nested = {
    credential: {
      ail_id: "AIL-2026-00010",
      owner_key_id: "owk_nested",
      credential_token: "credential_nested",
    },
  }

  assert.deepEqual(extractAgentIdentityCredential(direct), direct)
  assert.deepEqual(extractAgentIdentityCredential(nested), nested.credential)
})
