import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import S7Button from "../ui/S7Button.jsx";
import { useS7DialogFocus } from "../ui/useS7DialogFocus.js";
import TermsDocumentContent from "./TermsDocumentContent.jsx";
import { useScrollAteFinal } from "./useScrollAteFinal.js";
import {
  TERMOS_USO_HASH_CONTEUDO,
  TERMOS_USO_TIPO_DOCUMENTO,
  TERMOS_USO_VERSAO_ID,
} from "../../domain/legal/termosUsoDocumento.js";
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
  const scrollAteFinal = useScrollAteFinal(scrollRef, { enabled: open });

  useS7DialogFocus({ open, onClose, containerRef: panelRef });

  useEffect(() => {
    if (!open) return;
    setAceiteInterno(false);
    const frame = window.requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const podeMarcarAceite = scrollAteFinal;
  const podeConfirmar = scrollAteFinal && aceiteInterno;

  function handleConfirmar() {
    if (!podeConfirmar) return;
    onAccepted({
      document_type: TERMOS_USO_TIPO_DOCUMENTO,
      document_version: TERMOS_USO_VERSAO_ID,
      document_hash: TERMOS_USO_HASH_CONTEUDO,
      accepted_at: new Date().toISOString(),
      source: "SIGNUP",
      scrolled_to_end: true,
    });
  }

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!open) return null;

  return (
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
              Termos de Uso do SUSE7
            </h2>
            <p id="s7-terms-modal-desc" className="s7-terms-modal__hint">
              Leia o documento integralmente para habilitar o aceite.
            </p>
          </div>
          <button type="button" className="s7-terms-modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <div ref={scrollRef} className="s7-terms-modal__scroll" tabIndex={0}>
          <TermsDocumentContent variant="modal" showTitle={false} showUpdateDate />
        </div>

        <footer className="s7-terms-modal__footer">
          {!scrollAteFinal ? (
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
              <span>Li e aceito os Termos de Uso</span>
            </label>

            <Link to="/termos" target="_blank" rel="noopener noreferrer" className="s7-terms-modal__external-link">
              Abrir Termos em nova aba
            </Link>
          </div>

          <div className="s7-terms-modal__actions">
            <S7Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </S7Button>
            <S7Button variant="primary" type="button" disabled={!podeConfirmar} onClick={handleConfirmar}>
              Aceitar e continuar
            </S7Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
