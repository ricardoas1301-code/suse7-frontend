// ======================================================
// Métrica editável inline (valor da venda / margem) — só UI + callback.
// ======================================================

import { useCallback, useEffect, useId, useRef, useState } from "react";
import S7Icon from "../ui/S7Icon.jsx";

/**
 * Converte o valor exibido no card em rascunho de input (sem recalcular).
 * @param {string} displayValue
 * @param {string} prefix
 * @param {string} suffix
 */
function rascunhoAPartirExibicao(displayValue, prefix, suffix) {
  let s = String(displayValue ?? "").trim();
  if (s === "" || s === "—" || s === "-") return "";
  if (prefix) {
    const p = String(prefix).trim();
    if (p && s.toLowerCase().startsWith(p.toLowerCase())) {
      s = s.slice(p.length).trim();
    }
  }
  if (suffix) {
    const suf = String(suffix).trim();
    if (suf && s.endsWith(suf)) {
      s = s.slice(0, -suffix.length).trim();
    }
  }
  s = s.replace(/\s*%\s*$/u, "").trim();
  return s.replace(/[R$r$\s\u00a0]/g, "").trim();
}

/**
 * @param {{
 *   label: string;
 *   displayValue: string;
 *   onCommit: (raw: string) => void;
 *   inputMode?: "decimal" | "numeric";
 *   prefix?: string;
 *   suffix?: string;
 *   ariaLabelEdit?: string;
 * }} props
 */
export function PricingInlineEditableMetric({
  label,
  displayValue,
  onCommit,
  inputMode = "decimal",
  prefix = "",
  suffix = "",
  ariaLabelEdit,
}) {
  const inputId = useId();
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const abrirEdicao = useCallback(() => {
    setDraft(rascunhoAPartirExibicao(displayValue, prefix, suffix));
    setEditing(true);
  }, [displayValue, prefix, suffix]);

  useEffect(() => {
    if (!editing) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [editing]);

  const confirmar = useCallback(() => {
    onCommit(draft);
    setEditing(false);
  }, [draft, onCommit]);

  const cancelar = useCallback(() => {
    setEditing(false);
    setDraft("");
  }, []);

  return (
    <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key anuncios-sell-popover__line--inline-edit">
      <span className="anuncios-sell-popover__promo-sale-label">
        <span className="anuncios-sell-popover__promo-sale-title-text">{label}</span>
      </span>
      {editing ? (
        <span
          className={[
            "pricing-inline-editable-metric__edit-wrap",
            prefix ? "pricing-inline-editable-metric__edit-wrap--with-prefix" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {prefix ? (
            <span className="pricing-inline-editable-metric__affix pricing-inline-editable-metric__affix--currency">
              {prefix}
            </span>
          ) : null}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            className="pricing-inline-editable-metric__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            inputMode={inputMode}
            autoComplete="off"
            aria-label={ariaLabelEdit ?? `Editar ${label}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmar();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelar();
              }
            }}
            onBlur={confirmar}
          />
        </span>
      ) : (
        <span className="pricing-inline-editable-metric__display-wrap">
          <button
            type="button"
            className="pricing-inline-editable-metric__edit-btn"
            aria-label={ariaLabelEdit ?? `Editar ${label}`}
            onClick={abrirEdicao}
          >
            <S7Icon name="edit" size={12} strokeWidth={2} />
          </button>
          <strong className="pricing-inline-editable-metric__value">{displayValue}</strong>
        </span>
      )}
    </div>
  );
}
