import test from "node:test"
import assert from "node:assert/strict"
import { onRequestPost } from "./ail-exchange.js"

test("Cloudflare Pages exchange function returns sanitized credential payload", async () => {
  const response = await onRequestPost({
    request: new Request("https://www.koinara.xyz/api/ail-exchange", {
      method: "POST",
      headers: {
        Origin: "https://koinara.xyz",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "code_valid",
        state: "state_valid",
        redirect_uri: "https://koinara.xyz/callback",
      }),
    }),
    env: {
      AIL_CLIENT_ID: "client_123",
      AIL_CLIENT_SECRET: "secret_123",
    },
    data: {
      fetchImpl: async (_input, init) => {
        const body = JSON.parse(init.body)
        assert.deepEqual(body, {
          client_id: "client_123",
          client_secret: "secret_123",
          code: "code_valid",
          redirect_uri: "https://koinara.xyz/callback",
        })

        return new Response(JSON.stringify({
          ail_id: "AIL-2026-00001",
          display_name: "Koinara Agent",
          role: "agent",
          owner_org: "Koinara",
          reputation: { score: 98 },
          ignored: "nope",
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      },
    },
  })

  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.deepEqual(payload, {
    ail_id: "AIL-2026-00001",
    display_name: "Koinara Agent",
    role: "agent",
    owner_org: "Koinara",
    reputation: { score: 98 },
  })
})

test("Cloudflare Pages exchange function enforces the registered origin", async () => {
  const response = await onRequestPost({
    request: new Request("https://www.koinara.xyz/api/ail-exchange", {
      method: "POST",
      headers: {
        Origin: "https://www.koinara.xyz",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "code_valid",
        state: "state_valid",
        redirect_uri: "https://koinara.xyz/callback",
      }),
    }),
    env: {
      AIL_CLIENT_ID: "client_123",
      AIL_CLIENT_SECRET: "secret_123",
    },
    data: {
      fetchImpl: async () => {
        throw new Error("should not reach upstream")
      },
    },
  })

  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), {
    error: "origin_not_allowed",
  })
})
