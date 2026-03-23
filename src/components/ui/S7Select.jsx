// ======================================================
// COMPONENTE GLOBAL: S7Select
// Objetivo:
// - Padronizar selects do Suse7
// - Estados visuais alinhados ao S7Input (erro / sucesso / helper)
//
// Observações:
// - Sem lógica de negócio
// - Compatível com uso legado: error como string
// ======================================================

import "./S7Select.css";

export default function S7Select({
  label = "",
  name = "",
  value = "",
  onChange,
  onBlur,
  onFocus,
  placeholder = "",
  required = false,
  disabled = false,
  error = false,
  message = "",
  success = false,
  successMessage = "",
  helperText = "",
  hint = "",
  options = [],
  className = "",
  selectClassName = "",
  ...rest
}) {
  const legacyErrorString = typeof error === "string" ? error : "";
  const isErrorFlag = error === true || Boolean(legacyErrorString);
  const errorDisplayText = legacyErrorString || (error === true ? String(message || "") : "");

  const showSuccess =
    Boolean(success) && !isErrorFlag && !errorDisplayText;

  const helper = helperText || hint;

  const wrapperClasses = [
    "s7-select",
    isErrorFlag ? "s7-select--error" : "",
    showSuccess ? "s7-select--success" : "",
    disabled ? "s7-select--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const fieldClasses = [
    "s7-select__field",
    selectClassName,
  ]
    .filter(Boolean)
    .join(" ");

  let messageBlock = null;
  if (errorDisplayText) {
    messageBlock = (
      <div className="s7-select__message s7-select__message--error" role="alert">
        {errorDisplayText}
      </div>
    );
  } else if (showSuccess && successMessage) {
    messageBlock = (
      <div className="s7-select__message s7-select__message--success">{successMessage}</div>
    );
  } else if (helper) {
    messageBlock = (
      <div className="s7-select__message s7-select__message--helper">{helper}</div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {label ? (
        <label className="s7-select__label" htmlFor={name || undefined}>
          {label}
          {required ? <span className="s7-select__required"> *</span> : null}
        </label>
      ) : null}

      <div className="s7-select__control">
        <select
          id={name || undefined}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          className={fieldClasses}
          aria-invalid={isErrorFlag || undefined}
          {...rest}
        >
          {placeholder ? (
            <option value="">{placeholder}</option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {messageBlock}
    </div>
  );
}
