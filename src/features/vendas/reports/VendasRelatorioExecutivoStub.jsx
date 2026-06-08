// ======================================================================
// Template executivo (stub) — mesmos valores exibidos nos KPIs da página.
// ======================================================================

import { DollarSign, Percent, Users, AlertTriangle, TrendingUp, TrendingDown, Info } from "lucide-react";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import {
  EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  EXECUTIVE_PANEL_ERROR_MESSAGE,
} from "../../../components/sales/vendasExecutivePanelUx";
import { resolveVendasReportMetricAccent } from "./vendasReportMetricTone.js";
import "./VendasRelatorioExecutivoStub.css";

// Tooltip oficial do card Lucro (margem de contribuição) — P_2.8.12F.C.
const LUCRO_TOOLTIP =
  "Valor referente à margem de contribuição da venda/período, considerando receitas do marketplace, custos internos, impostos e custos operacionais cadastrados.";

// Ícone de status (acento) — preserva o conjunto aprovado: tendência +, alerta, tendência -.
const STATUS_ICON = {
  Saudável: TrendingUp,
  Crítico: AlertTriangle,
  Prejuízo: TrendingDown,
};

/**
 * Label "X vendas" igual ao render compartilhável (buildVendasSharePayload).
 * @param {number | string | null | undefined} value
 */
function formatVendasCountLabel(value) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  const safe = Number.isFinite(n) ? Math.max(0, n) : 0;
  return `${safe.toLocaleString("pt-BR")} ${safe === 1 ? "venda" : "vendas"}`;
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
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="vendas-relatorio-exec__metric vendas-relatorio-exec__metric--loading" />
          ))}
        </div>
        <div className="vendas-relatorio-exec__ops">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="vendas-relatorio-exec__ops-row vendas-relatorio-exec__ops-row--loading" />
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

  // BLOCO 1 — KPIs financeiros (cards). Identidade visual preservada.
  const financialMetrics = [
    {
      id: "revenue",
      label: "Faturamento",
      value: revenueValue,
      icon: DollarSign,
      hint: null,
    },
    {
      id: "netProfit",
      label: "Lucro",
      value: netProfitValue,
      icon: DollarSign,
      hint: null,
      tooltip: LUCRO_TOOLTIP,
    },
    {
      id: "margin",
      label: "Margem",
      value: marginUnavailable ? "—" : marginValue,
      icon: Percent,
      hint: marginUnavailable ? "Disponível em fase futura" : null,
      unavailable: marginUnavailable,
    },
  ];

  // BLOCO 2 — Indicadores operacionais (linhas executivas), iguais ao render
  // compartilhável: ícone + label à esquerda, quantidade à direita.
  const operationalMetrics = [
    {
      id: "healthy",
      label: "Saudáveis",
      value: healthyUnavailable ? healthyValue : formatVendasCountLabel(healthyCount),
      icon: Users,
    },
    {
      id: "lowMargin",
      label: "Margem crítica",
      value: formatVendasCountLabel(lowMarginCount),
      icon: AlertTriangle,
    },
    {
      id: "loss",
      label: "Prejuízo",
      value: formatVendasCountLabel(negativeCount),
      icon: TrendingDown,
    },
  ];

  return (
    <section className="vendas-relatorio-exec" aria-label="Resumo executivo do relatório">
      <div className="vendas-relatorio-exec__grid">
        {financialMetrics.map((m) => {
          const { accent, status } = resolveVendasReportMetricAccent(m.id, {
            displayValue: m.value,
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
                <span className="vendas-relatorio-exec__metric-label-wrap">
                  <span className="vendas-relatorio-exec__metric-label">{m.label}</span>
                  {m.tooltip ? (
                    <S7Tooltip content={m.tooltip} placement="top-start" offset={6} wrap>
                      <span
                        className="vendas-relatorio-exec__metric-info"
                        role="button"
                        tabIndex={0}
                        aria-label={`Sobre ${m.label}`}
                      >
                        <Info size={12} strokeWidth={2} aria-hidden />
                      </span>
                    </S7Tooltip>
                  ) : null}
                </span>
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

      <div className="vendas-relatorio-exec__ops">
        {operationalMetrics.map((op) => {
          const { accent } = resolveVendasReportMetricAccent(op.id, { displayValue: op.value });
          const OpIcon = op.icon;
          return (
            <div
              key={op.id}
              className={[
                "vendas-relatorio-exec__ops-row",
                `vendas-relatorio-exec__ops-row--accent-${accent}`,
              ].join(" ")}
            >
              <span className="vendas-relatorio-exec__ops-label-wrap">
                {OpIcon ? (
                  <OpIcon className="vendas-relatorio-exec__ops-icon" size={16} aria-hidden />
                ) : null}
                <span className="vendas-relatorio-exec__ops-label">{op.label}</span>
              </span>
              <span className="vendas-relatorio-exec__ops-value">{op.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
