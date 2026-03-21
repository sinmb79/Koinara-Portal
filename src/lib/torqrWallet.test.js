import assert from "node:assert/strict"
import test from "node:test"

import {
  formatTorqrWalletLabel,
  getTorqrDeployConfig,
  getTorqrCreateButtonState,
  getTorqrWalletConnectAction,
} from "./torqrWallet.js"

test("create modal asks to connect when the form is ready and no wallet is connected", () => {
  assert.deepEqual(
    getTorqrCreateButtonState({
      address: null,
      chainId: null,
      isConnecting: false,
      isReady: true,
    }),
    {
      intent: "connect",
      disabled: false,
      label: "Connect Wallet to Deploy",
    },
  )
})

test("create modal asks for a Worldland switch when wallet is connected on another chain", () => {
  assert.deepEqual(
    getTorqrCreateButtonState({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chainId: 8453,
      isConnecting: false,
      isReady: true,
    }),
    {
      intent: "switch",
      disabled: false,
      label: "Switch to Worldland",
    },
  )
})

test("create modal preserves deploy intent after wallet connection on Worldland", () => {
  assert.deepEqual(
    getTorqrCreateButtonState({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chainId: 103,
      isConnecting: false,
      isReady: true,
    }),
    {
      intent: "deploy",
      disabled: false,
      label: "Deploy Token",
    },
  )
})

test("create modal shows deploying state while the transaction is in flight", () => {
  assert.deepEqual(
    getTorqrCreateButtonState({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      chainId: 103,
      isConnecting: false,
      isDeploying: true,
      isReady: true,
    }),
    {
      intent: "deploy",
      disabled: true,
      label: "Deploying...",
    },
  )
})

test("wallet connect action opens a picker when multiple injected wallets are present", () => {
  const wallets = [{ id: "metamask" }, { id: "rabby" }]

  assert.deepEqual(
    getTorqrWalletConnectAction({
      wallets,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      href: "https://www.koinara.xyz/torqr",
    }),
    {
      type: "picker",
      walletId: null,
      href: null,
    },
  )
})

test("wallet connect action falls back to MetaMask deeplink on mobile when no wallet is injected", () => {
  assert.deepEqual(
    getTorqrWalletConnectAction({
      wallets: [],
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      href: "https://www.koinara.xyz/torqr/create?ref=koinara",
    }),
    {
      type: "deeplink",
      walletId: null,
      href: "https://metamask.app.link/dapp/www.koinara.xyz/torqr/create?ref=koinara",
    },
  )
})

test("wallet label shortens the connected address for the Torqr top bar", () => {
  assert.equal(
    formatTorqrWalletLabel({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      walletName: "MetaMask",
    }),
    "0x1234...5678",
  )
})

test("deploy config uses the Torqr factory with the fixed 1 WLC creation fee", () => {
  assert.deepEqual(
    getTorqrDeployConfig({
      factoryAddress: "0x1E8d07B68b0447c27B8976767d91974Eee5B5103",
      name: "WorldCat",
      symbol: "WCAT",
      description: "Token launch",
      imageURI: "https://example.com/cat.png",
    }),
    {
      address: "0x1E8d07B68b0447c27B8976767d91974Eee5B5103",
      functionName: "createToken",
      valueWei: "1000000000000000000",
      args: ["WorldCat", "WCAT", "Token launch", "https://example.com/cat.png"],
    },
  )
})
