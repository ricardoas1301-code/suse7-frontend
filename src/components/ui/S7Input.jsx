// ======================================================
// COMPONENTE GLOBAL: S7Input
// Objetivo:
// - Padronizar os campos de input do Suse7
// - Centralizar estados visuais: default, focus, erro, sucesso, disabled
// - Mensagens: erro (prioridade), sucesso opcional, texto auxiliar
//
// Observações:
// - Sem lógica de negócio
// - Compatível com uso legado: error como string
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
  /** @type {boolean|string} */
  error = false,
  /** Texto de erro quando `error === true` OU mensagem legada quando `error` é string não vazia */
  message = "",
  /** Destaque de sucesso (borda verde discreta); use com moderação */
  success = false,
  successMessage = "",
  /** Alias de texto auxiliar neutro (equivalente a `hint`) */
  helperText = "",
  hint = "",
  className = "",
  inputClassName = "",
  rightElement = null,
  ...rest
}) {
  const stateClassTokens = [
    "s7-input",
    "s7-input--error",
    "s7-input--success",
    "s7-input--disabled",
  ];
  const incomingTokens = String(className || "")
    .split(/\s+/)
    .filter(Boolean);

  const legacyErrorString = typeof error === "string" ? error : "";
  const isErrorFlag = error === true || Boolean(legacyErrorString);
  const errorDisplayText = legacyErrorString || (error === true ? String(message || "") : "");

  const hasDisabledToken = incomingTokens.includes("s7-input--disabled") || !!disabled;

  const showSuccess =
    Boolean(success) && !isErrorFlag && !errorDisplayText;

  const safeWrapperTokens = incomingTokens.filter((t) => !stateClassTokens.includes(t));

  const wrapperClasses = ["s7-input__wrapper", ...safeWrapperTokens].join(" ");

  const fieldClasses = [
    "s7-input__field",
    inputClassName,
    isErrorFlag ? "s7-input--error" : "",
    showSuccess ? "s7-input--success" : "",
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

  const helper = helperText || hint;

  let messageBlock = null;
  if (errorDisplayText) {
    messageBlock = (
      <div className="s7-input__message s7-input__message--error" role="alert">
        {errorDisplayText}
      </div>
    );
  } else if (showSuccess && successMessage) {
    messageBlock = (
      <div className="s7-input__message s7-input__message--success">{successMessage}</div>
    );
  } else if (helper) {
    messageBlock = (
      <div className="s7-input__message s7-input__message--helper">{helper}</div>
    );
  }

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
          aria-invalid={isErrorFlag || undefined}
          {...rest}
        />

        {rightElement ? (
          <div className="s7-input__right-element">
            {rightElement}
          </div>
        ) : null}
      </div>

      {messageBlock}
    </div>
  );
}
