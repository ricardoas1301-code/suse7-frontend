import { Link } from "react-router-dom";
import { S7Button } from "../../components/ui";
import { resolveBillingLimitUx } from "../billingLimitUx";
import { useBillingAccess } from "../hooks/useBillingAccess.jsx";

export default function BillingUsageNotice() {
  const { loading, usage, limits, plan } = useBillingAccess();
  const ux = resolveBillingLimitUx(usage, limits, plan);

  if (loading || !ux) return null;

  return (
    <section className={`s7-billing-usage s7-billing-usage--${ux.tone}`} aria-live="polite">
      <div>
        <strong>{ux.title}</strong>
        <p>{ux.description}</p>
      </div>
      <Link to="/perfil/assinatura/planos">
        <S7Button variant="secondary" size="sm">
          Ver planos
        </S7Button>
      </Link>
    </section>
  );
}
