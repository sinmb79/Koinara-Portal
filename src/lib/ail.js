import { ethers } from "ethers"

export const AIL_API = "https://api.agentidcard.org"
export const AIL_WIDGET_SCRIPT_URL = `${AIL_API}/widget.js`
export const AIL_BADGE_SCRIPT_URL = `${AIL_API}/badge.js`
export const DEFAULT_AIL_CLIENT_ID = "ail_client_c8eebc59b5af4e6bae589a0677126e9f"
export const PROD_AIL_REDIRECT_URI = "https://www.koinara.xyz/callback"
export const DEV_AIL_REDIRECT_URI = "http://localhost:5173/callback"

const AIL_CREDENTIAL_STORAGE_KEY = "ail_credential"
const AIL_AUTH_STATE_STORAGE_KEY = "ail_oauth_state"

function getImportMetaEnv() {
  try {
    return import.meta?.env || {}
  } catch {
    return {}
  }
}

function resolveStorage(storage, globalStorage) {
  if (storage) return storage
  if (typeof globalStorage !== "undefined") return globalStorage
  return null
}

function safeParseJSON(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function getAILClientId(env = getImportMetaEnv()) {
  return env?.VITE_AIL_CLIENT_ID || DEFAULT_AIL_CLIENT_ID
}

export function getAILRedirectUri({ isProd = Boolean(getImportMetaEnv().PROD) } = {}) {
  return isProd ? PROD_AIL_REDIRECT_URI : DEV_AIL_REDIRECT_URI
}

export function getAILWidgetConfig({
  isProd = Boolean(getImportMetaEnv().PROD),
  clientId = getAILClientId(),
  scope = "identity",
} = {}) {
  return {
    clientId,
    redirectUri: getAILRedirectUri({ isProd }),
    scope,
    widgetScriptUrl: AIL_WIDGET_SCRIPT_URL,
    badgeScriptUrl: AIL_BADGE_SCRIPT_URL,
  }
}

export function buildAILVerifyUrl({
  clientId,
  redirectUri,
  scope = "identity",
  state,
  baseUrl = AIL_API,
}) {
  const params = new URLSearchParams()
  params.append("client_id", clientId)
  params.append("redirect_uri", redirectUri)
  params.append("scope", scope)
  if (state) {
    params.append("state", state)
  }
  return `${baseUrl}/auth/verify?${params.toString()}`
}

export function createAILAuthState(randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto)) {
  if (typeof randomUUID === "function") {
    return randomUUID()
  }
  return `ail_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

export function saveAILAuthState(state, storage = resolveStorage(null, globalThis.sessionStorage)) {
  if (!storage) return
  storage.setItem(AIL_AUTH_STATE_STORAGE_KEY, String(state))
}

export function getAILAuthState(storage = resolveStorage(null, globalThis.sessionStorage)) {
  if (!storage) return null
  return storage.getItem(AIL_AUTH_STATE_STORAGE_KEY)
}

export function clearAILAuthState(storage = resolveStorage(null, globalThis.sessionStorage)) {
  if (!storage) return
  storage.removeItem(AIL_AUTH_STATE_STORAGE_KEY)
}

export function isLegacyAILCredential(value) {
  if (!value || typeof value !== "object") return false
  return Boolean(
    value.session_token ||
    value.owner_key_id ||
    value.credential_token ||
    (value.token && !value.ail_id),
  )
}

export function normalizeAILCredential(value) {
  if (!value || typeof value !== "object") return null

  const source =
    value?.data?.credential ||
    value?.credential ||
    value?.data ||
    value

  if (!source?.ail_id) {
    return null
  }

  return {
    ail_id: String(source.ail_id),
    display_name: String(source.display_name || "Koinara Agent"),
    role: source.role ? String(source.role) : null,
    owner_org: source.owner_org ? String(source.owner_org) : null,
    reputation: source.reputation ?? null,
    issued_at: source.issued_at || null,
    expires_at: source.expires_at || null,
    verified_at: Number(source.verified_at ?? Date.now()),
  }
}

export function isAILCredentialExpired(credential, now = Date.now()) {
  if (!credential?.expires_at) return false
  const expiresAt = new Date(credential.expires_at).getTime()
  if (!Number.isFinite(expiresAt)) return false
  return expiresAt <= now
}

export function getStoredAILCredential(storage = resolveStorage(null, globalThis.localStorage)) {
  if (!storage) return null
  const raw = storage.getItem(AIL_CREDENTIAL_STORAGE_KEY)
  if (!raw) return null

  const parsed = safeParseJSON(raw)
  if (!parsed || isLegacyAILCredential(parsed)) {
    storage.removeItem(AIL_CREDENTIAL_STORAGE_KEY)
    return null
  }

  const normalized = normalizeAILCredential(parsed)
  if (!normalized || isAILCredentialExpired(normalized)) {
    storage.removeItem(AIL_CREDENTIAL_STORAGE_KEY)
    return null
  }

  return normalized
}

export function storeAILCredential(credential, storage = resolveStorage(null, globalThis.localStorage)) {
  if (!storage) {
    throw new Error("Browser storage is unavailable for Agent ID CARD credentials.")
  }
  const normalized = normalizeAILCredential(credential)
  if (!normalized) {
    throw new Error("Agent ID CARD credential is missing ail_id.")
  }
  storage.setItem(AIL_CREDENTIAL_STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function clearAILCredential(storage = resolveStorage(null, globalThis.localStorage)) {
  if (!storage) return
  storage.removeItem(AIL_CREDENTIAL_STORAGE_KEY)
}

export async function exchangeAuthCode(
  code,
  {
    state = null,
    redirectUri = getAILWidgetConfig().redirectUri,
    fetchImpl = globalThis.fetch?.bind(globalThis),
  } = {},
) {
  if (!code) {
    throw new Error("Agent ID CARD auth code is required.")
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch is unavailable for Agent ID CARD exchange.")
  }

  const response = await fetchImpl("/api/ail-exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      state,
      redirect_uri: redirectUri,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Exchange failed: ${response.status}`)
  }

  const credential = normalizeAILCredential(payload)
  if (!credential) {
    throw new Error("Agent ID CARD exchange returned an invalid credential payload.")
  }
  return credential
}

export async function fetchJWKS({ fetchImpl = globalThis.fetch?.bind(globalThis) } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch is unavailable for Agent ID CARD JWKS lookup.")
  }
  const response = await fetchImpl(`${AIL_API}/keys`)
  if (!response.ok) {
    throw new Error(`JWKS fetch failed: ${response.status}`)
  }
  return response.json()
}

export function loadAILExternalScript(src, { documentRef = globalThis.document, id = null } = {}) {
  if (!documentRef) {
    return Promise.resolve(null)
  }

  if (id) {
    const existing = documentRef.getElementById(id)
    if (existing) {
      return Promise.resolve(existing)
    }
  }

  return new Promise((resolve, reject) => {
    const script = documentRef.createElement("script")
    script.src = src
    script.async = true
    if (id) {
      script.id = id
    }
    script.onload = () => resolve(script)
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    documentRef.head.appendChild(script)
  })
}

export function openAILVerificationPopup({
  state,
  scope = "identity",
  windowRef = globalThis.window,
  popupName = "ail-oauth",
} = {}) {
  const config = getAILWidgetConfig({ scope })
  const url = buildAILVerifyUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: config.scope,
    state,
  })

  const popup = windowRef?.open(
    url,
    popupName,
    "popup=yes,width=520,height=760,resizable=yes,scrollbars=yes",
  )

  if (!popup) {
    throw new Error("Agent ID CARD popup was blocked.")
  }

  popup.focus?.()
  return popup
}

export function getAgentProfileUrl(ailId) {
  return `https://agentidcard.org/agent/${ailId}`
}

/**
 * Encode credential for on-chain submission to MockAILVerifier.
 * MockAILVerifier.verifyCredential expects bytes that decode to (address, bytes32).
 */
export function encodeCredentialForChain(walletAddress) {
  const cleanAddr = walletAddress.toLowerCase().replace("0x", "")
  return "0x" + cleanAddr + "0".repeat(24)
}

export default {
  AIL_API,
  AIL_WIDGET_SCRIPT_URL,
  AIL_BADGE_SCRIPT_URL,
  DEFAULT_AIL_CLIENT_ID,
  getAILClientId,
  getAILRedirectUri,
  getAILWidgetConfig,
  buildAILVerifyUrl,
  createAILAuthState,
  saveAILAuthState,
  getAILAuthState,
  clearAILAuthState,
  isLegacyAILCredential,
  normalizeAILCredential,
  getStoredAILCredential,
  storeAILCredential,
  clearAILCredential,
  exchangeAuthCode,
  fetchJWKS,
  loadAILExternalScript,
  openAILVerificationPopup,
  getAgentProfileUrl,
  encodeCredentialForChain,
}
