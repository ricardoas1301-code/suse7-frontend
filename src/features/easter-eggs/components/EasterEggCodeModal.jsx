import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Modal 1 — digite o código secreto.
 * @param {{
 *   erroCodigo?: string;
 *   onConfirmar: (codigo: string) => void;
 *   onFechar: () => void;
 * }} props
 */
export default function EasterEggCodeModal({ erroCodigo = "", onConfirmar, onFechar }) {
  const [codigo, setCodigo] = useState("");
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, []);

  const handleConfirmar = () => {
    onConfirmar(codigo);
  };

  const modalNode = (
    <div
      className="s7-easter-egg__overlay"
      role="presentation"
      onMouseDown={() => onFechar()}
    >
      <div
        className="s7-easter-egg__modal s7-easter-egg__modal--code"
        role="dialog"
        aria-modal="true"
        aria-labelledby="s7-easter-egg-code-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-easter-egg__head">
          <h3 id="s7-easter-egg-code-title" className="s7-easter-egg__title">
            Easter Egg SUSE7
          </h3>
        </header>

        <p className="s7-easter-egg__subtitle">Digite o código secreto</p>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="s7-easter-egg__input"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleConfirmar();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onFechar();
            }
          }}
          aria-invalid={erroCodigo ? "true" : "false"}
          aria-describedby={erroCodigo ? "s7-easter-egg-code-error" : undefined}
        />

        {erroCodigo ? (
          <p id="s7-easter-egg-code-error" className="s7-easter-egg__error" role="status">
            {erroCodigo}
          </p>
        ) : null}

        <div className="s7-easter-egg__actions s7-easter-egg__actions--code">
          <button type="button" className="s7-easter-egg__btn s7-easter-egg__btn--primary" onClick={handleConfirmar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : modalNode;
}
