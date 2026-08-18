// ======================================================================
// Modal Relatório de Produto — alinhado ao padrão Concorrência / Vendas.
// ======================================================================

import { useEffect } from "react";
import { createPortal } from "react-dom";
import ProdutosRelatorioCanais from "./ProdutosRelatorioCanais.jsx";
import ProdutosRelatorioExecutivo from "./ProdutosRelatorioExecutivo.jsx";
import "../../../features/vendas/reports/VendasGerarRelatorioModal.css";
import "./ProdutosGerarRelatorioModal.css";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   reportContext: import("./buildProdutosReportContext.js").ProdutosReportContext | null;
 *   aggregatedReport?: import("./buildProdutosAggregatedReport.js").ReturnType<typeof import("./buildProdutosAggregatedReport.js").buildProdutosAggregatedReport> | null;
 * }} props
 */
export default function ProdutosGerarRelatorioModal({
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
    reportContext.operationalFilter.id !== "all" ? reportContext.operationalFilter.label : null,
    reportContext.search.hasQuery ? `Busca: "${reportContext.search.query}"` : null,
  ].filter(Boolean);

  const analyzedCount = aggregatedReport?.quantidadeProdutos ?? reportContext.products.totalCount ?? 0;
  const analyzedLabel = `${Number(analyzedCount).toLocaleString("pt-BR")} ${
    Number(analyzedCount) === 1 ? "produto" : "produtos"
  }`;

  return createPortal(
    <div className="vendas-relatorio-modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className="vendas-relatorio-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="produtos-relatorio-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vendas-relatorio-modal-shell__panel">
          <div className="anuncios-pricing-modal__head-row vendas-sale-rayx__modal-head-row vendas-relatorio-modal__head-row">
            <div className="vendas-sale-rayx__modal-title-stack">
              <h2 id="produtos-relatorio-modal-title" className="anuncios-sell-popover__title">
                Relatório de Produto
              </h2>
              <p className="produtos-relatorio-modal__subtitle">Inteligência do Catálogo</p>
            </div>
            <ProdutosRelatorioCanais aggregatedReport={aggregatedReport} reportContext={reportContext} />
          </div>

          <div className="vendas-relatorio-modal__inner-card">
            <dl className="vendas-relatorio-modal__summary-list">
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Escopo</dt>
                <dd className="vendas-relatorio-modal__summary-value">{reportContext.scope.label}</dd>
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

            <section className="vendas-relatorio-modal__exec-section" aria-label="Resumo executivo">
              <h3 className="vendas-relatorio-modal__section-title">Resumo executivo</h3>
              <ProdutosRelatorioExecutivo resumoExecutivo={aggregatedReport?.resumoExecutivo ?? null} />
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
