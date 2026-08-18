import { S7Button } from "../../components/ui";
import PlanCard from "./PlanCard";
import PlansPageAvatar from "./PlansPageAvatar";
import { PLANS_PAGE_AUXILIARY_TITLE, PLANS_PAGE_DESCRIPTION, PLANS_PAGE_GROWTH_HIGHLIGHT_LINE_1, PLANS_PAGE_GROWTH_HIGHLIGHT_LINE_2, PLANS_PAGE_POSITIONING_LINE } from "../planIncludedFeatures";

/**
 * Núcleo compartilhado do catálogo de planos (público e autenticado).
 *
 * @param {{
 *   loading: boolean;
 *   error: string;
 *   plans: Array<Record<string, unknown>>;
 *   currentPlan?: ReturnType<import("../planCta").resolveCurrentPlanSnapshot> | null;
 *   onRetry: () => void;
 *   onPlanSelect: (plan: Record<string, unknown>, cta: Record<string, unknown>) => void;
 *   onOpenArsenal: () => void;
 *   loadingMessage?: string;
 * }} props
 */
export default function PlansCatalogSection({
  loading,
  error,
  plans,
  currentPlan = null,
  onRetry,
  onPlanSelect,
  onOpenArsenal,
  loadingMessage = "Carregando planos…",
}) {
  return (
    <>
      <header className="s7-billing-plans-page-header">
        <h1 className="s7-billing-plans-page-header__title">Planos</h1>
        <p className="s7-billing-plans-page-header__lead">{PLANS_PAGE_AUXILIARY_TITLE}</p>
        <p className="s7-billing-plans-page-header__lead">
          {PLANS_PAGE_GROWTH_HIGHLIGHT_LINE_1}
          <br />
          {PLANS_PAGE_GROWTH_HIGHLIGHT_LINE_2}
        </p>
        <p className="s7-billing-plans-page-header__positioning">{PLANS_PAGE_POSITIONING_LINE}</p>
        <p className="s7-billing-plans-page-header__subtitle">{PLANS_PAGE_DESCRIPTION}</p>
      </header>

      {loading ? <p className="s7-billing-muted">{loadingMessage}</p> : null}

      {error ? (
        <section className="s7-billing-page__state s7-billing-page__state--error" aria-live="polite">
          <p className="s7-billing-error">{error}</p>
          <S7Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </S7Button>
        </section>
      ) : null}

      {!loading && !error ? (
        <section className="s7-billing-plans-grid" aria-label="Catálogo de planos">
          {plans.map((catalogPlan) => (
            <PlanCard
              key={catalogPlan.id}
              plan={catalogPlan}
              currentPlan={currentPlan}
              catalogPlans={plans}
              onSelect={onPlanSelect}
              onOpenArsenal={onOpenArsenal}
            />
          ))}
          <PlansPageAvatar />
        </section>
      ) : null}
    </>
  );
}
