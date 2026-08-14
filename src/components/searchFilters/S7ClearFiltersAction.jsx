import S7Icon from "../ui/S7Icon";
import "./S7ClearFiltersAction.css";

/**
 * Ação textual discreta — Limpar filtros (fora do dropdown de filtros rápidos).
 * @param {{
 *   disabled?: boolean;
 *   onClick?: () => void;
 *   label?: string;
 *   ariaLabel?: string;
 * }} props
 */
export default function S7ClearFiltersAction({
  disabled = true,
  onClick,
  label = "Limpar filtros",
  ariaLabel,
}) {
  const resolvedAriaLabel = ariaLabel ?? label;

  return (
    <button
      type="button"
      className="s7-clear-filters-action"
      disabled={disabled}
      aria-label={resolvedAriaLabel}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
    >
      <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="s7-clear-filters-action__icon" />
      <span className="s7-clear-filters-action__label">{label}</span>
    </button>
  );
}
