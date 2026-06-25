// ======================================================
// PI.2.11A — Modal espelho da Precificação Inteligente.
// Fechamento: X no canto superior direito + Escape/backdrop.
// Renderiza a mesma experiência da rota `/precificacoes/inteligente/:id`
// (`PricingIntelligenceContent` variant="page") dentro de um modal 95vw × 95vh.
// Não altera engine, hooks financeiros nem layout interno homologado.
// ======================================================

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import { PricingIntelligenceContent } from "../PricingIntelligenceContent.jsx";
import S7Icon from "../ui/S7Icon.jsx";
import "../Anuncios.css";
import "./PricingIntelligenceModal.css";

/**
 * @param {{
 *   open: boolean;
 *   row: Record<string, unknown> | null;
 *   onClose: () => void;
 *   onApplied?: () => void | Promise<void>;
 *   catalogRefreshing?: boolean;
 * }} props
 */
export function PricingIntelligenceModal({
  open,
  row,
  onClose,
  onApplied,
  catalogRefreshing = false,
}) {
  const handleBackdropMouseDown = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !row || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pricing-intelligence-modal__backdrop"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="pricing-intelligence-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Precificação inteligente"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="pricing-intelligence-modal__close anuncios-compare-modal__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <S7Icon name="close" size={18} strokeWidth={2} />
        </button>
        <div className="pricing-intelligence-modal__scroll">
          <div className="pricing-intelligence-page pricing-intelligence-page--modal-shell">
            <PricingIntelligenceContent
              row={row}
              active={open}
              variant="page"
              onClose={onClose}
              onApplied={onApplied}
              catalogRefreshing={catalogRefreshing}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PricingIntelligenceModal;
