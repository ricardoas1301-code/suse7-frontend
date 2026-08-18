// ======================================================================
// Checkbox de seleção — linha da lista de vendas.
// ======================================================================

/**
 * @param {{
 *   checked: boolean;
 *   disabled?: boolean;
 *   onChange: () => void;
 *   ariaLabel: string;
 * }} props
 */
export default function VendasRowSelectCheckbox({ checked, disabled = false, onChange, ariaLabel }) {
  return (
    <label
      className="vendas-page__row-select"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="anuncios-catalog__select-checkbox vendas-page__row-select-checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => {
          e.stopPropagation();
          onChange();
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </label>
  );
}
