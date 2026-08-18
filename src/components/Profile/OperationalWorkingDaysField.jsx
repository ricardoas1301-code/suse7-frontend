import {
  DEFAULT_OPERATIONAL_WORKING_DAYS,
  OPERATIONAL_WEEKDAY_OPTIONS,
} from "../../features/dashboard/operationalWorkingDays.js";
import "./OperationalWorkingDaysField.css";

/**
 * @param {{
 *   value?: number[];
 *   onChange: (days: number[]) => void;
 *   className?: string;
 *   title?: string;
 *   helpText?: string;
 *   compactLabels?: boolean;
 * }} props
 */
export default function OperationalWorkingDaysField({
  value = DEFAULT_OPERATIONAL_WORKING_DAYS,
  onChange,
  className = "",
  title = "Dias de operação",
  helpText = "Usaremos estes dias junto com a hora de encerramento operacional para calcular corretamente o Resumo Diário no Dashboard. Exemplo: se sua operação encerra sexta às 17h e não trabalha sábado/domingo, o resumo de segunda considera o período desde sexta às 17h.",
  compactLabels = false,
}) {
  const selected = new Set(value);

  const toggleDay = (day) => {
    const next = new Set(selected);
    if (next.has(day)) {
      if (next.size <= 1) return;
      next.delete(day);
    } else {
      next.add(day);
    }
    onChange([...next].sort((a, b) => a - b));
  };

  const rootClass = ["s7-operational-working-days", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <span className="s7-operational-working-days__title">{title}</span>
      <div className="s7-operational-working-days__grid" role="group" aria-label={title}>
        {OPERATIONAL_WEEKDAY_OPTIONS.map((option) => {
          const displayLabel = compactLabels ? option.label.slice(0, 3) : option.label;
          return (
            <label key={option.value} className="s7-operational-working-days__item">
              <input
                type="checkbox"
                checked={selected.has(option.value)}
                onChange={() => toggleDay(option.value)}
                aria-label={option.label}
              />
              <span aria-hidden={compactLabels}>{displayLabel}</span>
            </label>
          );
        })}
      </div>
      {helpText ? <small className="field-help s7-operational-working-days__help">{helpText}</small> : null}
    </div>
  );
}
