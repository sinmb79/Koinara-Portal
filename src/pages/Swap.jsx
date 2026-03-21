import useStore from "../lib/store.js"
import { getOfficialSwapConfig } from "../lib/officialSwapConfig.js"
import { StatusPill } from "../components/ui.jsx"
import OfficialSwapPanel from "../components/Swap/OfficialSwapPanel.jsx"
import OfficialSwapDisclosure from "../components/Swap/OfficialSwapDisclosure.jsx"

export default function Swap() {
  const { lang, connected, chainId } = useStore()
  const cfg = getOfficialSwapConfig()

  const network = chainId === 103 ? "worldland" : chainId === 8453 ? "base" : ""

  return (
    <div className="page-shell py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary/80">Swap</span>
          <StatusPill tone="success">Worldland Mainnet</StatusPill>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          {lang === "ko" ? "\uacf5\uc2dd KOIN/WLC \ub9c8\ucf13" : "Official KOIN/WLC Market"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          {lang === "ko"
            ? "Worldland Mainnet\uc758 \uacf5\uc2dd KOIN/WLC \ub9c8\ucf13\uc785\ub2c8\ub2e4. Base/demo \uc790\uc0b0\uacfc Torqr \ub7f0\uce58 \ud50c\ub85c\uc6b0\uc640\ub294 \ubcc4\uac1c\uc785\ub2c8\ub2e4."
            : "The canonical KOIN/WLC market on Worldland Mainnet. Separate from Base/demo assets and Torqr launch flows."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <OfficialSwapPanel
          connected={connected}
          network={network}
          lang={lang}
          onConnect={() => {
            // Wallet connect is handled by Navbar / store actions.
          }}
        />

        <div className="space-y-6">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {lang === "ko" ? "\uacf5\uac1c \uc815\ubcf4" : "Public Disclosure"}
            </div>
            <OfficialSwapDisclosure lang={lang} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.01] p-5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-wider">{cfg.pair}</span>
          <span>&bull;</span>
          <span>Worldland chain ID 103</span>
          <span>&bull;</span>
          <span>KOIN token: 0x1d22f43A5105C9dc540DbC9F9d94E0CA4bF0Ec08</span>
          <span>&bull;</span>
          <span>
            {lang === "ko"
              ? "\uc774 \ub9c8\ucf13\uc740 Torqr \ub7f0\uce58 \ud50c\ub85c\uc6b0\uac00 \uc544\ub2d9\ub2c8\ub2e4."
              : "This market is not a Torqr launch flow."}
          </span>
        </div>
      </div>
    </div>
  )
}
