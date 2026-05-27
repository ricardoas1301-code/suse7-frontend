import { memo } from "react";
import "./TimelineEmptyState.css";

/**
 * @param {{ variant?: "default" | "filtered" }} props
 */
function TimelineEmptyState({ variant = "default" }) {
  const isFiltered = variant === "filtered";

  return (
    <div className="timeline-empty-state" role="status" data-variant={variant}>
      <p className="timeline-empty-state__title">
        {isFiltered
          ? "Nenhum evento encontrado para os filtros aplicados."
          : "Nenhuma ação operacional encontrada."}
      </p>
      <p className="timeline-empty-state__desc">
        {isFiltered
          ? "Ajuste a busca ou limpe os filtros para ver mais eventos."
          : "Quando ações forem executadas na Seller Toolbox, elas aparecerão aqui em ordem cronológica."}
      </p>
    </div>
  );
}

export default memo(TimelineEmptyState);
