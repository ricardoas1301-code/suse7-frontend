import "./PricingIntelligencePageSkeleton.css";

/** Skeleton estrutural da rota `/precificacoes/inteligente/:listingId`. */
export default function PricingIntelligencePageSkeleton() {
  return (
    <div className="pricing-intelligence-page pricing-intelligence-page--loading" role="status" aria-live="polite">
      <p className="pricing-intelligence-page__visually-hidden">Carregando precificação inteligente…</p>
      <div className="pricing-intelligence-page-skeleton__shell">
        <div className="pricing-intelligence-page-skeleton__rail">
          <span className="pricing-intelligence-page-skeleton__block pricing-intelligence-page-skeleton__block--logo" />
          <span className="pricing-intelligence-page-skeleton__block pricing-intelligence-page-skeleton__block--thumb" />
          <span className="pricing-intelligence-page-skeleton__block pricing-intelligence-page-skeleton__block--title" />
          <span className="pricing-intelligence-page-skeleton__block pricing-intelligence-page-skeleton__block--line" />
        </div>
        <div className="pricing-intelligence-page-skeleton__main">
          <span className="pricing-intelligence-page-skeleton__block pricing-intelligence-page-skeleton__block--tabs" />
          <span className="pricing-intelligence-page-skeleton__block pricing-intelligence-page-skeleton__block--panel" />
        </div>
      </div>
    </div>
  );
}
