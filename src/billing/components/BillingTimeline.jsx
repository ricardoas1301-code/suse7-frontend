import { useMemo, useState } from "react";
import { S7Button } from "../../components/ui";
import BillingTimelineItem from "./BillingTimelineItem";
import BillingFinanceEmptyState from "./BillingFinanceEmptyState";
import {
  groupTimelineEventsByDate,
  matchesTimelineFilter,
  TIMELINE_FILTER_OPTIONS,
} from "../billingTimelineUi";
import "./BillingTimeline.css";

/**
 * @param {{
 *   events: NonNullable<ReturnType<import("../billingFinancialExperienceUi").normalizeTimelineEvent>>[];
 *   loading?: boolean;
 *   error?: string;
 *   hint?: string;
 *   onRetry?: () => void;
 * }} props
 */
export default function BillingTimeline({ events, loading = false, error = "", hint = "", onRetry }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredEvents = useMemo(
    () => events.filter((event) => matchesTimelineFilter(activeFilter, event)),
    [events, activeFilter]
  );

  const groupedEvents = useMemo(() => groupTimelineEventsByDate(filteredEvents), [filteredEvents]);

  if (loading) {
    return (
      <section className="s7-billing-timeline-panel s7-billing-timeline-panel--loading" aria-busy="true">
        <header className="s7-billing-timeline-panel__header">
          <h2>Timeline financeira</h2>
        </header>
        <div className="s7-billing-timeline-panel__filters s7-billing-timeline-panel__filters--skeleton">
          {TIMELINE_FILTER_OPTIONS.map((opt) => (
            <span key={opt.key} className="s7-billing-timeline-panel__filter-skeleton" />
          ))}
        </div>
        <div className="s7-billing-timeline-panel__skeleton-list">
          <div className="s7-billing-timeline-panel__skeleton-card" />
          <div className="s7-billing-timeline-panel__skeleton-card" />
          <div className="s7-billing-timeline-panel__skeleton-card s7-billing-timeline-panel__skeleton-card--short" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="s7-billing-timeline-panel s7-billing-timeline-panel--error" aria-live="polite">
        <header className="s7-billing-timeline-panel__header">
          <h2>Timeline financeira</h2>
        </header>
        <p className="s7-billing-timeline-panel__error">{error}</p>
        {hint ? <p className="s7-billing-timeline-panel__hint">{hint}</p> : null}
        {onRetry ? (
          <S7Button variant="secondary" size="sm" onClick={onRetry}>
            Tentar novamente
          </S7Button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="s7-billing-timeline-panel" aria-label="Timeline financeira">
      <header className="s7-billing-timeline-panel__header">
        <h2>Timeline financeira</h2>
        <p>Fluxo vivo de cobranças, pagamentos, renovações e alertas da sua assinatura.</p>
      </header>

      <div className="s7-billing-timeline-panel__filters" role="tablist" aria-label="Filtrar eventos">
        {TIMELINE_FILTER_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={activeFilter === option.key}
            className={`s7-billing-timeline-panel__filter ${activeFilter === option.key ? "s7-billing-timeline-panel__filter--active" : ""}`}
            onClick={() => setActiveFilter(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <BillingFinanceEmptyState
          iconName="records"
          title="Nenhum evento financeiro recente"
          description="Quando pagamentos e renovações acontecerem, eles aparecerão aqui com transparência total."
        />
      ) : filteredEvents.length === 0 ? (
        <BillingFinanceEmptyState
          iconName="search"
          title="Nenhum evento neste filtro"
          description="Tente outro filtro para localizar pagamentos, renovações ou alertas."
          className="s7-billing-finance-empty--compact"
        />
      ) : (
        <div className="s7-billing-timeline-panel__groups">
          {groupedEvents.map((group) => (
            <section key={group.label} className="s7-billing-timeline-panel__group">
              <h3 className="s7-billing-timeline-panel__group-label">{group.label}</h3>
              <ol className="s7-billing-timeline-panel__list">
                {group.events.map((event, index) => (
                  <BillingTimelineItem
                    key={event.id}
                    event={event}
                    isLast={index === group.events.length - 1}
                    animationIndex={index}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
