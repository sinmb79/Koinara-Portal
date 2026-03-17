import { Link, NavLink } from "react-router-dom"
import { useRef, useState } from "react"
import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { Button, StatusPill } from "./ui.jsx"
import { shortAddress } from "../lib/chain.js"
import { listInjectedWallets } from "../lib/wallet.js"
import SearchBar from "./SearchBar.jsx"

function formatWalletError(error, t) {
  const message = String(error?.reason || error?.message || "").toLowerCase()
  const code = error?.code

  if (code === "WALLET_SELECTION_REQUIRED" || message.includes("wallet selection required")) {
    return t("wallet_error_pick_wallet")
  }
  if (message.includes("must has at least one account") || message.includes("wallet must have at least one account")) {
    return t("wallet_error_no_account")
  }
  if (message.includes("provider not found") || message.includes("no compatible wallet provider found")) {
    return t("wallet_error_provider_conflict")
  }
  if (code === -32002 || message.includes("already processing eth_requestaccounts")) {
    return t("wallet_error_pending")
  }
  if (code === 4001 || message.includes("user rejected") || message.includes("rejected")) {
    return t("wallet_error_rejected")
  }
  if (message.includes("metamask is required")) {
    return t("wallet_error_missing_extension")
  }
  if (message.includes("wallet_switchethereumchain") || message.includes("wallet_addethereumchain")) {
    return t("wallet_error_switch_chain")
  }

  return error?.reason || error?.message || t("wallet_error_unknown")
}

export default function Navbar() {
  const {
    lang,
    setLang,
    address,
    isConnecting,
    isCorrectChain,
    walletName,
    dashboard,
    connect,
    disconnect,
    switchChain,
  } = useStore()
  const t = useT(lang)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [walletPickerOpen, setWalletPickerOpen] = useState(false)
  const [walletOptions, setWalletOptions] = useState([])
  const lastWalletErrorRef = useRef({ message: "", time: 0 })

  const mainNavItems = [
    ["/", t("nav_home")],
    ["/dashboard", t("nav_dashboard")],
    ["/agents", t("nav_agents")],
    ["/dashboard/bond", t("nav_staking")],
    ["/guide", t("nav_docs")],
  ]

  const secondaryNavItems = [
    ["/jobs", t("nav_jobs")],
    ["/submit", t("nav_create")],
    ["/providers", t("nav_providers")],
  ]

  function showWalletError(error) {
    const message = formatWalletError(error, t)
    const now = Date.now()
    if (
      lastWalletErrorRef.current.message === message &&
      now - lastWalletErrorRef.current.time < 2500
    ) {
      return
    }
    lastWalletErrorRef.current = { message, time: now }
    toast.dismiss("wallet-connect-error")
    toast.error(message, { id: "wallet-connect-error" })
  }

  async function runConnect(walletId = null) {
    if (isConnecting) return
    try {
      await connect(walletId)
      setWalletPickerOpen(false)
    } catch (error) {
      showWalletError(error)
    }
  }

  async function handleConnect() {
    if (isConnecting) return
    const wallets = listInjectedWallets()
    if (wallets.length > 1) {
      setWalletOptions(wallets)
      setWalletPickerOpen(true)
      return
    }
    await runConnect(wallets[0]?.id ?? null)
  }

  async function handleSwitch() {
    try {
      await switchChain()
    } catch (error) {
      toast.error(formatWalletError(error, t), { id: "wallet-switch-error" })
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-[#0f231d]/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-[76px] w-[min(1280px,calc(100vw-32px))] items-center justify-between gap-6 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" className="flex items-center gap-3 text-primary">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_24px_rgba(0,255,180,0.14)]">
              <img className="h-7 w-7 object-contain" src="/koin-logo-primary.png" alt="Koinara" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-black tracking-tight text-slate-100">{t("brand_title")}</div>
              <div className="truncate text-xs uppercase tracking-[0.22em] text-slate-500">{t("brand_subtitle")}</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {mainNavItems.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `border-b-2 py-6 text-sm font-semibold transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-primary"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-4 xl:flex">
          <div className="hidden w-full max-w-[220px] 2xl:block">
            <SearchBar placeholder={t("search_agents_placeholder")} compact />
          </div>

          <div className="inline-flex items-center rounded-full border border-primary/10 bg-white/5 p-1">
            {["ko", "en"].map((value) => (
              <button
                key={value}
                className={`h-9 rounded-full px-3 text-xs font-semibold transition-colors ${lang === value ? "bg-primary text-[#0f231d]" : "text-slate-400 hover:text-slate-100"}`}
                onClick={() => setLang(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>

          {address ? (
            <div className="flex items-center gap-2">
              {isCorrectChain ? (
                <StatusPill tone="success">{dashboard.currentEpoch ? `Epoch ${dashboard.currentEpoch}` : (walletName || "Connected")}</StatusPill>
              ) : (
                <Button variant="danger" onClick={handleSwitch}>
                  {t("nav_switch_chain")}
                </Button>
              )}
              <span className="inline-flex h-11 items-center rounded-xl border border-primary/10 bg-white/5 px-4 font-mono text-xs text-slate-200">
                {shortAddress(address)}
              </span>
              <Button variant="ghost" onClick={disconnect}>
                {t("nav_disconnect")}
              </Button>
            </div>
          ) : (
            <Button variant="primary" loading={isConnecting} onClick={handleConnect}>
              {isConnecting ? t("nav_connecting") : t("nav_connect")}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          {address ? (
            <button
              className="inline-flex h-11 items-center rounded-xl border border-primary/10 bg-white/5 px-3 font-mono text-xs text-slate-200"
              onClick={disconnect}
            >
              {shortAddress(address)}
            </button>
          ) : (
            <Button variant="primary" loading={isConnecting} onClick={handleConnect}>
              {isConnecting ? t("nav_connecting") : t("nav_connect")}
            </Button>
          )}
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/10 bg-white/5 text-slate-200"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-primary/10 bg-[#10261f]/95 px-4 pb-4 pt-4 xl:hidden">
          <div className="mx-auto grid w-[min(1280px,calc(100vw-32px))] gap-4">
            <SearchBar placeholder={t("search_agents_placeholder")} compact />
            <div className="grid gap-2">
              {[...mainNavItems, ...secondaryNavItems].map(([to, label]) => (
                <NavLink
                  key={`mobile-${to}`}
                  to={to}
                  className={({ isActive }) =>
                    `rounded-xl border px-4 py-3 text-sm font-semibold ${isActive ? "border-primary/40 bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-slate-200"}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
            <div className="inline-flex items-center rounded-full border border-primary/10 bg-white/5 p-1">
              {["ko", "en"].map((value) => (
                <button
                  key={`mobile-lang-${value}`}
                  className={`h-9 rounded-full px-3 text-xs font-semibold transition-colors ${lang === value ? "bg-primary text-[#0f231d]" : "text-slate-400 hover:text-slate-100"}`}
                  onClick={() => setLang(value)}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
            {address && !isCorrectChain ? (
              <Button variant="danger" onClick={handleSwitch}>
                {t("nav_switch_chain")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {walletPickerOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-[28px] border border-primary/10 bg-[#17111f] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{t("wallet_modal_eyebrow")}</div>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-white">{t("wallet_modal_title")}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{t("wallet_modal_subtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setWalletPickerOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary/10 px-4 text-sm font-semibold text-slate-300 transition hover:border-primary/30 hover:text-white"
              >
                {t("wallet_modal_close")}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => runConnect(wallet.id)}
                  className="flex w-full items-center justify-between rounded-3xl border border-primary/10 bg-white/5 px-5 py-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-primary">
                      <span className="material-symbols-outlined text-2xl">{wallet.icon}</span>
                    </div>
                    <div>
                      <div className="text-lg font-black text-white">{wallet.name}</div>
                      <div className="text-sm text-slate-500">{wallet.id}</div>
                    </div>
                  </div>
                  <span className="inline-flex h-11 items-center rounded-2xl border border-primary/10 px-4 text-sm font-semibold text-slate-200">
                    {t("wallet_modal_select")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
