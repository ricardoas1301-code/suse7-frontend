// ======================================================================
// Barra de canais do relatório — padrão global S7 (Raio-X).
// ======================================================================

import S7Tooltip from "../../../components/ui/S7Tooltip";
import S7ModalShareActionIcon from "../../../shared/modalActions/S7ModalShareActionIcon.jsx";
import {
  S7_MODAL_SHARE_ACTION_LABELS,
  S7_MODAL_SHARE_ACTION_ORDER,
} from "../../../shared/modalActions/s7ModalShareActions.js";

export default function VendasRelatorioCanais() {
  return (
    <div
      className="vendas-sale-rayx__ops-actions vendas-sale-rayx__ops-actions--icon-bar vendas-sale-rayx__ops-actions--header"
      role="toolbar"
      aria-label="Canais de exportação (em breve)"
    >
      {S7_MODAL_SHARE_ACTION_ORDER.map((actionId) => {
        const label = S7_MODAL_SHARE_ACTION_LABELS[actionId];
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
