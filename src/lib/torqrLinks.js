const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export function normalizeTorqrAppUrl(appUrl) {
  return String(appUrl || "").trim().replace(/\/+$/, "")
}

export function hasTorqrToken(tokenAddress) {
  if (!tokenAddress) return false
  return String(tokenAddress).toLowerCase() !== ZERO_ADDRESS
}

export function getTorqrAction({ appUrl, tokenAddress }) {
  const normalizedBaseUrl = normalizeTorqrAppUrl(appUrl)
  if (!normalizedBaseUrl) return null
  let baseUrl
  try {
    baseUrl = new URL(`${normalizedBaseUrl}/`)
  } catch {
    return null
  }

  if (hasTorqrToken(tokenAddress)) {
    const url = new URL(`token/${tokenAddress}`, baseUrl)
    return {
      kind: "view",
      href: url.toString(),
      label: "View Token",
    }
  }

  return {
    kind: "launch",
    href: new URL("create", baseUrl).toString(),
    label: "Launch on Torqr",
  }
}

export function getTorqrHubLinks(appUrl) {
  const normalizedBaseUrl = normalizeTorqrAppUrl(appUrl)
  if (!normalizedBaseUrl) return null

  let baseUrl
  try {
    baseUrl = new URL(`${normalizedBaseUrl}/`)
  } catch {
    return null
  }

  return {
    appHref: normalizedBaseUrl,
    createHref: new URL("create", baseUrl).toString(),
  }
}
