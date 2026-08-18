import { useMemo } from "react";
import {
  BILLING_ACCESS_PROFILE,
  hasEntitlementCapability,
  isArchiveReadOnlyProfile,
  isExecutiveOnlyProfile,
  pickArchiveFreshnessLabel,
  pickEntitlementCapabilitiesSource,
  resolveAccessProfile,
} from "../billingEntitlementCapabilities";
import { useBillingAccess } from "./useBillingAccess.jsx";

export function useBillingEntitlement() {
  const { loading, statusExtras } = useBillingAccess();

  const entitlementSource = useMemo(() => {
    const payload = {
      ...statusExtras,
      subscription_entitlement: statusExtras?.subscription_entitlement ?? null,
      access_profile: statusExtras?.access_profile ?? statusExtras?.subscription_entitlement?.access_profile ?? null,
      capabilities:
        statusExtras?.entitlement_capabilities ??
        statusExtras?.subscription_entitlement?.capabilities ??
        null,
    };
    return pickEntitlementCapabilitiesSource(payload) ?? payload;
  }, [statusExtras]);

  const accessProfile = useMemo(() => resolveAccessProfile(entitlementSource), [entitlementSource]);

  const can = useMemo(
    () => (capability) => hasEntitlementCapability(entitlementSource, capability),
    [entitlementSource]
  );

  return {
    loading,
    entitlementSource,
    accessProfile,
    isExecutiveOnly: accessProfile === BILLING_ACCESS_PROFILE.EXECUTIVE_ONLY,
    isArchiveReadOnly: isArchiveReadOnlyProfile(entitlementSource),
    isFinancialRecoveryOnly: accessProfile === BILLING_ACCESS_PROFILE.FINANCIAL_RECOVERY_ONLY,
    freshnessLabel: pickArchiveFreshnessLabel(entitlementSource),
    can,
  };
}
