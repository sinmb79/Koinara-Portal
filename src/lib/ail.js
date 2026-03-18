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

// ─── Koinara Mission Board Agent Credential ──────────────────
// Issued via AIL register-session for on-chain mission verification
export const KOINARA_AGENT = {
  ail_id: "AIL-2026-00003",
  display_name: "Koinara-MissionBoard",
  role: "mission_verifier",
  credential_token: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIyYmxhYnMtbWFzdGVyLTIwMjYifQ.eyJhaWxfaWQiOiJBSUwtMjAyNi0wMDAwMyIsImRpc3BsYXlfbmFtZSI6IktvaW5hcmEtTWlzc2lvbkJvYXJkIiwicm9sZSI6Im1pc3Npb25fdmVyaWZpZXIiLCJvd25lcl9rZXlfaWQiOiJvd2tfZjBiZTBhY2FlMTc1YTgyNjdjYWE4NDA3Iiwib3duZXJfb3JnIjpudWxsLCJzY29wZV9oYXNoIjoic2hhMjU2OjA1OTFlOWIwYmE1MzBlNWU3ZmVmZjY4OTRkZDVmMmUyOWM3ZjViZmQ2ZjRhMzk4ZmI1NDE1YTc0YTJjMTY2NWQiLCJzaWduYWxfZ2x5cGhfc2VlZCI6IkFJTC0yMDI2LTAwMDAzOktvaW5hcmEtTWlzc2lvbkJvYXJkOm93a19mMGJlMGFjYWUxNzVhODI2N2NhYTg0MDciLCJiZWhhdmlvcl9maW5nZXJwcmludCI6InNoYTI1Njo5OTk3YWNlZjU1Y2M1ZDI4NjZhMjIwMzJkOGJjZTA0OWVlMGExOGEwOThjZDgyNGQwMmJhYWVlNGZkYTUzMGEzIiwiaXNzIjoiMjJibGFicy5haSIsInN1YiI6IkFJTC0yMDI2LTAwMDAzIiwiaWF0IjoxNzczODI4OTA4LCJleHAiOjE4MDUzNjQ5MDh9.wKM9rfKOtmMh6bYNqglC9ZF4I74uH7xqAklo4v-2h-GeR5SItsifEJXQKRDWWBqeMUCA6HytoVwZJ7H4jR5vfw",
  issued_at: "2026-03-18T10:15:08.884Z",
  expires_at: "2027-03-18T10:15:08.884Z",
}

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

export async function registerAgentViaSession({ session_token, payload }) {
  const res = await fetch(`${AIL_API}/agents/register-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_token, payload }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Session registration failed: ${res.status}`)
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
  KOINARA_AGENT,
  ownerLogin,
  ownerVerifyLogin,
  registerAgent,
  registerAgentViaSession,
  verifyCredential,
  getSavedCredential,
  saveCredential,
  clearCredential,
  encodeCredentialForChain,
}
