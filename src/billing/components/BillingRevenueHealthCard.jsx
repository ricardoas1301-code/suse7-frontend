import { S7Button } from "../../components/ui";
import S7Icon from "../../components/ui/S7Icon";
import "./BillingRevenueHealthCard.css";

/**
 * @param {{
 *   health: ReturnType<import("../billingFinancialExperienceUi").normalizeRevenueHealth> | null;
 *   loading?: boolean;
 *   error?: string;
 *   onRetry?: () => void;
 *   onRenewClick?: (() => void) | null;
 *   showRenewalCta?: boolean;
 * }} props
 */
export default function BillingRevenueHealthCard({
  health,
  loading = false,
  error = "",
  onRetry,
  onRenewClick = null,
  showRenewalCta = false,
}) {
  if (loading) {
    return (
      <section className="s7-billing-revenue-health s7-billing-revenue-health--loading" aria-busy="true">
        <div className="s7-billing-revenue-health__skeleton s7-billing-revenue-health__skeleton--title" />
        <div className="s7-billing-revenue-health__skeleton s7-billing-revenue-health__skeleton--ring" />
        <div className="s7-billing-revenue-health__skeleton s7-billing-revenue-health__skeleton--line" />
        <div className="s7-billing-revenue-health__skeleton s7-billing-revenue-health__skeleton--line s7-billing-revenue-health__skeleton--short" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="s7-billing-revenue-health s7-billing-revenue-health--error" aria-live="polite">
        <p className="s7-billing-revenue-health__error">{error}</p>
        {onRetry ? (
          <S7Button variant="secondary" size="sm" onClick={onRetry}>
            Tentar novamente
          </S7Button>
        ) : null}
      </section>
    );
  }

  if (!health) return null;

  const scorePercent = health.score != null ? health.score : 0;

  return (
    <section
      className={`s7-billing-revenue-health s7-billing-revenue-health--${health.badgeClass} ${health.unavailable ? "s7-billing-revenue-health--unavailable" : ""}`}
      aria-label="Saúde financeira da assinatura"
    >
      <div className="s7-billing-revenue-health__layout">
        <div className="s7-billing-revenue-health__main">
          <div className="s7-billing-revenue-health__title-row">
            <span className="s7-billing-revenue-health__icon" aria-hidden="true">
              <S7Icon name={health.s7Icon} size={22} strokeWidth={2} />
            </span>
            <div>
              <p className="s7-billing-revenue-health__eyebrow">Saúde financeira</p>
              <h2 className="s7-billing-revenue-health__title">{health.title}</h2>
            </div>
          </div>

          <p className="s7-billing-revenue-health__insight">{health.insight}</p>
          <p className="s7-billing-revenue-health__description">{health.description}</p>
          <p className="s7-billing-revenue-health__recommendation">{health.recommendation}</p>

          {showRenewalCta && onRenewClick ? (
            <div className="s7-billing-revenue-health__cta">
              <S7Button variant="primary" onClick={onRenewClick}>
                Renovar assinatura
              </S7Button>
            </div>
          ) : health.actionHint ? (
            <p className="s7-billing-revenue-health__action">{health.actionHint}</p>
          ) : null}
        </div>

        <div className="s7-billing-revenue-health__score-panel">
          <div
            className="s7-billing-revenue-health__ring"
            style={{ "--s7-health-score": String(scorePercent) }}
            role="img"
            aria-label={`Score financeiro ${scorePercent}`}
          >
            <span className="s7-billing-revenue-health__ring-value">{health.score ?? "—"}</span>
          </div>
          <span
            className={`s7-billing-status-badge s7-billing-status-badge--${health.badgeClass === "success" ? "success" : health.badgeClass === "danger" ? "danger" : "warning"}`}
          >
            {health.levelLabel ?? resolveRevenueHealthLevelLabel(health.level)}
          </span>
          <div className="s7-billing-revenue-health__progress" aria-hidden="true">
            <span className="s7-billing-revenue-health__progress-fill" style={{ width: `${scorePercent}%` }} />
          </div>
          {health.computedAtLabel ? (
            <p className="s7-billing-revenue-health__meta">Atualizado em {health.computedAtLabel}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
