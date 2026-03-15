import { Link, NavLink } from "react-router-dom"
import { toast } from "react-hot-toast"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { Button, StatusPill } from "./ui.jsx"
import { shortAddress } from "../lib/chain.js"

export default function Navbar() {
  const {
    lang,
    setLang,
    address,
    isConnecting,
    isCorrectChain,
    dashboard,
    connect,
    disconnect,
    switchChain,
  } = useStore()
  const t = useT(lang)

  const navItems = [
    ["/", t("nav_home")],
    ["/guide", t("nav_guide")],
    ["/jobs", t("nav_jobs")],
    ["/submit", t("nav_create")],
    ["/providers", t("nav_providers")],
    ["/dashboard", t("nav_dashboard")],
  ]

  async function handleConnect() {
    try {
      await connect()
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function handleSwitch() {
    try {
      await switchChain()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand-mark">
          <img className="brand-logo" src="/logo.png" alt="Koinara" />
          <div>
            <div className="brand-title">{t("brand_title")}</div>
            <div className="brand-subtitle">{t("brand_subtitle")}</div>
          </div>
        </Link>

        <nav className="nav-links">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <div className="lang-toggle">
            {["ko", "en"].map((value) => (
              <button
                key={value}
                className={`button ${lang === value ? "button-primary" : "button-ghost"}`}
                style={{ minHeight: 34, padding: "0 12px" }}
                onClick={() => setLang(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>

          {address ? (
            <>
              {isCorrectChain ? (
                <StatusPill tone="success">{dashboard.currentEpoch ? `Epoch ${dashboard.currentEpoch}` : "Connected"}</StatusPill>
              ) : (
                <Button variant="danger" onClick={handleSwitch}>
                  {t("nav_switch_chain")}
                </Button>
              )}
              <StatusPill tone="dim">{shortAddress(address)}</StatusPill>
              <Button variant="ghost" onClick={disconnect}>
                {t("nav_disconnect")}
              </Button>
            </>
          ) : (
            <Button variant="primary" loading={isConnecting} onClick={handleConnect}>
              {isConnecting ? t("nav_connecting") : t("nav_connect")}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
