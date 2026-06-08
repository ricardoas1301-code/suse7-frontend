// ======================================================================
// Template executivo (stub) — mesmos valores exibidos nos KPIs da página.
// ======================================================================

import { DollarSign, Percent, Users, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import {
  EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  EXECUTIVE_PANEL_ERROR_MESSAGE,
} from "../../../components/sales/vendasExecutivePanelUx";
import { resolveVendasReportMetricAccent } from "./vendasReportMetricTone.js";
import "./VendasRelatorioExecutivoStub.css";

// Ícone de status (acento) — preserva o conjunto aprovado: tendência +, alerta, tendência -.
const STATUS_ICON = {
  Saudável: TrendingUp,
  Crítico: AlertTriangle,
  Prejuízo: TrendingDown,
};

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
 * Escala automática (P_2.8.12F): "maior tamanho possível sem quebra".
 * Os valores ocupam o máximo da largura útil do card e só reduzem quando
 * realmente necessário. Tabela calibrada pelo pior caso de largura (string
 * monetária com "R$ "), garantindo nowrap sem overflow e sem alterar o card.
 * @param {string | number | null | undefined} value
 * @returns {number} font-size em px
 */
function resolveMetricValueFontSize(value) {
  const len = String(value ?? "").length;
  if (len <= 3) return 24;
  if (len <= 6) return 23;
  if (len <= 8) return 22;
  if (len <= 10) return 21;
  if (len === 11) return 20;
  if (len === 12) return 19;
  if (len === 13) return 18;
  if (len === 14) return 16.5;
  if (len === 15) return 15.5;
  if (len === 16) return 14.5;
  if (len === 17) return 13.5;
  return 12.5;
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
      icon: DollarSign,
      hint: null,
    },
    {
      id: "netProfit",
      label: "Lucro líquido",
      value: netProfitValue,
      icon: DollarSign,
      hint: null,
    },
    {
      id: "margin",
      label: "Margem",
      value: marginUnavailable ? "—" : marginValue,
      icon: Percent,
      hint: marginUnavailable ? "Disponível em fase futura" : null,
      unavailable: marginUnavailable,
    },
    {
      id: "healthy",
      label: "Saudáveis",
      value: healthyUnavailable ? "—" : healthyValue,
      icon: Users,
      numericCount: healthyCount,
      hint: healthyUnavailable ? "Disponível em fase futura" : null,
      unavailable: healthyUnavailable,
    },
    {
      id: "lowMargin",
      label: "Margem crítica",
      value: formatCount(lowMarginCount),
      icon: AlertTriangle,
      numericCount: lowMarginCount,
      hint: null,
    },
    {
      id: "loss",
      label: "Prejuízo",
      value: formatCount(negativeCount),
      icon: TrendingDown,
      numericCount: negativeCount,
      hint: null,
    },
  ];

  return (
    <section className="vendas-relatorio-exec" aria-label="Resumo executivo do relatório">
      <div className="vendas-relatorio-exec__grid">
        {metrics.map((m) => {
          const { accent, status } = resolveVendasReportMetricAccent(m.id, {
            displayValue: m.value,
            numericCount: m.numericCount,
            unavailable: m.unavailable,
          });
          const MetricIcon = m.icon;
          const StatusIcon = status ? STATUS_ICON[status] : null;
          return (
            <article
              key={m.id}
              className={[
                "vendas-relatorio-exec__metric",
                `vendas-relatorio-exec__metric--accent-${accent}`,
              ].join(" ")}
            >
              <span className="vendas-relatorio-exec__metric-top">
                <span className="vendas-relatorio-exec__metric-label">{m.label}</span>
                {MetricIcon ? (
                  <MetricIcon className="vendas-relatorio-exec__metric-icon" size={16} aria-hidden />
                ) : null}
              </span>
              <span
                className="vendas-relatorio-exec__metric-value"
                style={{ fontSize: `${resolveMetricValueFontSize(m.value)}px` }}
              >
                {m.value}
              </span>
              {status ? (
                <span className="vendas-relatorio-exec__metric-status">
                  {StatusIcon ? <StatusIcon size={12} aria-hidden /> : null}
                  {status}
                </span>
              ) : (
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
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
