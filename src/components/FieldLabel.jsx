// ======================================================================
// COMPONENTE: FieldLabel
// Objetivo:
// - Padronizar labels do Suse7 (texto + obrigatório + tooltip + copiar)
// - Reutilizar em ProductForm e outras telas
// Regras:
// - UI only (sem lógica sensível)
// - Tooltip padrão via Design System (.s7-tip + data-tip)
// ======================================================================

import "./FieldLabel.css";

export default function FieldLabel({ text, required = false, infoText, onCopy }) {
  return (
    <div className="fl-wrap">
      {/* ------------------------------------------------------------
         LABEL + OBRIGATÓRIO
      ------------------------------------------------------------ */}
      <span className="fl-text s7-label">
        {text}
        {required ? <span className="s7-required">*</span> : null}
      </span>

      {/* ------------------------------------------------------------
         AÇÕES À DIREITA (tooltip + copiar)
      ------------------------------------------------------------ */}
      <div className="fl-actions">
        {infoText ? (
          <button
            type="button"
            className="fl-icon fl-info s7-tip"
            data-tip={infoText}
            aria-label={`Informações sobre ${text}`}
          >
            i
          </button>
        ) : null}

        {onCopy ? (
          <button
            type="button"
            className="fl-icon fl-copy s7-tip"
            data-tip="Copiar"
            onClick={onCopy}
            aria-label={`Copiar ${text}`}
          >
            ⧉
          </button>
        ) : null}
      </div>
    </div>
  );
}
