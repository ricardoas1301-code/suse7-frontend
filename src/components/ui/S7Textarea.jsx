// ======================================================
// COMPONENTE GLOBAL: S7Textarea
// Objetivo:
// - Padronizar campos de texto multilinha do Suse7
// - Reutilizar padrões visuais do S7Input
// - Facilitar manutenção e evolução do design system
//
// Observações:
// - Sem lógica de negócio
// - Componente visual e reutilizável
// ======================================================

import "./S7Textarea.css";

export default function S7Textarea({
  label = "",
  name = "",
  value = "",
  onChange,
  onBlur,
  onFocus,
  placeholder = "",
  required = false,
  disabled = false,
  error = "",
  hint = "",
  rows = 4,
  className = "",
  textareaClassName = "",
  ...rest
}) {
  const wrapperClasses = [
    "s7-textarea",
    error ? "s7-textarea--error" : "",
    disabled ? "s7-textarea--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const fieldClasses = [
    "s7-textarea__field",
    textareaClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      {label ? (
        <label className="s7-textarea__label" htmlFor={name || undefined}>
          {label}
          {required ? <span className="s7-textarea__required"> *</span> : null}
        </label>
      ) : null}

      <div className="s7-textarea__control">
        <textarea
          id={name || undefined}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={fieldClasses}
          {...rest}
        />
      </div>

      {error ? (
        <div className="s7-textarea__message s7-textarea__message--error">
          {error}
        </div>
      ) : hint ? (
        <div className="s7-textarea__message s7-textarea__message--hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
