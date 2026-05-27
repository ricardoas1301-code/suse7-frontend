import { memo, useEffect, useMemo, useRef } from "react";
import { ScrollText } from "lucide-react";
import { logSellerToolbox } from "../../../sellerToolboxDevLog";
import { useSellerToolbox } from "../SellerToolboxContext";
import { buildTimelineSummary, formatRelativeTime } from "./timelineModel";
import { useTimelineView } from "./useTimelineView";
import TimelineFiltersBar from "./TimelineFiltersBar";
import TimelineList from "./TimelineList";
import TimelineEmptyState from "./TimelineEmptyState";
import "./TimelinePanel.css";

function TimelinePanelSkeleton() {
  return (
    <div className="timeline-panel__skeleton" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} className="timeline-panel__skeleton-block" />
      ))}
    </div>
  );
}

/**
 * @param {{ category: import("../sellerToolboxCategoriesModel").SellerToolboxCategory }} props
 */
function TimelinePanel({ category }) {
  const { sellerId } = useSellerToolbox();
  const { panelState, events, loading, empty } = useTimelineView();
  const loggedOpenRef = useRef(false);

  const summary = useMemo(() => buildTimelineSummary(events), [events]);

  useEffect(() => {
    if (loggedOpenRef.current) return;
    loggedOpenRef.current = true;
    logSellerToolbox("timeline_panel_open", {
      sellerId,
      categoryId: category.id,
    });
  }, [sellerId, category.id]);

  return (
    <section
      className="timeline-panel"
      data-category-id={category.id}
      data-panel-state={panelState}
      data-seller-id={sellerId ?? undefined}
      aria-labelledby="timeline-panel-title"
    >
      <header className="timeline-panel__head">
        <div className="timeline-panel__icon-wrap" aria-hidden>
          <ScrollText className="timeline-panel__icon" strokeWidth={2} />
        </div>
        <div className="timeline-panel__titles">
          <div className="timeline-panel__title-row">
            <h4 id="timeline-panel-title" className="timeline-panel__title">
              {category.label}
            </h4>
            {import.meta.env.DEV ? <span className="timeline-panel__dev-badge">DEV</span> : null}
          </div>
          <p className="timeline-panel__desc">{category.description}</p>
        </div>
      </header>

      <div className="timeline-panel__body">
        {panelState === "loading" || loading ? <TimelinePanelSkeleton /> : null}

        {panelState === "empty" && !loading ? (
          <p className="timeline-panel__message timeline-panel__message--empty" role="status">
            Timeline indisponível para este seller no momento.
          </p>
        ) : null}

        {panelState === "error" ? (
          <p className="timeline-panel__message timeline-panel__message--error" role="alert">
            Não foi possível exibir a timeline. Tente voltar e abrir novamente.
          </p>
        ) : null}

        {panelState === "loaded" && !loading ? (
          <>
            <section className="timeline-panel__summary" aria-label="Resumo da timeline">
              <div className="timeline-panel__summary-grid">
                <div className="timeline-panel__summary-item">
                  <span className="timeline-panel__summary-label">Total eventos</span>
                  <strong className="timeline-panel__summary-value">{summary.totalEvents}</strong>
                </div>
                <div className="timeline-panel__summary-item">
                  <span className="timeline-panel__summary-label">Admins envolvidos</span>
                  <strong className="timeline-panel__summary-value">{summary.adminsInvolved}</strong>
                </div>
                <div className="timeline-panel__summary-item timeline-panel__summary-item--wide">
                  <span className="timeline-panel__summary-label">Último evento</span>
                  <strong className="timeline-panel__summary-value">{summary.lastEventLabel}</strong>
                  {summary.lastEventAt ? (
                    <span className="timeline-panel__summary-meta">
                      {formatRelativeTime(summary.lastEventAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            </section>

            <TimelineFiltersBar />

            {empty ? <TimelineEmptyState /> : <TimelineList />}
          </>
        ) : null}
      </div>

      <footer className="timeline-panel__foot">
        <span className="timeline-panel__seal">
          {import.meta.env.DEV
            ? "Simulação local — Timeline sem backend"
            : "Somente leitura"}
        </span>
      </footer>
    </section>
  );
}

export default memo(TimelinePanel);
