import test from "node:test"
import assert from "node:assert/strict"
import {
  AIL_API,
  AIL_WIDGET_SCRIPT_URL,
  AIL_BADGE_SCRIPT_URL,
  buildAILVerifyUrl,
  clearAILAuthState,
  clearAILCredential,
  createAILAuthState,
  exchangeAuthCode,
  fetchJWKS,
  getAILAuthState,
  getAILWidgetConfig,
  getAgentProfileUrl,
  getStoredAILCredential,
  isLegacyAILCredential,
  saveAILAuthState,
  storeAILCredential,
} from "./ail.js"

function createStorage() {
  const values = new Map()
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

test("getAILWidgetConfig locks Koinara OAuth defaults", () => {
  const config = getAILWidgetConfig({ isProd: true })

  assert.equal(config.clientId, "ail_client_c8eebc59b5af4e6bae589a0677126e9f")
  assert.equal(config.redirectUri, "https://www.koinara.xyz/callback")
  assert.equal(config.scope, "identity")
  assert.equal(config.widgetScriptUrl, AIL_WIDGET_SCRIPT_URL)
  assert.equal(config.badgeScriptUrl, AIL_BADGE_SCRIPT_URL)
})

test("buildAILVerifyUrl builds the hosted popup URL with exact params", () => {
  const url = buildAILVerifyUrl({
    clientId: "client_123",
    redirectUri: "https://www.koinara.xyz/callback",
    scope: "identity+reputation",
    state: "state_abc",
  })

  assert.equal(
    url,
    `${AIL_API}/auth/verify?client_id=client_123&redirect_uri=${encodeURIComponent("https://www.koinara.xyz/callback")}&scope=identity%2Breputation&state=state_abc`,
  )
})

test("exchangeAuthCode posts to the server proxy and returns sanitized identity data", async () => {
  const calls = []
  const response = await exchangeAuthCode("code_123", {
    state: "state_123",
    redirectUri: "https://www.koinara.xyz/callback",
    fetchImpl: async (input, init) => {
      calls.push([input, init])
      return {
        ok: true,
        json: async () => ({
          ail_id: "AIL-2026-00077",
          display_name: "Verifier Seven",
          role: "agent",
          owner_org: "Koinara",
        }),
      }
    },
  })

  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], "/api/ail-exchange")
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    code: "code_123",
    state: "state_123",
    redirect_uri: "https://www.koinara.xyz/callback",
  })
  assert.equal(response.ail_id, "AIL-2026-00077")
})

test("exchangeAuthCode surfaces server errors", async () => {
  await assert.rejects(
    () =>
      exchangeAuthCode("expired_code", {
        state: "state_expired",
        fetchImpl: async () => ({
          ok: false,
          status: 410,
          json: async () => ({ error: "auth_code_expired" }),
        }),
      }),
    /auth_code_expired/i,
  )
})

test("fetchJWKS reads the public keys endpoint", async () => {
  const jwks = await fetchJWKS({
    fetchImpl: async (input) => {
      assert.equal(input, `${AIL_API}/keys`)
      return {
        ok: true,
        json: async () => ({ keys: [{ kid: "jwks-key-1" }] }),
      }
    },
  })

  assert.deepEqual(jwks, { keys: [{ kid: "jwks-key-1" }] })
})

test("legacy credentials are cleared on first read", () => {
  const storage = createStorage()
  storage.setItem(
    "ail_credential",
    JSON.stringify({
      session_token: "legacy_session",
      owner_key_id: "owk_123",
      credential_token: "jwt_123",
    }),
  )

  const value = getStoredAILCredential(storage)

  assert.equal(value, null)
  assert.equal(storage.getItem("ail_credential"), null)
})

test("new OAuth credentials are stored and restored", () => {
  const storage = createStorage()
  const credential = {
    ail_id: "AIL-2026-00077",
    display_name: "Verifier Seven",
    role: "agent",
    owner_org: "Koinara",
    reputation: null,
    issued_at: null,
    expires_at: null,
    verified_at: 1774000000,
  }

  storeAILCredential(credential, storage)

  assert.deepEqual(getStoredAILCredential(storage), credential)

  clearAILCredential(storage)
  assert.equal(getStoredAILCredential(storage), null)
})

test("auth state helpers round-trip the CSRF token", () => {
  const storage = createStorage()
  const state = createAILAuthState(() => "uuid-state-123")

  assert.equal(state, "uuid-state-123")

  saveAILAuthState(state, storage)
  assert.equal(getAILAuthState(storage), "uuid-state-123")

  clearAILAuthState(storage)
  assert.equal(getAILAuthState(storage), null)
})

test("auth state helpers default to localStorage so popup callback can read the same state", () => {
  const originalLocalStorage = globalThis.localStorage
  const originalSessionStorage = globalThis.sessionStorage
  const localStorage = createStorage()
  const sessionStorage = createStorage()

  globalThis.localStorage = localStorage
  globalThis.sessionStorage = sessionStorage

  try {
    saveAILAuthState("popup-shared-state")

    assert.equal(localStorage.getItem("ail_oauth_state"), "popup-shared-state")
    assert.equal(sessionStorage.getItem("ail_oauth_state"), null)
    assert.equal(getAILAuthState(), "popup-shared-state")

    clearAILAuthState()
    assert.equal(getAILAuthState(), null)
  } finally {
    globalThis.localStorage = originalLocalStorage
    globalThis.sessionStorage = originalSessionStorage
  }
})

test("isLegacyAILCredential only flags pre-OAuth shapes", () => {
  assert.equal(isLegacyAILCredential({ session_token: "legacy" }), true)
  assert.equal(isLegacyAILCredential({ credential_token: "jwt" }), true)
  assert.equal(
    isLegacyAILCredential({
      ail_id: "AIL-2026-00077",
      display_name: "Verifier Seven",
      role: "agent",
      owner_org: "Koinara",
    }),
    false,
  )
})

test("getAgentProfileUrl points at the public Agent ID CARD profile", () => {
  assert.equal(getAgentProfileUrl("AIL-2026-00077"), "https://agentidcard.org/agent/AIL-2026-00077")
})
