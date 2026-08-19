import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactModal from "../../components/ContactModal";
import PublicLegalHeader from "../../components/legal/PublicLegalHeader.jsx";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import PlansCatalogSection from "../components/PlansCatalogSection";
import PlansArsenalModal from "../components/PlansArsenalModal";
import { resolveCheckoutPlanSlug } from "../checkoutUi";
import { useBillingPlans } from "../hooks/useBillingPlans";
import { INFINITY_SUPPORT_CONTEXT, INFINITY_SUPPORT_PREFILL } from "../planInfinitySupport";
import { AUTHENTICATED_PLANS_PATH } from "../plansCatalogPaths";
import "../../components/legal/publicLegalPage.css";
import "../billing.css";
import "./PublicPlansPage.css";

export default function PublicPlansPage() {
  const navigate = useNavigate();
  const { ready, signedOut } = useAuthBootstrap();
  const { loading, error, plans, refresh } = useBillingPlans();
  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("public-legal-page-active");
    return () => document.body.classList.remove("public-legal-page-active");
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Planos | SUSE7";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  function handlePlanSelect(plan, cta) {
    if (cta.disabled) return;
    if (cta.isQuote) {
      setSupportModalOpen(true);
      return;
    }
    if (ready && !signedOut) {
      navigate(AUTHENTICATED_PLANS_PATH);
      return;
    }
    const slug = resolveCheckoutPlanSlug(plan);
    navigate(slug ? `/signup?plan=${encodeURIComponent(slug)}` : "/signup");
  }

  return (
    <div className="public-legal-page s7-public-plans-page">
      <PublicLegalHeader />

      <main className="public-legal-container s7-public-plans-page__container">
        <div className="s7-public-plans-page__card">
          <div className="s7-billing-page s7-planos-page">
            <PlansCatalogSection
              loading={loading}
              error={error}
              plans={plans}
              currentPlan={null}
              onRetry={refresh}
              onPlanSelect={handlePlanSelect}
              onOpenArsenal={() => setArsenalOpen(true)}
              loadingMessage="Carregando planos…"
            />
          </div>
        </div>
      </main>

      {supportModalOpen ? (
        <ContactModal
          onClose={() => setSupportModalOpen(false)}
          prefill={INFINITY_SUPPORT_PREFILL}
          context={INFINITY_SUPPORT_CONTEXT}
        />
      ) : null}

      <PlansArsenalModal open={arsenalOpen} onClose={() => setArsenalOpen(false)} />
    </div>
  );
}
