/**
 * AIL (Agent Identity Layer) — agentidcard.org API integration
 * https://api.agentidcard.org
 *
 * Endpoints used:
 *   POST /owners/login            → sends OTP to owner email
 *   POST /owners/verify-login     → returns session_token
 *   POST /agents/register         → returns ail_id + JWT credential
 *   POST /verify                  → online credential verification
 *   GET  /keys                    → public keys for offline verification
 */

const AIL_API = "https://api.agentidcard.org"

// ─── Owner Login ──────────────────────────────────────────────

export async function ownerLogin(email) {
  const res = await fetch(`${AIL_API}/owners/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  return res.json()
}

export async function ownerVerifyLogin(owner_key_id, otp) {
  const res = await fetch(`${AIL_API}/owners/verify-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner_key_id, otp }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Login verify failed: ${res.status}`)
  }
  return res.json()
}

// ─── Agent Registration ───────────────────────────────────────

export async function registerAgent({ owner_key_id, payload, owner_signature }) {
  const res = await fetch(`${AIL_API}/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner_key_id, payload, owner_signature }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Agent registration failed: ${res.status}`)
  }
  return res.json()
}

// ─── Verification ─────────────────────────────────────────────

export async function verifyCredential(token) {
  const res = await fetch(`${AIL_API}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Verify failed: ${res.status}`)
  }
  return res.json()
}

// ─── Local Credential Storage ─────────────────────────────────

const STORAGE_KEY = "ail_credential"

export function getSavedCredential() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    const parsed = JSON.parse(data)
    if (parsed.expires_at && new Date(parsed.expires_at) < new Date()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveCredential(credential) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credential))
}

export function clearCredential() {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── On-chain encoding ────────────────────────────────────────

/**
 * Encode credential for on-chain submission to MockAILVerifier
 * MockAILVerifier.verifyCredential expects bytes that decode to (address, bytes32)
 *
 * In production: would pass JWT token bytes for on-chain verification
 */
export function encodeCredentialForChain(walletAddress) {
  const cleanAddr = walletAddress.toLowerCase().replace("0x", "")
  return "0x" + cleanAddr + "0".repeat(24)
}

export default {
  AIL_API,
  ownerLogin,
  ownerVerifyLogin,
  registerAgent,
  verifyCredential,
  getSavedCredential,
  saveCredential,
  clearCredential,
  encodeCredentialForChain,
}
