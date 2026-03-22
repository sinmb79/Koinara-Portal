import { ethers } from "ethers"

export function extractAgentIdentityOwnerKeyId(response) {
  return (
    response?.owner_key_id ||
    response?.owner?.key_id ||
    response?.data?.owner_key_id ||
    response?.data?.owner?.key_id ||
    null
  )
}

export function extractAgentIdentitySessionToken(response) {
  return (
    response?.session_token ||
    response?.session?.token ||
    response?.data?.session_token ||
    response?.data?.session?.token ||
    null
  )
}

export function extractAgentIdentityCredential(response) {
  if (!response || typeof response !== "object") return null
  if (response.ail_id || response.owner_key_id || response.credential_token || response.token) {
    return response
  }

  return response.credential || response.agent || response.data?.credential || response.data?.agent || null
}

export function normalizeIdentityBinding({ credential, ownerWallet, metadataURI = "" }) {
  const normalizedOwner = ethers.getAddress(ownerWallet)
  const ailId = String(credential?.ail_id || credential?.owner_key_id || "").trim()

  if (!ailId) {
    throw new Error("Agent ID CARD credential is missing an identity reference.")
  }

  return {
    identityRef: ethers.keccak256(ethers.toUtf8Bytes(ailId)),
    ailId,
    ownerWallet: normalizedOwner,
    ownerKeyId: credential?.owner_key_id || null,
    displayName: credential?.display_name || "Koinara Agent",
    credentialToken: credential?.credential_token || credential?.token || null,
    metadataURI: String(metadataURI || "").trim(),
  }
}

export function buildRegistrationPayload({ displayName, ownerWallet, role = "koinara_agent" }) {
  return {
    display_name: String(displayName || "").trim() || "Koinara Agent",
    owner_wallet: ethers.getAddress(ownerWallet),
    role,
  }
}

export function validateOwnerWalletMatch(connectedWallet, requestedOwnerWallet) {
  const connected = ethers.getAddress(connectedWallet)
  const requested = ethers.getAddress(requestedOwnerWallet)

  if (connected !== requested) {
    return {
      valid: false,
      reason: "The connected wallet must match the canonical owner wallet for Agent ID CARD registration.",
      connectedWallet: connected,
      requestedOwnerWallet: requested,
    }
  }

  return {
    valid: true,
    reason: null,
    connectedWallet: connected,
    requestedOwnerWallet: requested,
  }
}
