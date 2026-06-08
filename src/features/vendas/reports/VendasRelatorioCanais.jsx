// ======================================================================
// Barra de canais do relatório — padrão global S7 (Raio-X).
// Canal Copiar = cópia VISUAL do relatório (P_2.8.12F.C) com fallback texto.
// Demais canais em fase futura.
// ======================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7ModalShareActionIcon from "../../../shared/modalActions/S7ModalShareActionIcon.jsx";
import {
  S7_MODAL_SHARE_ACTION_LABELS,
  S7_MODAL_SHARE_ACTION_ORDER,
} from "../../../shared/modalActions/s7ModalShareActions.js";
import { buildVendasSharePayload } from "./share/buildVendasSharePayload.js";
import { renderVendasShareExecutiveText } from "./share/renderVendasShareExecutiveText.js";
import { copyVendasReportImageToClipboard } from "./share/copyVendasReportImage.jsx";

const COPY_FEEDBACK_MS = 2000;

/**
 * @param {{
 *   aggregatedReport?: import("./buildVendasAggregatedReport.js").VendasAggregatedReport | null;
 * }} props
 */
export default function VendasRelatorioCanais({ aggregatedReport = null }) {
  const canCopy = Boolean(aggregatedReport);
  // null | "image" | "text"
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [copying, setCopying] = useState(false);
  const timeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    };
  }, []);

  const flashFeedback = useCallback((kind) => {
    if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    setCopyFeedback(kind);
    timeoutRef.current = setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_MS);
  }, []);

  const handleCopy = useCallback(async () => {
    if (copying) return;
    const payload = buildVendasSharePayload(aggregatedReport);
    if (!payload) return;

    setCopying(true);
    try {
      // 1) Tenta copiar a imagem visual do relatório.
      try {
        const copiedImage = await copyVendasReportImageToClipboard(payload);
        if (copiedImage) {
          flashFeedback("image");
          return;
        }
      } catch {
        // Cai no fallback textual abaixo.
      }

      // 2) Fallback: copia o resumo executivo textual.
      try {
        const text = renderVendasShareExecutiveText(payload);
        if (text && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          flashFeedback("text");
        }
      } catch {
        // Silencioso: sem clipboard disponível.
      }
    } finally {
      setCopying(false);
    }
  }, [aggregatedReport, copying, flashFeedback]);

  const copied = copyFeedback != null;
  const copyTooltip =
    copyFeedback === "image"
      ? "Copiado!"
      : copyFeedback === "text"
        ? "Copiado como texto"
        : S7_MODAL_SHARE_ACTION_LABELS.copy;

  return (
    <div
      className="vendas-sale-rayx__ops-actions vendas-sale-rayx__ops-actions--icon-bar vendas-sale-rayx__ops-actions--header"
      role="toolbar"
      aria-label="Canais de exportação"
    >
      {S7_MODAL_SHARE_ACTION_ORDER.map((actionId) => {
        const label = S7_MODAL_SHARE_ACTION_LABELS[actionId];

        if (actionId === "copy" && canCopy) {
          return (
            <S7Tooltip key={actionId} content={copyTooltip} placement="bottom-start" offset={6}>
              <button
                type="button"
                className={[
                  "vendas-sale-rayx__ops-icon-btn",
                  copied ? "vendas-sale-rayx__ops-icon-btn--copied" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={label}
                onClick={handleCopy}
              >
                {copied ? (
                  <Check size={17} strokeWidth={2} aria-hidden />
                ) : (
                  <S7ModalShareActionIcon actionId={actionId} />
                )}
              </button>
            </S7Tooltip>
          );
        }

        return (
          <S7Tooltip key={actionId} content={`${label} — em breve`} placement="bottom-start" offset={6}>
            <button
              type="button"
              className="vendas-sale-rayx__ops-icon-btn"
              aria-label={label}
              disabled
              title="Disponível em fase futura"
            >
              <S7ModalShareActionIcon actionId={actionId} />
            </button>
          </S7Tooltip>
        );
      })}
    </div>
  );
}
