import OpsHealthBadge from "./OpsHealthBadge";
import OpsConfidenceBadge from "./OpsConfidenceBadge";
import "./ops.css";

/**
 * Ops strip de métricas — consumidor atual: Dev Center Global (summary.scope = admin_global).
 * Domínio seller (Clientes360) deve usar GET /api/customers — ver customersDomainBoundary.js.
 * @param {{ summary?: Record<string, unknown> | null; loading?: boolean }} props
 */
export default function OpsStatsGrid({ summary, loading = false }) {
  const ih = /** @type {Record<string, unknown> | null | undefined} */ (summary?.ingestion_health);
  const dq = /** @type {Record<string, unknown> | null | undefined} */ (summary?.data_quality_overview);

  const cards = [
    {
      id: "total",
      label: "Total Clientes",
      value: loading ? "…" : String(summary?.total_customers ?? 0),
      hint: "Base global cross-seller (admin)",
    },
    {
      id: "health",
      label: "Saúde Ingestão",
      value: loading ? "…" : null,
      render: () => (
        <OpsHealthBadge
          status={ih?.status != null ? String(ih.status) : null}
          coveragePct={typeof ih?.coverage_pct === "number" ? ih.coverage_pct : null}
          pending={
            ih?.orders && typeof ih.orders === "object" && "pending_materialization" in ih.orders
              ? Number(ih.orders.pending_materialization)
              : null
          }
          computedAt={ih?.computed_at != null ? String(ih.computed_at) : null}
        />
      ),
    },
    {
      id: "confidence",
      label: "Confiança Dados",
      value: loading ? "…" : null,
      render: () => (
        <OpsConfidenceBadge
          status={dq?.status != null ? String(dq.status) : null}
          confidencePct={typeof dq?.confidence_pct === "number" ? dq.confidence_pct : null}
          computedAt={dq?.computed_at != null ? String(dq.computed_at) : null}
        />
      ),
    },
    {
      id: "critical",
      label: "Clientes Críticos",
      value: loading ? "…" : String(summary?.incomplete_contact ?? 0),
      hint: "Contato incompleto (heurística 4A.1)",
    },
  ];

  return (
    <section className="ops-stats-grid" aria-label="Indicadores operacionais">
      {cards.map((card) => (
        <article key={card.id} className="ops-stat-card">
          <header>{card.label}</header>
          <div className="ops-stat-card__value">
            {card.render ? card.render() : card.value}
          </div>
          {card.hint ? <p className="ops-stat-card__hint">{card.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}
