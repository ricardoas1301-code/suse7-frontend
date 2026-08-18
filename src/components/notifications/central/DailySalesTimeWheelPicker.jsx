import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatDailySalesSummaryTimeParts,
  parseDailySalesSummaryTimeParts,
} from "./dailySalesSummaryTimeInput";
import "./DailySalesTimeWheelPicker.css";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const ITEM_HEIGHT = 36;

/**
 * @param {{
 *   open: boolean;
 *   value: string;
 *   title?: string;
 *   onClose: () => void;
 *   onConfirm: (value: string) => void;
 * }} props
 */
export default function DailySalesTimeWheelPicker({ open, value, title, onClose, onConfirm }) {
  const initial = parseDailySalesSummaryTimeParts(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const parts = parseDailySalesSummaryTimeParts(value);
    setHour(parts.hour);
    setMinute(parts.minute);
  }, [open, value]);

  const scrollToIndex = useCallback((container, index) => {
    if (!container) return;
    container.scrollTop = index * ITEM_HEIGHT;
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      scrollToIndex(hourRef.current, hour);
      scrollToIndex(minuteRef.current, minute);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, hour, minute, scrollToIndex]);

  const snapScroll = (container, items, setter) => {
    if (!container) return;
    const index = Math.round(container.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setter(clamped);
    container.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
  };

  const handleHourScroll = () => {
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      snapScroll(hourRef.current, HOURS, (idx) => setHour(idx));
    }, 80);
  };

  const handleMinuteScroll = () => {
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      snapScroll(minuteRef.current, MINUTES, (idx) => setMinute(idx));
    }, 80);
  };

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(formatDailySalesSummaryTimeParts(hour, minute));
    onClose();
  };

  return (
    <div className="s7-time-wheel-backdrop" role="presentation" onClick={onClose}>
      <div
        className="s7-time-wheel"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Selecionar horário"}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="s7-time-wheel__head">
          <strong>{title ?? "Selecionar horário"}</strong>
        </header>

        <div className="s7-time-wheel__columns">
          <div className="s7-time-wheel__col">
            <span className="s7-time-wheel__col-label">Hora</span>
            <div className="s7-time-wheel__viewport-wrap">
              <div className="s7-time-wheel__highlight" aria-hidden />
              <div
                ref={hourRef}
                className="s7-time-wheel__viewport"
                onScroll={handleHourScroll}
              >
                <div className="s7-time-wheel__pad" />
                {HOURS.map((h, idx) => (
                  <button
                    key={h}
                    type="button"
                    className={`s7-time-wheel__item ${idx === hour ? "s7-time-wheel__item--active" : ""}`}
                    onClick={() => {
                      setHour(idx);
                      scrollToIndex(hourRef.current, idx);
                    }}
                  >
                    {h}
                  </button>
                ))}
                <div className="s7-time-wheel__pad" />
              </div>
            </div>
          </div>

          <span className="s7-time-wheel__sep">:</span>

          <div className="s7-time-wheel__col">
            <span className="s7-time-wheel__col-label">Minuto</span>
            <div className="s7-time-wheel__viewport-wrap">
              <div className="s7-time-wheel__highlight" aria-hidden />
              <div
                ref={minuteRef}
                className="s7-time-wheel__viewport"
                onScroll={handleMinuteScroll}
              >
                <div className="s7-time-wheel__pad" />
                {MINUTES.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    className={`s7-time-wheel__item ${idx === minute ? "s7-time-wheel__item--active" : ""}`}
                    onClick={() => {
                      setMinute(idx);
                      scrollToIndex(minuteRef.current, idx);
                    }}
                  >
                    {m}
                  </button>
                ))}
                <div className="s7-time-wheel__pad" />
              </div>
            </div>
          </div>
        </div>

        <footer className="s7-time-wheel__actions">
          <button type="button" className="s7-time-wheel__btn s7-time-wheel__btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="s7-time-wheel__btn s7-time-wheel__btn--primary" onClick={handleConfirm}>
            Confirmar
          </button>
        </footer>
      </div>
    </div>
  );
}
