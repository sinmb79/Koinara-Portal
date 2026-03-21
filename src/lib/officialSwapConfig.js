/**
 * officialSwapConfig.js — Canonical KOIN/WLC swap configuration
 *
 * The official swap is locked to Worldland Mainnet.
 * Pool address and venue are populated when the team confirms
 * the bootstrap liquidity deployment.  Until then the UI gates
 * the swap CTA behind a "not live yet" state.
 */

const OFFICIAL_SWAP = {
  network: "worldland",
  pair: "KOIN/WLC",
  poolAddress: "",          // set when pool is deployed
  venueName: "",            // e.g. "Worldland DEX" or specific AMM
  venueUrl: "",             // direct link to the venue/router
  poolExplorerUrl: "",      // block-explorer link for the pool contract
  liquidityDisclosure:
    "Bootstrap liquidity is provided by the Koinara team. " +
    "Liquidity may be thin and price can move quickly. " +
    "Users are responsible for local legal and regulatory compliance.",
}

/**
 * Return the full official swap configuration object.
 * @returns {typeof OFFICIAL_SWAP}
 */
export function getOfficialSwapConfig() {
  return { ...OFFICIAL_SWAP }
}

/**
 * Is `networkId` the canonical swap network?
 * Only Worldland is canonical for the official KOIN market.
 * @param {string} networkId
 * @returns {boolean}
 */
export function isCanonicalSwapNetwork(networkId) {
  return networkId === OFFICIAL_SWAP.network
}

/**
 * The swap is considered live when both pool address and venue are set.
 * @returns {boolean}
 */
export function isSwapLive() {
  return Boolean(OFFICIAL_SWAP.poolAddress && OFFICIAL_SWAP.venueName)
}
