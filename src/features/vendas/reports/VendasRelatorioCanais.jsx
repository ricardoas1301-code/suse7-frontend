// ======================================================================
// Barra de canais do relatório — padrão global S7 (Raio-X).
// Canal Copiar ativo (P_2.8.12F.B); demais canais em fase futura.
// ======================================================================

import { useCallback } from "react";
import { Check } from "lucide-react";
import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7ModalShareActionIcon from "../../../shared/modalActions/S7ModalShareActionIcon.jsx";
import {
  S7_MODAL_SHARE_ACTION_LABELS,
  S7_MODAL_SHARE_ACTION_ORDER,
} from "../../../shared/modalActions/s7ModalShareActions.js";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";
import { buildVendasSharePayload } from "./share/buildVendasSharePayload.js";
import { renderVendasShareExecutiveText } from "./share/renderVendasShareExecutiveText.js";

const COPY_FLASH_KEY = "vendas-relatorio-copy";

/**
 * @param {{
 *   aggregatedReport?: import("./buildVendasAggregatedReport.js").VendasAggregatedReport | null;
 * }} props
 */
export default function VendasRelatorioCanais({ aggregatedReport = null }) {
  const { copy, isFlashing } = useCopyToClipboard();
  const canCopy = Boolean(aggregatedReport);
  const copied = isFlashing(COPY_FLASH_KEY);

  const handleCopy = useCallback(async () => {
    const payload = buildVendasSharePayload(aggregatedReport);
    const text = renderVendasShareExecutiveText(payload);
    if (!text) return;
    await copy({ text, flashKey: COPY_FLASH_KEY });
  }, [aggregatedReport, copy]);

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
            <S7Tooltip
              key={actionId}
              content={copied ? "Copiado!" : label}
              placement="bottom-start"
              offset={6}
            >
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
