// ======================================================================
// S7Pagination — paginação padrão Suse7 (modelo da página Vendas)
// Exibe: "Página X de Y · Z {noun} no total" + botões Anterior / Próxima.
// Componente único reaproveitado por Vendas, Produtos, Anúncios,
// Precificações e Concorrência para manter a experiência consistente.
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
  ariaLabel = "Paginação",
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.min(Math.max(1, Number(page) || 1), safeTotalPages);
  const hasPrevious = safePage > 1;
  const hasNext = safePage < safeTotalPages;
  const safeTotal = Number(total) || 0;

  return (
    <nav className={`s7-pagination${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
      <span className="s7-pagination__summary">
        Página {safePage} de {safeTotalPages}
        {safeTotal > 0 ? ` · ${safeTotal.toLocaleString("pt-BR")} ${noun} no total` : ""}
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
        Próxima
      </button>
    </nav>
  );
}
