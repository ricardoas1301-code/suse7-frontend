// ======================================================
// COMPONENTE GLOBAL: S7FormField
// Objetivo:
// - Combinar label, campo, erro, hint e tooltip em um bloco reutilizável
// - Reduzir código repetido nos formulários do Suse7
// - Integrar com S7Input, S7Select, S7Textarea e S7Tooltip
//
// Observações:
// - Sem lógica de negócio
// - Componente de layout e composição
// ======================================================

import "./S7FormField.css";

export default function S7FormField({
  label = "",
  required = false,
  tooltip = "",
  error = "",
  hint = "",
  children,
  className = "",
  htmlFor = "",
  topRightAction = null,
}) {
  const wrapperClasses = [
    "s7-form-field",
    error ? "s7-form-field--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      {(label || topRightAction) && (
        <div className="s7-form-field__label-row">
          <div className="s7-form-field__label-left">
            {label && (
              <label className="s7-form-field__label" htmlFor={htmlFor || undefined}>
                {label}
                {required ? <span className="s7-form-field__required"> *</span> : null}
              </label>
            )}
            {tooltip ? (
              <span
                className="s7-form-field__info-icon pf-info-btn s7-tip s7-tip-left s7-tip-bottom"
                data-tip={tooltip}
                aria-hidden="true"
              >
                i
              </span>
            ) : null}
          </div>

          {topRightAction && (
            <div className="s7-form-field__label-right">
              {topRightAction}
            </div>
          )}
        </div>
      )}

      <div className="s7-form-field__control">
        {children}
      </div>

      {error ? (
        <div className="s7-form-field__message s7-form-field__message--error">
          {error}
        </div>
      ) : hint ? (
        <div className="s7-form-field__message s7-form-field__message--hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
