// ======================================================
// PI.2.11A — Modal espelho da Precificação Inteligente.
// Fechamento: clique no backdrop + Escape (sem botão X no canto).
// Renderiza a mesma experiência da rota `/precificacoes/inteligente/:id`
// (`PricingIntelligenceContent` variant="page") dentro de um modal 95vw × 95vh.
// Não altera engine, hooks financeiros nem layout interno homologado.
// ======================================================

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import { PricingIntelligenceContent } from "../PricingIntelligenceContent.jsx";
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
      if (e.key !== "Escape") return;
      // S4.3.6.20 — camada superior (Comparativo) consome Escape com preventDefault.
      if (e.defaultPrevented) return;
      onClose();
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
        <div className="pricing-intelligence-modal__scroll">
          <div className="pricing-intelligence-page pricing-intelligence-page--modal-shell">
            <PricingIntelligenceContent
              row={row}
              active={open}
              variant="page"
              embeddedInModalShell
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
