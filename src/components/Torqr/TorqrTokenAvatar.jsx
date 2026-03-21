import { useState } from "react"

import { getTorqrTokenVisual } from "../../lib/torqrMedia.js"

export default function TorqrTokenAvatar({ token, size = 40, radius = 10, fontSize = 12 }) {
  const [broken, setBroken] = useState(false)
  const visual = !broken ? getTorqrTokenVisual(token) : { kind: "badge", label: token?.badge || "??" }

  if (visual.kind === "image") {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <img
          src={visual.src}
          alt={visual.alt}
          loading="lazy"
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", fontSize, fontWeight: 700, border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
      {visual.label}
    </div>
  )
}
