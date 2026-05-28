import { useBillingAccess } from "./useBillingAccess.jsx";

export function useSubscriptionStatus() {
  return useBillingAccess();
}
