import { Link } from "react-router-dom"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { EXTERNAL_LINKS } from "../lib/externalLinks.js"

export default function Footer() {
  const { lang } = useStore()
  const t = useT(lang)

  return (
    <footer className="mt-auto border-t border-primary/10 bg-[#0b1713]/80">
      <div className="mx-auto grid w-[min(1260px,calc(100vw-32px))] gap-8 px-0 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-primary">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_24px_rgba(0,255,180,0.14)]">
              <img className="h-7 w-7 object-contain" src="/koin-logo-primary.png" alt="Koinara" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Koinara Protocol</div>
              <div className="text-xl font-black tracking-tight text-slate-100">{t("brand_subtitle")}</div>
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-400">{t("footer_all_systems")}</p>
        </div>

        <FooterGroup
          title={t("footer_status")}
          links={[
            { label: t("footer_status"), to: "/providers", internal: true },
            { label: t("footer_analytics"), to: "/dashboard", internal: true },
          ]}
        />

        <FooterGroup
          title={t("footer_docs")}
          links={[
            { label: t("footer_guide"), to: "/guide", internal: true },
            { label: t("footer_whitepaper"), to: EXTERNAL_LINKS.whitepaperEn },
          ]}
        />

        <div>
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t("footer_network")}</div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-primary/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Worldland Mainnet</div>
              <div className="mt-1 font-semibold text-slate-100">Worldland</div>
              <div className="mt-0.5 font-mono text-[10px] text-slate-500">Chain ID 103</div>
            </div>
            <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.03] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-blue-400/60">Base Mainnet</div>
              <div className="mt-1 font-semibold text-slate-100">Base</div>
              <div className="mt-0.5 font-mono text-[10px] text-slate-500">Chain ID 8453</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterGroup({ title, links }) {
  return (
    <div>
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</div>
      <div className="grid gap-3 text-sm text-slate-300">
        {links.map((link) =>
          link.internal ? (
            <Link key={link.label} to={link.to} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ) : (
            <a key={link.label} href={link.to} target="_blank" rel="noreferrer" className="transition-colors hover:text-primary">
              {link.label}
            </a>
          ),
        )}
      </div>
    </div>
  )
}
