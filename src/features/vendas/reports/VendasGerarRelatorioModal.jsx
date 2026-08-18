// ======================================================================
// Modal Gerar relatório — alinhado ao Raio-X (moldura azul + card laranja).
// ======================================================================

import { useEffect } from "react";
import { createPortal } from "react-dom";
import VendasRelatorioCanais from "./VendasRelatorioCanais";
import VendasRelatorioExecutivoStub from "./VendasRelatorioExecutivoStub";
import { buildVendasSharePayload } from "./share/buildVendasSharePayload.js";
import "./VendasGerarRelatorioModal.css";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   reportContext: import("./buildVendasReportContext.js").VendasReportContext | null;
 *   modalTitle?: string;
 *   modalSubtitle?: string;
 *   aggregatedReport?: import("./buildVendasAggregatedReport.js").VendasAggregatedReport | null;
 *   visibleActions?: readonly import("../../../shared/modalActions/s7ModalShareActions.js").S7ModalShareActionId[];
 *   executivePreview: {
 *     revenueValue: string;
 *     netProfitValue: string;
 *     marginValue: string;
 *     marginUnavailable?: boolean;
 *     healthyValue?: string;
 *     healthyUnavailable?: boolean;
 *     healthyCount?: number | string | null;
 *     lowMarginCount?: number | string | null;
 *     negativeCount?: number | string | null;
 *     loading?: boolean;
 *     empty?: boolean;
 *     error?: string | null;
 *   };
 * }} props
 */
export default function VendasGerarRelatorioModal({
  open,
  onClose,
  reportContext,
  modalTitle = "Relatório de vendas",
  modalSubtitle = "",
  aggregatedReport = null,
  visibleActions,
  executivePreview,
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

  const sharePayload = buildVendasSharePayload(aggregatedReport, reportContext);

  const activeFilters = Array.isArray(sharePayload?.filtrosAtivos) ? sharePayload.filtrosAtivos : [];

  // Quantidade de vendas deixou de ser card e passou a ser contexto textual
  // (P_2.8.12B). Consome o contrato agregado oficial quando disponível.
  const analyzedCount =
    aggregatedReport?.resumoExecutivo?.quantidadeVendas ?? reportContext.sales.totalCount ?? 0;
  const analyzedLabel = `${Number(analyzedCount).toLocaleString("pt-BR")} ${
    Number(analyzedCount) === 1 ? "venda" : "vendas"
  }`;

  const distribuicaoPorConta = Array.isArray(aggregatedReport?.distribuicaoPorConta)
    ? aggregatedReport.distribuicaoPorConta
    : [];

  return createPortal(
    <div className="vendas-relatorio-modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className="vendas-relatorio-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendas-relatorio-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="vendas-relatorio-modal-shell__decor vendas-relatorio-modal-shell__decor--left"
          aria-hidden
        />
        <div
          className="vendas-relatorio-modal-shell__decor vendas-relatorio-modal-shell__decor--right"
          aria-hidden
        />
        <div className="vendas-relatorio-modal-shell__panel">
          <div className="anuncios-pricing-modal__head-row vendas-sale-rayx__modal-head-row vendas-relatorio-modal__head-row">
            <div className="vendas-sale-rayx__modal-title-stack">
              <h2 id="vendas-relatorio-modal-title" className="anuncios-sell-popover__title">
                {modalTitle}
              </h2>
              {modalSubtitle ? (
                <p className="vendas-relatorio-modal__subtitle">{modalSubtitle}</p>
              ) : null}
            </div>
            <VendasRelatorioCanais
              aggregatedReport={aggregatedReport}
              reportContext={reportContext}
              visibleActions={visibleActions}
            />
          </div>

          <div className="vendas-relatorio-modal__inner-card">
            <dl className="vendas-relatorio-modal__summary-list">
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Período</dt>
                <dd className="vendas-relatorio-modal__summary-value">
                  {sharePayload?.cabecalhoExecutivo?.periodo ?? reportContext.period.rangeDisplay}
                </dd>
              </div>
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Conta</dt>
                <dd className="vendas-relatorio-modal__summary-value">
                  {sharePayload?.cabecalhoExecutivo?.contas ?? reportContext.account.label}
                </dd>
              </div>
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Vendas</dt>
                <dd className="vendas-relatorio-modal__summary-value vendas-relatorio-modal__summary-value--count">
                  {sharePayload?.cabecalhoExecutivo?.vendas ?? analyzedLabel}
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

            {/* Distribuição só faz sentido com 2+ contas (P_2.8.12E); com 1 conta é redundante. */}
            {distribuicaoPorConta.length > 1 ? (
              <section
                className="vendas-relatorio-modal__accounts"
                aria-label="Distribuição por conta"
              >
                <h3 className="vendas-relatorio-modal__section-title">Distribuição por conta</h3>
                <ul className="vendas-relatorio-modal__accounts-list">
                  {distribuicaoPorConta.map((conta) => (
                    <li
                      key={conta.contaId ?? conta.conta}
                      className="vendas-relatorio-modal__accounts-item"
                    >
                      <span className="vendas-relatorio-modal__accounts-name">{conta.conta}</span>
                      <span className="vendas-relatorio-modal__accounts-count">
                        {`${Number(conta.quantidadeVendas).toLocaleString("pt-BR")} ${
                          Number(conta.quantidadeVendas) === 1 ? "venda" : "vendas"
                        }`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="vendas-relatorio-modal__exec-section" aria-label="Resumo executivo">
              <h3 className="vendas-relatorio-modal__section-title">Resumo executivo</h3>
              <VendasRelatorioExecutivoStub
                {...executivePreview}
                executiveSchema={sharePayload?.resumoExecutivoSchema ?? executivePreview?.schema ?? null}
              />
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
