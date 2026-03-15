import { Link } from "react-router-dom"
import { Eyebrow, Panel, Button } from "../components/ui.jsx"
import { useT } from "../lib/i18n.js"
import useStore from "../lib/store.js"
import { EXTERNAL_LINKS } from "../lib/externalLinks.js"

export default function Home() {
  const { lang } = useStore()
  const t = useT(lang)

  const quickLinks = [
    {
      title: t("home_quick_guide"),
      description: t("home_quick_guide_desc"),
      href: "/guide",
      internal: true,
      icon: "/icons/icon-broker.png",
    },
    {
      title: t("home_quick_install"),
      description: t("home_quick_install_desc"),
      href: EXTERNAL_LINKS.installWindows,
      icon: "/icons/icon-node.png",
    },
    {
      title: t("home_quick_whitepaper"),
      description: t("home_quick_whitepaper_desc"),
      href: EXTERNAL_LINKS.whitepaperKo,
      icon: "/icons/icon-rewards.png",
    },
    {
      title: t("home_quick_dashboard"),
      description: t("home_quick_dashboard_desc"),
      href: "/dashboard",
      internal: true,
      icon: "/icons/icon-create-job.png",
    },
  ]

  const steps = [
    t("guide_step1_body"),
    t("guide_step2_body"),
    t("guide_step3_body"),
    t("guide_step4_body"),
  ]

  return (
    <div className="page-shell">
      <Eyebrow>{t("home_tag")}</Eyebrow>
      <div className="hero-grid">
        <div>
          <h1 className="page-title">{t("home_title")}</h1>
          <p className="page-subtitle">{t("home_subtitle")}</p>
          <div className="hero-actions" style={{ marginTop: 28 }}>
            <Link to="/guide" className="button button-primary">{t("home_cta_guide")}</Link>
            <a className="button button-secondary" href={EXTERNAL_LINKS.installWindows} target="_blank" rel="noreferrer">
              {t("home_cta_install")}
            </a>
            <a className="button button-ghost" href={EXTERNAL_LINKS.whitepaperKo} target="_blank" rel="noreferrer">
              {t("home_cta_whitepaper")}
            </a>
          </div>
        </div>

        <Panel title={t("home_summary_title")} subtitle={t("home_summary_subtitle")}>
          <div className="value-list">
            <div className="value-row"><span className="subtle">{t("home_summary_stack")}</span><span>{t("home_summary_stack_value")}</span></div>
            <div className="value-row"><span className="subtle">{t("home_summary_wallet")}</span><span>{t("home_summary_wallet_value")}</span></div>
            <div className="value-row"><span className="subtle">{t("home_summary_flow")}</span><span>{t("home_summary_flow_value")}</span></div>
            <div className="value-row"><span className="subtle">{t("home_summary_rewards")}</span><span>{t("home_summary_rewards_value")}</span></div>
          </div>
        </Panel>
      </div>

      <div className="action-grid" style={{ marginTop: 28, marginBottom: 28 }}>
        {quickLinks.map((item) => (
          item.internal ? (
            <Link key={item.title} to={item.href} className="action-card">
              <div className="icon-chip"><img src={item.icon} alt="" /></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ) : (
            <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="action-card">
              <div className="icon-chip"><img src={item.icon} alt="" /></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </a>
          )
        ))}
      </div>

      <div className="two-col-grid">
        <Panel title={t("home_steps_title")} subtitle={t("home_steps_subtitle")}>
          <div className="guide-step-list">
            {steps.map((step, index) => (
              <div key={step} className="guide-step-card">
                <div className="guide-step-index">{String(index + 1).padStart(2, "0")}</div>
                <div>{step}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("home_links_title")} subtitle={t("home_links_subtitle")}>
          <div className="guide-link-list">
            <a href={EXTERNAL_LINKS.installWindows} target="_blank" rel="noreferrer" className="guide-link-row">
              <strong>{t("home_link_install")}</strong>
              <span>{t("home_link_install_desc")}</span>
            </a>
            <a href={EXTERNAL_LINKS.openclawSetup} target="_blank" rel="noreferrer" className="guide-link-row">
              <strong>{t("home_link_openclaw")}</strong>
              <span>{t("home_link_openclaw_desc")}</span>
            </a>
            <a href={EXTERNAL_LINKS.whitepaperKo} target="_blank" rel="noreferrer" className="guide-link-row">
              <strong>{t("home_link_whitepaper")}</strong>
              <span>{t("home_link_whitepaper_desc")}</span>
            </a>
            <a href={EXTERNAL_LINKS.nodeRepo} target="_blank" rel="noreferrer" className="guide-link-row">
              <strong>{t("home_link_repo")}</strong>
              <span>{t("home_link_repo_desc")}</span>
            </a>
          </div>
        </Panel>
      </div>
    </div>
  )
}
