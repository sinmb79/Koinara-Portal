import assert from "node:assert/strict"
import test from "node:test"

import { BASE, WORLDLAND } from "./chain.js"
import { createWalletSession, ensureWalletChain, requestWalletChain } from "./walletSession.js"

test("requestWalletChain switches to the requested chain", async () => {
  const calls = []
  const walletProvider = {
    async request(payload) {
      calls.push(payload)
      return null
    },
  }

  await requestWalletChain({ walletProvider, chain: WORLDLAND })

  assert.deepEqual(calls, [
    {
      method: "wallet_switchEthereumChain",
      params: [{ chainId: WORLDLAND.chainIdHex }],
    },
  ])
})

test("requestWalletChain adds the chain when the wallet does not know it yet", async () => {
  const calls = []
  const walletProvider = {
    async request(payload) {
      calls.push(payload)
      if (payload.method === "wallet_switchEthereumChain") {
        const error = new Error("Unknown chain")
        error.code = 4902
        throw error
      }
      return null
    },
  }

  await ensureWalletChain({ walletProvider, chain: BASE })

  assert.equal(calls[0].method, "wallet_switchEthereumChain")
  assert.equal(calls[1].method, "wallet_addEthereumChain")
  assert.deepEqual(calls[1].params[0], {
    chainId: BASE.chainIdHex,
    chainName: BASE.chainName,
    nativeCurrency: BASE.nativeCurrency,
    rpcUrls: BASE.rpcUrls,
    blockExplorerUrls: BASE.blockExplorerUrls,
  })
})

test("createWalletSession rehydrates the connected wallet after a network change", async () => {
  class FakeBrowserProvider {
    constructor(walletProvider) {
      this.walletProvider = walletProvider
    }

    async getSigner() {
      const walletProvider = this.walletProvider
      return {
        async getAddress() {
          return walletProvider.address
        },
      }
    }

    async getNetwork() {
      return {
        chainId: BigInt(this.walletProvider.chainId),
      }
    }
  }

  const session = await createWalletSession({
    walletProvider: {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chainId: BASE.chainId,
    },
    walletId: "metamask",
    walletName: "MetaMask",
    BrowserProvider: FakeBrowserProvider,
  })

  assert.equal(session.address, "0x1234567890abcdef1234567890abcdef12345678")
  assert.equal(session.chainId, BASE.chainId)
  assert.equal(session.isCorrectChain, true)
  assert.equal(session.walletId, "metamask")
  assert.equal(session.walletName, "MetaMask")
})
