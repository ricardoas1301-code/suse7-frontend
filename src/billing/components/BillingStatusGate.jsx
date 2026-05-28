import { useMemo } from "react";
import { Link } from "react-router-dom";
import { S7Button } from "../../components/ui";
import { resolveBillingUx } from "../billingAccessUx";
import { formatBillingDate } from "../billingFormatters";
import { useBillingAccess } from "../hooks/useBillingAccess.jsx";
import BillingStatusBadge from "./BillingStatusBadge";

export default function BillingStatusGate() {
  const { loading, access, subscriptions, statusExtras } = useBillingAccess();
  const ux = useMemo(() => resolveBillingUx(access, subscriptions, statusExtras), [access, subscriptions, statusExtras]);

  if (loading) return null;
  if (!access) return null;

  const showBanner =
    (ux.state !== "active" && ux.state !== "internal_free" && !ux.hasPendingCheckout) ||
    ux.showGraceNotice;
  if (!showBanner) return null;

  return (
    <section className={`s7-billing-gate s7-billing-gate--${ux.tone}`} aria-live="polite">
      <div className="s7-billing-gate__content">
        <div className="s7-billing-gate__title-row">
          <strong>{ux.title}</strong>
          <BillingStatusBadge state={ux.state} status={ux.subscriptionStatus} />
        </div>
        <p>{ux.description}</p>
        {ux.showGraceNotice ? (
          <p className="s7-billing-gate__meta">Acesso liberado até {formatBillingDate(ux.currentPeriodEnd)}.</p>
        ) : null}
        {ux.nextDueDate ? (
          <p className="s7-billing-gate__meta">Próxima cobrança: {formatBillingDate(ux.nextDueDate)}.</p>
        ) : null}
      </div>
      <div className="s7-billing-gate__actions">
        <Link to="/perfil/assinatura/minha-assinatura">
          <S7Button variant="secondary" size="sm">
            Minha assinatura
          </S7Button>
        </Link>
        {!ux.canAccess || ux.state === "internal_free" || ux.state === "past_due" ? (
          <Link to="/perfil/assinatura/planos">
            <S7Button variant="primary" size="sm">
              Ver planos
            </S7Button>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
