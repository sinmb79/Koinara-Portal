import test from "node:test"
import assert from "node:assert/strict"
import {
  ALLOWED_AIL_ORIGINS,
  ALLOWED_AIL_REDIRECT_URIS,
  handleAILExchangeRequest,
} from "./ail-exchange.js"

test("happy path exchanges a valid auth code and sanitizes the credential payload", async () => {
  const result = await handleAILExchangeRequest({
    method: "POST",
    headers: { origin: ALLOWED_AIL_ORIGINS[0] },
    body: {
      code: "code_valid",
      state: "state_valid",
      redirect_uri: ALLOWED_AIL_REDIRECT_URIS[0],
    },
  }, {
    clientId: "client_123",
    clientSecret: "secret_123",
    fetchImpl: async (_input, init) => {
      const body = JSON.parse(init.body)
      assert.deepEqual(body, {
        client_id: "client_123",
        client_secret: "secret_123",
        code: "code_valid",
        redirect_uri: ALLOWED_AIL_REDIRECT_URIS[0],
      })

      return {
        ok: true,
        status: 200,
        json: async () => ({
          ail_id: "AIL-2026-00001",
          display_name: "Koinara Agent",
          role: "agent",
          owner_org: "Koinara",
          reputation: { score: 92 },
          ignored: "secret",
        }),
      }
    },
  })

  assert.equal(result.status, 200)
  assert.deepEqual(result.body, {
    ail_id: "AIL-2026-00001",
    display_name: "Koinara Agent",
    role: "agent",
    owner_org: "Koinara",
    reputation: { score: 92 },
  })
})

test("missing code is rejected before upstream exchange", async () => {
  const result = await handleAILExchangeRequest({
    method: "POST",
    headers: { origin: ALLOWED_AIL_ORIGINS[0] },
    body: {
      state: "state_missing_code",
      redirect_uri: ALLOWED_AIL_REDIRECT_URIS[0],
    },
  }, {
    clientId: "client_123",
    clientSecret: "secret_123",
    fetchImpl: async () => {
      throw new Error("should not reach upstream")
    },
  })

  assert.equal(result.status, 400)
  assert.equal(result.body.error, "missing_code")
})

test("origin must be in the allow-list", async () => {
  const result = await handleAILExchangeRequest({
    method: "POST",
    headers: { origin: "https://evil.example" },
    body: {
      code: "code_valid",
      state: "state_valid",
      redirect_uri: ALLOWED_AIL_REDIRECT_URIS[0],
    },
  }, {
    clientId: "client_123",
    clientSecret: "secret_123",
    fetchImpl: async () => {
      throw new Error("should not reach upstream")
    },
  })

  assert.equal(result.status, 403)
  assert.equal(result.body.error, "origin_not_allowed")
})

test("redirect URI must match the registered callback exactly", async () => {
  const result = await handleAILExchangeRequest({
    method: "POST",
    headers: { origin: ALLOWED_AIL_ORIGINS[0] },
    body: {
      code: "code_valid",
      state: "state_valid",
      redirect_uri: "https://koinara.xyz/auth/callback",
    },
  }, {
    clientId: "client_123",
    clientSecret: "secret_123",
    fetchImpl: async () => {
      throw new Error("should not reach upstream")
    },
  })

  assert.equal(result.status, 400)
  assert.equal(result.body.error, "invalid_redirect_uri")
})

test("upstream auth code errors are surfaced with status and code", async () => {
  const result = await handleAILExchangeRequest({
    method: "POST",
    headers: { origin: ALLOWED_AIL_ORIGINS[0] },
    body: {
      code: "code_expired",
      state: "state_valid",
      redirect_uri: ALLOWED_AIL_REDIRECT_URIS[0],
    },
  }, {
    clientId: "client_123",
    clientSecret: "secret_123",
    fetchImpl: async () => ({
      ok: false,
      status: 410,
      json: async () => ({ error: "auth_code_expired" }),
    }),
  })

  assert.equal(result.status, 410)
  assert.equal(result.body.error, "auth_code_expired")
})

test("missing server secret stops the exchange endpoint", async () => {
  const result = await handleAILExchangeRequest({
    method: "POST",
    headers: { origin: ALLOWED_AIL_ORIGINS[0] },
    body: {
      code: "code_valid",
      state: "state_valid",
      redirect_uri: ALLOWED_AIL_REDIRECT_URIS[0],
    },
  }, {
    clientId: "client_123",
    clientSecret: "",
    fetchImpl: async () => {
      throw new Error("should not reach upstream")
    },
  })

  assert.equal(result.status, 500)
  assert.equal(result.body.error, "ail_exchange_not_configured")
})
