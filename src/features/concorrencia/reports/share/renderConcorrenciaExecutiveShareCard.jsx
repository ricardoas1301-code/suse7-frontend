// ======================================================================
// Card visual executivo — Relatório de Concorrência (compartilhável).
// Layout alinhado ao VendasExecutiveShareCard (420px, header, KPIs + ops).
// ======================================================================

import suse7Logo from "../../../../assets/suse7-logo-redonda.png";
import { buildConcorrenciaShareExecBlocos } from "../concorrenciaRelatorioExecutivoMetrics.js";
import { buildConcorrenciaShareReportSections } from "./concorrenciaShareReportLayout.js";
import "./renderConcorrenciaExecutiveShareCard.css";

/** Escala do valor KPI — cabe dentro do card (ex.: "32 concorrentes"). */
function resolveShareKpiValueFontSize(value) {
  const len = String(value ?? "").length;
  if (len <= 8) return 16;
  if (len <= 10) return 14.5;
  if (len <= 13) return 12.5;
  if (len <= 16) return 11.5;
  return 10.5;
}

/**
 * Card visual compartilhável do Relatório de Concorrência.
 *
 * @param {{
 *   payload: import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined;
 * }} props
 */
export default function ConcorrenciaExecutiveShareCard({ payload }) {
  if (!payload) return null;

  const sections = buildConcorrenciaShareReportSections(payload);
  if (!sections) return null;

  const { kpis, operacionais } = buildConcorrenciaShareExecBlocos(payload.resumoExecutivo);

  return (
    <article className="concorrencia-share-card" aria-label="Relatório de Concorrência (compartilhável)">
      <header className="concorrencia-share-card__header">
        <img className="concorrencia-share-card__logo" src={suse7Logo} alt="" aria-hidden />
        <div className="concorrencia-share-card__brand">
          <span className="concorrencia-share-card__brand-name">Suse7 Precifica</span>
          <span className="concorrencia-share-card__brand-sub">Relatório de Concorrência</span>
        </div>
      </header>

      <section className="concorrencia-share-card__meta">
        <div className="concorrencia-share-card__meta-row">
          <span className="concorrencia-share-card__meta-label">Conta</span>
          <span className="concorrencia-share-card__meta-value">{sections.cabecalho.conta}</span>
        </div>
        <div className="concorrencia-share-card__meta-row">
          <span className="concorrencia-share-card__meta-label">Produtos</span>
          <span className="concorrencia-share-card__meta-value concorrencia-share-card__meta-value--count">
            {sections.cabecalho.produtos}
          </span>
        </div>
      </section>

      {sections.mostrarDistribuicao ? (
        <section className="concorrencia-share-card__dist">
          <h3 className="concorrencia-share-card__section-title">Distribuição por conta</h3>
          <ul className="concorrencia-share-card__dist-list">
            {sections.distribuicaoPorConta.map((conta) => (
              <li key={conta.conta} className="concorrencia-share-card__dist-item">
                <span className="concorrencia-share-card__dist-name">{conta.conta}</span>
                <span className="concorrencia-share-card__dist-count">{conta.quantidadeLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="concorrencia-share-card__kpis">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="concorrencia-share-card__kpi">
            <span className="concorrencia-share-card__kpi-label">{kpi.label}</span>
            <span
              className="concorrencia-share-card__kpi-value"
              style={{ color: kpi.color, fontSize: `${resolveShareKpiValueFontSize(kpi.value)}px` }}
            >
              {kpi.value}
            </span>
          </div>
        ))}
      </section>

      <section className="concorrencia-share-card__ops">
        {operacionais.map((op) => {
          const OpIcon = op.icon;
          return (
            <div key={op.label} className="concorrencia-share-card__ops-row">
              <span className="concorrencia-share-card__ops-label-wrap">
                {OpIcon ? (
                  <OpIcon
                    className="concorrencia-share-card__ops-icon"
                    size={16}
                    aria-hidden
                    style={{ color: op.color }}
                  />
                ) : null}
                <span className="concorrencia-share-card__ops-label">{op.label}</span>
              </span>
              <span className="concorrencia-share-card__ops-value" style={{ color: op.color }}>
                {op.value}
              </span>
            </div>
          );
        })}
      </section>

      <footer className="concorrencia-share-card__footer">
        <span className="concorrencia-share-card__footer-line">Gerado por Suse7 Precifica</span>
        <span className="concorrencia-share-card__footer-line">Inteligência Competitiva</span>
      </footer>
    </article>
  );
}
