import { memo } from "react";
import "./TimelineEmptyState.css";

function TimelineEmptyState() {
  return (
    <div className="timeline-empty-state" role="status">
      <p className="timeline-empty-state__title">Nenhuma ação operacional encontrada.</p>
      <p className="timeline-empty-state__desc">
        Quando ações forem executadas na Seller Toolbox, elas aparecerão aqui em ordem cronológica.
      </p>
    </div>
  );
}

export default memo(TimelineEmptyState);
