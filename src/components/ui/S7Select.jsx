// ======================================================
// COMPONENTE GLOBAL: S7Select
// Objetivo:
// - Padronizar selects do Suse7
// - Reutilizar padrões visuais do S7Input
// - Facilitar manutenção e evolução do design system
//
// Observações:
// - Sem lógica de negócio
// - Componente visual e reutilizável
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
  error = "",
  hint = "",
  options = [],
  className = "",
  selectClassName = "",
  ...rest
}) {
  const wrapperClasses = [
    "s7-select",
    error ? "s7-select--error" : "",
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

      {error ? (
        <div className="s7-select__message s7-select__message--error">
          {error}
        </div>
      ) : hint ? (
        <div className="s7-select__message s7-select__message--hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
