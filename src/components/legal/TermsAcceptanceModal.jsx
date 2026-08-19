import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import S7Button from "../ui/S7Button.jsx";
import S7Tooltip from "../ui/S7Tooltip.jsx";
import { useS7DialogFocus } from "../ui/useS7DialogFocus.js";
import TermsDocumentContent from "./TermsDocumentContent.jsx";
import { useScrollAteFinal } from "./useScrollAteFinal.js";
import { useTermosUsoCatalogo } from "../../hooks/useTermosUsoCatalogo.js";
import "./TermsAcceptanceModal.css";

/**
 * @typedef {{
 *   document_type: string;
 *   document_version: string;
 *   document_hash: string;
 *   accepted_at: string;
 *   source: string;
 *   scrolled_to_end: boolean;
 * }} RegistroAceiteTermos
 */

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   onAccepted: (registro: RegistroAceiteTermos) => void;
 * }} props
 */
export default function TermsAcceptanceModal({ open, onClose, onAccepted }) {
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const scrollRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [aceiteInterno, setAceiteInterno] = useState(false);
  const { catalog, loading: catalogLoading, error: catalogError } = useTermosUsoCatalogo();
  const scrollAteFinal = useScrollAteFinal(scrollRef, { enabled: open && Boolean(catalog) });

  useS7DialogFocus({ open, onClose, containerRef: panelRef });

  useEffect(() => {
    if (!open) return;
    setAceiteInterno(false);
    const frame = window.requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const podeMarcarAceite = scrollAteFinal && Boolean(catalog);
  const podeConfirmar = scrollAteFinal && aceiteInterno && Boolean(catalog);

  function handleConfirmar() {
    if (!podeConfirmar || !catalog) return;
    onAccepted({
      document_type: catalog.document_type,
      document_version: catalog.document_version,
      document_hash: catalog.document_hash,
      accepted_at: new Date().toISOString(),
      source: "SIGNUP",
      scrolled_to_end: true,
    });
  }

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!open) return null;

  const modal = (
    <div className="s7-terms-modal-bg" onMouseDown={handleOverlayMouseDown} role="presentation">
      <div
        ref={panelRef}
        className="s7-terms-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-terms-modal-title"
        aria-describedby="s7-terms-modal-desc"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="s7-terms-modal__header">
          <div>
            <h2 id="s7-terms-modal-title" className="s7-terms-modal__heading">
              {catalog?.title_modal ?? "Termos de Uso do SUSE7"}
            </h2>
            <p id="s7-terms-modal-desc" className="s7-terms-modal__hint">
              Leia o documento integralmente para habilitar o aceite.
            </p>
          </div>
        </header>

        <div ref={scrollRef} className="s7-terms-modal__scroll" tabIndex={0}>
          {catalogError ? (
            <p className="s7-terms-modal__catalog-error" role="alert">
              {catalogError}
            </p>
          ) : (
            <TermsDocumentContent variant="modal" showTitle={false} showUpdateDate />
          )}
        </div>

        <footer className="s7-terms-modal__footer">
          {catalogLoading ? (
            <p className="s7-terms-modal__scroll-hint" aria-live="polite">
              Carregando documento jurídico…
            </p>
          ) : null}

          {!catalogLoading && !catalogError && !scrollAteFinal ? (
            <p className="s7-terms-modal__scroll-hint" aria-live="polite">
              Role até o final para habilitar o aceite.
            </p>
          ) : null}

          <div className="s7-terms-modal__footer-row">
            <label className={`s7-terms-modal__accept${!podeMarcarAceite ? " s7-terms-modal__accept--disabled" : ""}`}>
              <input
                type="checkbox"
                checked={aceiteInterno}
                disabled={!podeMarcarAceite}
                onChange={(event) => setAceiteInterno(event.target.checked)}
              />
              {!podeMarcarAceite ? (
                <S7Tooltip
                  content="Role os Termos de Uso até o final para habilitar esta opção."
                  placement="top-start"
                  offset={6}
                  wrap
                >
                  <span>Li e aceito os Termos de Uso</span>
                </S7Tooltip>
              ) : (
                <span>Li e aceito os Termos de Uso</span>
              )}
            </label>
          </div>

          <div className="s7-terms-modal__actions">
            <S7Button
              variant="primary"
              type="button"
              disabled={!podeConfirmar || catalogLoading || Boolean(catalogError)}
              onClick={handleConfirmar}
            >
              Aceitar e continuar
            </S7Button>
          </div>
        </footer>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
