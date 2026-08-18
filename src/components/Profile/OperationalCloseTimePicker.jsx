import { useCallback, useEffect, useId, useRef, useState } from "react";
import S7Icon from "../ui/S7Icon.jsx";
import {
  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  normalizeOperationalDayClosesAt,
} from "../../features/dashboard/operationalDayCycle.js";
import "./OperationalCloseTimePicker.css";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

function parseOperationalTime(value) {
  const formatted = normalizeOperationalDayClosesAt(value);
  const [hourText, minuteText] = formatted.split(":");
  return {
    hour: Number(hourText),
    minute: Number(minuteText),
    formatted,
  };
}

function formatOperationalTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Seletor de hora HH:mm para encerramento operacional (substitui input nativo type="time").
 *
 * @param {{
 *   value?: string;
 *   onChange: (value: string) => void;
 *   disabled?: boolean;
 *   id?: string;
 *   label?: string;
 *   className?: string;
 * }} props
 */
export default function OperationalCloseTimePicker({
  value = DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  onChange,
  disabled = false,
  id,
  label,
  className = "",
}) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);
  const { hour, minute, formatted } = parseOperationalTime(value);

  const emitChange = useCallback(
    (nextHour, nextMinute) => {
      onChange(formatOperationalTime(nextHour, nextMinute));
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return undefined;

    const scrollSelected = (listRef, selectedIndex) => {
      const selected = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "center" });
    };

    scrollSelected(hourListRef, hour);
    scrollSelected(minuteListRef, minute);
  }, [open, hour, minute]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const rootClass = ["s7-op-close-time", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} ref={rootRef}>
      {label ? (
        <span className="s7-op-close-time__label" id={`${triggerId}-label`}>
          {label}
        </span>
      ) : null}

      <button
        type="button"
        id={triggerId}
        className={`s7-op-close-time__trigger${open ? " is-open" : ""}`}
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={label ? `${triggerId}-label` : undefined}
      >
        <span className="s7-op-close-time__value">{formatted}</span>
        <S7Icon name="billing_clock" size={16} className="s7-op-close-time__icon" />
      </button>

      {open ? (
        <div
          className="s7-op-close-time__popover"
          role="dialog"
          aria-label="Selecionar hora de encerramento"
        >
          <div className="s7-op-close-time__preview" aria-hidden="true">
            <span className="s7-op-close-time__preview-part">{String(hour).padStart(2, "0")}</span>
            <span className="s7-op-close-time__preview-sep">:</span>
            <span className="s7-op-close-time__preview-part">{String(minute).padStart(2, "0")}</span>
          </div>

          <div className="s7-op-close-time__columns">
            <ul
              ref={hourListRef}
              className="s7-op-close-time__column"
              role="listbox"
              aria-label="Hora"
            >
              {HOURS.map((optionHour) => {
                const selected = optionHour === hour;
                return (
                  <li key={optionHour} role="presentation" data-index={optionHour}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={selected ? "is-selected" : ""}
                      onClick={() => emitChange(optionHour, minute)}
                    >
                      {String(optionHour).padStart(2, "0")}
                    </button>
                  </li>
                );
              })}
            </ul>

            <ul
              ref={minuteListRef}
              className="s7-op-close-time__column"
              role="listbox"
              aria-label="Minuto"
            >
              {MINUTES.map((optionMinute) => {
                const selected = optionMinute === minute;
                return (
                  <li key={optionMinute} role="presentation" data-index={optionMinute}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={selected ? "is-selected" : ""}
                      onClick={() => emitChange(hour, optionMinute)}
                    >
                      {String(optionMinute).padStart(2, "0")}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
