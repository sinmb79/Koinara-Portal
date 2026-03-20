import { toast } from "react-hot-toast"
import { BASE, WORLDLAND } from "../lib/chain.js"
import { Button, StatusPill } from "../components/ui.jsx"

const WORLDLAND_TOKEN = {
  name: "Worldland KOIN",
  short: "WL",
  chainId: 103,
  token: "0x1d22f43A5105C9dc540DbC9F9d94E0CA4bF0Ec08",
  summary: "Canonical protocol token. This is the official KOIN reference on Worldland.",
  notes: [
    "This is the canonical KOIN users should treat as the protocol-native token.",
    "Base is used for Mission Board testing and swap demo flows, not for canonical token semantics.",
    "If an official external market is launched later, it should reference the canonical Worldland asset design.",
  ],
}

const BASE_DEMO_TOKEN = {
  name: "Base MockKOIN",
  short: "BASE",
  chainId: 8453,
  token: "0xEA5E19f07E3A55C85A8822Ee2b81994bfD38972B",
  totalSupply: "2,100,000,000",
  summary: "Demo / mock token for Base-side Mission Board testing. Not the canonical KOIN token.",
  notes: [
    "This contract exists for Base test/demo flows and user walkthroughs.",
    "It shares the KOIN name for product continuity, but it is not the official protocol token.",
    "Do not treat Base market activity here as the canonical price discovery venue for Worldland KOIN.",
  ],
  distribution: [
    { label: "Demo reserve (deployer wallet)", amount: "2,089,000,000", pct: 99.47, color: "slate" },
    { label: "Uniswap V3 LP (KOIN / WETH)", amount: "10,000,000", pct: 0.48, color: "blue" },
    { label: "Oracle reward pool", amount: "1,000,000", pct: 0.05, color: "emerald" },
  ],
}

const UNISWAP = {
  pool: "0x6cf3472A8ecc8d8E56F0749Ba5A7ffC221f70EC1",
  pair: "MockKOIN / WETH",
  fee: "1%",
  chain: "Base Mainnet",
  swapUrl: "https://app.uniswap.org/swap?chain=base&inputCurrency=0xEA5E19f07E3A55C85A8822Ee2b81994bfD38972B&outputCurrency=ETH",
}

const CONTRACTS = {
  worldland: {
    missionBoard: "0xBEeC6567e8eCB6a5D919F15312a8cAB73e3Bef55",
    collaborationManager: "0xBC2939f67142946331e5c2Bbb04CCC2AAe432CE4",
    verificationOracle: "0x28c3e8F3b441C3a1a797b39E5B4d8F9EFF4eF901",
    koinToken: WORLDLAND_TOKEN.token,
  },
  base: {
    missionBoard: "0xc1dfc5B92b4B5c7C5F2E33266C69B49520eDEE21",
    collaborationManager: "0x47D87b7ca2dFFC147BDB47d0A371064E3d7179A3",
    verificationOracle: "0x60106dce7AdC0eD103D12601680B832250d586A7",
    koinToken: BASE_DEMO_TOKEN.token,
    uniswapPool: UNISWAP.pool,
  },
}

const PRINCIPLES = [
  {
    title: "Canonical on Worldland",
    body: "Worldland KOIN is the official protocol token. Base MockKOIN exists only for demo and testing flows.",
    tone: "success",
  },
  {
    title: "No Symbol Ambiguity",
    body: "Every trading and address section now explicitly labels Base as demo/mock to reduce user confusion.",
    tone: "info",
  },
  {
    title: "Demo Liquidity Only",
    body: "The current Uniswap pool on Base is for product testing and walkthroughs, not canonical market discovery.",
    tone: "warn",
  },
]

const CONTRACT_ROWS = [
  { key: "koinToken", label: "KOIN Token" },
  { key: "missionBoard", label: "MissionBoard" },
  { key: "collaborationManager", label: "CollaborationManager" },
  { key: "verificationOracle", label: "VerificationOracle" },
  { key: "uniswapPool", label: "Uniswap Pool" },
]

const COLOR_MAP = {
  emerald: { dot: "bg-emerald-400", bar: "bg-emerald-400" },
  blue: { dot: "bg-sky-400", bar: "bg-sky-400" },
  slate: { dot: "bg-slate-400", bar: "bg-slate-400" },
}

const CHAIN_META = {
  worldland: {
    badgeTone: "success",
    blockExplorer: WORLDLAND.blockExplorerUrls[0],
    cardClass: "border-primary/12 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]",
  },
  base: {
    badgeTone: "danger",
    blockExplorer: BASE.blockExplorerUrls[0],
    cardClass: "border-amber-400/18 bg-amber-500/[0.05] shadow-[0_18px_60px_rgba(0,0,0,0.18)]",
  },
}

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

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-black/15 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  )
}

function DistributionLegendRow({ entry }) {
  const color = COLOR_MAP[entry.color] || COLOR_MAP.slate

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-black/10 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-100">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
          <span>{entry.label}</span>
        </div>
        <div className="mt-1 text-xs text-slate-400">MockKOIN allocation snapshot for the Base demo deployment.</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-xs text-slate-200 sm:text-sm">{entry.amount}</div>
        <div className="mt-1 text-xs font-semibold text-slate-400">{entry.pct}%</div>
      </div>
    </div>
  )
}

function TokenIdentityCard({ chainKey, token, accentTitle, warning }) {
  return (
    <article className={`rounded-[30px] border p-6 ${CHAIN_META[chainKey].cardClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <StatusPill tone={CHAIN_META[chainKey].badgeTone}>{token.short}</StatusPill>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chain ID {token.chainId}</span>
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{accentTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{token.summary}</p>
        </div>

        <button
          type="button"
          onClick={() => copyText(token.token, `${token.name} address`)}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-300 transition hover:border-primary/25 hover:text-primary"
        >
          Copy address
        </button>
      </div>

      {warning ? (
        <div className="mt-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Important</div>
          <p className="mt-2">{warning}</p>
        </div>
      ) : null}

      <div className="mt-5 rounded-3xl border border-white/8 bg-black/15 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Token contract</div>
        <a
          href={explorerUrl(chainKey, token.token)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all font-mono text-sm leading-7 text-slate-200 transition hover:text-primary"
        >
          {token.token}
        </a>
      </div>

      <div className="mt-5 space-y-3">
        {token.notes.map((note) => (
          <div key={note} className="rounded-2xl border border-white/5 bg-black/10 px-4 py-3 text-sm leading-7 text-slate-300">
            {note}
          </div>
        ))}
      </div>
    </article>
  )
}

export default function Tokenomics() {
  return (
    <div className="page-shell py-8">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_38%),linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-primary/80">Token Design</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">KOIN Token Identity</h1>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
              Worldland hosts the canonical KOIN token. Base hosts a separate MockKOIN deployment for Mission Board demos,
              testing, and swap walkthroughs.
            </p>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
              The current Uniswap pool on Base is tied to the mock token, not the canonical Worldland token. Users should not
              treat the Base mock market as official protocol price discovery.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <StatusPill tone="success">Canonical: Worldland KOIN</StatusPill>
            <StatusPill tone="danger">Demo: Base MockKOIN</StatusPill>
            <StatusPill tone="warn">Uniswap pool is demo-only</StatusPill>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard label="Official Network" value="Worldland Mainnet" />
            <InfoCard label="Demo Trading Network" value="Base Mainnet" />
            <InfoCard label="Current Uniswap Status" value="Mock token only" />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Identity Split</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Canonical token vs demo token</h2>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <TokenIdentityCard
              chainKey="worldland"
              token={WORLDLAND_TOKEN}
              accentTitle="Worldland official KOIN"
            />
            <TokenIdentityCard
              chainKey="base"
              token={BASE_DEMO_TOKEN}
              accentTitle="Base MockKOIN (demo only)"
              warning="This Base token is a mock deployment used for testing and walkthroughs. It is not the canonical KOIN token and should not be presented as the official market listing."
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Base Demo Allocation</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">MockKOIN supply snapshot on Base</h2>
            </div>
            <div className="text-sm text-slate-400">Only the Base mock token is shown below. This is not the canonical Worldland supply view.</div>
          </div>

          <article className={`rounded-[30px] border p-6 ${CHAIN_META.base.cardClass}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <StatusPill tone="danger">{BASE_DEMO_TOKEN.short}</StatusPill>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Demo / Mock Distribution</span>
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-white">{BASE_DEMO_TOKEN.name}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Total mock supply:
                  {" "}
                  <span className="font-mono text-slate-200">{BASE_DEMO_TOKEN.totalSupply}</span>
                  {" "}
                  KOIN on Base.
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(BASE_DEMO_TOKEN.token, "Base mock token address")}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-300 transition hover:border-primary/25 hover:text-primary"
              >
                Copy token
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-full border border-white/8 bg-black/20">
              <div className="flex h-4 w-full">
                {BASE_DEMO_TOKEN.distribution.map((entry) => (
                  <div
                    key={entry.label}
                    className={COLOR_MAP[entry.color]?.bar || COLOR_MAP.slate.bar}
                    style={{ width: `${entry.pct}%` }}
                    title={`${entry.label}: ${entry.pct}%`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {BASE_DEMO_TOKEN.distribution.map((entry) => (
                <DistributionLegendRow key={entry.label} entry={entry} />
              ))}
            </div>
          </article>
        </section>

        <section className="space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Principles</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Rules to prevent user confusion</h2>
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
          <article className="rounded-[30px] border border-amber-400/18 bg-amber-500/[0.05] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">Trading</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Uniswap pool for Base mock token</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  This pool exists for Base-side demos and product testing. It is not the canonical listing of the official
                  Worldland KOIN token.
                </p>
              </div>
              <StatusPill tone="warn">{UNISWAP.chain}</StatusPill>
            </div>

            <div className="mt-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Demo-only warning</div>
              <p className="mt-2">
                Anyone viewing this pool should understand it references
                {" "}
                <span className="font-semibold">MockKOIN on Base</span>
                {" "}
                rather than the official Worldland KOIN token.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <InfoCard label="Pair" value={UNISWAP.pair} />
              <InfoCard label="Fee Tier" value={UNISWAP.fee} />
              <InfoCard label="Pool Address" value={<AddressAnchor chainKey="base" address={UNISWAP.pool} />} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => openExternal(UNISWAP.swapUrl)}>
                Open demo pool on Uniswap
              </Button>
              <button
                type="button"
                onClick={() => copyText(BASE_DEMO_TOKEN.token, "Base mock token address")}
                className="inline-flex h-[46px] items-center justify-center rounded-[14px] border border-amber-400/25 bg-amber-500/10 px-4 text-sm font-semibold text-amber-100 transition hover:border-amber-300/40 hover:text-white"
              >
                Copy mock token address
              </button>
            </div>
          </article>

          <article className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Official token</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Worldland canonical address</h2>
            <div className="mt-5 rounded-3xl border border-white/8 bg-black/15 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">KOIN on Worldland</div>
              <a
                href={explorerUrl("worldland", WORLDLAND_TOKEN.token)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block break-all font-mono text-sm leading-7 text-slate-200 transition hover:text-primary"
              >
                {WORLDLAND_TOKEN.token}
              </a>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              If an official external market is launched later, it should map cleanly to the canonical Worldland token rather
              than the current Base mock deployment.
            </p>
          </article>
        </section>

        <section className="rounded-[32px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Contracts</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Core addresses by network</h2>
            </div>
            <div className="text-sm text-slate-400">Worldland is canonical. Base is explicitly labeled as demo/mock.</div>
          </div>

          <div className="mt-6 grid gap-3 md:hidden">
            {CONTRACT_ROWS.map((row) => (
              <article key={`mobile-${row.key}`} className="rounded-3xl border border-white/8 bg-black/15 p-4">
                <div className="text-sm font-semibold text-slate-100">{row.label}</div>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Worldland canonical</div>
                    <div className="mt-2">
                      <AddressAnchor chainKey="worldland" address={CONTRACTS.worldland[row.key]} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">Base demo/mock</div>
                    <div className="mt-2">
                      <AddressAnchor chainKey="base" address={CONTRACTS.base[row.key]} />
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
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Worldland (canonical)</th>
                    <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">Base (demo/mock)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 bg-white/[0.02]">
                  {CONTRACT_ROWS.map((row) => (
                    <tr key={row.key} className="align-top">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-100">{row.label}</td>
                      <td className="px-5 py-4">
                        <AddressAnchor chainKey="worldland" address={CONTRACTS.worldland[row.key]} />
                      </td>
                      <td className="px-5 py-4">
                        <AddressAnchor chainKey="base" address={CONTRACTS.base[row.key]} />
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
