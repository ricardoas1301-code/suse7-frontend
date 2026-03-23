// ======================================================================
// PvLocalTooltip — tooltip 100% local (aba Variações)
// Sem S7Tooltip, sem .s7-tip / .s7-tooltip — apenas marcação + CSS da tela.
// ======================================================================

/**
 * @param {{ text: string; ariaLabel?: string }} props
 */
export function PvLocalTooltip({ text, ariaLabel = "Ajuda contextual" }) {
  return (
    <div className="pv-tooltip-wrapper">
      <button
        type="button"
        className="pf-info-btn pv-tooltip-trigger"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        i
      </button>
      <div className="pv-tooltip-content" role="tooltip">
        {text}
      </div>
    </div>
  );
}

/**
 * Mesma ordem da aba Dados (FieldLabel): texto + * + ícone (i).
 * Usar com S7FormField required={false} e required aqui.
 *
 * @param {{ children: import("react").ReactNode; tooltipText: string; required?: boolean }} props
 */
export function PvLabelWithTooltip({ children, tooltipText, required = false }) {
  const labelText =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : "campo";
  return (
    <span className="pv-label-with-tooltip">
      <span className="pv-label-with-tooltip__text">
        {children}
        {required ? (
          <span className="s7-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      <PvLocalTooltip text={tooltipText} ariaLabel={`Informações: ${labelText}`} />
    </span>
  );
}
