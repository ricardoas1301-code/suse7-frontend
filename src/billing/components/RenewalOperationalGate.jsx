import { useLocation, Link } from "react-router-dom";
import { S7Button } from "../../components/ui";
import { useBillingAccess } from "../hooks/useBillingAccess";
import { isRenewalOperationalPathBlocked } from "../renewalNoticeUi";

/**
 * Bloqueia áreas operacionais quando renewal access_status = SUSPENDED.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function RenewalOperationalGate({ children }) {
  const { pathname } = useLocation();
  const { statusExtras } = useBillingAccess();
  const restrictions = statusExtras?.access_restrictions ?? null;
  const renewalNotice = statusExtras?.renewal_notice ?? null;
  const blocked = isRenewalOperationalPathBlocked(pathname, restrictions);

  if (!blocked) return children;

  return (
    <section className="s7-billing-page s7-billing-renewal-block" aria-live="polite">
      <h2>{renewalNotice?.title || "Assinatura suspensa"}</h2>
      <p>
        {renewalNotice?.message ||
          "Seu período de tolerância terminou. Regularize sua assinatura para reativar o acesso ao Suse7."}
      </p>
      <div className="s7-billing-renewal-block__actions">
        <Link to="/perfil/assinatura">
          <S7Button variant="primary">{renewalNotice?.action_label || "Regularizar assinatura"}</S7Button>
        </Link>
        <Link to="/perfil/assinatura/planos">
          <S7Button variant="secondary">Ver planos</S7Button>
        </Link>
      </div>
    </section>
  );
}
