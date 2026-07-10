import { S7Button, S7Icon } from "../../components/ui";
import { useBillingAccess } from "../hooks/useBillingAccess.jsx";
import UpgradeCTA from "./UpgradeCTA";

export default function PremiumFeatureLock({ children, title, description, preview = false }) {
  const { loading, canAccess, error, connectionError, refresh, refreshing, transientRetrying } =
    useBillingAccess();

  if (loading && !refreshing && !transientRetrying) {
    return <div className="s7-billing-lock s7-billing-lock--loading">Carregando permissões do plano…</div>;
  }

  if (transientRetrying && !error) {
    return (
      <>
        <div className="s7-billing-lock s7-billing-lock--loading" role="status">
          Revalidando permissões do plano…
        </div>
        {canAccess ? children : null}
      </>
    );
  }

  if (error && !canAccess) {
    const devBypass = import.meta.env.DEV && connectionError;
    return (
      <div className="s7-billing-protected-route">
        <div className="s7-billing-lock s7-billing-lock--error" role="alert">
          <p>{error}</p>
          {devBypass ? (
            <p className="s7-billing-lock__dev-hint">
              DEV: conteúdo liberado para homologação enquanto o plano não carrega.
            </p>
          ) : null}
          <S7Button variant="secondary" size="sm" onClick={() => refresh({ silent: false })} disabled={refreshing}>
            {refreshing ? "Tentando…" : "Tentar novamente"}
          </S7Button>
        </div>
        {devBypass ? children : null}
      </div>
    );
  }

  if (canAccess) return children;

  if (!preview) {
    return (
      <div className="s7-billing-lock s7-billing-lock--wall">
        <S7Icon name="lock" size={22} />
        <UpgradeCTA title={title} description={description} />
      </div>
    );
  }

  return (
    <div className="s7-billing-lock">
      <div className="s7-billing-lock__blur">{children}</div>
      <div className="s7-billing-lock__panel">
        <S7Icon name="lock" size={20} />
        <UpgradeCTA title={title} description={description} />
      </div>
    </div>
  );
}
