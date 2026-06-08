// ======================================================================
// Template executivo (stub) — mesmos valores exibidos nos KPIs da página.
// ======================================================================

import {
  EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  EXECUTIVE_PANEL_ERROR_MESSAGE,
} from "../../../components/sales/vendasExecutivePanelUx";
import { resolveVendasReportMetricTone } from "./vendasReportMetricTone.js";
import "./VendasRelatorioExecutivoStub.css";

/**
 * @param {number | string | null | undefined} value
 */
function formatCount(value) {
  if (value == null) return "0";
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("pt-BR");
}

/**
 * Grid executivo padronizado em 6 cards (2 linhas de 3). A quantidade de vendas
 * deixou de ser card e passou a ser contexto textual acima do grid (P_2.8.12B).
 *
 * @param {{
 *   revenueValue?: string;
 *   netProfitValue?: string;
 *   marginValue?: string;
 *   marginUnavailable?: boolean;
 *   healthyValue?: string;
 *   healthyUnavailable?: boolean;
 *   healthyCount?: number | string | null;
 *   lowMarginCount?: number | string | null;
 *   negativeCount?: number | string | null;
 *   loading?: boolean;
 *   empty?: boolean;
 *   error?: string | null;
 * }} props
 */
export default function VendasRelatorioExecutivoStub({
  revenueValue = EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  netProfitValue = EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  marginValue = EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  marginUnavailable = false,
  healthyValue = "—",
  healthyUnavailable = true,
  healthyCount = 0,
  lowMarginCount = 0,
  negativeCount = 0,
  loading = false,
  empty = false,
  error = null,
}) {
  if (loading) {
    return (
      <div className="vendas-relatorio-exec" aria-busy="true" aria-label="Resumo executivo do relatório">
        <div className="vendas-relatorio-exec__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="vendas-relatorio-exec__metric vendas-relatorio-exec__metric--loading" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="vendas-relatorio-exec__note vendas-relatorio-exec__note--error" role="status">
        {EXECUTIVE_PANEL_ERROR_MESSAGE}
      </p>
    );
  }

  if (empty) {
    return (
      <p className="vendas-relatorio-exec__note" role="status">
        Nenhuma venda no recorte atual para compor o resumo executivo.
      </p>
    );
  }

  const metrics = [
    {
      id: "revenue",
      label: "Faturamento",
      value: revenueValue,
      hint: null,
    },
    {
      id: "netProfit",
      label: "Lucro líquido",
      value: netProfitValue,
      hint: null,
    },
    {
      id: "margin",
      label: "Margem",
      value: marginUnavailable ? "—" : marginValue,
      hint: marginUnavailable ? "Disponível em fase futura" : null,
      unavailable: marginUnavailable,
    },
    {
      id: "healthy",
      label: "Saudáveis",
      value: healthyUnavailable ? "—" : healthyValue,
      numericCount: healthyCount,
      hint: healthyUnavailable ? "Disponível em fase futura" : null,
      unavailable: healthyUnavailable,
    },
    {
      id: "lowMargin",
      label: "Margem crítica",
      value: formatCount(lowMarginCount),
      numericCount: lowMarginCount,
      hint: null,
    },
    {
      id: "loss",
      label: "Prejuízo",
      value: formatCount(negativeCount),
      numericCount: negativeCount,
      hint: null,
    },
  ];

  return (
    <section className="vendas-relatorio-exec" aria-label="Resumo executivo do relatório">
      <div className="vendas-relatorio-exec__grid">
        {metrics.map((m) => {
          const tone = resolveVendasReportMetricTone(m.id, {
            displayValue: m.value,
            numericCount: m.numericCount,
            unavailable: m.unavailable,
          });
          return (
            <article
              key={m.id}
              className={[
                "vendas-relatorio-exec__metric",
                `vendas-relatorio-exec__metric--tone-${tone}`,
              ].join(" ")}
            >
              <span className="vendas-relatorio-exec__metric-label">{m.label}</span>
              <span className="vendas-relatorio-exec__metric-value">{m.value}</span>
              <span
                className={[
                  "vendas-relatorio-exec__metric-hint",
                  m.hint ? "" : "vendas-relatorio-exec__metric-hint--placeholder",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {m.hint ?? "\u00a0"}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
