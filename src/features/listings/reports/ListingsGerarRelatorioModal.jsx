// ======================================================================
// Modal de Relatórios — Listings (Precificações / Anúncios)
// Padrão visual alinhado ao Relatório de Produto.
// ======================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, CheckCircle, ClipboardList, Eye, Package, TrendingDown } from "lucide-react";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7ModalShareActionIcon from "../../../shared/modalActions/S7ModalShareActionIcon.jsx";
import {
  S7_MODAL_SHARE_ACTION_LABELS,
  S7_MODAL_SHARE_ACTION_ORDER,
} from "../../../shared/modalActions/s7ModalShareActions.js";
import { useNotifications } from "../../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes";
import "../../vendas/reports/VendasGerarRelatorioModal.css";
import "../../products/reports/ProdutosGerarRelatorioModal.css";
import "../../concorrencia/reports/ConcorrenciaRelatorioExecutivo.css";

const COPY_FEEDBACK_MS = 2000;

function ExecCard({ label, value, accent, icon: Icon }) {
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
        {Icon ? <Icon className="concorrencia-relatorio-exec__metric-icon" size={16} strokeWidth={2} aria-hidden /> : null}
      </span>
      <span className="concorrencia-relatorio-exec__metric-value">{value}</span>
    </article>
  );
}

function OpsRow({ label, value, accent, icon: Icon }) {
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
        {Icon ? <Icon className="concorrencia-relatorio-exec__ops-icon" size={16} strokeWidth={2} aria-hidden /> : null}
        <span className="concorrencia-relatorio-exec__ops-label">{label}</span>
      </span>
      <span className="concorrencia-relatorio-exec__ops-value">{value}</span>
    </div>
  );
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   mode: "precificacoes" | "anuncios";
 *   scopeLabel: string;
 *   totalLabel: string;
 *   activeFilters: string[];
 *   resumoExecutivo: {
 *     cards: { id: string; label: string; value: string; accent: string; icon: string }[];
 *     operacionais: { id: string; label: string; value: string; accent: string; icon: string }[];
 *   };
 * }} props
 */
export default function ListingsGerarRelatorioModal({
  open,
  onClose,
  mode,
  scopeLabel,
  totalLabel,
  activeFilters,
  resumoExecutivo,
}) {
  const { addNotification } = useNotifications();
  const [copyFeedback, setCopyFeedback] = useState(null);
  const timeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const moduleLabel = mode === "precificacoes" ? "precificações" : "anúncios";

  const iconById = useMemo(
    () => ({
      check: CheckCircle,
      package: Package,
      eye: Eye,
      clipboard: ClipboardList,
      warn: AlertTriangle,
      trend_down: TrendingDown,
    }),
    [],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    };
  }, []);

  const notifyHomologacao = useCallback(
    (canal) => {
      addNotification({
        event_type: "LISTINGS_REPORT_NOTIFY",
        entity_type: "listing_report",
        title: `${canal} — em homologação`,
        message: `Canal preparado no relatório de ${moduleLabel}. Configuração funcional na próxima etapa.`,
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    },
    [addNotification, moduleLabel],
  );

  const flashCopyFeedback = useCallback(() => {
    if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    setCopyFeedback("pending");
    timeoutRef.current = setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_MS);
  }, []);

  const handleChannelClick = useCallback(
    (actionId) => {
      const label = S7_MODAL_SHARE_ACTION_LABELS[actionId] ?? actionId;
      if (actionId === "copy") flashCopyFeedback();
      notifyHomologacao(label);
    },
    [flashCopyFeedback, notifyHomologacao],
  );

  if (!open) return null;

  const title = mode === "precificacoes" ? "Relatório de Precificações" : "Relatório de Anúncios";
  const subtitle = mode === "precificacoes" ? "Inteligência de Precificação" : "Inteligência de Anúncios";
  const copyCopied = copyFeedback != null;

  return createPortal(
    <div className="vendas-relatorio-modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className="vendas-relatorio-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listings-relatorio-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vendas-relatorio-modal-shell__panel">
          <div className="anuncios-pricing-modal__head-row vendas-sale-rayx__modal-head-row vendas-relatorio-modal__head-row">
            <div className="vendas-sale-rayx__modal-title-stack">
              <h2 id="listings-relatorio-modal-title" className="anuncios-sell-popover__title">
                {title}
              </h2>
              <p className="produtos-relatorio-modal__subtitle">{subtitle}</p>
            </div>
            <div
              className="vendas-sale-rayx__ops-actions vendas-sale-rayx__ops-actions--icon-bar vendas-sale-rayx__ops-actions--header"
              role="toolbar"
              aria-label="Canais de exportação"
            >
              {S7_MODAL_SHARE_ACTION_ORDER.map((actionId) => {
                const label = S7_MODAL_SHARE_ACTION_LABELS[actionId];
                if (actionId === "copy") {
                  const copyTooltip = copyCopied ? "Canal preparado" : label;
                  return (
                    <S7Tooltip key={actionId} content={copyTooltip} placement="bottom-start" offset={6}>
                      <button
                        type="button"
                        className={[
                          "vendas-sale-rayx__ops-icon-btn",
                          copyCopied ? "vendas-sale-rayx__ops-icon-btn--copied" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-label={label}
                        onClick={() => handleChannelClick(actionId)}
                      >
                        {copyCopied ? <Check size={17} strokeWidth={2} aria-hidden /> : <S7ModalShareActionIcon actionId={actionId} />}
                      </button>
                    </S7Tooltip>
                  );
                }
                return (
                  <S7Tooltip
                    key={actionId}
                    content={actionId === "csv" ? "Exportar Excel" : label}
                    placement="bottom-start"
                    offset={6}
                  >
                    <button
                      type="button"
                      className="vendas-sale-rayx__ops-icon-btn"
                      aria-label={actionId === "csv" ? "Exportar Excel" : label}
                      onClick={() => handleChannelClick(actionId)}
                    >
                      <S7ModalShareActionIcon actionId={actionId} />
                    </button>
                  </S7Tooltip>
                );
              })}
            </div>
          </div>

          <div className="vendas-relatorio-modal__inner-card">
            <dl className="vendas-relatorio-modal__summary-list">
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Escopo</dt>
                <dd className="vendas-relatorio-modal__summary-value">{scopeLabel}</dd>
              </div>
              <div className="vendas-relatorio-modal__summary-row">
                <dt className="vendas-relatorio-modal__summary-label">Itens</dt>
                <dd className="vendas-relatorio-modal__summary-value vendas-relatorio-modal__summary-value--count">{totalLabel}</dd>
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
              <section className="concorrencia-relatorio-exec" aria-label="Indicadores do resumo executivo">
                <div className="concorrencia-relatorio-exec__grid">
                  {resumoExecutivo.cards.map((card) => (
                    <ExecCard
                      key={card.id}
                      label={card.label}
                      value={card.value}
                      accent={card.accent}
                      icon={iconById[card.icon]}
                    />
                  ))}
                </div>
                <div className="concorrencia-relatorio-exec__ops">
                  {resumoExecutivo.operacionais.map((op) => (
                    <OpsRow
                      key={op.id}
                      label={op.label}
                      value={op.value}
                      accent={op.accent}
                      icon={iconById[op.icon]}
                    />
                  ))}
                </div>
              </section>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
