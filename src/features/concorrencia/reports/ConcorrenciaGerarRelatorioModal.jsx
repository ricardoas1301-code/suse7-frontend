// ======================================================================
// Modal Relatório de Concorrência — alinhado ao padrão Vendas (Raio-X).
// ======================================================================

import { useEffect } from "react";
import { createPortal } from "react-dom";
import ConcorrenciaRelatorioCanais from "./ConcorrenciaRelatorioCanais.jsx";
import { buildDistribuicaoPorContaFromDetalhes } from "./share/concorrenciaShareReportLayout.js";
import ConcorrenciaRelatorioExecutivo from "./ConcorrenciaRelatorioExecutivo.jsx";
import "../../../features/vendas/reports/VendasGerarRelatorioModal.css";
import "./ConcorrenciaGerarRelatorioModal.css";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   reportContext: import("./buildConcorrenciaReportContext.js").ConcorrenciaReportContext | null;
 *   aggregatedReport?: import("./buildConcorrenciaAggregatedReport.js").ReturnType<typeof import("./buildConcorrenciaAggregatedReport.js").buildConcorrenciaAggregatedReport> | null;
 * }} props
 */
export default function ConcorrenciaGerarRelatorioModal({
  open,
  onClose,
  reportContext,
  aggregatedReport = null,
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !reportContext) return null;

  const activeFilters = [
    reportContext.reportScope === "selected"
      ? `${reportContext.products.totalCount.toLocaleString("pt-BR")} produtos selecionados`
      : null,
    reportContext.operationalFilter.id !== "all" && reportContext.reportScope !== "selected"
      ? reportContext.operationalFilter.label
      : null,
    reportContext.search.hasQuery && reportContext.reportScope !== "selected"
      ? `Busca: "${reportContext.search.query}"`
      : null,
  ].filter(Boolean);

  const analyzedCount = aggregatedReport?.quantidadeProdutos ?? reportContext.products.totalCount ?? 0;
  const analyzedLabel = `${Number(analyzedCount).toLocaleString("pt-BR")} ${
    Number(analyzedCount) === 1 ? "produto" : "produtos"
  }`;

  const detalhesProdutos = aggregatedReport?.detalhesProdutos ?? [];
  const distribuicaoPorConta = buildDistribuicaoPorContaFromDetalhes(detalhesProdutos);

  return createPortal(
    <div className="vendas-relatorio-modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className="vendas-relatorio-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="concorrencia-relatorio-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vendas-relatorio-modal-shell__panel">
          <div className="anuncios-pricing-modal__head-row vendas-sale-rayx__modal-head-row vendas-relatorio-modal__head-row">
            <div className="vendas-sale-rayx__modal-title-stack">
              <h2 id="concorrencia-relatorio-modal-title" className="anuncios-sell-popover__title">
                Relatório de Concorrência
              </h2>
              <p className="concorrencia-relatorio-modal__subtitle">Inteligência Competitiva</p>
            </div>
            <ConcorrenciaRelatorioCanais aggregatedReport={aggregatedReport} reportContext={reportContext} />
          </div>

          <div className="vendas-relatorio-modal__inner-card">
            <dl className="vendas-relatorio-modal__summary-list">
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Conta</dt>
                <dd className="vendas-relatorio-modal__summary-value">{reportContext.account.label}</dd>
              </div>
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Produtos</dt>
                <dd className="vendas-relatorio-modal__summary-value vendas-relatorio-modal__summary-value--count">
                  {analyzedLabel}
                </dd>
              </div>
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Filtros</dt>
                <dd className="vendas-relatorio-modal__summary-value">
                  {activeFilters.length > 0 ? (
                    <ul className="vendas-relatorio-modal__filter-tags">
                      {activeFilters.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    "Nenhum filtro operacional ou busca adicional"
                  )}
                </dd>
              </div>
            </dl>

            {distribuicaoPorConta.length > 1 ? (
              <section
                className="vendas-relatorio-modal__accounts"
                aria-label="Distribuição por conta"
              >
                <h3 className="vendas-relatorio-modal__section-title">Distribuição por conta</h3>
                <ul className="vendas-relatorio-modal__accounts-list">
                  {distribuicaoPorConta.map((conta) => (
                    <li key={conta.conta} className="vendas-relatorio-modal__accounts-item">
                      <span className="vendas-relatorio-modal__accounts-name">{conta.conta}</span>
                      <span className="vendas-relatorio-modal__accounts-count">
                        {`${Number(conta.quantidadeProdutos).toLocaleString("pt-BR")} ${
                          Number(conta.quantidadeProdutos) === 1 ? "produto" : "produtos"
                        }`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="vendas-relatorio-modal__exec-section" aria-label="Resumo executivo">
              <h3 className="vendas-relatorio-modal__section-title">Resumo executivo</h3>
              <ConcorrenciaRelatorioExecutivo resumoExecutivo={aggregatedReport?.resumoExecutivo ?? null} />
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
