import { Link } from "react-router-dom"
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
      links: [{ label: t("guide_step1_link"), href: EXTERNAL_LINKS.installWindows }],
    },
    {
      title: t("guide_step2_title"),
      body: t("guide_step2_body"),
      links: [{ label: t("guide_step2_link"), href: EXTERNAL_LINKS.openclawSetup }],
    },
    {
      title: t("guide_step3_title"),
      body: t("guide_step3_body"),
      links: [{ label: t("guide_step3_link"), href: EXTERNAL_LINKS.installWindows }],
    },
    {
      title: t("guide_step4_title"),
      body: t("guide_step4_body"),
      links: [{ label: t("guide_step4_link"), href: "/dashboard" }],
    },
  ]

  const requirements = [
    t("guide_requirement_wallet"),
    t("guide_requirement_worldland"),
    t("guide_requirement_openclaw"),
    t("guide_requirement_agent"),
  ]

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("guide_tag")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("guide_title")}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">{t("guide_subtitle")}</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-[28px] border border-primary/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] lg:sticky lg:top-28">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t("guide_sidebar_title")}
          </div>
          <div className="grid gap-2">
            {steps.map((step, index) => (
              <a
                key={step.title}
                href={`#guide-step-${index + 1}`}
                className="rounded-xl border border-white/5 bg-[#10261f]/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-primary/20 hover:text-primary"
              >
                {step.title}
              </a>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <PanelCard title={t("guide_requirements_title")} subtitle={t("guide_requirements_subtitle")}>
            <div className="grid gap-3 md:grid-cols-2">
              {requirements.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/5 bg-[#10261f]/70 px-4 py-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </PanelCard>

          {steps.map((step, index) => (
            <PanelCard
              key={step.title}
              title={step.title}
              subtitle={t("guide_step_note")}
              action={
                <span
                  id={`guide-step-${index + 1}`}
                  className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              }
            >
              <div className="space-y-5">
                <p className="text-sm leading-8 text-slate-300">{step.body}</p>
                <div className="flex flex-wrap gap-3">
                  {step.links.map((link) =>
                    link.href.startsWith("/") ? (
                      <Link
                        key={link.label}
                        to={link.href}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-5 text-sm font-bold text-primary transition hover:bg-primary/20"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-5 text-sm font-bold text-primary transition hover:bg-primary/20"
                      >
                        {link.label}
                      </a>
                    ),
                  )}
                </div>
              </div>
            </PanelCard>
          ))}

          <PanelCard title={t("guide_more_title")} subtitle={t("guide_more_subtitle")}>
            <div className="grid gap-3">
              <ResourceLink
                title={t("home_link_whitepaper")}
                body={t("home_link_whitepaper_desc")}
                href={EXTERNAL_LINKS.whitepaperKo}
              />
              <ResourceLink
                title={t("guide_whitepaper_en")}
                body={t("guide_whitepaper_en_desc")}
                href={EXTERNAL_LINKS.whitepaperEn}
              />
              <ResourceLink
                title={t("home_link_repo")}
                body={t("home_link_repo_desc")}
                href={EXTERNAL_LINKS.nodeRepo}
              />
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  )
}

function PanelCard({ title, subtitle, action, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm leading-7 text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function ResourceLink({ title, body, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-2xl border border-white/5 bg-[#10261f]/70 px-5 py-4 transition hover:border-primary/20 hover:bg-primary/5"
    >
      <strong className="block text-base text-white">{title}</strong>
      <span className="mt-2 block text-sm leading-7 text-slate-400">{body}</span>
    </a>
  )
}
