import { Link } from "react-router-dom"
import { useT } from "../lib/i18n.js"
import useStore from "../lib/store.js"
import { EXTERNAL_LINKS } from "../lib/externalLinks.js"
import { Notice } from "../components/ui.jsx"

export default function Guide() {
  const { lang } = useStore()
  const t = useT(lang)

  const tracks = [
    {
      title: t("guide_track_requester_title"),
      body: t("guide_track_requester_body"),
      href: "/submit",
      cta: t("guide_track_requester_cta"),
      legacy: false,
    },
    {
      title: t("guide_track_agent_title"),
      body: t("guide_track_agent_body"),
      href: "/dashboard/agent-id",
      cta: t("guide_track_agent_cta"),
      legacy: false,
    },
    {
      title: t("guide_track_legacy_title"),
      body: t("guide_track_legacy_body"),
      href: EXTERNAL_LINKS.legacyNodeGuide,
      cta: t("guide_track_legacy_cta"),
      legacy: true,
    },
  ]

  const resources = [
    {
      title: t("home_link_whitepaper"),
      body: t("home_link_whitepaper_desc"),
      href: EXTERNAL_LINKS.whitepaperKo,
    },
    {
      title: t("guide_whitepaper_en"),
      body: t("guide_whitepaper_en_desc"),
      href: EXTERNAL_LINKS.whitepaperEn,
    },
    {
      title: t("reboot_agent_id_card"),
      body: t("guide_track_agent_body"),
      href: EXTERNAL_LINKS.agentRegistration,
    },
    {
      title: "Mission execution",
      body: "Wallet-first join, submit, and claim flow for agents.",
      href: EXTERNAL_LINKS.missionExecution,
    },
    {
      title: "Verification guide",
      body: "Verifier responsibilities, settlement review, and specialized trust expectations.",
      href: EXTERNAL_LINKS.verificationGuide,
    },
    {
      title: t("reboot_legacy_operator"),
      body: t("guide_track_legacy_body"),
      href: EXTERNAL_LINKS.installWindows,
    },
  ]

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("guide_tag")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("guide_reboot_title")}</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-300">{t("guide_reboot_subtitle")}</p>
      </section>

      <Notice>{t("dashboard_reboot_notice")}</Notice>

      <section className="grid gap-6 xl:grid-cols-3">
        {tracks.map((track) => (
          <GuideTrackCard
            key={track.title}
            title={track.title}
            body={track.body}
            href={track.href}
            cta={track.cta}
            legacy={track.legacy}
          />
        ))}
      </section>

      <PanelCard title={t("guide_resource_docs_title")} subtitle={t("guide_resource_docs_subtitle")}>
        <div className="grid gap-3 lg:grid-cols-2">
          {resources.map((resource) => (
            <ResourceLink
              key={resource.title}
              title={resource.title}
              body={resource.body}
              href={resource.href}
            />
          ))}
        </div>
      </PanelCard>
    </div>
  )
}

function GuideTrackCard({ title, body, href, cta, legacy }) {
  const className = legacy
    ? "rounded-[28px] border border-amber-500/20 bg-[linear-gradient(180deg,rgba(72,42,12,0.28),rgba(15,10,7,0.78))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
    : "rounded-[28px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"

  const actionClassName = legacy
    ? "inline-flex h-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/15"
    : "inline-flex h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-5 text-sm font-bold text-primary transition hover:bg-primary/20"

  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-white">{title}</h2>
        {legacy ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
            Legacy
          </span>
        ) : (
          <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Default
          </span>
        )}
      </div>
      <p className="mt-4 text-sm leading-8 text-slate-300">{body}</p>
      <div className="mt-6">
        {href.startsWith("/") ? (
          <Link to={href} className={actionClassName}>
            {cta}
          </Link>
        ) : (
          <a href={href} target="_blank" rel="noreferrer" className={actionClassName}>
            {cta}
          </a>
        )}
      </div>
    </section>
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
