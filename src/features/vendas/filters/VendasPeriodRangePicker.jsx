// ======================================================================
// Seletor premium de período — calendário duplo + presets (Vendas P_2.2.1.A).
// ======================================================================

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import S7Icon from "../../../components/ui/S7Icon";
import { VENDAS_CALENDAR_WEEKDAYS_PT, VENDAS_PERIOD_PRESETS } from "./vendasFiltersConstants";
import {
  compareIsoDates,
  formatIsoToBrDate,
  formatVendasOrderDateTriggerLabel,
  isoInInclusiveRange,
  parseIsoDateOnlyUtc,
  resolveVendasPeriodRange,
} from "./vendasFiltersPeriod";
import {
  buildUtcMonthMatrix,
  formatMonthYearLabelPt,
  monthKeyFromDate,
  shiftMonthKey,
} from "./vendasPeriodCalendarGrid";
import "./VendasPeriodRangePicker.css";

/** @typedef {import("./vendasFiltersPeriod.js").VendasPeriodPresetUi} VendasPeriodPresetUi */

/**
 * @param {{
 *   periodPreset: VendasPeriodPresetUi | "operational_cycle";
 *   startDate: string;
 *   endDate: string;
 *   onApply: (payload: {
 *     preset: VendasPeriodPresetUi | "operational_cycle";
 *     startDate: string;
 *     endDate: string;
 *   }) => void;
 *   showFieldLabel?: boolean;
 *   triggerLabelOverride?: string | null;
 *   presets?: readonly { id: string; label: string }[];
 * }} props
 */
export default function VendasPeriodRangePicker({
  periodPreset,
  startDate,
  endDate,
  onApply,
  showFieldLabel = true,
  triggerLabelOverride = null,
  presets = VENDAS_PERIOD_PRESETS,
}) {
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(/** @type {import("react").CSSProperties} */ ({}));

  const [draftPreset, setDraftPreset] = useState(periodPreset);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [pickPhase, setPickPhase] = useState(/** @type {"start" | "end"} */ ("start"));

  const appliedStart = parseIsoDateOnlyUtc(startDate);
  const initialLeftMonth = useMemo(
    () => monthKeyFromDate(appliedStart ?? new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na abertura
    [startDate],
  );

  const [leftMonth, setLeftMonth] = useState(initialLeftMonth);
  const rightMonth = useMemo(() => shiftMonthKey(leftMonth, 1), [leftMonth]);

  const resetDraftFromApplied = useCallback(() => {
    setDraftPreset(periodPreset);
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setPickPhase("start");
    const d = parseIsoDateOnlyUtc(startDate);
    if (d) setLeftMonth(monthKeyFromDate(d));
  }, [periodPreset, startDate, endDate]);

  const openPanel = useCallback(() => {
    resetDraftFromApplied();
    setOpen(true);
  }, [resetDraftFromApplied]);

  const closePanel = useCallback(() => {
    setOpen(false);
    resetDraftFromApplied();
  }, [resetDraftFromApplied]);

  const measurePanel = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const rect = root.getBoundingClientRect();
    const bubble = panel.getBoundingClientRect();
    const pad = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left;
    if (left + bubble.width > vw - pad) left = Math.max(pad, vw - pad - bubble.width);
    if (left < pad) left = pad;

    let top = rect.bottom + 8;
    if (top + bubble.height > vh - pad) {
      const above = rect.top - 8 - bubble.height;
      if (above >= pad) top = above;
      else top = Math.max(pad, vh - pad - bubble.height);
    }

    setPanelStyle({
      position: "fixed",
      left,
      top,
      maxHeight: `${vh - pad * 2}px`,
      zIndex: "var(--s7-z-popover, 300000)",
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measurePanel();
    const id = window.requestAnimationFrame(measurePanel);
    return () => window.cancelAnimationFrame(id);
  }, [open, leftMonth, measurePanel]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => measurePanel();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, measurePanel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closePanel();
    };
    const onPointer = (e) => {
      const t = /** @type {Node | null} */ (e.target);
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      closePanel();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, closePanel]);

  const applyPreset = useCallback(
    (presetId) => {
      if (presetId === "operational_cycle") {
        onApply({
          preset: "operational_cycle",
          startDate: startDate || "",
          endDate: endDate || "",
        });
        setOpen(false);
        return;
      }
      /** @type {VendasPeriodPresetUi} */
      const preset = /** @type {VendasPeriodPresetUi} */ (presetId);
      if (preset === "custom") {
        setDraftPreset("custom");
        setPickPhase("start");
        return;
      }
      const range = resolveVendasPeriodRange(preset);
      setDraftPreset(preset);
      setDraftStart(range.startDate);
      setDraftEnd(range.endDate);
      setPickPhase("start");
      const d = parseIsoDateOnlyUtc(range.startDate);
      if (d) setLeftMonth(monthKeyFromDate(d));
    },
    [onApply, startDate, endDate],
  );

  const onDayClick = useCallback(
    (iso) => {
      setDraftPreset("custom");
      if (pickPhase === "start" || !draftStart || (draftStart && draftEnd)) {
        setDraftStart(iso);
        setDraftEnd("");
        setPickPhase("end");
        return;
      }
      let start = draftStart;
      let end = iso;
      if (compareIsoDates(end, start) < 0) {
        const tmp = start;
        start = end;
        end = tmp;
      }
      setDraftStart(start);
      setDraftEnd(end);
      setPickPhase("start");
    },
    [draftStart, draftEnd, pickPhase],
  );

  const canApply = Boolean(draftStart && draftEnd);

  const handleFilter = useCallback(() => {
    if (!canApply) return;
    onApply({
      preset: draftPreset,
      startDate: draftStart,
      endDate: draftEnd,
    });
    setOpen(false);
  }, [canApply, draftPreset, draftStart, draftEnd, onApply]);

  const triggerLabel =
    triggerLabelOverride != null && String(triggerLabelOverride).trim() !== ""
      ? String(triggerLabelOverride).trim()
      : formatVendasOrderDateTriggerLabel(startDate, endDate);
  const periodAriaLabel =
    triggerLabelOverride != null && String(triggerLabelOverride).trim() !== ""
      ? String(triggerLabelOverride).trim()
      : startDate && endDate
        ? `Período: ${formatIsoToBrDate(startDate)} até ${formatIsoToBrDate(endDate)}`
        : "Período";

  const panel =
    open && typeof document !== "undefined" ? (
      <div
        ref={panelRef}
        className="vendas-period-picker__panel"
        style={panelStyle}
        role="dialog"
        aria-label="Selecionar período"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="vendas-period-picker__panel-inner">
          <div className="vendas-period-picker__calendars">
            <CalendarMonth
              monthKey={leftMonth}
              rangeStart={draftStart}
              rangeEnd={draftEnd}
              onPrev={() => setLeftMonth((m) => shiftMonthKey(m, -1))}
              onNext={() => setLeftMonth((m) => shiftMonthKey(m, 1))}
              onSelectDay={onDayClick}
            />
            <CalendarMonth
              monthKey={rightMonth}
              rangeStart={draftStart}
              rangeEnd={draftEnd}
              onPrev={() => setLeftMonth((m) => shiftMonthKey(m, -1))}
              onNext={() => setLeftMonth((m) => shiftMonthKey(m, 1))}
              onSelectDay={onDayClick}
            />
          </div>

          <aside className="vendas-period-picker__presets" aria-label="Presets de período">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                className={[
                  "vendas-period-picker__preset",
                  draftPreset === p.id ||
                  (p.id === "operational_cycle" && periodPreset === "operational_cycle")
                    ? "vendas-period-picker__preset--active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </aside>
        </div>

        <div className="vendas-period-picker__footer">
          <p className="vendas-period-picker__draft-label">
            {draftStart && draftEnd
              ? `${formatIsoToBrDate(draftStart)} até ${formatIsoToBrDate(draftEnd)}`
              : draftStart
                ? `Início ${formatIsoToBrDate(draftStart)} — selecione o fim`
                : "Selecione o intervalo"}
          </p>
          <div className="vendas-period-picker__actions">
            <button type="button" className="vendas-period-picker__btn vendas-period-picker__btn--ghost" onClick={closePanel}>
              Cancelar
            </button>
            <button
              type="button"
              className="vendas-period-picker__btn vendas-period-picker__btn--primary"
              disabled={!canApply}
              onClick={handleFilter}
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="vendas-period-picker" ref={rootRef}>
      {showFieldLabel ? <span className="vendas-filters-card__label">Período</span> : null}
      <button
        type="button"
        className="vendas-period-picker__trigger"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={periodAriaLabel}
      >
        <S7Icon name="calendar" size={16} strokeWidth={1.85} className="vendas-period-picker__trigger-icon" />
        <span className="vendas-period-picker__trigger-text">{triggerLabel}</span>
        <S7Icon name="chevron_down" size={16} strokeWidth={2} className="vendas-period-picker__trigger-chevron" />
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  );
}

/**
 * @param {{
 *   monthKey: { year: number; month: number };
 *   rangeStart: string;
 *   rangeEnd: string;
 *   onPrev: () => void;
 *   onNext: () => void;
 *   onSelectDay: (iso: string) => void;
 * }} props
 */
function CalendarMonth({ monthKey, rangeStart, rangeEnd, onPrev, onNext, onSelectDay }) {
  const cells = useMemo(
    () => buildUtcMonthMatrix(monthKey.year, monthKey.month),
    [monthKey.year, monthKey.month],
  );
  const title = formatMonthYearLabelPt(monthKey.year, monthKey.month);
  const hasRange = Boolean(rangeStart && rangeEnd);

  return (
    <div className="vendas-period-picker__month">
      <div className="vendas-period-picker__month-head">
        <button type="button" className="vendas-period-picker__nav" onClick={onPrev} aria-label="Mês anterior">
          <S7Icon name="chevron_left" size={16} strokeWidth={2} />
        </button>
        <span className="vendas-period-picker__month-title">{title}</span>
        <button type="button" className="vendas-period-picker__nav" onClick={onNext} aria-label="Próximo mês">
          <S7Icon name="chevron_right" size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="vendas-period-picker__weekdays">
        {VENDAS_CALENDAR_WEEKDAYS_PT.map((w) => (
          <span key={w} className="vendas-period-picker__weekday">
            {w}
          </span>
        ))}
      </div>
      <div className="vendas-period-picker__days">
        {cells.map((cell) => {
          const isStart = cell.iso === rangeStart;
          const isEnd = cell.iso === rangeEnd;
          const inRange = hasRange && isoInInclusiveRange(cell.iso, rangeStart, rangeEnd);
          const isBetween = inRange && !isStart && !isEnd;
          return (
            <button
              key={`${monthKey.year}-${monthKey.month}-${cell.iso}`}
              type="button"
              className={[
                "vendas-period-picker__day",
                !cell.inMonth ? "vendas-period-picker__day--outside" : "",
                inRange ? "vendas-period-picker__day--in-range" : "",
                isBetween ? "vendas-period-picker__day--between" : "",
                isStart ? "vendas-period-picker__day--start" : "",
                isEnd ? "vendas-period-picker__day--end" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDay(cell.iso)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
