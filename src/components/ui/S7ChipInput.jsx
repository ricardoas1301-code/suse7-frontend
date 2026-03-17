// ======================================================================
// S7ChipInput
// Campo de entrada com chips reutilizável.
// - Não contém lógica de negócio específica; emite lista de valores.
// - A tela decide como persistir/validar.
// ======================================================================

import { useState } from "react";
import "./S7ChipInput.css";

export default function S7ChipInput({
  value = [],
  onChange,
  placeholder,
  disabled,
}) {
  const [draft, setDraft] = useState("");

  const notifyChange = (next) => {
    onChange?.(next);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      const raw = draft.trim();
      if (!raw) return;
      const next = [...value, raw];
      notifyChange(next);
      setDraft("");
    }
    if (e.key === "Backspace" && !draft && value.length > 0) {
      const next = value.slice(0, -1);
      notifyChange(next);
    }
  };

  const handleRemove = (chip) => {
    if (disabled) return;
    notifyChange(value.filter((v) => v !== chip));
  };

  return (
    <div className={`s7-chip-input ${disabled ? "s7-chip-input--disabled" : ""}`}>
      {value.map((chip) => (
        <span key={chip} className="s7-chip-input__chip">
          {chip}
          {!disabled && (
            <button
              type="button"
              className="s7-chip-input__chip-remove"
              onClick={() => handleRemove(chip)}
              aria-label={`Remover ${chip}`}
            >
              ✕
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          className="s7-chip-input__field"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

