import { useEffect, useState } from "react"
import { ethers } from "ethers"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { FEE_CONFIG, getCurrentPromoPhase, getPromoPhaseLabelKey } from "../lib/feeConfig.js"
import { AddressLink, Eyebrow, MetricCard, Notice, Panel, StatusPill } from "../components/ui.jsx"

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
        if (!cancelled) {
          setFeeBalance(Number(ethers.formatEther(balance)).toFixed(4))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeeBalance("0.0000")
        }
      })

    return () => {
      cancelled = true
    }
  }, [readProvider])

  return (
    <div className="page-shell">
      <Eyebrow>{t("admin_tag")}</Eyebrow>
      <h1 className="page-title">{t("admin_title")}</h1>
      <p className="page-subtitle">{t("admin_subtitle")}</p>

      <div style={{ marginBottom: 24 }}>
        <Notice>{t("admin_fee_disclaimer")}</Notice>
      </div>

      {!address ? (
        <Panel title={t("admin_title")} subtitle={t("admin_connect_first")}>
          <StatusPill tone="warn">{t("admin_connect_first")}</StatusPill>
        </Panel>
      ) : !isAdmin ? (
        <Panel title={t("admin_title")} subtitle={t("admin_not_authorized")}>
          <StatusPill tone="danger">{t("admin_not_authorized")}</StatusPill>
        </Panel>
      ) : (
        <>
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <MetricCard
              label={t("admin_current_phase")}
              value={t(getPromoPhaseLabelKey(currentPhase.name))}
              footnote={`${currentPhase.requesterBps / 100}% / ${currentPhase.agentBps / 100}%`}
            />
            <MetricCard
              label={t("admin_requester_rate")}
              value={`${currentPhase.requesterBps / 100}%`}
              footnote={`${FEE_CONFIG.requesterFeeBps / 100}% standard`}
            />
            <MetricCard
              label={t("admin_provider_rate")}
              value={`${currentPhase.agentBps / 100}%`}
              footnote={t("admin_provider_rate_note")}
            />
            <MetricCard
              label={t("admin_fee_wallet_balance")}
              value={`${feeBalance} WLC`}
              footnote={t("admin_fee_wallet")}
            />
          </div>

          <div className="two-col-grid">
            <Panel title={t("admin_current_config")} subtitle={t("admin_save_note")}>
              <div className="value-list">
                <div className="value-row">
                  <span className="subtle">{t("admin_fee_wallet")}</span>
                  <AddressLink address={FEE_CONFIG.feeWallet} />
                </div>
                <div className="value-row">
                  <span className="subtle">{t("admin_requester_rate")}</span>
                  <span>{`${currentPhase.requesterBps / 100}%`}</span>
                </div>
                <div className="value-row">
                  <span className="subtle">{t("admin_provider_rate")}</span>
                  <span>{`${currentPhase.agentBps / 100}%`}</span>
                </div>
                <div className="value-row">
                  <span className="subtle">{t("create_fee_label")}</span>
                  <span>{`${FEE_CONFIG.requesterFeeBps / 100}% standard / ${FEE_CONFIG.requesterFeeFloorWlc} WLC floor`}</span>
                </div>
                <div className="value-row">
                  <span className="subtle">{t("admin_current_phase")}</span>
                  <span>{t(getPromoPhaseLabelKey(currentPhase.name))}</span>
                </div>
              </div>
            </Panel>

            <Panel title={t("admin_accepted_tokens")} subtitle={t("admin_provider_rate_note")}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("admin_token_symbol")}</th>
                    <th>{t("admin_token_type")}</th>
                    <th>{t("admin_token_address")}</th>
                    <th>{t("admin_token_enabled")}</th>
                  </tr>
                </thead>
                <tbody>
                  {FEE_CONFIG.acceptedTokens.map((token) => (
                    <tr key={`${token.symbol}-${token.type}`}>
                      <td>{token.symbol}</td>
                      <td>{token.type}</td>
                      <td>{token.address ? <AddressLink address={token.address} /> : "Native"}</td>
                      <td>{token.enabled ? t("admin_enabled_yes") : t("admin_enabled_no")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
