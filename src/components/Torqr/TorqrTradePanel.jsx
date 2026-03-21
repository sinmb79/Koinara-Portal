import { useEffect, useMemo, useState } from "react"
import { ethers } from "ethers"

import { WORLDLAND, txUrl } from "../../lib/chain.js"
import {
  TORQR_BONDING_CURVE_ABI,
  TORQR_FACTORY_ABI,
  TORQR_FACTORY_STACKS,
  TORQR_POOL_ABI,
  TORQR_TOKEN_ABI,
} from "../../lib/torqrIntegration.js"
import {
  calculateMinimumBuyGrossWlc,
  TORQR_DEFAULT_SLIPPAGE,
  TORQR_SLIPPAGE_OPTIONS,
  TORQR_TRADING_FEE_BPS,
  TORQR_ZERO_ADDRESS,
  applyTorqrSlippage,
  estimateBuyTokensForWlc,
  formatTorqrTokenAmount,
  formatTorqrWlc,
  getTorqrSwapPrimaryActionLabel,
  getTorqrTradePrimaryActionLabel,
  parseTorqrAmount,
  toBigInt,
} from "../../lib/torqrTrade.js"

const QUICK_BUY_AMOUNTS = ["0.1", "0.5", "1", "5"]

function getField(value, key, index, fallback) {
  if (value && typeof value === "object" && value[key] !== undefined) return value[key]
  if (value && typeof value === "object" && value[index] !== undefined) return value[index]
  return fallback
}

function safeAddress(value) {
  if (!value) return null
  try {
    const address = ethers.getAddress(value)
    return address === TORQR_ZERO_ADDRESS ? null : address
  } catch {
    return null
  }
}

function getErrorMessage(error) {
  const code = error?.code
  const message = String(error?.shortMessage || error?.reason || error?.info?.error?.message || error?.message || "")
  const normalized = message.toLowerCase()
  if (code === 4001 || normalized.includes("rejected")) return "Transaction rejected."
  if (normalized.includes("insufficient funds")) return "Insufficient WLC balance."
  if (normalized.includes("slippage")) return "Slippage exceeded. Try a higher tolerance."
  if (normalized.includes("no liquidity")) return "Pool liquidity is not ready yet."
  return message || "Transaction failed."
}

export default function TorqrTradePanel({
  token,
  address,
  chainId,
  signer,
  onConnect,
  onSwitchWorldland,
  onRefreshMarket,
}) {
  const oneTokenUnit = 10n ** 18n
  const [stack, setStack] = useState(null)
  const [resolvedToken, setResolvedToken] = useState(token)
  const [curveState, setCurveState] = useState(null)
  const [mode, setMode] = useState("buy")
  const [direction, setDirection] = useState("wlc-to-token")
  const [amount, setAmount] = useState("")
  const [slippageBps, setSlippageBps] = useState(TORQR_DEFAULT_SLIPPAGE)
  const [buyQuote, setBuyQuote] = useState(0n)
  const [sellQuote, setSellQuote] = useState(0n)
  const [swapQuote, setSwapQuote] = useState(0n)
  const [minimumBuyWlc, setMinimumBuyWlc] = useState(0n)
  const [reserves, setReserves] = useState({ wlc: 0n, token: 0n })
  const [balance, setBalance] = useState(0n)
  const [allowance, setAllowance] = useState(0n)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [txHash, setTxHash] = useState("")
  const [txAction, setTxAction] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [quotePending, setQuotePending] = useState(false)

  const readProvider = useMemo(() => new ethers.JsonRpcProvider(WORLDLAND.rpcUrls[0], WORLDLAND.chainId), [])
  const parsedAmount = useMemo(() => parseTorqrAmount(amount || "0"), [amount])
  const isConnected = Boolean(address && signer)
  const isCorrectChain = chainId === WORLDLAND.chainId
  const remainingSupply = curveState ? curveState.totalSupply - curveState.soldSupply : 0n
  const buyBudgetAfterFee = parsedAmount > 0n ? parsedAmount - (parsedAmount * BigInt(TORQR_TRADING_FEE_BPS)) / 10000n : 0n
  const requiresApproval = resolvedToken.graduated
    ? direction === "token-to-wlc" && parsedAmount > 0n && allowance < parsedAmount
    : mode === "sell" && parsedAmount > 0n && allowance < parsedAmount
  const minBuyTokens = applyTorqrSlippage(buyQuote, slippageBps)
  const minSellWlc = applyTorqrSlippage(sellQuote, slippageBps)
  const minSwapOut = applyTorqrSlippage(swapQuote, slippageBps)
  const minimumBuyRequired = !resolvedToken.graduated && mode === "buy" && parsedAmount > 0n && !quotePending && buyQuote <= 0n && minimumBuyWlc > 0n
  const actionLabel = resolvedToken.graduated
    ? getTorqrSwapPrimaryActionLabel({ isConnected, isCorrectChain, isBusy: busy, requiresApproval, txAction })
    : getTorqrTradePrimaryActionLabel({ isConnected, isCorrectChain, isBusy: busy, tradeMode: mode, requiresApproval, txAction })
  const actionDisabled = busy || loading || (resolvedToken.graduated && !resolvedToken.poolAddress) || (isConnected && isCorrectChain && (parsedAmount <= 0n || minimumBuyRequired))

  async function resolveStack() {
    const candidates = token.stackKey
      ? [token.stackKey, ...TORQR_FACTORY_STACKS.map((item) => item.key).filter((item) => item !== token.stackKey)]
      : TORQR_FACTORY_STACKS.map((item) => item.key)
    for (const key of candidates) {
      const candidate = TORQR_FACTORY_STACKS.find((item) => item.key === key)
      if (!candidate) continue
      try {
        const factory = new ethers.Contract(candidate.factoryAddress, TORQR_FACTORY_ABI, readProvider)
        const info = await factory.getTokenInfo(token.address)
        const tokenAddress = safeAddress(getField(info, "tokenAddress", 0, null))
        if (tokenAddress && tokenAddress.toLowerCase() === token.address.toLowerCase()) return candidate
      } catch {
        // continue
      }
    }
    return null
  }

  async function refreshDetail() {
    setLoading(true)
    try {
      const nextStack = await resolveStack()
      if (!nextStack) throw new Error("Token stack could not be resolved.")
      const factory = new ethers.Contract(nextStack.factoryAddress, TORQR_FACTORY_ABI, readProvider)
      const bonding = new ethers.Contract(nextStack.bondingCurveAddress, TORQR_BONDING_CURVE_ABI, readProvider)
      const [info, curve, progress] = await Promise.all([
        factory.getTokenInfo(token.address),
        bonding.getCurveState(token.address),
        bonding.getProgress(token.address),
      ])
      const poolAddress = safeAddress(await factory.getPool(token.address).catch(() => null))
      const reserveWLC = toBigInt(getField(curve, "reserveWLC", 4, 0))
      const soldSupply = toBigInt(getField(curve, "soldSupply", 3, token.soldSupply || 0))
      setStack(nextStack)
      setResolvedToken((prev) => ({
        ...prev,
        creator: safeAddress(getField(info, "creator", 1, prev.creator)) || prev.creator || TORQR_ZERO_ADDRESS,
        name: String(getField(info, "name", 2, prev.name)).trim() || prev.name,
        symbol: String(getField(info, "symbol", 3, prev.symbol)).trim() || prev.symbol,
        graduated: Boolean(getField(info, "graduated", 5, prev.graduated)),
        progress: Number(progress || 0) / 100,
        mcapDisplay: formatTorqrWlc(reserveWLC),
        soldSupply: soldSupply.toString(),
        poolAddress,
        stackKey: nextStack.key,
        source: "chain",
      }))
      setCurveState({
        totalSupply: toBigInt(getField(curve, "totalSupply", 2, 0)),
        soldSupply,
        reserveWLC,
      })
    } catch (nextError) {
      setError(String(nextError?.message || "Token detail sync failed."))
    } finally {
      setLoading(false)
    }
  }

  async function refreshWallet() {
    if (!address) {
      setBalance(0n)
      setAllowance(0n)
      return
    }
    try {
      const tokenContract = new ethers.Contract(token.address, TORQR_TOKEN_ABI, readProvider)
      const spender = resolvedToken.graduated ? resolvedToken.poolAddress : stack?.bondingCurveAddress
      const [nextBalance, nextAllowance] = await Promise.all([
        tokenContract.balanceOf(address).catch(() => 0n),
        spender ? tokenContract.allowance(address, spender).catch(() => 0n) : 0n,
      ])
      setBalance(toBigInt(nextBalance))
      setAllowance(toBigInt(nextAllowance))
    } catch {
      setBalance(0n)
      setAllowance(0n)
    }
  }

  useEffect(() => {
    setMinimumBuyWlc(0n)
    setResolvedToken(token)
    setAmount("")
    setError("")
    setStatus("")
    setTxHash("")
    void refreshDetail()
  }, [token.address])

  useEffect(() => {
    void refreshWallet()
  }, [address, resolvedToken.graduated, resolvedToken.poolAddress, stack?.bondingCurveAddress])

  useEffect(() => {
    if (!resolvedToken.graduated || !resolvedToken.poolAddress) {
      setReserves({ wlc: 0n, token: 0n })
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const pool = new ethers.Contract(resolvedToken.poolAddress, TORQR_POOL_ABI, readProvider)
        const next = await pool.getReserves()
        if (!cancelled) setReserves({ wlc: toBigInt(next?.[0]), token: toBigInt(next?.[1]) })
      } catch {
        if (!cancelled) setReserves({ wlc: 0n, token: 0n })
      }
    })()
    return () => { cancelled = true }
  }, [resolvedToken.graduated, resolvedToken.poolAddress])

  useEffect(() => {
    if (!stack || resolvedToken.graduated || remainingSupply <= 0n) {
      setMinimumBuyWlc(0n)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const bonding = new ethers.Contract(stack.bondingCurveAddress, TORQR_BONDING_CURVE_ABI, readProvider)
        const minimumTokenAmount = remainingSupply < oneTokenUnit ? remainingSupply : oneTokenUnit
        const oneTokenNetCost = await bonding.getBuyPrice(token.address, minimumTokenAmount)
        const next = calculateMinimumBuyGrossWlc({
          oneTokenNetCostWei: toBigInt(oneTokenNetCost),
          tradingFeeBps: TORQR_TRADING_FEE_BPS,
        })
        if (!cancelled) setMinimumBuyWlc(next)
      } catch {
        if (!cancelled) setMinimumBuyWlc(0n)
      }
    })()
    return () => { cancelled = true }
  }, [remainingSupply, resolvedToken.graduated, stack?.bondingCurveAddress, token.address])

  useEffect(() => {
    if (!stack || resolvedToken.graduated || mode !== "buy" || buyBudgetAfterFee <= 0n || remainingSupply <= 0n) {
      setBuyQuote(0n)
      setQuotePending(false)
      return
    }
    let cancelled = false
    setQuotePending(true)
    void (async () => {
      try {
        const bonding = new ethers.Contract(stack.bondingCurveAddress, TORQR_BONDING_CURVE_ABI, readProvider)
        const next = await estimateBuyTokensForWlc({
          budgetWlc: buyBudgetAfterFee,
          remainingSupply,
          getBuyPrice: async (value) => bonding.getBuyPrice(token.address, value),
        })
        if (!cancelled) setBuyQuote(next)
      } catch {
        if (!cancelled) setBuyQuote(0n)
      } finally {
        if (!cancelled) setQuotePending(false)
      }
    })()
    return () => { cancelled = true }
  }, [buyBudgetAfterFee, mode, remainingSupply, resolvedToken.graduated, stack?.bondingCurveAddress, token.address])

  useEffect(() => {
    if (!stack || resolvedToken.graduated || mode !== "sell" || parsedAmount <= 0n) {
      setSellQuote(0n)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const bonding = new ethers.Contract(stack.bondingCurveAddress, TORQR_BONDING_CURVE_ABI, readProvider)
        const next = await bonding.getSellPrice(token.address, parsedAmount)
        if (!cancelled) setSellQuote(toBigInt(next))
      } catch {
        if (!cancelled) setSellQuote(0n)
      }
    })()
    return () => { cancelled = true }
  }, [mode, parsedAmount, resolvedToken.graduated, stack?.bondingCurveAddress, token.address])

  useEffect(() => {
    if (!resolvedToken.graduated || !resolvedToken.poolAddress || parsedAmount <= 0n) {
      setSwapQuote(0n)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const pool = new ethers.Contract(resolvedToken.poolAddress, TORQR_POOL_ABI, readProvider)
        const next = await pool.getAmountOut(direction === "wlc-to-token", parsedAmount)
        if (!cancelled) setSwapQuote(toBigInt(next))
      } catch {
        if (!cancelled) setSwapQuote(0n)
      }
    })()
    return () => { cancelled = true }
  }, [direction, parsedAmount, resolvedToken.graduated, resolvedToken.poolAddress])

  async function runTx(action, execute, pendingText, successText) {
    setBusy(true)
    setError("")
    setStatus(pendingText)
    setTxAction(action)
    setTxHash("")
    try {
      const tx = await execute()
      setTxHash(tx.hash)
      await tx.wait()
      setStatus(successText)
      if (action !== "approve") setAmount("")
      await refreshDetail()
      await refreshWallet()
      await onRefreshMarket?.()
    } catch (nextError) {
      setStatus("")
      setError(getErrorMessage(nextError))
    } finally {
      setTxAction(null)
      setBusy(false)
    }
  }

  async function handleAction() {
    if (!isConnected) {
      try { await onConnect?.() } catch (nextError) { setError(getErrorMessage(nextError)) }
      return
    }
    if (!isCorrectChain) {
      try { await onSwitchWorldland?.() } catch (nextError) { setError(getErrorMessage(nextError)) }
      return
    }
    if (!signer) { setError("Wallet signer is not available."); return }
    if (parsedAmount <= 0n) return

    if (resolvedToken.graduated) {
      if (!resolvedToken.poolAddress) { setError("Pool address is not available yet."); return }
      const pool = new ethers.Contract(resolvedToken.poolAddress, TORQR_POOL_ABI, signer)
      const tokenContract = new ethers.Contract(token.address, TORQR_TOKEN_ABI, signer)
      if (requiresApproval) {
        await runTx("approve", () => tokenContract.approve(resolvedToken.poolAddress, parsedAmount), "Submitting approval transaction...", "Approval confirmed. You can swap now.")
        return
      }
      if (direction === "wlc-to-token") {
        await runTx("swap", () => pool.swap(true, 0n, minSwapOut, { value: parsedAmount }), "Submitting swap transaction...", "Swap confirmed.")
        return
      }
      await runTx("swap", () => pool.swap(false, parsedAmount, minSwapOut), "Submitting swap transaction...", "Swap confirmed.")
      return
    }

    if (!stack) { setError("Token stack is still resolving."); return }
    const bonding = new ethers.Contract(stack.bondingCurveAddress, TORQR_BONDING_CURVE_ABI, signer)
    const tokenContract = new ethers.Contract(token.address, TORQR_TOKEN_ABI, signer)
    if (mode === "buy") {
      if (buyQuote <= 0n) {
        setError(`Minimum buy right now is ${formatTorqrWlc(minimumBuyWlc)} WLC for about 1 ${resolvedToken.symbol}.`)
        return
      }
      await runTx("buy", () => bonding.buy(token.address, minBuyTokens, { value: parsedAmount }), "Submitting buy transaction...", "Buy confirmed.")
      return
    }
    if (requiresApproval) {
      await runTx("approve", () => tokenContract.approve(stack.bondingCurveAddress, parsedAmount), "Submitting approval transaction...", "Approval confirmed. You can sell now.")
      return
    }
    await runTx("sell", () => bonding.sell(token.address, parsedAmount, minSellWlc), "Submitting sell transaction...", "Sell confirmed.")
  }

  return (
    <div style={{ padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", marginTop: 14 }}>
      {resolvedToken.graduated ? (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button onClick={() => setDirection("wlc-to-token")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: direction === "wlc-to-token" ? "linear-gradient(135deg,#00e5a0,#00b880)" : "rgba(255,255,255,0.04)", color: direction === "wlc-to-token" ? "#08080e" : "rgba(255,255,255,0.55)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>WLC to {resolvedToken.symbol}</button>
            <button onClick={() => setDirection("token-to-wlc")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: direction === "token-to-wlc" ? "linear-gradient(135deg,#00e5a0,#00b880)" : "rgba(255,255,255,0.04)", color: direction === "token-to-wlc" ? "#08080e" : "rgba(255,255,255,0.55)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>{resolvedToken.symbol} to WLC</button>
          </div>
          <input value={amount} onChange={(event) => { setAmount(event.target.value); setError("") }} placeholder={direction === "wlc-to-token" ? "0.0 WLC" : `0.0 ${resolvedToken.symbol}`} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f0f0f5", fontSize: 14, fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }} />
          {direction === "token-to-wlc" ? <div style={{ marginBottom: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Balance: {isConnected ? formatTorqrTokenAmount(balance) : "0"} {resolvedToken.symbol}</div> : null}
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Estimated output</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#00e5a0" }}>{direction === "wlc-to-token" ? `${formatTorqrTokenAmount(swapQuote)} ${resolvedToken.symbol}` : `${formatTorqrWlc(swapQuote)} WLC`}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Pool Reserves</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#f0f0f5" }}>{formatTorqrWlc(reserves.wlc)} WLC | {formatTorqrWlc(reserves.token)} {resolvedToken.symbol}</span></div>
            {direction === "token-to-wlc" ? <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Allowance</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: requiresApproval ? "#ff4d6a" : "#00e5a0" }}>{requiresApproval ? "Approval required" : "Ready to swap"}</span></div> : null}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <button onClick={() => { setMode("buy"); setError("") }} style={{ padding: "14px 0", borderRadius: 10, border: "none", cursor: "pointer", background: mode === "buy" ? "linear-gradient(135deg,#00e5a0,#00b880)" : "rgba(255,255,255,0.04)", color: mode === "buy" ? "#08080e" : "rgba(255,255,255,0.55)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>Buy</button>
            <button onClick={() => { setMode("sell"); setError("") }} style={{ padding: "14px 0", borderRadius: 10, border: mode === "sell" ? "1px solid rgba(255,61,106,0.3)" : "1px solid rgba(255,255,255,0.08)", background: mode === "sell" ? "rgba(255,61,106,0.06)" : "rgba(255,255,255,0.03)", color: mode === "sell" ? "#ff4d6a" : "rgba(255,255,255,0.45)", cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>Sell</button>
          </div>
          <input value={amount} onChange={(event) => { setAmount(event.target.value); setError("") }} placeholder={mode === "buy" ? "0.0 WLC" : `0.0 ${resolvedToken.symbol}`} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f0f0f5", fontSize: 14, fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }} />
          {mode === "buy" ? <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>{QUICK_BUY_AMOUNTS.map((value) => <button key={value} onClick={() => { setAmount(value); setError("") }} style={{ flex: 1, padding: "8px 0", borderRadius: 999, border: "none", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{value}</button>)}</div> : <div style={{ marginBottom: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Balance: {isConnected ? formatTorqrTokenAmount(balance) : "0"} {resolvedToken.symbol}</div>}
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {mode === "buy" ? <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Estimated output</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#00e5a0" }}>{quotePending ? "Estimating..." : `${formatTorqrTokenAmount(buyQuote)} ${resolvedToken.symbol}`}</span></div> : null}
            {mode === "buy" && minimumBuyWlc > 0n ? <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: minimumBuyRequired ? "rgba(245,158,11,0.09)" : "rgba(255,255,255,0.03)", border: minimumBuyRequired ? "1px solid rgba(245,158,11,0.16)" : "1px solid transparent" }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Minimum buy now</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: minimumBuyRequired ? "#f6c466" : "#f0f0f5" }}>{formatTorqrWlc(minimumBuyWlc)} WLC</span></div> : null}
            {mode === "sell" ? <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Estimated WLC out</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#ff8fa0" }}>{formatTorqrWlc(sellQuote)} WLC</span></div> : null}
            {mode === "sell" ? <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Allowance</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: requiresApproval ? "#ff4d6a" : "#00e5a0" }}>{requiresApproval ? "Approval required" : "Ready to sell"}</span></div> : null}
          </div>
        </>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Slippage</div>
        <div style={{ display: "flex", gap: 8 }}>{TORQR_SLIPPAGE_OPTIONS.map((option) => <button key={option} onClick={() => setSlippageBps(option)} style={{ flex: 1, padding: "8px 0", borderRadius: 999, border: "none", background: slippageBps === option ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", color: slippageBps === option ? "#f0f0f5" : "rgba(255,255,255,0.55)", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{(option / 100).toFixed(1)}%</button>)}</div>
      </div>

      {status ? <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.16)", color: "#b6bcff", fontSize: 12 }}>{status}{txHash ? <div style={{ marginTop: 6 }}><a href={txUrl(txHash)} target="_blank" rel="noreferrer" style={{ color: "#d8dcff", textDecoration: "underline" }}>View transaction</a></div> : null}</div> : null}
      {minimumBuyRequired ? <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.16)", color: "#f6c466", fontSize: 12 }}>This amount is too small to buy 1 full {resolvedToken.symbol}. Minimum buy right now is {formatTorqrWlc(minimumBuyWlc)} WLC.</div> : null}
      {error ? <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.16)", color: "#ff9aaa", fontSize: 12 }}>{error}</div> : null}

      <button type="button" onClick={handleAction} disabled={actionDisabled} style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", cursor: actionDisabled ? "not-allowed" : "pointer", opacity: actionDisabled ? 0.55 : 1, background: resolvedToken.graduated ? (requiresApproval ? "linear-gradient(135deg,#ffd15c,#ffb400)" : "linear-gradient(135deg,#00e5a0,#00b880)") : mode === "buy" ? "linear-gradient(135deg,#00e5a0,#00b880)" : requiresApproval ? "linear-gradient(135deg,#ffd15c,#ffb400)" : "linear-gradient(135deg,#ff667f,#ff4d6a)", color: "#08080e", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>{actionLabel}</button>
    </div>
  )
}
