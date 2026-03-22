import { ethers } from "ethers"

export function extractAILIdentity(response) {
  const source =
    response?.data?.credential ||
    response?.credential ||
    response?.data?.agent ||
    response?.agent ||
    response?.data ||
    response

  if (!source || typeof source !== "object" || !source.ail_id) {
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
  }
}

export function normalizeIdentityBinding({ credential, ownerWallet, metadataURI = "" }) {
  const normalizedOwner = ethers.getAddress(ownerWallet)
  const identity = extractAILIdentity(credential)
  const ailId = String(identity?.ail_id || "").trim()

  if (!ailId) {
    throw new Error("Agent ID CARD credential is missing an identity reference.")
  }

  return {
    identityRef: ethers.keccak256(ethers.toUtf8Bytes(ailId)),
    ailId,
    ownerWallet: normalizedOwner,
    displayName: identity?.display_name || "Koinara Agent",
    role: identity?.role || null,
    ownerOrg: identity?.owner_org || null,
    metadataURI: String(metadataURI || "").trim(),
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
