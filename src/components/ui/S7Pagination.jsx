// ======================================================================
// S7Pagination ÔÇö pagina├º├úo padr├úo Suse7 (modelo da p├ígina Vendas)
// Exibe: "P├ígina X de Y ┬À Z {noun} no total" + bot├Áes Anterior / Pr├│xima.
// Componente ├║nico reaproveitado por Vendas, Produtos, An├║ncios,
// Precifica├º├Áes e Concorr├¬ncia para manter a experi├¬ncia consistente.
// ======================================================================

import "./S7Pagination.css";

/**
 * @param {{
 *   page: number;
 *   totalPages: number;
 *   total?: number;
 *   noun?: string;
 *   onPrevious: () => void;
 *   onNext: () => void;
 *   disabled?: boolean;
 *   className?: string;
 *   ariaLabel?: string;
 * }} props
 */
export default function S7Pagination({
  page,
  totalPages,
  total = 0,
  noun = "itens",
  onPrevious,
  onNext,
  disabled = false,
  className = "",
  ariaLabel = "Pagina├º├úo",
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.min(Math.max(1, Number(page) || 1), safeTotalPages);
  const hasPrevious = safePage > 1;
  const hasNext = safePage < safeTotalPages;
  const safeTotal = Number(total) || 0;

  return (
    <nav className={`s7-pagination${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
      <span className="s7-pagination__summary">
        P├ígina {safePage} de {safeTotalPages}
        {safeTotal > 0 ? ` ┬À ${safeTotal.toLocaleString("pt-BR")} ${noun} no total` : ""}
      </span>
      <button
        type="button"
        className="s7-pagination__btn"
        disabled={disabled || !hasPrevious}
        onClick={onPrevious}
      >
        Anterior
      </button>
      <button
        type="button"
        className="s7-pagination__btn s7-pagination__btn--next"
        disabled={disabled || !hasNext}
        onClick={onNext}
      >
        Pr├│xima
      </button>
    </nav>
  );
}
