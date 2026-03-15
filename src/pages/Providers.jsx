import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { Eyebrow, Panel, StatusPill } from "../components/ui.jsx"

export default function Providers() {
  const { dashboard, lang } = useStore()
  const t = useT(lang)

  return (
    <div className="page-shell">
      <Eyebrow>{t("providers_tag")}</Eyebrow>
      <h1 className="page-title">{t("providers_title")}</h1>
      <p className="page-subtitle">{t("providers_subtitle")}</p>

      <div className="two-col-grid" style={{ marginTop: 28 }}>
        <Panel title={t("providers_heading")} subtitle={t("providers_placeholder")}>
          <table className="table">
            <thead>
              <tr>
                <th>{t("providers_rank")}</th>
                <th>{t("providers_provider")}</th>
                <th>{t("providers_score")}</th>
                <th>{t("providers_status")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["01", t("common_coming_soon"), "-", t("providers_pending_indexer")],
                ["02", t("common_coming_soon"), "-", t("providers_pending_indexer")],
                ["03", t("common_coming_soon"), "-", t("providers_pending_indexer")],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => <td key={cell}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={t("providers_network_snapshot")} subtitle={t("providers_priority_note")}>
          <div className="value-list">
            <div className="value-row">
              <span className="subtle">{t("providers_active_nodes")}</span>
              <span>{dashboard.activeNodeCount}</span>
            </div>
            <div className="value-row">
              <span className="subtle">{t("providers_current_epoch")}</span>
              <span>{dashboard.currentEpoch}</span>
            </div>
            <div className="value-row">
              <span className="subtle">{t("providers_hot_standby")}</span>
              <StatusPill tone="info">{t("common_ready")}</StatusPill>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
