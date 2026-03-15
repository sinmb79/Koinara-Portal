import { Eyebrow, Panel } from "../components/ui.jsx"
import { useT } from "../lib/i18n.js"
import useStore from "../lib/store.js"
import { EXTERNAL_LINKS } from "../lib/externalLinks.js"

export default function Guide() {
  const { lang } = useStore()
  const t = useT(lang)

  const steps = [
    {
      title: t("guide_step1_title"),
      body: t("guide_step1_body"),
      links: [
        { label: t("guide_step1_link"), href: EXTERNAL_LINKS.installWindows },
      ],
    },
    {
      title: t("guide_step2_title"),
      body: t("guide_step2_body"),
      links: [
        { label: t("guide_step2_link"), href: EXTERNAL_LINKS.openclawSetup },
      ],
    },
    {
      title: t("guide_step3_title"),
      body: t("guide_step3_body"),
      links: [
        { label: t("guide_step3_link"), href: EXTERNAL_LINKS.installWindows },
      ],
    },
    {
      title: t("guide_step4_title"),
      body: t("guide_step4_body"),
      links: [
        { label: t("guide_step4_link"), href: "/dashboard" },
      ],
    },
  ]

  return (
    <div className="page-shell">
      <Eyebrow>{t("guide_tag")}</Eyebrow>
      <h1 className="page-title">{t("guide_title")}</h1>
      <p className="page-subtitle">{t("guide_subtitle")}</p>

      <div className="guide-doc-layout" style={{ marginTop: 28 }}>
        <aside className="guide-doc-sidebar">
          <div className="guide-doc-sidebar-title">{t("guide_sidebar_title")}</div>
          <div className="guide-doc-sidebar-list">
            {steps.map((step, index) => (
              <a key={step.title} href={`#guide-step-${index + 1}`} className="guide-doc-anchor">
                {String(index + 1).padStart(2, "0")} · {step.title}
              </a>
            ))}
          </div>
        </aside>

        <div className="guide-doc-content">
          <Panel title={t("guide_requirements_title")} subtitle={t("guide_requirements_subtitle")}>
            <div className="guide-step-list">
              <div className="guide-step-card">{t("guide_requirement_wallet")}</div>
              <div className="guide-step-card">{t("guide_requirement_worldland")}</div>
              <div className="guide-step-card">{t("guide_requirement_openclaw")}</div>
              <div className="guide-step-card">{t("guide_requirement_agent")}</div>
            </div>
          </Panel>

          {steps.map((step, index) => (
            <Panel
              key={step.title}
              title={step.title}
              subtitle={t("guide_step_note")}
              action={<span id={`guide-step-${index + 1}`} className="mono subtle">{String(index + 1).padStart(2, "0")}</span>}
            >
              <div className="guide-step-content">
                <p>{step.body}</p>
                <div className="hero-actions">
                  {step.links.map((link) => (
                    link.href.startsWith("/") ? (
                      <a key={link.label} className="button button-secondary" href={link.href}>{link.label}</a>
                    ) : (
                      <a key={link.label} className="button button-secondary" href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    )
                  ))}
                </div>
              </div>
            </Panel>
          ))}

          <Panel title={t("guide_more_title")} subtitle={t("guide_more_subtitle")}>
            <div className="guide-link-list">
              <a href={EXTERNAL_LINKS.whitepaperKo} target="_blank" rel="noreferrer" className="guide-link-row">
                <strong>{t("home_link_whitepaper")}</strong>
                <span>{t("home_link_whitepaper_desc")}</span>
              </a>
              <a href={EXTERNAL_LINKS.whitepaperEn} target="_blank" rel="noreferrer" className="guide-link-row">
                <strong>{t("guide_whitepaper_en")}</strong>
                <span>{t("guide_whitepaper_en_desc")}</span>
              </a>
              <a href={EXTERNAL_LINKS.nodeRepo} target="_blank" rel="noreferrer" className="guide-link-row">
                <strong>{t("home_link_repo")}</strong>
                <span>{t("home_link_repo_desc")}</span>
              </a>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
