// ======================================================
// COMPONENTE GLOBAL: S7Textarea
// Objetivo:
// - Padronizar campos de texto multilinha do Suse7
// - Estados visuais alinhados ao S7Input (erro / sucesso / helper)
//
// Observações:
// - Sem lógica de negócio
// - Compatível com uso legado: error como string
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
  error = false,
  message = "",
  success = false,
  successMessage = "",
  helperText = "",
  hint = "",
  rows = 4,
  className = "",
  textareaClassName = "",
  ...rest
}) {
  const legacyErrorString = typeof error === "string" ? error : "";
  const isErrorFlag = error === true || Boolean(legacyErrorString);
  const errorDisplayText = legacyErrorString || (error === true ? String(message || "") : "");

  const showSuccess =
    Boolean(success) && !isErrorFlag && !errorDisplayText;

  const helper = helperText || hint;

  const wrapperClasses = [
    "s7-textarea",
    isErrorFlag ? "s7-textarea--error" : "",
    showSuccess ? "s7-textarea--success" : "",
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

  let messageBlock = null;
  if (errorDisplayText) {
    messageBlock = (
      <div className="s7-textarea__message s7-textarea__message--error" role="alert">
        {errorDisplayText}
      </div>
    );
  } else if (showSuccess && successMessage) {
    messageBlock = (
      <div className="s7-textarea__message s7-textarea__message--success">{successMessage}</div>
    );
  } else if (helper) {
    messageBlock = (
      <div className="s7-textarea__message s7-textarea__message--helper">{helper}</div>
    );
  }

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
          aria-invalid={isErrorFlag || undefined}
          {...rest}
        />
      </div>

      {messageBlock}
    </div>
  );
}
