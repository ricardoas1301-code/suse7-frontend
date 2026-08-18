import { Link } from "react-router-dom";
import {
  BILLING_ENTITLEMENT_CAPABILITY,
  hasEntitlementCapability,
} from "../billingEntitlementCapabilities";
import { useBillingEntitlement } from "../hooks/useBillingEntitlement";
import "./s7EntitlementGates.css";

/**
 * @param {{
 *   capability: string;
 *   children: import("react").ReactNode;
 *   fallback?: import("react").ReactNode | null;
 *   blockFetch?: boolean;
 * }} props
 */
export default function S7CapabilityGate({ capability, children, fallback = null, blockFetch = true }) {
  const { loading, entitlementSource, can } = useBillingEntitlement();
  const allowed = can(capability);

  if (loading) {
    return blockFetch ? null : children;
  }

  if (!allowed) {
    return fallback;
  }

  return children;
}

export function S7ExecutiveOnlyGate({ children, className = "" }) {
  const { loading, isExecutiveOnly } = useBillingEntitlement();

  if (loading || !isExecutiveOnly) {
    return children;
  }

  return (
    <div className={`s7-executive-only-gate ${className}`.trim()}>
      <div className="s7-executive-only-gate__panel" role="status" aria-live="polite">
        <h2 className="s7-executive-only-gate__title">Limite do plano atingido</h2>
        <p className="s7-executive-only-gate__text">
          Seus indicadores executivos continuam sendo atualizados, mas o acesso aos dados detalhados está
          temporariamente limitado. Faça upgrade para continuar utilizando listas, filtros, relatórios e ações
          operacionais.
        </p>
        <Link className="s7-executive-only-gate__cta" to="/perfil/assinatura">
          Ver planos
        </Link>
      </div>
    </div>
  );
}

export function S7ArchiveReadOnlyBanner({ className = "" }) {
  const { loading, isArchiveReadOnly, freshnessLabel, entitlementSource } = useBillingEntitlement();

  if (loading || !isArchiveReadOnly) return null;

  const gap = entitlementSource?.data_gap;
  const gapStart = gap?.data_gap_start ?? null;

  return (
    <div className={`s7-archive-readonly-banner ${className}`.trim()} role="status">
      {freshnessLabel ? <p className="s7-archive-readonly-banner__line">{freshnessLabel}</p> : null}
      {gapStart ? (
        <p className="s7-archive-readonly-banner__line s7-archive-readonly-banner__line--muted">
          Não houve sincronização desde {String(gapStart).slice(0, 10).split("-").reverse().join("/")} porque o
          limite do plano Baby foi atingido.
        </p>
      ) : null}
    </div>
  );
}

export function S7OperationalListsGate({ children, className = "" }) {
  const { loading, can } = useBillingEntitlement();
  const canLists = can(BILLING_ENTITLEMENT_CAPABILITY.VIEW_STORED_LISTS);

  if (loading) return null;

  return (
    <>
      <S7ArchiveReadOnlyBanner className={className} />
      {canLists ? children : <S7ExecutiveOnlyGate className={className} />}
    </>
  );
}
