import { useEffect, useRef } from "react";
import { BILLING_ACCESS_PROFILE } from "../billingEntitlementCapabilities";
import { useBillingEntitlement } from "./useBillingEntitlement";

/**
 * Dispara limpeza de caches detalhados quando o perfil muda em runtime.
 *
 * @param {{
 *   onEnterExecutiveOnly?: () => void;
 *   onEnterArchiveReadOnly?: () => void;
 *   onEnterFinancialRecovery?: () => void;
 *   onExitRestricted?: (from: string, to: string) => void;
 * }} [handlers]
 */
export function useBillingEntitlementProfileTransition(handlers = {}) {
  const { loading, accessProfile } = useBillingEntitlement();
  const previousProfileRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    const previous = previousProfileRef.current;
    if (previous && previous !== accessProfile) {
      handlers.onExitRestricted?.(previous, accessProfile);
      if (accessProfile === BILLING_ACCESS_PROFILE.EXECUTIVE_ONLY) {
        handlers.onEnterExecutiveOnly?.();
      }
      if (accessProfile === BILLING_ACCESS_PROFILE.ARCHIVE_READ_ONLY) {
        handlers.onEnterArchiveReadOnly?.();
      }
      if (accessProfile === BILLING_ACCESS_PROFILE.FINANCIAL_RECOVERY_ONLY) {
        handlers.onEnterFinancialRecovery?.();
      }
      if (
        previous !== BILLING_ACCESS_PROFILE.FULL_ACCESS &&
        accessProfile === BILLING_ACCESS_PROFILE.FULL_ACCESS
      ) {
        handlers.onExitRestricted?.(previous, accessProfile);
      }
    }
    previousProfileRef.current = accessProfile;
  }, [loading, accessProfile, handlers]);
}
