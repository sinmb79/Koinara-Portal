import { ethers } from "ethers"

import { BASE, WORLDLAND } from "./chain.js"

export function isSupportedPortalChain(chainId) {
  const normalized = Number(chainId)
  return normalized === WORLDLAND.chainId || normalized === BASE.chainId
}

export async function requestWalletChain({ walletProvider, chain }) {
  await walletProvider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: chain.chainIdHex }],
  })
}

export async function ensureWalletChain({ walletProvider, chain }) {
  try {
    await requestWalletChain({ walletProvider, chain })
  } catch (error) {
    if (error?.code !== 4902) throw error

    await walletProvider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: chain.chainIdHex,
        chainName: chain.chainName,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls,
        blockExplorerUrls: chain.blockExplorerUrls,
      }],
    })
  }
}

export async function createWalletSession({
  walletProvider,
  walletId = null,
  walletName = null,
  BrowserProvider = ethers.BrowserProvider,
}) {
  const provider = new BrowserProvider(walletProvider)
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  const network = await provider.getNetwork()
  const chainId = Number(network.chainId)

  return {
    provider,
    signer,
    address,
    chainId,
    walletProvider,
    walletId,
    walletName,
    isCorrectChain: isSupportedPortalChain(chainId),
  }
}
