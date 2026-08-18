import { useRef } from "react";
import { S7Button } from "../../components/ui";
import { useS7DialogFocus } from "../../components/ui/useS7DialogFocus";
import "./SubscriptionDowngradeModal.css";

/**
 * @param {{
 *   open: boolean;
 *   planName: string;
 *   accessEndLabel: string;
 *   loading?: boolean;
 *   onClose: () => void;
 *   onConfirm: () => void;
 * }} props
 */
export default function SubscriptionDowngradeModal({
  open,
  planName,
  accessEndLabel,
  loading = false,
  onClose,
  onConfirm,
}) {
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  useS7DialogFocus({
    open,
    onClose: handleClose,
    containerRef: panelRef,
  });

  if (!open) return null;

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) handleClose();
  };

  return (
    <div
      className="s7-billing-downgrade-modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        ref={panelRef}
        className="s7-billing-downgrade-modal__panel s7-billing-checkout-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-billing-downgrade-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id="s7-billing-downgrade-modal-title">Agendar downgrade?</h3>
        <p>
          Seu plano atual continua ativo até {accessEndLabel}. Depois disso, sua assinatura passará para{" "}
          {planName}.
        </p>
        <p className="s7-billing-muted">Nenhuma cobrança extra é gerada agora. O histórico financeiro é preservado.</p>
        <div className="s7-billing-checkout-sheet__actions">
          <S7Button variant="secondary" onClick={handleClose} disabled={loading}>
            Manter plano atual
          </S7Button>
          <S7Button variant="primary" onClick={onConfirm} disabled={loading}>
            {loading ? "Agendando downgrade…" : "Agendar downgrade"}
          </S7Button>
        </div>
      </div>
    </div>
  );
}
