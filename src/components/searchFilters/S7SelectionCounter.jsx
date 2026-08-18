import S7Icon from "../ui/S7Icon";
import { formatSelectionCountLabel } from "../../utils/formatSelectionCountLabel.js";
import "./S7SelectionCounter.css";

/**
 * Contador informativo de itens selecionados — cards de busca e filtros S7.
 * Não renderiza quando count === 0 (sem espaço reservado).
 * @param {{
 *   count?: number;
 *   singularLabel: string;
 *   pluralLabel: string;
 * }} props
 */
export default function S7SelectionCounter({ count = 0, singularLabel, pluralLabel }) {
  const n = Number.isFinite(Number(count)) ? Math.max(0, Math.trunc(Number(count))) : 0;
  if (n === 0) return null;

  const label = formatSelectionCountLabel(n, singularLabel, pluralLabel);

  return (
    <span className="s7-selection-counter" aria-live="polite" aria-atomic="true">
      <S7Icon
        name="billing_check"
        size={14}
        strokeWidth={1.75}
        className="s7-selection-counter__icon"
        aria-hidden
      />
      <span className="s7-selection-counter__label">{label}</span>
    </span>
  );
}
