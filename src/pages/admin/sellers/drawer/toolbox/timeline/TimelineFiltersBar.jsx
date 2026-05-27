import { memo, useCallback } from "react";
import { Search } from "lucide-react";
import {
  TIMELINE_ENTITY_FILTER_OPTIONS,
  TIMELINE_SEVERITY_FILTER_OPTIONS,
  hasActiveTimelineFilters,
} from "./timelineModel";
import { useTimelineView } from "./useTimelineView";
import "./TimelineFiltersBar.css";

function TimelineFiltersBar() {
  const { filters, updateFilters, resetFilters } = useTimelineView();
  const showReset = hasActiveTimelineFilters(filters);

  const handleSearchChange = useCallback(
    (event) => {
      updateFilters({ searchQuery: event.target.value });
    },
    [updateFilters],
  );

  const handleEntityChange = useCallback(
    (event) => {
      updateFilters({ entityType: event.target.value });
    },
    [updateFilters],
  );

  const handleSeverityChange = useCallback(
    (event) => {
      updateFilters({ severity: event.target.value });
    },
    [updateFilters],
  );

  return (
    <section className="timeline-filters-bar" aria-label="Filtros da timeline">
      <div className="timeline-filters-bar__head">
        <p className="timeline-filters-bar__hint">Filtros locais — resultados instantâneos.</p>
        {showReset ? (
          <button type="button" className="timeline-filters-bar__reset" onClick={resetFilters}>
            Limpar filtros
          </button>
        ) : null}
      </div>

      <div className="timeline-filters-bar__grid">
        <label className="timeline-filters-bar__field">
          <span className="timeline-filters-bar__label">Busca</span>
          <div className="timeline-filters-bar__input-wrap">
            <Search className="timeline-filters-bar__icon" strokeWidth={2} aria-hidden />
            <input
              type="search"
              className="timeline-filters-bar__input"
              placeholder="Ação, entidade, admin ou ticket"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              aria-label="Buscar eventos da timeline"
            />
          </div>
        </label>

        <label className="timeline-filters-bar__field">
          <span className="timeline-filters-bar__label">Tipo de ação</span>
          <select
            className="timeline-filters-bar__select"
            value={filters.entityType}
            onChange={handleEntityChange}
            aria-label="Filtrar por tipo de entidade"
          >
            {TIMELINE_ENTITY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="timeline-filters-bar__field">
          <span className="timeline-filters-bar__label">Severidade</span>
          <select
            className="timeline-filters-bar__select"
            value={filters.severity}
            onChange={handleSeverityChange}
            aria-label="Filtrar por severidade"
          >
            {TIMELINE_SEVERITY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export default memo(TimelineFiltersBar);
