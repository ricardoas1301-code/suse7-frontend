import { memo } from "react";
import { Search } from "lucide-react";
import "./TimelineFiltersBar.css";

function TimelineFiltersBar() {
  return (
    <section className="timeline-filters-bar" aria-label="Filtros da timeline (em breve)">
      <p className="timeline-filters-bar__hint">Filtros avançados chegam no próximo bloco.</p>

      <div className="timeline-filters-bar__grid">
        <label className="timeline-filters-bar__field">
          <span className="timeline-filters-bar__label">Busca futura</span>
          <div className="timeline-filters-bar__input-wrap">
            <Search className="timeline-filters-bar__icon" strokeWidth={2} aria-hidden />
            <input
              type="search"
              className="timeline-filters-bar__input"
              placeholder="Buscar por entidade, admin ou motivo"
              disabled
              aria-disabled="true"
            />
          </div>
        </label>

        <label className="timeline-filters-bar__field">
          <span className="timeline-filters-bar__label">Tipo de ação</span>
          <select className="timeline-filters-bar__select" disabled aria-disabled="true">
            <option>Todos os tipos</option>
          </select>
        </label>

        <label className="timeline-filters-bar__field">
          <span className="timeline-filters-bar__label">Severidade</span>
          <select className="timeline-filters-bar__select" disabled aria-disabled="true">
            <option>Todas</option>
          </select>
        </label>
      </div>
    </section>
  );
}

export default memo(TimelineFiltersBar);
