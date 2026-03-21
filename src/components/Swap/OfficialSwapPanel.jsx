import { useState } from "react"
import { getDirectionLabel, getDirectionAssets, getSwapReadiness } from "../../lib/officialSwap.js"
import { isSwapLive } from "../../lib/officialSwapConfig.js"
import { Button, StatusPill } from "../ui.jsx"

const DIRECTION_OPTIONS = ["BUY", "SELL"]

export default function OfficialSwapPanel({ connected = false, network = "", lang = "en", onConnect }) {
  const [direction, setDirection] = useState("BUY")
  const [amount, setAmount] = useState("")
  const assets = getDirectionAssets(direction)
  const readiness = getSwapReadiness({ connected, network })
  const live = isSwapLive()

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="mb-5 flex gap-2">
        {DIRECTION_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDirection(option)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              direction === option
                ? "border-primary bg-primary/15 text-primary"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {getDirectionLabel(option, lang)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {lang === "ko" ? "\ubcf4\ub0b4\ub294 \uc790\uc0b0" : "From"}
            </span>
            <StatusPill tone="dim">{assets.from}</StatusPill>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={!live}
            className="mt-2 w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-slate-600 disabled:opacity-40"
          />
        </div>

        <div className="flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-500">
            {"\u2195"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {lang === "ko" ? "\ubc1b\ub294 \uc790\uc0b0" : "To"}
            </span>
            <StatusPill tone="dim">{assets.to}</StatusPill>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-500">{"\u2014"}</div>
        </div>
      </div>

      <div className="mt-5">
        {!live ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4 text-center">
            <div className="text-sm font-semibold text-slate-400">
              {lang === "ko" ? "\uc544\uc9c1 \uc624\ud508\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4" : "Not Live Yet"}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {lang === "ko"
                ? "\uacf5\uc2dd \ud480 \uc8fc\uc18c\uc640 \uac70\ub798\uc18c\uac00 \ud655\uc778\ub418\uba74 \ud65c\uc131\ud654\ub429\ub2c8\ub2e4."
                : "The swap will activate once the official pool address and venue are confirmed."}
            </p>
          </div>
        ) : !connected ? (
          <Button variant="primary" full onClick={onConnect}>
            {lang === "ko" ? "\uc9c0\uac11 \uc5f0\uacb0" : "Connect Wallet"}
          </Button>
        ) : readiness.reason === "wrong_network" ? (
          <Button variant="primary" full disabled>
            {lang === "ko" ? "Worldland Mainnet\uc73c\ub85c \uc804\ud658\ud558\uc138\uc694" : "Switch to Worldland Mainnet"}
          </Button>
        ) : (
          <Button variant="primary" full disabled={!amount || Number(amount) <= 0}>
            {lang === "ko" ? "\uc2a4\uc651 \ud655\uc778" : "Confirm Swap"}
          </Button>
        )}
      </div>
    </div>
  )
}
