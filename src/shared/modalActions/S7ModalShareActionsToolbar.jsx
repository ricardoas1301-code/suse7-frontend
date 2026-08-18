// ======================================================================
// Barra de ações de compartilhamento/exportação — modais S7 (Raio-X, PI, etc.)
// UI-only: handlers reais plugados pelo consumidor; padrão seguro = placeholder.
// ======================================================================

import S7Tooltip from "../../components/ui/S7Tooltip.jsx";
import S7ModalShareActionIcon from "./S7ModalShareActionIcon.jsx";
import {
  S7_MODAL_SHARE_ACTION_LABELS,
  S7_MODAL_SHARE_ACTION_ORDER,
} from "./s7ModalShareActions.js";
import "./S7ModalShareActionsToolbar.css";

/**
 * @param {{
 *   actions?: readonly import("./s7ModalShareActions.js").S7ModalShareActionId[];
 *   actionLabels?: Record<string, string>;
 *   className?: string;
 *   buttonClassName?: string;
 *   placeholderTooltip?: string;
 *   onAction?: (actionId: import("./s7ModalShareActions.js").S7ModalShareActionId) => void;
 * }} props
 */
export default function S7ModalShareActionsToolbar({
  actions = S7_MODAL_SHARE_ACTION_ORDER,
  actionLabels = S7_MODAL_SHARE_ACTION_LABELS,
  className = "s7-modal-share-actions",
  buttonClassName = "s7-modal-share-actions__btn",
  placeholderTooltip = "Em breve",
  onAction,
}) {
  const handleClick = (actionId) => {
    onAction?.(actionId);
  };

  return (
    <div className={className} role="toolbar" aria-label="Ações de compartilhamento">
      {actions.map((actionId) => (
        <S7Tooltip key={actionId} content={placeholderTooltip} placement="bottom-start" offset={6}>
          <span
            role="button"
            tabIndex={0}
            className={buttonClassName}
            aria-label={actionLabels[actionId] ?? `Ação ${actionId}`}
            onClick={() => handleClick(actionId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleClick(actionId);
              }
            }}
          >
            <S7ModalShareActionIcon actionId={actionId} />
          </span>
        </S7Tooltip>
      ))}
    </div>
  );
}
