// ======================================================================
// Modal — editar/completar produto na página Produtos (espelho da rota).
// Fechamento: Escape e backdrop respeitam alterações pendentes via ProductForm.
// ======================================================================

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ProductEditContent from "./ProductEditContent.jsx";
import "../ProductForm.css";
import "../../pages/ProductEdit.css";
import "./ProductEditModal.css";

/**
 * @param {{
 *   open: boolean;
 *   productId: string | null;
 *   onClose: () => void;
 *   onSaved?: (productId: string) => void;
 * }} props
 */
export default function ProductEditModal({ open, productId, onClose, onSaved }) {
  const closeControllerRef = useRef(/** @type {{ requestClose: () => void; isDirty: () => boolean } | null} */ (null));

  const bindCloseController = useCallback((controller) => {
    closeControllerRef.current = controller;
  }, []);

  const attemptClose = useCallback(() => {
    closeControllerRef.current?.requestClose?.();
  }, []);

  const handleBackdropMouseDown = useCallback(
    (e) => {
      if (e.target === e.currentTarget) attemptClose();
    },
    [attemptClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") attemptClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, attemptClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !productId || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="product-edit-modal__backdrop"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="product-edit-modal product-edit-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Editar produto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="product-edit-modal__scroll">
          <ProductEditContent
            key={productId}
            productId={productId}
            presentation="modal"
            onCancel={onClose}
            onSaved={onSaved}
            onBindCloseController={bindCloseController}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
