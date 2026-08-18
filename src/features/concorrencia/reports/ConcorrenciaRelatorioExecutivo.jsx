// ======================================================================
// Resumo executivo — Relatório de Concorrência.
// 3 cards (topo) + 3 linhas operacionais (base) — padrão Relatório de Vendas.
// ======================================================================

import { buildConcorrenciaExecutivoBlocos } from "./concorrenciaRelatorioExecutivoMetrics.js";
import "./ConcorrenciaRelatorioExecutivo.css";

/** Escala do valor — cabe inteiro no card sem abreviação. */
function resolveMetricValueFontSize(value) {
  const len = String(value ?? "").length;
  if (len <= 9) return 20;
  if (len <= 12) return 18;
  if (len <= 15) return 15;
  if (len <= 18) return 13.5;
  if (len <= 22) return 12;
  return 11;
}

/**
 * @param {{
 *   label: string;
 *   value: string;
 *   icon: import("lucide-react").LucideIcon;
 *   accent: string;
 * }} props
 */
function ExecCard({ label, value, icon: Icon, accent }) {
  return (
    <article
      className={[
        "concorrencia-relatorio-exec__metric",
        accent ? `concorrencia-relatorio-exec__metric--accent-${accent}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="concorrencia-relatorio-exec__metric-top">
        <span className="concorrencia-relatorio-exec__metric-label">{label}</span>
        {Icon ? (
          <Icon className="concorrencia-relatorio-exec__metric-icon" size={16} strokeWidth={2} aria-hidden />
        ) : null}
      </span>
      <span
        className="concorrencia-relatorio-exec__metric-value"
        style={{ fontSize: `${resolveMetricValueFontSize(value)}px` }}
      >
        {value}
      </span>
    </article>
  );
}

/**
 * @param {{
 *   label: string;
 *   value: string;
 *   icon: import("lucide-react").LucideIcon;
 *   accent: string;
 * }} props
 */
function OpsRow({ label, value, icon: Icon, accent }) {
  return (
    <div
      className={[
        "concorrencia-relatorio-exec__ops-row",
        accent ? `concorrencia-relatorio-exec__ops-row--accent-${accent}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="concorrencia-relatorio-exec__ops-label-wrap">
        {Icon ? (
          <Icon className="concorrencia-relatorio-exec__ops-icon" size={16} strokeWidth={2} aria-hidden />
        ) : null}
        <span className="concorrencia-relatorio-exec__ops-label">{label}</span>
      </span>
      <span className="concorrencia-relatorio-exec__ops-value">{value}</span>
    </div>
  );
}

/**
 * @param {{
 *   resumoExecutivo?: {
 *     produtosAnalisados: { label: string };
 *     comConcorrentes: { label: string };
 *     semConcorrentes: { label: string };
 *     concorrenciaCompleta: { label: string };
 *     concorrenciaIncompleta: { label: string };
 *     comConcorrentesInativos: { label: string };
 *     totalConcorrentesMonitorados: { label: string };
 *   } | null;
 * }} props
 */
export default function ConcorrenciaRelatorioExecutivo({ resumoExecutivo = null }) {
  if (!resumoExecutivo) {
    return <p className="concorrencia-relatorio-exec__empty">Resumo indisponível.</p>;
  }

  const { cards, operacionais } = buildConcorrenciaExecutivoBlocos(resumoExecutivo);

  return (
    <section className="concorrencia-relatorio-exec" aria-label="Indicadores do resumo executivo">
      <div className="concorrencia-relatorio-exec__grid">
        {cards.map((card) => (
          <ExecCard key={card.id} {...card} />
        ))}
      </div>
      <div className="concorrencia-relatorio-exec__ops">
        {operacionais.map((op) => (
          <OpsRow key={op.id} {...op} />
        ))}
      </div>
    </section>
  );
}
