import { memo, useCallback, useEffect, useRef } from "react";
import { S7Button } from "../../ui";
import {
  classeCssRiscoOperacional,
  exigeConfirmacaoDuplaRisco,
  rotuloRiscoOperacional,
} from "./devCenterOperationalRiskModel";
import { useDevCenterOperationalConfirm } from "./useDevCenterOperationalConfirm";
import "./devCenterOperational.css";

/**
 * @param {{ onConfirmar?: (acao: import("./devCenterOperationalConfirmModel").DevCenterAcaoConfirmacaoPendente) => void }} props
 */
function DevCenterOperationalConfirmModal({ onConfirmar }) {
  const { acaoPendente, confirmacaoAberta, fecharConfirmacao, confirmarAcao } =
    useDevCenterOperationalConfirm();
  const cancelRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

  useEffect(() => {
    if (!confirmacaoAberta) return undefined;
    cancelRef.current?.focus();
    return undefined;
  }, [confirmacaoAberta]);

  const handleCancelar = useCallback(() => {
    fecharConfirmacao();
  }, [fecharConfirmacao]);

  const handleConfirmar = useCallback(() => {
    const confirmada = confirmarAcao();
    if (confirmada && onConfirmar) onConfirmar(confirmada);
  }, [confirmarAcao, onConfirmar]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleCancelar();
        return;
      }

      if (
        event.key === "Enter" &&
        acaoPendente &&
        exigeConfirmacaoDuplaRisco(acaoPendente.nivelRisco)
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [acaoPendente, handleCancelar],
  );

  if (!confirmacaoAberta || !acaoPendente) return null;

  const varianteBotao =
    acaoPendente.nivelRisco === "destrutivo" || acaoPendente.nivelRisco === "critico"
      ? "warning"
      : "primary";

  return (
    <div
      className="dc-operacional-confirm"
      data-risco={acaoPendente.nivelRisco}
      onKeyDown={handleKeyDown}
    >
      <div className="dc-operacional-confirm__backdrop" aria-hidden onClick={handleCancelar} />
      <div
        className="dc-operacional-confirm__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dc-operacional-confirm-title"
        aria-describedby="dc-operacional-confirm-desc"
      >
        <header className="dc-operacional-confirm__head">
          <span className={classeCssRiscoOperacional(acaoPendente.nivelRisco)}>
            Risco {rotuloRiscoOperacional(acaoPendente.nivelRisco)}
          </span>
          <h4 id="dc-operacional-confirm-title" className="dc-operacional-confirm__title">
            {acaoPendente.titulo}
          </h4>
        </header>

        <p id="dc-operacional-confirm-desc" className="dc-operacional-confirm__desc">
          {acaoPendente.descricao}
        </p>

        {exigeConfirmacaoDuplaRisco(acaoPendente.nivelRisco) ? (
          <p className="dc-operacional-confirm__aviso" role="note">
            Operação crítica — confirme somente se tiver certeza do impacto operacional.
          </p>
        ) : null}

        <footer className="dc-operacional-confirm__actions">
          <button
            ref={cancelRef}
            type="button"
            className="s7-btn s7-btn--secondary s7-btn--sm"
            onClick={handleCancelar}
          >
            <span className="s7-btn__label">{acaoPendente.rotuloCancelar}</span>
          </button>
          <S7Button type="button" variant={varianteBotao} size="sm" onClick={handleConfirmar}>
            {acaoPendente.rotuloConfirmar}
          </S7Button>
        </footer>
      </div>
    </div>
  );
}

export default memo(DevCenterOperationalConfirmModal);
