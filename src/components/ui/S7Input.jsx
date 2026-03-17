// ======================================================
// COMPONENTE GLOBAL: S7Input
// Objetivo:
// - Padronizar os campos de input do Suse7
// - Centralizar estados visuais de foco, erro e disabled
// - Facilitar manutenção e evolução do design system
//
// Observações:
// - Sem lógica de negócio
// - Sem validação sensível
// - Componente visual e reutilizável
// ======================================================

import "./S7Input.css";

export default function S7Input({
  label = "",
  name = "",
  value = "",
  onChange,
  onBlur,
  onFocus,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
  error = "",
  hint = "",
  className = "",
  inputClassName = "",
  rightElement = null,
  ...rest
}) {
  const stateClassTokens = ["s7-input", "s7-input--error", "s7-input--disabled"];
  const incomingTokens = String(className || "")
    .split(/\s+/)
    .filter(Boolean);

  const hasErrorToken = incomingTokens.includes("s7-input--error") || !!error;
  const hasDisabledToken = incomingTokens.includes("s7-input--disabled") || !!disabled;

  const safeWrapperTokens = incomingTokens.filter((t) => !stateClassTokens.includes(t));

  const wrapperClasses = ["s7-input__wrapper", ...safeWrapperTokens].join(" ");

  const fieldClasses = [
    "s7-input__field",
    inputClassName,
    hasErrorToken ? "s7-input--error" : "",
    hasDisabledToken ? "s7-input--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const controlClasses = [
    "s7-input__control",
    rightElement ? "s7-input__control--has-right" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      {label ? (
        <label className="s7-input__label" htmlFor={name || undefined}>
          {label}
          {required ? <span className="s7-input__required"> *</span> : null}
        </label>
      ) : null}

      <div className={controlClasses}>
        <input
          id={name || undefined}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={fieldClasses}
          {...rest}
        />

        {rightElement ? (
          <div className="s7-input__right-element">
            {rightElement}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="s7-input__message s7-input__message--error">
          {error}
        </div>
      ) : hint ? (
        <div className="s7-input__message s7-input__message--hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
