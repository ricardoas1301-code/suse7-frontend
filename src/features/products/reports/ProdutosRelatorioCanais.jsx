// ======================================================================
// Barra de canais do Relatório de Produto — padrão global S7 (Concorrência / Vendas).
// Canais visíveis e prontos; integração funcional será homologada etapa a etapa.
// ======================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7ModalShareActionIcon from "../../../shared/modalActions/S7ModalShareActionIcon.jsx";
import {
  S7_MODAL_SHARE_ACTION_LABELS,
  S7_MODAL_SHARE_ACTION_ORDER,
} from "../../../shared/modalActions/s7ModalShareActions.js";
import { useNotifications } from "../../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../../services/notificationTypes";

const COPY_FEEDBACK_MS = 2000;

/**
 * @param {{
 *   aggregatedReport?: import("./buildProdutosAggregatedReport.js").ReturnType<typeof import("./buildProdutosAggregatedReport.js").buildProdutosAggregatedReport> | null;
 *   reportContext?: import("./buildProdutosReportContext.js").ProdutosReportContext | null;
 * }} props
 */
export default function ProdutosRelatorioCanais({ aggregatedReport = null, reportContext = null }) {
  const { addNotification } = useNotifications();
  const canShare = Boolean(aggregatedReport && reportContext);

  const [copyFeedback, setCopyFeedback] = useState(null);
  const timeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    };
  }, []);

  const notifyHomologacao = useCallback(
    (canal) => {
      addNotification({
        event_type: "PRODUCTS_REPORT_NOTIFY",
        entity_type: "product_report",
        title: `${canal} — em homologação`,
        message: "Canal preparado no Relatório de Produto. Configuração funcional na próxima etapa.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
    },
    [addNotification],
  );

  const flashCopyFeedback = useCallback(() => {
    if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    setCopyFeedback("pending");
    timeoutRef.current = setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_MS);
  }, []);

  const handleChannelClick = useCallback(
    (actionId) => {
      if (!canShare) return;
      const label = S7_MODAL_SHARE_ACTION_LABELS[actionId] ?? actionId;
      if (actionId === "copy") flashCopyFeedback();
      notifyHomologacao(label);
    },
    [canShare, flashCopyFeedback, notifyHomologacao],
  );

  const copyCopied = copyFeedback != null;
  const copyTooltip = copyCopied ? "Canal preparado" : S7_MODAL_SHARE_ACTION_LABELS.copy;

  return (
    <div
      className="vendas-sale-rayx__ops-actions vendas-sale-rayx__ops-actions--icon-bar vendas-sale-rayx__ops-actions--header"
      role="toolbar"
      aria-label="Canais de exportação"
    >
      {S7_MODAL_SHARE_ACTION_ORDER.map((actionId) => {
        const label = S7_MODAL_SHARE_ACTION_LABELS[actionId];
        if (!canShare) return null;

        if (actionId === "copy") {
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
                {copyCopied ? (
                  <Check size={17} strokeWidth={2} aria-hidden />
                ) : (
                  <S7ModalShareActionIcon actionId={actionId} />
                )}
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
  );
}
