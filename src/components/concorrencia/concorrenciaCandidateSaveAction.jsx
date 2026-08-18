// ======================================================================
// Ação de cadastro de candidato — compartilhada entre modais de concorrência.
// ======================================================================

import S7Icon from "../ui/S7Icon";
import S7Tooltip from "../ui/S7Tooltip";
import { getListingSaveStatus, SAVE_QUEUE_STATUS } from "./concorrenciaCompetitorSave";

function resolverTooltipOverlay({ already, queued, saving, limitReached }) {
  if (already) return "Concorrente já cadastrado";
  if (queued) return "Na fila";
  if (saving) return "Cadastrando…";
  if (limitReached) return "Limite de concorrentes atingido";
  return "Cadastrar concorrente";
}

/**
 * @param {{
 *   listingId: string;
 *   already: boolean;
 *   limitReached: boolean;
 *   candidate: object;
 *   onSave: (candidate: object) => void;
 *   layout?: "inline" | "footer" | "overlay";
 * }} props
 */
export function CandidateSaveAction({
  listingId,
  already,
  limitReached,
  candidate,
  onSave,
  layout = "inline",
}) {
  const status = getListingSaveStatus(listingId);
  const queued = status === SAVE_QUEUE_STATUS.QUEUED;
  const saving = status === SAVE_QUEUE_STATUS.SAVING;
  const isFooter = layout === "footer";
  const isOverlay = layout === "overlay";

  if (isOverlay) {
    const busy = queued || saving;
    const tooltip = resolverTooltipOverlay({ already, queued, saving, limitReached });
    const estadoClasse = already
      ? "concorrencia-produto-modal__reg-card-register--saved"
      : limitReached
        ? "concorrencia-produto-modal__reg-card-register--limit"
        : "concorrencia-produto-modal__reg-card-register--available";

    return (
      <S7Tooltip content={tooltip} placement="bottom-start" offset={6}>
        <span
          className={`concorrencia-produto-modal__reg-card-register-wrap ${estadoClasse}`}
          aria-label={tooltip}
        >
          {already ? (
            <S7Icon name="billing_check" size={13} strokeWidth={2.2} />
          ) : (
            <button
              type="button"
              className="concorrencia-produto-modal__reg-card-register"
              disabled={busy || limitReached}
              onClick={() => onSave(candidate)}
            >
              {busy ? "…" : <S7Icon name="plus" size={14} strokeWidth={2.2} />}
            </button>
          )}
        </span>
      </S7Tooltip>
    );
  }

  if (already) {
    return (
      <div
        className={`concorrencia-produto-modal__cand-action${
          isFooter ? " concorrencia-produto-modal__cand-action--footer" : ""
        }`}
      >
        <span className="concorrencia-produto-modal__badge-saved">
          <S7Icon name="billing_check" size={13} strokeWidth={2.2} /> Já cadastrado
        </span>
      </div>
    );
  }

  let label = "Cadastrar";
  if (queued) label = "Na fila";
  else if (saving) label = "Cadastrando…";

  return (
    <div
      className={`concorrencia-produto-modal__cand-action concorrencia-produto-modal__cand-action--stack${
        isFooter ? " concorrencia-produto-modal__cand-action--footer" : ""
      }`}
    >
      {queued ? (
        <span className="concorrencia-produto-modal__queue-badge">⏳ Na fila</span>
      ) : saving ? (
        <span className="concorrencia-produto-modal__queue-badge">⏳ Cadastrando</span>
      ) : null}
      <button
        type="button"
        className="concorrencia-produto-modal__add-btn"
        disabled={queued || saving || limitReached}
        onClick={() => onSave(candidate)}
      >
        {label}
      </button>
    </div>
  );
}
