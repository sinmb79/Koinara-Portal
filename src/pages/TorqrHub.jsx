import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { TORQR_HUB_COPY } from "../lib/torqrHubContent.js"

const HOME_ROUTE = "/torqr"

const RESTRICTED = [
  { code: "KR", name: "South Korea", law: "FSC guidance and local virtual asset rules" },
  { code: "US", name: "United States", law: "Securities Act 1933 and SEC regulations" },
  { code: "CN", name: "China", law: "PRC crypto trading restrictions" },
  { code: "GB", name: "United Kingdom", law: "Financial Services and Markets Act 2000" },
  { code: "SG", name: "Singapore", law: "Payment Services Act 2019" },
  { code: "JP", name: "Japan", law: "Payment Services Act and FIEA" },
  { code: "CA", name: "Canada", law: "CSA guidance" },
  { code: "AU", name: "Australia", law: "Corporations Act 2001 and ASIC guidance" },
  { code: "HK", name: "Hong Kong", law: "Securities and Futures Ordinance" },
  { code: "KP", name: "North Korea", law: "OFAC sanctions" },
  { code: "IR", name: "Iran", law: "OFAC sanctions" },
  { code: "CU", name: "Cuba", law: "OFAC sanctions" },
  { code: "SY", name: "Syria", law: "OFAC sanctions" },
]

const TOKENS = [
  { id: 1, name: "WorldCat", symbol: "WCAT", creator: "0x7a3f...e21b", mcap: 8.7, volume24h: 3.2, progress: 87, holders: 142, txCount: 891, createdAgo: "2h", badge: "WC", change: 23.4, graduated: false },
  { id: 2, name: "Seoul Punk", symbol: "SPNK", creator: "0x3b1c...f90a", mcap: 7.1, volume24h: 2.8, progress: 71, holders: 98, txCount: 634, createdAgo: "4h", badge: "SP", change: 15.7, graduated: false },
  { id: 3, name: "KimchiDAO", symbol: "KCHI", creator: "0x9e2d...a43c", mcap: 11.2, volume24h: 5.1, progress: 100, holders: 267, txCount: 1843, createdAgo: "1d", badge: "KD", change: -2.1, graduated: true },
  { id: 4, name: "BullRun AI", symbol: "BRAI", creator: "0x1f8e...b72d", mcap: 6.3, volume24h: 4.7, progress: 63, holders: 201, txCount: 1290, createdAgo: "6h", badge: "BA", change: 45.2, graduated: false },
  { id: 5, name: "NeonDrift", symbol: "NEON", creator: "0x5c0a...d19f", mcap: 5.8, volume24h: 1.9, progress: 58, holders: 77, txCount: 412, createdAgo: "8h", badge: "ND", change: 8.3, graduated: false },
  { id: 6, name: "Dokdo Whale", symbol: "DKDO", creator: "0x2e7b...c84a", mcap: 9.4, volume24h: 3.8, progress: 94, holders: 189, txCount: 1102, createdAgo: "12h", badge: "DW", change: 31.6, graduated: false },
  { id: 7, name: "GangnamStyle", symbol: "GNMS", creator: "0x8f3d...e56b", mcap: 4.2, volume24h: 1.1, progress: 42, holders: 54, txCount: 287, createdAgo: "30m", badge: "GS", change: 67.8, graduated: false },
  { id: 8, name: "HanRiver", symbol: "HRVR", creator: "0x4a6c...f23e", mcap: 10.8, volume24h: 4.3, progress: 100, holders: 312, txCount: 2104, createdAgo: "2d", badge: "HR", change: -5.3, graduated: true },
  { id: 9, name: "MetaMonkey", symbol: "MMKY", creator: "0x6d1f...a98c", mcap: 3.1, volume24h: 2.4, progress: 31, holders: 41, txCount: 198, createdAgo: "15m", badge: "MM", change: 112.5, graduated: false },
  { id: 10, name: "CryptoRamen", symbol: "RAMN", creator: "0xb2e5...d71a", mcap: 5.5, volume24h: 1.6, progress: 55, holders: 83, txCount: 501, createdAgo: "10h", badge: "CR", change: 4.2, graduated: false },
  { id: 11, name: "SojuToken", symbol: "SOJU", creator: "0xc7a9...e34b", mcap: 7.8, volume24h: 3.5, progress: 78, holders: 156, txCount: 923, createdAgo: "18h", badge: "SJ", change: 19.1, graduated: false },
  { id: 12, name: "ZeroGravity", symbol: "0GRV", creator: "0xd4f2...b89c", mcap: 2.3, volume24h: 0.8, progress: 23, holders: 29, txCount: 134, createdAgo: "5m", badge: "ZG", change: 189.3, graduated: false },
].map((token) => ({ ...token, slug: token.symbol.toLowerCase() }))

const LIVE_TXS = [
  { type: "buy", token: "WCAT", amount: "0.5 WLC", time: "just now" },
  { type: "sell", token: "SPNK", amount: "0.2 WLC", time: "2s ago" },
  { type: "buy", token: "BRAI", amount: "1.2 WLC", time: "5s ago" },
  { type: "create", token: "0GRV", amount: "1 WLC", time: "8s ago" },
  { type: "buy", token: "DKDO", amount: "0.8 WLC", time: "12s ago" },
  { type: "buy", token: "GNMS", amount: "2.1 WLC", time: "15s ago" },
  { type: "sell", token: "RAMN", amount: "0.3 WLC", time: "20s ago" },
]

const TERMS = [
  ["1. No Investment Advice.", "Nothing on this interface constitutes investment, financial, or trading advice. Conduct your own research and consult an independent adviser."],
  ["2. No Warranties.", "This protocol and interface are provided as is without warranties of any kind, express or implied."],
  ["3. Risk of Loss.", "Tokens created on this platform are highly speculative and may lose all value. You could lose all funds."],
  ["4. Restricted Jurisdictions.", "This interface is not available to persons in restricted jurisdictions. Users are solely responsible for ensuring compliance with local laws."],
  ["5. Smart Contract Risk.", "Interacting with smart contracts carries risks including bugs, exploits, and economic attacks."],
  ["6. No Fiduciary Relationship.", "Use does not create any fiduciary, advisory, brokerage, or exchange relationship with the developers."],
  ["7. Regulatory Status.", "This protocol is not registered with any financial regulatory authority. Tokens may be regulated differently across jurisdictions."],
  ["8. Limitation of Liability.", "Developers are not liable for indirect, incidental, consequential, or punitive damages resulting from your use of the protocol."],
]

function loadGateState() {
  if (typeof window === "undefined") return "gate"
  return window.localStorage.getItem("torqr_gate_state") === "accepted" ? "ok" : "gate"
}

function persistGateState(nextState) {
  if (typeof window === "undefined") return
  if (nextState === "ok") window.localStorage.setItem("torqr_gate_state", "accepted")
  else window.localStorage.removeItem("torqr_gate_state")
}

function ProgressBar({ value, graduated }) {
  return (
    <div style={{ width: "100%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.min(value, 100)}%`,
          height: "100%",
          borderRadius: 2,
          background: graduated ? "#22c55e" : value > 80 ? "linear-gradient(90deg,#f0f000,#ff6b00)" : "linear-gradient(90deg,#00e5ff,#6366f1)",
          transition: "width 0.6s ease",
        }}
      />
    </div>
  )
}

function Ticker() {
  const items = [...LIVE_TXS, ...LIVE_TXS, ...LIVE_TXS]
  return (
    <div style={{ display: "flex", gap: 24, overflow: "hidden", padding: "10px 0", maskImage: "linear-gradient(90deg,transparent 0%,#000 5%,#000 95%,transparent 100%)" }}>
      <div style={{ display: "flex", gap: 24, animation: "tickerScroll 30s linear infinite", whiteSpace: "nowrap" }}>
        {items.map((tx, index) => (
          <span key={`${tx.token}-${tx.time}-${index}`} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: tx.type === "buy" ? "#00e5a0" : tx.type === "sell" ? "#ff4d6a" : "#6366f1", flexShrink: 0 }} />
            <span style={{ color: tx.type === "buy" ? "#00e5a0" : tx.type === "sell" ? "#ff4d6a" : "#6366f1" }}>{tx.type === "buy" ? "BUY" : tx.type === "sell" ? "SELL" : "NEW"}</span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{tx.token}</span>
            <span>{tx.amount}</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span>{tx.time}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function ComplianceGate({ checks, onToggle, onAccept, onReject }) {
  const [showList, setShowList] = useState(false)
  const allOk = checks.a && checks.b && checks.c
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#08080e", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 540, animation: "slideUp 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#00e5ff,#6366f1)", display: "grid", placeItems: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#08080e" }}>T</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: "#f0f0f5" }}>torqr</span>
        </div>
        <div style={{ background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "28px 32px 0" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 50, background: "rgba(255,200,0,0.08)", border: "1px solid rgba(255,200,0,0.15)", marginBottom: 16 }}>
              <span style={{ fontSize: 13 }}>!</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#ffc800", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{TORQR_HUB_COPY.legalBadge}</span>
            </div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", color: "#f0f0f5", marginBottom: 12, lineHeight: 1.3 }}>{TORQR_HUB_COPY.gateTitle}</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 8 }}>
              Torqr is a decentralized token launchpad protocol on WorldLand blockchain. This interface is <strong style={{ color: "rgba(255,255,255,0.7)" }}>not available</strong> to residents, citizens, or persons located in restricted jurisdictions.
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 20 }}>
              By proceeding, you confirm you are not subject to restrictions under applicable laws, regulations, or sanctions programs.
            </p>
          </div>
          <div style={{ padding: "0 32px" }}>
            <button onClick={() => setShowList((value) => !value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>View {RESTRICTED.length} Restricted Jurisdictions</span>
              <span style={{ transform: showList ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", fontSize: 10 }}>v</span>
            </button>
            {showList ? (
              <div style={{ marginTop: 2, borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)", maxHeight: 240, overflowY: "auto" }}>
                {RESTRICTED.map((item, index) => (
                  <div key={item.code} style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 12, alignItems: "start", padding: "11px 16px", borderBottom: index < RESTRICTED.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, color: "rgba(255,80,80,0.6)", background: "rgba(255,80,80,0.06)", padding: "3px 0", borderRadius: 4, textAlign: "center" }}>{item.code}</span>
                    <div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: "rgba(255,255,255,0.2)", marginTop: 3, lineHeight: 1.5 }}>{item.law}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div style={{ padding: "20px 32px 0" }}>
            {[
              { key: "a", text: "I confirm that I am not a resident, citizen, or person located in a restricted jurisdiction." },
              { key: "b", text: "I confirm that I am not a U.S. Person as defined under Regulation S of the U.S. Securities Act of 1933." },
              { key: "c", text: "I understand that tokens are highly speculative, may have zero value, and I accept all risks of financial loss." },
            ].map((item) => (
              <label key={item.key} onClick={() => onToggle(item.key)} style={{ display: "flex", gap: 12, cursor: "pointer", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1, border: checks[item.key] ? "none" : "1.5px solid rgba(255,255,255,0.15)", background: checks[item.key] ? "linear-gradient(135deg,#00e5ff,#6366f1)" : "transparent", display: "grid", placeItems: "center", transition: "all 0.15s" }}>
                  {checks[item.key] ? <span style={{ color: "#08080e", fontSize: 12, fontWeight: 700 }}>OK</span> : null}
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{item.text}</span>
              </label>
            ))}
          </div>
          <div style={{ padding: "24px 32px 28px" }}>
            <button onClick={onAccept} disabled={!allOk} style={{ width: "100%", padding: "15px 0", borderRadius: 10, border: "none", cursor: allOk ? "pointer" : "not-allowed", background: allOk ? "linear-gradient(135deg,#00e5ff,#6366f1)" : "rgba(255,255,255,0.04)", color: allOk ? "#08080e" : "rgba(255,255,255,0.15)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, transition: "all 0.2s", marginBottom: 10 }}>
              {TORQR_HUB_COPY.enterApp}
            </button>
            <button onClick={onReject} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              I am in a restricted jurisdiction - Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RejectedScreen({ onBack }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#08080e", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 460, animation: "slideUp 0.4s ease" }}>
        <div style={{ fontSize: 40, marginBottom: 20, color: "#ff4d6a" }}>!</div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#f0f0f5", marginBottom: 12 }}>{TORQR_HUB_COPY.accessRestricted}</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 10 }}>
          Torqr is not available in your jurisdiction. Using a VPN or similar methods to circumvent geographic restrictions may violate local law.
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 32 }}>
          If you believe this is an error, please review the restricted jurisdictions list again.
        </p>
        <button onClick={onBack} style={{ padding: "12px 28px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13 }}>Go Back</button>
      </div>
    </div>
  )
}

function TokenRow({ token, index, onOpen }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onClick={() => onOpen(token)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ display: "grid", gridTemplateColumns: "32px 44px 1fr auto auto auto", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer", background: hovered ? "rgba(255,255,255,0.03)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", animation: `fadeSlideIn 0.3s ease ${index * 0.03}s both` }}>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>{token.graduated ? "AMM" : `#${index + 1}`}</span>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'JetBrains Mono',monospace" }}>{token.badge}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#f0f0f5" }}>{token.name}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>${token.symbol}</span>
          {token.graduated ? <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 50, background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>AMM</span> : null}
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace" }}>{token.createdAgo}</span>
        </div>
        <div style={{ marginTop: 6 }}><ProgressBar value={token.progress} graduated={token.graduated} /></div>
      </div>
      <div style={{ textAlign: "right", minWidth: 70 }}><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600 }}>{token.mcap.toFixed(1)} WLC</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>mcap</div></div>
      <div style={{ textAlign: "right", minWidth: 60 }}><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600 }}>{token.volume24h.toFixed(1)}</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>vol</div></div>
      <div style={{ textAlign: "right", minWidth: 60 }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: token.change >= 0 ? "#00e5a0" : "#ff4d6a" }}>{token.change >= 0 ? "+" : ""}{token.change.toFixed(1)}%</span></div>
    </div>
  )
}

function TermsModal({ onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 24, animation: "modalBg 0.2s ease" }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 580, background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden", animation: "slideUp 0.3s ease", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ padding: "28px 32px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#0e0e1a", zIndex: 1 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{TORQR_HUB_COPY.termsTitle}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center" }}>x</button>
        </div>
        <div style={{ padding: "24px 32px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
          {TERMS.map(([title, body]) => (
            <p key={title} style={{ marginBottom: 16 }}>
              <strong style={{ color: "rgba(255,255,255,0.7)" }}>{title}</strong> {body}
            </p>
          ))}
          <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: "rgba(255,200,0,0.04)", border: "1px solid rgba(255,200,0,0.1)" }}>
            <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,200,0,0.6)", lineHeight: 1.7 }}>
              Using a VPN or other means to circumvent geographic restrictions is a violation of these terms and may also violate the laws of your jurisdiction.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ walletConnected, form, onChange, onClose }) {
  const ready = Boolean(form.name && form.symbol)
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 24, animation: "modalBg 0.2s ease" }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden", animation: "slideUp 0.3s ease" }}>
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{TORQR_HUB_COPY.createButton}</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>Deploy ERC-20 on WorldLand | 1 WLC fee</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center" }}>x</button>
        </div>
        <div style={{ padding: "24px 28px" }}>
          {[
            { key: "name", label: "Token Name", placeholder: "e.g. WorldCat", maxLength: 32 },
            { key: "symbol", label: "Symbol", placeholder: "e.g. WCAT", maxLength: 8, mono: true },
            { key: "desc", label: "Description", placeholder: "A brief description...", multiline: true },
            { key: "img", label: "Image URI", placeholder: "https://... or ipfs://..." },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: 18 }}>
              <label style={{ display: "block", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{field.label}</label>
              {field.multiline ? (
                <textarea value={form[field.key]} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f0f0f5", fontSize: 14, fontFamily: "'DM Sans',sans-serif", resize: "vertical" }} />
              ) : (
                <input value={form[field.key]} onChange={(event) => onChange(field.key, field.key === "symbol" ? event.target.value.toUpperCase() : event.target.value)} placeholder={field.placeholder} maxLength={field.maxLength} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f0f0f5", fontSize: 14, fontFamily: field.mono ? "'JetBrains Mono',monospace" : "'DM Sans',sans-serif" }} />
              )}
            </div>
          ))}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 20 }}>
            {[
              ["Total Supply", "1,000,000,000", null],
              ["Bonding Curve", "80%", "#00e5ff"],
              ["Creator (vested)", "20%", "#ff4d6a"],
              ["Creation Fee", "1 WLC", null],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
                <span style={{ color: color || "rgba(255,255,255,0.6)" }}>{value}</span>
              </div>
            ))}
          </div>
          <button disabled={!ready} style={{ width: "100%", padding: "14px 0", borderRadius: 10, border: "none", cursor: ready ? "pointer" : "not-allowed", background: ready ? "linear-gradient(135deg,#00e5ff,#6366f1)" : "rgba(255,255,255,0.06)", color: ready ? "#08080e" : "rgba(255,255,255,0.2)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>
            {walletConnected ? "Deploy Token" : "Connect Wallet to Deploy"}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ token, onClose }) {
  const stats = [
    ["Market Cap", `${token.mcap.toFixed(1)} WLC`, null],
    ["24h Volume", `${token.volume24h.toFixed(1)} WLC`, null],
    ["24h Change", `${token.change >= 0 ? "+" : ""}${token.change.toFixed(1)}%`, token.change >= 0 ? "#00e5a0" : "#ff4d6a"],
    ["Holders", token.holders.toLocaleString(), null],
    ["Transactions", token.txCount.toLocaleString(), null],
    ["Progress", `${token.progress}%`, null],
  ]

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 24, animation: "modalBg 0.2s ease" }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden", animation: "slideUp 0.3s ease" }}>
        <div style={{ padding: "24px 28px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700, border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'JetBrains Mono',monospace" }}>{token.badge}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{token.name}</span>
                {token.graduated ? <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 50, background: "rgba(34,197,94,0.12)", color: "#22c55e", fontWeight: 600 }}>AMM LIVE</span> : null}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>${token.symbol} | {token.createdAgo} ago</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center" }}>x</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(255,255,255,0.02)" }}>
          {stats.map(([label, value, color]) => (
            <div key={label} style={{ padding: "16px 20px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: color || "#f0f0f5" }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Graduation Progress</span>
            <span style={{ color: token.graduated ? "#22c55e" : "#f0f0f5" }}>{token.graduated ? "Graduated" : `${token.progress}% / 10 WLC`}</span>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.04)" }}><div style={{ width: `${Math.min(token.progress, 100)}%`, height: "100%", borderRadius: 4, background: token.graduated ? "#22c55e" : token.progress > 80 ? "linear-gradient(90deg,#f0f000,#ff6b00)" : "linear-gradient(90deg,#00e5ff,#6366f1)" }} /></div>
        </div>
        <div style={{ padding: "0 28px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button style={{ padding: "14px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#00e5a0,#00b880)", color: "#08080e", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>Buy</button>
            <button style={{ padding: "14px 0", borderRadius: 10, border: "1px solid rgba(255,61,106,0.3)", background: "rgba(255,61,106,0.06)", color: "#ff4d6a", cursor: "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>Sell</button>
          </div>
          <div style={{ marginTop: 12, textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.15)" }}>creator: {token.creator} | 1% fee | slippage protected</div>
        </div>
      </div>
    </div>
  )
}

export default function TorqrHub() {
  const navigate = useNavigate()
  const location = useLocation()
  const [gate, setGate] = useState(loadGateState)
  const [checks, setChecks] = useState({ a: false, b: false, c: false })
  const [tab, setTab] = useState("trending")
  const [search, setSearch] = useState("")
  const [walletConnected, setWalletConnected] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [form, setForm] = useState({ name: "", symbol: "", desc: "", img: "" })

  useEffect(() => {
    persistGateState(gate)
  }, [gate])

  const showCreate = String(location.pathname || "").startsWith("/torqr/create")
  const selectedToken = useMemo(() => {
    const match = String(location.pathname || "").match(/\/torqr\/token\/([^/]+)$/)
    if (!match) return null
    const slug = match[1].toLowerCase()
    return TOKENS.find((token) => token.slug === slug || token.symbol.toLowerCase() === slug) || null
  }, [location.pathname])

  const visibleTokens = useMemo(() => {
    let list = [...TOKENS]
    if (search) {
      const query = search.toLowerCase()
      list = list.filter((token) => token.name.toLowerCase().includes(query) || token.symbol.toLowerCase().includes(query))
    }
    switch (tab) {
      case "trending":
        return list.sort((left, right) => right.volume24h - left.volume24h)
      case "new":
        return list.sort((left, right) => left.id - right.id)
      case "graduating":
        return list.filter((token) => !token.graduated).sort((left, right) => right.progress - left.progress)
      case "graduated":
        return list.filter((token) => token.graduated)
      default:
        return list
    }
  }, [search, tab])

  function toggleCheck(key) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreate() {
    navigate("/torqr/create")
  }

  function closeModal() {
    navigate(HOME_ROUTE)
  }

  function openToken(token) {
    navigate(`/torqr/token/${token.slug}`)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08080e", color: "#f0f0f5", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalBg { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(0,229,255,0.2); }
        input:focus, textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        @media (max-width: 980px) {
          .torqr-topbar, .torqr-stats, .torqr-header, .torqr-table-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {gate === "gate" ? <ComplianceGate checks={checks} onToggle={toggleCheck} onAccept={() => setGate("ok")} onReject={() => setGate("no")} /> : null}
      {gate === "no" ? <RejectedScreen onBack={() => setGate("gate")} /> : null}

      {gate === "ok" ? (
        <>
          <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,8,14,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 24px" }}>
            <div className="torqr-topbar" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 20, minHeight: 60 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <button onClick={() => navigate(HOME_ROUTE)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "transparent", border: "none", color: "#f0f0f5" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#00e5ff,#6366f1)", display: "grid", placeItems: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#08080e" }}>T</div>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>torqr</span>
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3, flexWrap: "wrap" }}>
                  {[
                    ["trending", "Trending"],
                    ["new", "New"],
                    ["graduating", "Graduating"],
                    ["graduated", "AMM"],
                  ].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, background: tab === key ? "rgba(255,255,255,0.08)" : "transparent", color: tab === key ? "#f0f0f5" : "rgba(255,255,255,0.35)", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Link to="/ecosystem" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Back to Koinara</Link>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.2)", pointerEvents: "none" }}>?</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tokens..." style={{ width: 200, padding: "8px 12px 8px 34px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "#f0f0f5", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }} />
                </div>
                <button onClick={openCreate} style={{ padding: "9px 20px", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#00e5ff,#6366f1)", color: "#08080e", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>+ {TORQR_HUB_COPY.createButton}</button>
                <button onClick={() => setWalletConnected((value) => !value)} style={{ padding: "9px 18px", borderRadius: 8, border: walletConnected ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)", background: walletConnected ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", color: walletConnected ? "#22c55e" : "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>
                  {walletConnected ? "0x7a3f...e21b" : TORQR_HUB_COPY.connectWallet}
                </button>
              </div>
            </div>
          </nav>

          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 24px", background: "rgba(255,255,255,0.01)" }}><div style={{ maxWidth: 1280, margin: "0 auto" }}><Ticker /></div></div>

          <main style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
            <div className="torqr-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, margin: "24px 0", borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
              {[
                ["Total Tokens", "12", "TK"],
                ["24h Volume", "34.2 WLC", "VOL"],
                ["Graduated", "2", "AMM"],
                ["Active Traders", "487", "USR"],
              ].map(([label, value, icon], index) => (
                <div key={label} style={{ padding: "20px 24px", background: "rgba(255,255,255,0.02)", borderRight: index < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#00e5ff" }}>{icon}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em" }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="torqr-header" style={{ display: "grid", gridTemplateColumns: "32px 44px 1fr auto auto auto", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["#", "", "Token", "Market Cap", "Volume", "24h"].map((heading, index) => (
                <span key={`${heading}-${index}`} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.15)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: index > 2 ? "right" : "left", minWidth: index === 3 ? 70 : index > 3 ? 60 : undefined }}>{heading}</span>
              ))}
            </div>

            <div style={{ marginBottom: 40 }}>
              {visibleTokens.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>No tokens found</div>
              ) : (
                visibleTokens.map((token, index) => (
                  <TokenRow key={token.id} token={token} index={index} onOpen={openToken} />
                ))
              )}
            </div>
          </main>

          {showCreate ? <CreateModal walletConnected={walletConnected} form={form} onChange={updateForm} onClose={closeModal} /> : null}
          {selectedToken ? <DetailModal token={selectedToken} onClose={closeModal} /> : null}
          {showTerms ? <TermsModal onClose={() => setShowTerms(false)} /> : null}

          <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "20px 24px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.15)" }}>torqr | Token launchpad on WorldLand | Open source (MIT)</span>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <button onClick={() => setShowTerms(true)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", cursor: "pointer", background: "transparent", border: "none", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.08)", textUnderlineOffset: 3 }}>Terms & Disclaimer</button>
                <button onClick={() => setGate("gate")} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", cursor: "pointer", background: "transparent", border: "none", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.08)", textUnderlineOffset: 3 }}>Restricted Jurisdictions</button>
                <a href="https://github.com/sinmb79/torqr" target="_blank" rel="noreferrer" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>GitHub</a>
              </div>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  )
}
