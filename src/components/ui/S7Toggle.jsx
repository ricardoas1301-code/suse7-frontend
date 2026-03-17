// ======================================================================
// S7Toggle
// Alternância visual padronizada (switch + label).
// ======================================================================

import "./S7Toggle.css";

export default function S7Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
  id,
}) {
  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e.target.checked);
  };

  const switchId = id || `s7-toggle-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <label className={`s7-toggle ${disabled ? "s7-toggle--disabled" : ""}`} htmlFor={switchId}>
      <div className="s7-toggle__control">
        <input
          id={switchId}
          type="checkbox"
          className="s7-toggle__input"
          checked={!!checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <span className="s7-toggle__slider" />
      </div>

      {(label || description) && (
        <div className="s7-toggle__texts">
          {label && <span className="s7-toggle__label">{label}</span>}
          {description && (
            <span className="s7-toggle__description">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}

