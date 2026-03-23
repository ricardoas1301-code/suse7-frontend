// ======================================================
// COMPONENTE GLOBAL: S7FormField
// Objetivo:
// - Wrapper oficial de campos de formulário (Suse7)
// - Label, obrigatório, tooltip, mensagens e espaçamento
// - Composição com S7Input, S7Select, S7Textarea, etc.
//
// Prioridade da mensagem inferior:
// error → success → helperText (ou hint legado) → nada
//
// Observações:
// - Sem lógica de negócio; apenas estrutura e UX visual
// - Estado visual do controle (borda) continua no filho (ex.: S7Input)
// ======================================================

import S7Tooltip from "../S7Tooltip";

import "./S7FormField.css";

function trimMessage(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

export default function S7FormField({
  label = "",
  required = false,
  tooltip = "",
  error = "",
  success = "",
  helperText = "",
  /** @deprecated Preferir helperText — mantido por compatibilidade */
  hint = "",
  children,
  className = "",
  htmlFor = "",
  topRightAction = null,
}) {
  const err = trimMessage(error);
  const ok = trimMessage(success);
  const help = trimMessage(helperText) || trimMessage(hint);

  let footerKind = null;
  let footerText = "";
  if (err) {
    footerKind = "error";
    footerText = err;
  } else if (ok) {
    footerKind = "success";
    footerText = ok;
  } else if (help) {
    footerKind = "helper";
    footerText = help;
  }

  const wrapperClasses = [
    "s7-form-field",
    footerKind === "error" ? "s7-form-field--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const showHeaderRow = Boolean(label || tooltip || topRightAction);

  return (
    <div className={wrapperClasses}>
      {showHeaderRow ? (
        <div className="s7-form-field__header">
          <div className="s7-form-field__label-wrap">
            {label ? (
              <label
                className="s7-form-field__label"
                htmlFor={htmlFor || undefined}
              >
                {label}
                {required ? (
                  <span className="s7-form-field__required" aria-hidden="true">
                    {" "}
                    *
                  </span>
                ) : null}
              </label>
            ) : null}

            {tooltip ? (
              <span className="s7-form-field__tooltip">
                {/*
                  Trigger em <span>: pseudo-elementos ::after (balão .s7-tip) em <button>
                  falharam em alguns contextos; o hover no filho mantém :hover no span.
                */}
                <S7Tooltip
                  content={tooltip}
                  placement="bottom-start"
                  offset={6}
                  wrap
                >
                  <span className="s7-form-field__tooltip-anchor">
                    <button
                      type="button"
                      className="s7-form-field__tooltip-btn pf-info-btn"
                      aria-label={`Informações: ${label || "campo"}`}
                    >
                      i
                    </button>
                  </span>
                </S7Tooltip>
              </span>
            ) : null}
          </div>

          {topRightAction ? (
            <div className="s7-form-field__actions">{topRightAction}</div>
          ) : null}
        </div>
      ) : null}

      <div className="s7-form-field__control">{children}</div>

      {footerText ? (
        <div
          className={`s7-form-field__message s7-form-field__message--${footerKind}`}
          role={footerKind === "error" ? "alert" : undefined}
        >
          {footerText}
        </div>
      ) : null}
    </div>
  );
}
