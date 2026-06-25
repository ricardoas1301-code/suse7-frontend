// ======================================================================
// Render visual executivo do Relatório de Vendas (P_2.8.12F.C — Missão 1).
//
// Base visual PREMIUM reutilizável, alinhada ao padrão do Raio-X da Venda S7:
// header com logo Suse7, card de informações, bloco de KPIs, bloco
// operacional e rodapé "Gerado por Suse7 Precifica".
//
// Consome EXCLUSIVAMENTE o payload único (buildVendasSharePayload). Não
// recalcula dados, não acessa backend, não duplica regra. Será reutilizado
// pelos canais futuros (Copiar imagem, WhatsApp, Imprimir/PDF).
// ======================================================================

import { Users, AlertTriangle, TrendingDown } from "lucide-react";
import suse7Logo from "../../../../assets/suse7-logo-redonda.png";
import { resolveVendasReportMetricAccent } from "../vendasReportMetricTone.js";
import "./renderVendasExecutiveShareImage.css";

const ACCENT_COLOR = {
  green: "#059669",
  orange: "#f97316",
  red: "#dc2626",
  neutral: "#0f172a",
};

/**
 * @param {string} metricId
 * @param {{ displayValue?: string; unavailable?: boolean }} input
 * @returns {string}
 */
function accentColorFor(metricId, input) {
  const { accent } = resolveVendasReportMetricAccent(metricId, input);
  return ACCENT_COLOR[accent] ?? ACCENT_COLOR.neutral;
}

/**
 * Card visual compartilhável do relatório agregado de vendas.
 *
 * @param {{
 *   payload: import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined;
 * }} props
 */
export default function VendasExecutiveShareCard({ payload }) {
  if (!payload) return null;

  const r = payload.resumoExecutivo;
  const cabecalho = payload.cabecalhoExecutivo ?? {};
  const custos = Array.isArray(r.custos) ? r.custos : [];

  const kpis = [
    {
      label: "Faturamento",
      value: r.faturamento.display,
      color: accentColorFor("revenue", { displayValue: r.faturamento.display }),
    },
    {
      label: "Lucro",
      value: r.lucroLiquido.display,
      color: accentColorFor("netProfit", { displayValue: r.lucroLiquido.display }),
    },
    {
      label: "Margem",
      value: r.margem.display,
      color: accentColorFor("margin", {
        displayValue: r.margem.display,
        unavailable: r.margem.raw == null,
      }),
    },
  ];

  const operacionais = [
    {
      label: "Saudáveis",
      value: r.saudaveis ? r.saudaveis.label : "—",
      color: ACCENT_COLOR.green,
      icon: Users,
    },
    {
      label: "Margem crítica",
      value: r.margemCritica.label,
      color: ACCENT_COLOR.orange,
      icon: AlertTriangle,
    },
    {
      label: "Prejuízo",
      value: r.prejuizo.label,
      color: ACCENT_COLOR.red,
      icon: TrendingDown,
    },
  ];

  if (import.meta.env.DEV) {
    const firstRow =
      Array.isArray(payload.vendasDetalhe) && payload.vendasDetalhe.length > 0
        ? payload.vendasDetalhe[0]
        : null;
    console.info("[S7][VendasShareCard][debug]", {
      vendas_count: payload.quantidadeVendas?.valor ?? 0,
      detail_rows_count: Array.isArray(payload.vendasDetalhe) ? payload.vendasDetalhe.length : 0,
      first_row_keys: firstRow ? Object.keys(firstRow).slice(0, 20) : [],
      custos_final: r.custos,
    });
  }

  return (
    <article className="vendas-share-card" aria-label="Relatório de vendas (compartilhável)">
      <header className="vendas-share-card__header">
        <img className="vendas-share-card__logo" src={suse7Logo} alt="" aria-hidden />
        <div className="vendas-share-card__brand">
          <span className="vendas-share-card__brand-name">Suse7 Precifica</span>
          <span className="vendas-share-card__brand-sub">Relatório de Vendas</span>
        </div>
      </header>

      <section className="vendas-share-card__meta">
        <div className="vendas-share-card__meta-row">
          <span className="vendas-share-card__meta-label">Período</span>
          <span className="vendas-share-card__meta-value">{cabecalho.periodo ?? payload.periodo.label}</span>
        </div>
        <div className="vendas-share-card__meta-row">
          <span className="vendas-share-card__meta-label">Conta(s)</span>
          <span className="vendas-share-card__meta-value">{cabecalho.contas ?? payload.contas.label}</span>
        </div>
        <div className="vendas-share-card__meta-row">
          <span className="vendas-share-card__meta-label">Vendas</span>
          <span className="vendas-share-card__meta-value vendas-share-card__meta-value--count">
            {cabecalho.vendas ?? payload.quantidadeVendas.label}
          </span>
        </div>
        <div className="vendas-share-card__meta-row">
          <span className="vendas-share-card__meta-label">Filtros</span>
          <span className="vendas-share-card__meta-value">{cabecalho.filtros ?? "Nenhum filtro operacional ou busca adicional"}</span>
        </div>
      </section>

      {payload.mostrarDistribuicao && payload.distribuicaoPorConta.length > 0 ? (
        <section className="vendas-share-card__dist">
          <h3 className="vendas-share-card__section-title">Distribuição por conta</h3>
          <ul className="vendas-share-card__dist-list">
            {payload.distribuicaoPorConta.map((conta) => (
              <li key={conta.contaId ?? conta.conta} className="vendas-share-card__dist-item">
                <span className="vendas-share-card__dist-name">{conta.conta}</span>
                <span className="vendas-share-card__dist-count">{conta.quantidadeLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="vendas-share-card__kpis">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="vendas-share-card__kpi">
            <span className="vendas-share-card__kpi-label">{kpi.label}</span>
            <span className="vendas-share-card__kpi-value" style={{ color: kpi.color }}>
              {kpi.value}
            </span>
          </div>
        ))}
      </section>

      <section className="vendas-share-card__ops">
        {operacionais.map((op) => {
          const OpIcon = op.icon;
          return (
            <div key={op.label} className="vendas-share-card__ops-row">
              <span className="vendas-share-card__ops-label-wrap">
                {OpIcon ? (
                  <OpIcon
                    className="vendas-share-card__ops-icon"
                    size={16}
                    aria-hidden
                    style={{ color: op.color }}
                  />
                ) : null}
                <span className="vendas-share-card__ops-label">{op.label}</span>
              </span>
              <span className="vendas-share-card__ops-value" style={{ color: op.color }}>
                {op.value}
              </span>
            </div>
          );
        })}
      </section>

      <section className="vendas-share-card__costs" aria-label="Custos">
        <h3 className="vendas-share-card__section-title">Custos</h3>
        <div className="vendas-share-card__costs-grid">
          {custos.map((custo) => (
            <article key={custo.id} className="vendas-share-card__cost-card">
              <span className="vendas-share-card__cost-card-label">{custo.label}</span>
              <span className="vendas-share-card__cost-card-value">{custo.display}</span>
              <span className="vendas-share-card__cost-card-percent">{custo.sharePercent}</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="vendas-share-card__footer">
        <span className="vendas-share-card__footer-line">Gerado por Suse7 Precifica</span>
        <span className="vendas-share-card__footer-line">Inteligência em Vendas</span>
      </footer>
    </article>
  );
}
