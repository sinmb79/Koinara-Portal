import { Link, NavLink } from "react-router-dom"
import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { Button, StatusPill } from "./ui.jsx"
import { shortAddress, SUPPORTED_CHAINS, WORLDLAND, BASE } from "../lib/chain.js"
import { discoverInjectedWallets } from "../lib/wallet.js"
import SearchBar from "./SearchBar.jsx"
import { getMainNavItems, getNavbarDesktopUtilityState, getSecondaryNavItems } from "../lib/navigation.js"

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
    chainId,
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
  const [networkPickerOpen, setNetworkPickerOpen] = useState(false)
  const [walletPickerOpen, setWalletPickerOpen] = useState(false)
  const [walletOptions, setWalletOptions] = useState([])
  const lastWalletErrorRef = useRef({ message: "", time: 0 })

  const mainNavItems = getMainNavItems(t)
  const secondaryNavItems = getSecondaryNavItems(t)
  const desktopUtilityState = getNavbarDesktopUtilityState({ connected: Boolean(address) })

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
    const wallets = await discoverInjectedWallets()

    // Mobile: no injected wallet found → open in MetaMask app browser
    if (wallets.length === 0 && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const dappUrl = window.location.href.replace(/^https?:\/\//, "")
      window.location.href = `https://metamask.app.link/dapp/${dappUrl}`
      return
    }

    if (wallets.length > 1) {
      setWalletOptions(wallets)
      setWalletPickerOpen(true)
      return
    }
    await runConnect(wallets[0]?.id ?? null)
  }

  async function handleSwitch(targetChain = null) {
    try {
      await switchChain(targetChain)
    } catch (error) {
      toast.error(formatWalletError(error, t), { id: "wallet-switch-error" })
    }
  }

  const walletModal =
    walletPickerOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[120] bg-[rgba(4,10,16,0.84)] backdrop-blur-md">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <div className="flex max-h-[calc(100vh-32px)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-primary/15 bg-[#15111b] shadow-[0_32px_120px_rgba(0,0,0,0.55)] sm:max-h-[calc(100vh-64px)]">
                <div className="border-b border-white/5 bg-[radial-gradient(circle_at_top,rgba(0,255,180,0.08),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] px-6 py-5 sm:px-8 sm:py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">{t("wallet_modal_eyebrow")}</div>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{t("wallet_modal_title")}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">{t("wallet_modal_subtitle")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWalletPickerOpen(false)}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-primary/10 px-4 text-sm font-semibold text-slate-300 transition hover:border-primary/30 hover:text-white"
                    >
                      {t("wallet_modal_close")}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                  <div className="space-y-3">
                    {walletOptions.map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => runConnect(wallet.id)}
                        className="group flex w-full items-center justify-between rounded-[26px] border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition hover:border-primary/30 hover:bg-primary/[0.06] sm:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            {wallet.logo ? (
                              <img src={wallet.logo} alt="" className="h-9 w-9 rounded-xl object-contain" />
                            ) : (
                              <span className="material-symbols-outlined text-[28px]">{wallet.icon}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-lg font-black text-white">{wallet.name}</div>
                            <div className="truncate text-sm capitalize text-slate-500">{wallet.shortLabel || wallet.id}</div>
                          </div>
                        </div>
                        <span className="ml-4 inline-flex h-11 shrink-0 items-center rounded-2xl border border-primary/15 px-4 text-sm font-semibold text-slate-200 transition group-hover:border-primary/35 group-hover:text-white">
                          {t("wallet_modal_select")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 px-6 py-4 text-sm leading-7 text-slate-500 sm:px-8">
                  {t("wallet_modal_note")}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-[#0f231d]/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-[76px] w-[min(1440px,calc(100vw-32px))] items-center justify-between gap-4 py-3 2xl:w-[min(1520px,calc(100vw-48px))]">
        <div className="flex min-w-0 items-center gap-4 xl:gap-5">
          <Link to="/" className="flex items-center gap-3 text-primary">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_24px_rgba(0,255,180,0.14)]">
              <img className="h-7 w-7 object-contain" src="/koin-logo-primary.png" alt="Koinara" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-black tracking-tight text-slate-100">{t("brand_title")}</div>
              <div className="hidden truncate text-xs uppercase tracking-[0.22em] text-slate-500 2xl:block">{t("brand_subtitle")}</div>
            </div>
          </Link>

          <nav className="hidden min-w-0 items-center gap-4 xl:flex 2xl:gap-5">
            {mainNavItems.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `whitespace-nowrap border-b-2 py-6 text-sm font-semibold transition-colors ${isActive ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-primary"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 xl:flex 2xl:gap-3">
          {desktopUtilityState.showSearch ? (
          <div className="hidden w-full max-w-[180px] 2xl:block">
            <SearchBar placeholder={t("search_agents_placeholder")} compact />
          </div>
          ) : null}

          <div className="inline-flex items-center rounded-full border border-primary/10 bg-white/5 p-1">
            {["en", "ko"].map((value) => (
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
            <div className="flex min-w-0 items-center gap-2">
              {/* Network selector dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNetworkPickerOpen((value) => !value)}
                  className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                    isCorrectChain
                      ? "border-primary/15 bg-primary/5 text-primary hover:bg-primary/10"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {chainId === BASE.chainId ? "Base" : "Worldland"}
                  <span className="ml-0.5 text-[9px]">v</span>
                </button>
                {networkPickerOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#15111b] shadow-xl">
                    <button
                      onClick={async () => {
                        setNetworkPickerOpen(false)
                        await handleSwitch(WORLDLAND)
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold transition hover:bg-white/5 ${chainId === WORLDLAND.chainId ? "text-primary" : "text-slate-300"}`}
                    >
                      Worldland Mainnet
                      {chainId === WORLDLAND.chainId ? <span className="ml-auto text-primary">OK</span> : null}
                    </button>
                    <button
                      onClick={async () => {
                        setNetworkPickerOpen(false)
                        await handleSwitch(BASE)
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold transition hover:bg-white/5 ${chainId === BASE.chainId ? "text-primary" : "text-slate-300"}`}
                    >
                      Base Mainnet
                      {chainId === BASE.chainId ? <span className="ml-auto text-primary">OK</span> : null}
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                onClick={async () => { disconnect(); await handleConnect() }}
                className="inline-flex h-10 min-w-0 items-center rounded-xl border border-primary/10 bg-white/5 px-3 font-mono text-xs text-slate-200 hover:border-primary/30 hover:text-primary transition cursor-pointer"
                title="Click to switch wallet"
              >
                {shortAddress(address)}
              </button>
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

      {walletModal}
    </header>
  )
}
