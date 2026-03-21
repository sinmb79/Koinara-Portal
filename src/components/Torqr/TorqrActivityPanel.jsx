import { useEffect, useMemo, useState } from "react"

import { addrUrl, shortAddress, txUrl } from "../../lib/chain.js"
import {
  estimateTorqrFallbackPrice,
  formatTorqrActivityAmount,
  formatTorqrActivityPrice,
  loadTorqrTradeActivity,
  summarizeTorqrTrades,
} from "../../lib/torqrActivity.js"

function StatCard({ label, value, accent = "#f0f0f5" }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: accent }}>{value}</div>
    </div>
  )
}

function buildChartPoints(series, width, height, padding) {
  if (!series.length) return []

  const prices = series.map((point) => point.priceFloat)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const range = Math.max(maxPrice - minPrice, maxPrice * 0.02, 0.000001)
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  return series.map((point, index) => {
    const x = series.length === 1
      ? width / 2
      : padding + (index / (series.length - 1)) * innerWidth
    const ratio = (point.priceFloat - minPrice) / range
    const y = height - padding - ratio * innerHeight
    return { x, y }
  })
}

function ActivityChart({ series }) {
  const width = 480
  const height = 160
  const padding = 14
  const points = buildChartPoints(series, width, height, padding)

  if (points.length === 0) {
    return (
      <div style={{ height: 160, display: "grid", placeItems: "center", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.28)", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
        Waiting for first trade...
      </div>
    )
  }

  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
  const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
  const lastPoint = points[points.length - 1]

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)", background: "linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 160, display: "block" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="torqrActivityArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={padding + (height - padding * 2) * ratio}
            y2={padding + (height - padding * 2) * ratio}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}
        <path d={area} fill="url(#torqrActivityArea)" />
        <path d={line} fill="none" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="4.5" fill="#08080e" stroke="#00e5ff" strokeWidth="2" />
      </svg>
    </div>
  )
}

function TradeRow({ trade, symbol }) {
  const isBuy = trade.type === "buy"

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
        <span style={{ padding: "3px 8px", borderRadius: 999, background: isBuy ? "rgba(0,229,160,0.12)" : "rgba(255,77,106,0.12)", color: isBuy ? "#00e5a0" : "#ff6b82", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {trade.type}
        </span>
        <span style={{ padding: "3px 8px", borderRadius: 999, background: trade.source === "amm" ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)", color: trade.source === "amm" ? "#9aa4ff" : "rgba(255,255,255,0.45)", fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>
          {trade.source === "amm" ? "AMM" : "Curve"}
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#f0f0f5" }}>{formatTorqrActivityPrice(trade.priceFloat)} WLC</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.24)" }}>/ {symbol}</span>
        </div>
        <div style={{ marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.32)" }}>
          <span>{formatTorqrActivityAmount(trade.wlcAmountFloat, "WLC")}</span>
          <span>{formatTorqrActivityAmount(trade.tokenAmountFloat, symbol)}</span>
          <a href={addrUrl(trade.trader)} target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>{shortAddress(trade.trader)}</a>
        </div>
      </div>
      <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
        <div>{trade.time}</div>
        <a href={txUrl(trade.txHash)} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 4, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>tx</a>
      </div>
    </div>
  )
}

export default function TorqrActivityPanel({ token }) {
  const fallbackPrice = useMemo(
    () => estimateTorqrFallbackPrice(token),
    [token.address, token.mcapDisplay, token.reserveWlc, token.soldSupply],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [trades, setTrades] = useState([])
  const [summary, setSummary] = useState(() => summarizeTorqrTrades([], fallbackPrice))

  useEffect(() => {
    let cancelled = false

    async function syncActivity() {
      setLoading(true)
      setError("")

      try {
        const next = await loadTorqrTradeActivity(token, { limit: 20 })
        if (cancelled) return
        setTrades(next.trades)
        setSummary(summarizeTorqrTrades(next.trades, fallbackPrice))
      } catch (nextError) {
        if (cancelled) return
        setTrades([])
        setSummary(summarizeTorqrTrades([], fallbackPrice))
        setError(String(nextError?.message || "Trade activity could not be loaded."))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void syncActivity()
    return () => {
      cancelled = true
    }
  }, [token.address, token.poolAddress, token.stackKey, fallbackPrice])

  const displayedTrades = trades.slice(0, 8)
  const changeAccent = summary.changePct > 0 ? "#00e5a0" : summary.changePct < 0 ? "#ff6b82" : "#f0f0f5"

  return (
    <div style={{ marginTop: 14, padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "#f0f0f5" }}>Recent Trading Activity</div>
          <div style={{ marginTop: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
            Lightweight on-chain activity, loaded only on this token detail.
          </div>
        </div>
        {loading ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Syncing...</span> : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 14 }}>
        <StatCard label="Last Price" value={`${formatTorqrActivityPrice(summary.lastPrice)} WLC`} accent="#00e5ff" />
        <StatCard label="Recent Range" value={`${formatTorqrActivityPrice(summary.lowPrice)} - ${formatTorqrActivityPrice(summary.highPrice)}`} />
        <StatCard label="Change / Trades" value={`${summary.changePct >= 0 ? "+" : ""}${summary.changePct.toFixed(2)}% | ${summary.tradeCount}`} accent={changeAccent} />
      </div>

      <ActivityChart series={summary.series} />

      {error ? (
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.16)", color: "#f6c466", fontSize: 12 }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 2 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Latest trades</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{token.graduated ? "Curve + AMM history" : "Bonding curve history"}</div>
        </div>
        {displayedTrades.length ? (
          displayedTrades.map((trade) => <TradeRow key={trade.id} trade={trade} symbol={token.symbol} />)
        ) : (
          <div style={{ padding: "16px 0 4px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            No recent trades yet. The chart will start moving after the first live buy or sell.
          </div>
        )}
      </div>
    </div>
  )
}
