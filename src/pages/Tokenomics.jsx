import { toast } from "react-hot-toast"
import { BASE, WORLDLAND } from "../lib/chain.js"
import { Button, StatusPill } from "../components/ui.jsx"

const TOKENOMICS = {
  totalSupply: "2,100,000,000 KOIN",
  chains: [
    {
      key: "worldland",
      name: "Worldland Mainnet",
      short: "WL",
      chainId: 103,
      token: "0x1d22f43A5105C9dc540DbC9F9d94E0CA4bF0Ec08",
      distribution: [
        { label: "Mission Reward Pool", amount: "1,501,000,000", pct: 71.5, color: "emerald" },
        { label: "Burned (0xdead)", amount: "599,000,000", pct: 28.5, color: "red" },
        { label: "Team Allocation", amount: "0", pct: 0, color: "slate" },
      ],
    },
    {
      key: "base",
      name: "Base Mainnet",
      short: "BASE",
      chainId: 8453,
      token: "0xEA5E19f07E3A55C85A8822Ee2b81994bfD38972B",
      distribution: [
        { label: "Mission Reward Pool", amount: "1,501,000,000", pct: 71.5, color: "emerald" },
        { label: "Burned (0xdead)", amount: "590,293,000", pct: 28.1, color: "red" },
        { label: "Uniswap V3 LP (KOIN/ETH)", amount: "8,707,000", pct: 0.4, color: "blue" },
        { label: "Team Allocation", amount: "0", pct: 0, color: "slate" },
      ],
    },
  ],
  uniswap: {
    pool: "0x6cf3472A8ecc8d8E56F0749Ba5A7ffC221f70EC1",
    pair: "KOIN / WETH",
    fee: "1%",
    chain: "Base Mainnet",
    swapUrl: "https://app.uniswap.org/swap?chain=base&inputCurrency=0xEA5E19f07E3A55C85A8822Ee2b81994bfD38972B&outputCurrency=ETH",
  },
  contracts: {
    worldland: {
      missionBoard: "0xBEeC6567e8eCB6a5D919F15312a8cAB73e3Bef55",
      collaborationManager: "0xBC2939f67142946331e5c2Bbb04CCC2AAe432CE4",
      verificationOracle: "0x28c3e8F3b441C3a1a797b39E5B4d8F9EFF4eF901",
      koinToken: "0x1d22f43A5105C9dc540DbC9F9d94E0CA4bF0Ec08",
    },
    base: {
      missionBoard: "0xc1dfc5B92b4B5c7C5F2E33266C69B49520eDEE21",
      collaborationManager: "0x47D87b7ca2dFFC147BDB47d0A371064E3d7179A3",
      verificationOracle: "0x60106dce7AdC0eD103D12601680B832250d586A7",
      koinToken: "0xEA5E19f07E3A55C85A8822Ee2b81994bfD38972B",
      uniswapPool: "0x6cf3472A8ecc8d8E56F0749Ba5A7ffC221f70EC1",
    },
  },
}

const CHAIN_META = {
  worldland: {
    badgeTone: "success",
    blockExplorer: WORLDLAND.blockExplorerUrls[0],
    cardClass: "border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]",
  },
  base: {
    badgeTone: "info",
    blockExplorer: BASE.blockExplorerUrls[0],
    cardClass: "border-blue-500/10 bg-blue-500/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.18)]",
  },
}

const COLOR_MAP = {
  emerald: { dot: "bg-emerald-400", bar: "bg-emerald-400" },
  red: { dot: "bg-red-400", bar: "bg-red-400" },
  blue: { dot: "bg-sky-400", bar: "bg-sky-400" },
  slate: { dot: "bg-slate-500", bar: "bg-slate-500" },
}

const PRINCIPLES = [
  {
    title: "Zero Team Tokens",
    body: "No insider allocation. All tokens serve the ecosystem.",
    tone: "danger",
  },
  {
    title: "Dual-Chain Rewards",
    body: "Earn KOIN on both Worldland and Base for mission completion.",
    tone: "info",
  },
  {
    title: "Deflationary Burn",
    body: "~28% of supply is permanently burned to 0xdead.",
    tone: "success",
  },
]

const CONTRACT_ROWS = [
  { key: "koinToken", label: "KOIN Token" },
  { key: "missionBoard", label: "MissionBoard" },
  { key: "collaborationManager", label: "CollaborationManager" },
  { key: "verificationOracle", label: "VerificationOracle" },
  { key: "uniswapPool", label: "Uniswap Pool" },
]

function openExternal(url) {
  window.open(url, "_blank", "noopener,noreferrer")
}

async function copyText(value, label) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  } catch {
    toast.error(`Unable to copy ${label.toLowerCase()}`)
  }
}

function explorerUrl(chainKey, address) {
  return `${CHAIN_META[chainKey].blockExplorer}/address/${address}`
}

function AddressAnchor({ chainKey, address, label = address }) {
  if (!address) {
    return <span className="text-slate-600">-</span>
  }

  return (
    <a
      href={explorerUrl(chainKey, address)}
      target="_blank"
      rel="noreferrer"
      className="block break-all font-mono text-[11px] leading-6 text-slate-300 transition hover:text-primary sm:text-xs"
    >
      {label}
    </a>
  )
}

function DistributionLegendRow({ entry }) {
  const color = COLOR_MAP[entry.color] || COLOR_MAP.slate
  const isZero = Number(entry.pct) === 0

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-black/10 px-4 py-3">
      <div className="min-w-0">
        <div className={`flex items-center gap-3 text-sm font-semibold ${isZero ? "text-slate-500" : "text-slate-100"}`}>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
          <span className={isZero ? "line-through" : ""}>{entry.label}</span>
        </div>
        <div className={`mt-1 text-xs ${isZero ? "text-slate-600" : "text-slate-400"}`}>
          {isZero ? "Explicitly set to zero team allocation" : "Hardcoded token allocation snapshot"}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`font-mono text-xs sm:text-sm ${isZero ? "text-slate-500" : "text-slate-200"}`}>{entry.amount}</div>
        <div className={`mt-1 text-xs font-semibold ${isZero ? "text-slate-600" : "text-slate-400"}`}>{entry.pct}%</div>
      </div>
    </div>
  )
}

export default function Tokenomics() {
  const baseToken = TOKENOMICS.contracts.base.koinToken

  return (
    <div className="page-shell py-8">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_38%),linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
          <div className="max-w-4xl">
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-primary/80">Token Design</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">KOIN Tokenomics</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Total Supply: 2,100,000,000 KOIN per chain. Zero team allocation. 100% ecosystem.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              KOIN powers mission rewards across both networks while keeping treasury ownership aligned with open ecosystem growth.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {TOKENOMICS.chains.map((chain) => (
              <StatusPill key={chain.key} tone={CHAIN_META[chain.key].badgeTone}>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-current/20 px-2 py-0.5 text-[10px]">
                    {chain.short}
                  </span>
                  {chain.name}
                </span>
              </StatusPill>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-black/15 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Per Chain Supply</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-white">{TOKENOMICS.totalSupply}</div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-black/15 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Team Allocation</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-500 line-through">0 KOIN</div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-black/15 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Reward Coverage</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-primary">Worldland + Base</div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Distribution</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Per-chain allocation snapshot</h2>
            </div>
            <div className="text-sm text-slate-400">Visualized with stacked bars, no external chart dependency.</div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {TOKENOMICS.chains.map((chain) => (
              <article key={chain.key} className={`rounded-[30px] border p-6 ${CHAIN_META[chain.key].cardClass}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <StatusPill tone={CHAIN_META[chain.key].badgeTone}>{chain.short}</StatusPill>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chain ID {chain.chainId}</span>
                    </div>
                    <h3 className="mt-3 text-2xl font-black tracking-tight text-white">{chain.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Token contract:{" "}
                      <a
                        href={explorerUrl(chain.key, chain.token)}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all font-mono text-slate-200 transition hover:text-primary"
                      >
                        {chain.token}
                      </a>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyText(chain.token, `${chain.name} token address`)}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-300 transition hover:border-primary/25 hover:text-primary"
                  >
                    Copy token
                  </button>
                </div>

                <div className="mt-6 overflow-hidden rounded-full border border-white/8 bg-black/20">
                  <div className="flex h-4 w-full">
                    {chain.distribution
                      .filter((entry) => entry.pct > 0)
                      .map((entry) => (
                        <div
                          key={`${chain.key}-${entry.label}`}
                          className={COLOR_MAP[entry.color]?.bar || COLOR_MAP.slate.bar}
                          style={{ width: `${entry.pct}%` }}
                          title={`${entry.label}: ${entry.pct}%`}
                        />
                      ))}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {chain.distribution.map((entry) => (
                    <DistributionLegendRow key={`${chain.key}-${entry.label}`} entry={entry} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Principles</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Core rules behind the supply</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <article key={item.title} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
                <StatusPill tone={item.tone}>{item.title}</StatusPill>
                <p className="mt-4 text-sm leading-7 text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[30px] border border-blue-500/12 bg-blue-500/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300/70">Trading</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Uniswap trading on Base</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  The Base deployment includes a live Uniswap V3 liquidity position for KOIN / WETH discovery.
                </p>
              </div>
              <StatusPill tone="info">{TOKENOMICS.uniswap.chain}</StatusPill>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <InfoCard label="Pair" value={TOKENOMICS.uniswap.pair} />
              <InfoCard label="Fee Tier" value={TOKENOMICS.uniswap.fee} />
              <InfoCard label="Pool Address" value={<AddressAnchor chainKey="base" address={TOKENOMICS.uniswap.pool} />} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => openExternal(TOKENOMICS.uniswap.swapUrl)}>
                Trade KOIN on Uniswap
              </Button>
              <button
                type="button"
                onClick={() => copyText(baseToken, "Base token address")}
                className="inline-flex h-[46px] items-center justify-center rounded-[14px] border border-blue-500/20 bg-blue-500/10 px-4 text-sm font-semibold text-blue-200 transition hover:border-blue-400/35 hover:text-white"
              >
                Copy token address
              </button>
            </div>
          </article>

          <article className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Base token</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Copy-ready contract address</h2>
            <div className="mt-5 rounded-3xl border border-white/8 bg-black/15 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">KOIN on Base</div>
              <a
                href={explorerUrl("base", baseToken)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block break-all font-mono text-sm leading-7 text-slate-200 transition hover:text-primary"
              >
                {baseToken}
              </a>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400">This address is used for swaps and Base-side reward visibility.</p>
          </article>
        </section>

        <section className="rounded-[32px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Contracts</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Core addresses by network</h2>
            </div>
            <div className="text-sm text-slate-400">Every address links directly to the correct explorer.</div>
          </div>

          <div className="mt-6 grid gap-3 md:hidden">
            {CONTRACT_ROWS.map((row) => (
              <article key={`mobile-${row.key}`} className="rounded-3xl border border-white/8 bg-black/15 p-4">
                <div className="text-sm font-semibold text-slate-100">{row.label}</div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Worldland</div>
                    <div className="mt-2">
                      <AddressAnchor chainKey="worldland" address={TOKENOMICS.contracts.worldland[row.key]} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Base</div>
                    <div className="mt-2">
                      <AddressAnchor chainKey="base" address={TOKENOMICS.contracts.base[row.key]} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-[28px] border border-white/8 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-black/15">
                  <tr>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Contract</th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Worldland</th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 bg-white/[0.02]">
                  {CONTRACT_ROWS.map((row) => (
                    <tr key={row.key} className="align-top">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-100">{row.label}</td>
                      <td className="px-5 py-4">
                        <AddressAnchor chainKey="worldland" address={TOKENOMICS.contracts.worldland[row.key]} />
                      </td>
                      <td className="px-5 py-4">
                        <AddressAnchor chainKey="base" address={TOKENOMICS.contracts.base[row.key]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-black/15 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  )
}
