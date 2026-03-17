import { useEffect, useState } from "react"
import { ethers } from "ethers"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { FEE_CONFIG, getCurrentPromoPhase, getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { AddressLink, StatusPill } from "../components/ui.jsx"

export default function Admin() {
  const { lang, address, readProvider } = useStore()
  const t = useT(lang)
  const [feeBalance, setFeeBalance] = useState("0.0000")
  const currentPhase = getCurrentPromoPhase()
  const isAdmin = address?.toLowerCase() === FEE_CONFIG.adminAddress.toLowerCase()

  useEffect(() => {
    let cancelled = false
    if (!readProvider) return undefined

    readProvider
      .getBalance(FEE_CONFIG.feeWallet)
      .then((balance) => {
        if (!cancelled) setFeeBalance(Number(ethers.formatEther(balance)).toFixed(4))
      })
      .catch(() => {
        if (!cancelled) setFeeBalance("0.0000")
      })

    return () => {
      cancelled = true
    }
  }, [readProvider])

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,255,180,0.12),transparent_32%),linear-gradient(180deg,rgba(19,42,34,0.96),rgba(8,14,13,0.98))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:p-10">
        <div className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("admin_tag")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("admin_title")}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">{t("admin_subtitle")}</p>
      </section>

      <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-300">
        {t("admin_fee_disclaimer")}
      </div>

      {!address ? (
        <GateCard subtitle={t("admin_connect_first")}>
          <StatusPill tone="warn">{t("admin_connect_first")}</StatusPill>
        </GateCard>
      ) : !isAdmin ? (
        <GateCard subtitle={t("admin_not_authorized")}>
          <StatusPill tone="danger">{t("admin_not_authorized")}</StatusPill>
        </GateCard>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label={t("admin_current_phase")}
              value={t(getPromoPhaseLabelKey(currentPhase.name))}
              footnote={`${currentPhase.requesterBps / 100}% / ${currentPhase.agentBps / 100}%`}
              icon="campaign"
            />
            <KpiCard
              label={t("admin_requester_rate")}
              value={`${currentPhase.requesterBps / 100}%`}
              footnote={`${FEE_CONFIG.requesterFeeBps / 100}% standard`}
              icon="percent"
            />
            <KpiCard
              label={t("admin_provider_rate")}
              value={`${currentPhase.agentBps / 100}%`}
              footnote={t("admin_provider_rate_note")}
              icon="payments"
            />
            <KpiCard
              label={t("admin_fee_wallet_balance")}
              value={`${feeBalance} WLC`}
              footnote={t("admin_fee_wallet")}
              icon="account_balance_wallet"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <PanelCard title={t("admin_current_config")} subtitle={t("admin_save_note")}>
              <div className="grid gap-3">
                <ValueRow label={t("admin_fee_wallet")} value={<AddressLink address={FEE_CONFIG.feeWallet} />} />
                <ValueRow label={t("admin_requester_rate")} value={`${currentPhase.requesterBps / 100}%`} />
                <ValueRow label={t("admin_provider_rate")} value={`${currentPhase.agentBps / 100}%`} />
                <ValueRow
                  label={t("create_fee_label")}
                  value={`${FEE_CONFIG.requesterFeeBps / 100}% standard / ${FEE_CONFIG.requesterFeeFloorWlc} WLC floor`}
                />
                <ValueRow label={t("admin_current_phase")} value={t(getPromoPhaseLabelKey(currentPhase.name))} />
              </div>
            </PanelCard>

            <PanelCard title={t("admin_accepted_tokens")} subtitle={t("admin_provider_rate_note")}>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-primary/5 text-slate-400">
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">
                        {t("admin_token_symbol")}
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">
                        {t("admin_token_type")}
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">
                        {t("admin_token_address")}
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]">
                        {t("admin_token_enabled")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {FEE_CONFIG.acceptedTokens.map((token) => (
                      <tr key={`${token.symbol}-${token.type}`} className="transition-colors hover:bg-primary/5">
                        <td className="px-5 py-4 font-semibold text-white">{token.symbol}</td>
                        <td className="px-5 py-4 text-slate-300">{token.type}</td>
                        <td className="px-5 py-4 text-slate-300">
                          {token.address ? <AddressLink address={token.address} /> : "Native"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill tone={token.enabled ? "success" : "dim"}>
                            {token.enabled ? t("admin_enabled_yes") : t("admin_enabled_no")}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>
          </div>
        </>
      )}
    </div>
  )
}

function GateCard({ subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/5 px-6 py-5">
        <h2 className="text-xl font-black text-white">Admin</h2>
        <p className="mt-2 text-sm leading-7 text-slate-400">{subtitle}</p>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function PanelCard({ title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/5 px-6 py-5">
        <h2 className="text-xl font-black text-white">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-7 text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function KpiCard({ icon, label, value, footnote }) {
  return (
    <div className="rounded-[24px] border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined rounded-2xl bg-primary/10 p-3 text-primary">{icon}</span>
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-white">{value}</div>
      {footnote ? <div className="mt-2 text-sm leading-6 text-slate-400">{footnote}</div> : null}
    </div>
  )
}

function ValueRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#0b1713]/60 px-4 py-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
