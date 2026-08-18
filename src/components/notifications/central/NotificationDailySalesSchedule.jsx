import { useEffect, useState } from "react";
import NotificationChannelToggle from "./NotificationChannelToggle";
import DailySalesTimeWheelPicker from "./DailySalesTimeWheelPicker";
import { isValidDailySalesSummaryTime } from "./dailySalesSummaryTimeInput";
import {
  WEEKDAY_OPTIONS,
  DEFAULT_DAILY_SALES_SUMMARY_CONFIG,
  normalizeDailySalesSummaryWeekdays,
  normalizeDailySalesSummaryTimes,
  validateDailySalesSummaryDraft,
} from "./dailySalesSummaryScheduleUtils";
import "./NotificationDailySalesSchedule.css";
import "./DailySalesTimeWheelPicker.css";

const POPUP_CHANNEL_DEF = {
  key: "popup",
  label: "Pop-up",
  description: "Modal com resumo executivo.",
};

/**
 * @param {{
 *   index: number;
 *   label: string;
 *   value: string;
 *   disabled?: boolean;
 *   onCommit: (value: string) => { ok: boolean; message?: string };
 * }} props
 */
function DailySalesTimeField({ index, label, value, disabled, onCommit }) {
  const [error, setError] = useState(null);
  const [wheelOpen, setWheelOpen] = useState(false);

  const wheelSeed = isValidDailySalesSummaryTime(value) ? value : "08:00";

  const openPicker = () => {
    if (disabled) return;
    setError(null);
    setWheelOpen(true);
  };

  const handleWheelConfirm = (next) => {
    if (!next || !isValidDailySalesSummaryTime(next)) return;
    const result = onCommit(next);
    if (!result.ok) {
      setError(result.message ?? "Horário inválido.");
      return;
    }
    setError(null);
  };

  return (
    <>
      <div className="s7-ndaily-schedule__time">
        <span>{label}</span>
        <div
          className={`s7-ndaily-schedule__time-field ${error ? "s7-ndaily-schedule__time-field--error" : ""} ${disabled ? "s7-ndaily-schedule__time-field--disabled" : ""}`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`${label}${value ? `: ${value}` : ""}. Abrir seletor de horário`}
          aria-haspopup="dialog"
          aria-expanded={wheelOpen}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `daily-time-error-${index}` : undefined}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
        >
          <input
            type="text"
            className="s7-ndaily-schedule__time-input"
            value={value || ""}
            placeholder="08:00"
            readOnly
            tabIndex={-1}
            aria-hidden
          />
          <span className="s7-ndaily-schedule__time-icon" aria-hidden>
            🕐
          </span>
        </div>
        {error ? (
          <small id={`daily-time-error-${index}`} className="s7-ndaily-schedule__time-error">
            {error}
          </small>
        ) : null}
      </div>

      <DailySalesTimeWheelPicker
        open={wheelOpen}
        value={wheelSeed}
        title={label}
        onClose={() => setWheelOpen(false)}
        onConfirm={handleWheelConfirm}
      />
    </>
  );
}

/**
 * @param {{
 *   rule?: Record<string, unknown> | null;
 *   saving?: boolean;
 *   onChange?: (patch: Record<string, unknown>) => void | Promise<void>;
 * }} props
 */
export default function NotificationDailySalesSchedule({ rule, saving, onChange }) {
  const config =
    rule?.config && typeof rule.config === "object"
      ? /** @type {Record<string, unknown>} */ (rule.config)
      : DEFAULT_DAILY_SALES_SUMMARY_CONFIG;

  const weekdays = normalizeDailySalesSummaryWeekdays(config.weekdays);
  const times = normalizeDailySalesSummaryTimes(config.times);
  const channels =
    config.channels && typeof config.channels === "object"
      ? /** @type {Record<string, boolean>} */ (config.channels)
      : DEFAULT_DAILY_SALES_SUMMARY_CONFIG.channels;

  const time1 = times[0] ?? "";
  const time2 = times[1] ?? "";
  const [showSecondTime, setShowSecondTime] = useState(() => Boolean(time2));

  useEffect(() => {
    if (time2) setShowSecondTime(true);
  }, [time2]);

  const validateSecondTimeInterval = (a, b) => {
    if (!a || !b) return { ok: true };
    if (!isValidDailySalesSummaryTime(a) || !isValidDailySalesSummaryTime(b)) {
      return { ok: true };
    }
    const [ha, ma] = a.split(":").map(Number);
    const [hb, mb] = b.split(":").map(Number);
    const deltaMin = Math.abs(hb * 60 + mb - (ha * 60 + ma));
    if (deltaMin < 4 * 60) {
      return {
        ok: false,
        message: "Use no máximo 2 horários com intervalo mínimo de 4 horas entre eles.",
      };
    }
    return { ok: true };
  };

  const emitPatch = (partialConfig) => {
    const next = {
      enabled: true,
      config: {
        ...config,
        ...partialConfig,
        timezone: DEFAULT_DAILY_SALES_SUMMARY_CONFIG.timezone,
        channels: {
          ...DEFAULT_DAILY_SALES_SUMMARY_CONFIG.channels,
          ...channels,
          ...(partialConfig?.channels ?? {}),
          // Regra de produto: sininho sempre ativo para resumo diário.
          in_app: true,
        },
      },
    };
    const validated = validateDailySalesSummaryDraft(next);
    if (!validated.ok) {
      return { ok: false, message: validated.message ?? "Não foi possível salvar a regra." };
    }
    onChange?.(next);
    return { ok: true };
  };

  const toggleWeekday = (value, checked) => {
    const set = new Set(weekdays);
    if (checked) set.add(value);
    else set.delete(value);
    emitPatch({ weekdays: [...set].sort((a, b) => a - b) });
  };

  const commitTime = (index, raw) => {
    const trimmed = String(raw ?? "").trim();
    const other = index === 0 ? time2 : time1;

    if (!trimmed) {
      return { ok: false, message: "Informe ao menos um horário válido (HH:mm)." };
    }

    if (!isValidDailySalesSummaryTime(trimmed)) {
      return { ok: false, message: "Use o formato HH:mm (ex.: 13:45)." };
    }

    if (other && other === trimmed) {
      return { ok: false, message: "Os horários não podem ser duplicados." };
    }

    const nextTimes = index === 0 ? [trimmed, time2].filter(Boolean) : [time1, trimmed].filter(Boolean);
    const spacingValidation = validateSecondTimeInterval(nextTimes[0] ?? "", nextTimes[1] ?? "");
    if (!spacingValidation.ok) return spacingValidation;

    const saved = emitPatch({ times: nextTimes });
    if (!saved.ok) return saved;
    return { ok: true };
  };

  const addSecondTime = () => {
    setShowSecondTime(true);
  };

  const removeSecondTime = () => {
    setShowSecondTime(false);
    if (time1) {
      emitPatch({ times: [time1] });
    }
  };

  const toggleChannel = (key, enabled) => {
    if (key === "in_app") return;
    emitPatch({ channels: { ...channels, [key]: enabled } });
  };

  return (
    <div className="s7-ndaily-schedule">
      <p className="s7-ndaily-schedule__intro">
        Configure os dias e horários em que o resumo automático será gerado. Os destinatários e
        canais de envio são definidos separadamente em Destinatários.
      </p>

      <fieldset className="s7-ndaily-schedule__block" disabled={saving}>
        <legend>Canais automáticos</legend>
        <div className="s7-ndaily-schedule__channels">
          <NotificationChannelToggle
            key={POPUP_CHANNEL_DEF.key}
            channelKey={POPUP_CHANNEL_DEF.key}
            label={POPUP_CHANNEL_DEF.label}
            description={POPUP_CHANNEL_DEF.description}
            enabled={channels[POPUP_CHANNEL_DEF.key] !== false}
            saving={saving}
            onChange={toggleChannel}
          />
        </div>
      </fieldset>

      <fieldset className="s7-ndaily-schedule__block" disabled={saving}>
        <legend>Dias da semana</legend>
        <div className="s7-ndaily-schedule__weekdays">
          {WEEKDAY_OPTIONS.map((d) => (
            <label key={d.value} className="s7-ndaily-schedule__weekday">
              <input
                type="checkbox"
                checked={weekdays.includes(d.value)}
                onChange={(e) => toggleWeekday(d.value, e.target.checked)}
              />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="s7-ndaily-schedule__block" disabled={saving}>
        <legend>Horários (até 2 por dia)</legend>
        <div className="s7-ndaily-schedule__times">
          <DailySalesTimeField
            index={0}
            label="Horário 1"
            value={time1}
            disabled={saving}
            onCommit={(raw) => commitTime(0, raw)}
          />

          {showSecondTime ? (
            <div className="s7-ndaily-schedule__second-time">
              <DailySalesTimeField
                index={1}
                label="Horário 2"
                value={time2}
                disabled={saving}
                onCommit={(raw) => commitTime(1, raw)}
              />
              <button
                type="button"
                className="s7-ndaily-schedule__link-btn s7-ndaily-schedule__link-btn--danger"
                disabled={saving}
                onClick={removeSecondTime}
              >
                Remover segundo horário
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="s7-ndaily-schedule__link-btn"
              disabled={saving || !time1}
              onClick={addSecondTime}
            >
              + Incluir segundo horário
            </button>
          )}
        </div>
      </fieldset>
    </div>
  );
}
