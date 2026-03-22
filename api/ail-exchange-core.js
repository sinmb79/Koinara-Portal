export const AIL_EXCHANGE_URL = "https://api.agentidcard.org/auth/exchange"
export const DEFAULT_AIL_CLIENT_ID = "ail_client_4fd5181b1f754362a99a75596b41b593"

export const ALLOWED_AIL_ORIGINS = [
  "https://koinara.xyz",
  "http://localhost:5173",
]

export const ALLOWED_AIL_REDIRECT_URIS = [
  "https://koinara.xyz/callback",
  "http://localhost:5173/callback",
]

function asJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

export function sanitizeExchangeResponse(payload) {
  return {
    ail_id: payload?.ail_id ? String(payload.ail_id) : null,
    display_name: payload?.display_name ? String(payload.display_name) : "Koinara Agent",
    role: payload?.role ? String(payload.role) : null,
    owner_org: payload?.owner_org ? String(payload.owner_org) : null,
    reputation: payload?.reputation ?? null,
  }
}

export function ensureBody(body) {
  if (!body) return {}
  if (typeof body === "string") return asJson(body)
  return body
}

export async function handleAILExchange({
  method,
  origin,
  body,
  fetchImpl = globalThis.fetch?.bind(globalThis),
  clientId = DEFAULT_AIL_CLIENT_ID,
  clientSecret = "",
} = {}) {
  if (method !== "POST") {
    return {
      status: 405,
      body: { error: "method_not_allowed" },
    }
  }

  if (!ALLOWED_AIL_ORIGINS.includes(origin || "")) {
    return {
      status: 403,
      body: { error: "origin_not_allowed" },
    }
  }

  const parsedBody = ensureBody(body)
  if (!parsedBody?.code) {
    return {
      status: 400,
      body: { error: "missing_code" },
    }
  }

  if (!parsedBody?.state) {
    return {
      status: 400,
      body: { error: "missing_state" },
    }
  }

  if (!ALLOWED_AIL_REDIRECT_URIS.includes(parsedBody?.redirect_uri)) {
    return {
      status: 400,
      body: { error: "invalid_redirect_uri" },
    }
  }

  if (!clientSecret) {
    return {
      status: 500,
      body: { error: "ail_exchange_not_configured" },
    }
  }

  if (typeof fetchImpl !== "function") {
    return {
      status: 500,
      body: { error: "fetch_unavailable" },
    }
  }

  const upstreamResponse = await fetchImpl(AIL_EXCHANGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: parsedBody.code,
      redirect_uri: parsedBody.redirect_uri,
    }),
  })

  const upstreamBody = await upstreamResponse.json().catch(() => ({}))

  if (!upstreamResponse.ok) {
    return {
      status: upstreamResponse.status,
      body: {
        error: upstreamBody?.error || upstreamBody?.message || "ail_exchange_failed",
      },
    }
  }

  const sanitized = sanitizeExchangeResponse(upstreamBody)
  if (!sanitized.ail_id) {
    return {
      status: 502,
      body: { error: "invalid_exchange_payload" },
    }
  }

  return {
    status: 200,
    body: sanitized,
  }
}
