import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuthBootstrap } from "../../contexts/AuthBootstrapContext";
import {
  canOpenRenewalCheckout,
  isRenewalExperienceHydrated,
  normalizeBillingRenewalExperience,
  pickPreferredRenewalExperience,
} from "../billingRenewalExperienceContract.js";
import { resolvePendingRenewalAlert } from "../billingRenewalAlertUi.js";
import {
  logBillingRenewalCheckoutBlocked,
  logBillingRenewalUiStateResolved,
} from "../billingRenewalExperienceDevLog.js";
import { fetchRenewalExperience } from "../services/billingApi";
import { shouldShowRenewalPrimaryAction } from "../renewalExperienceUi.js";
import { useBillingAccess } from "./useBillingAccess.jsx";

const BillingRenewalExperienceContext = createContext(null);

function useBillingRenewalExperienceState() {
  const { ready: authReady, loading: authLoading } = useAuthBootstrap();
  const { statusExtras, refresh: refreshStatus, loading: statusLoading, refreshing } = useBillingAccess();
  const [dedicatedExperience, setDedicatedExperience] = useState(null);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState("");
  const [renewalCheckoutOpen, setRenewalCheckoutOpen] = useState(false);
  const hydrateRequestRef = useRef(0);
  const hydrateInFlightRef = useRef(null);

  const statusExperience = useMemo(
    () => normalizeBillingRenewalExperience(statusExtras?.renewal_experience),
    [statusExtras?.renewal_experience]
  );

  const renewalExperience = useMemo(
    () => pickPreferredRenewalExperience(statusExperience, dedicatedExperience),
    [statusExperience, dedicatedExperience]
  );

  const refreshRenewalExperience = useCallback(
    async ({ silent = true } = {}) => {
      if (hydrateInFlightRef.current) {
        return hydrateInFlightRef.current;
      }

      const requestId = ++hydrateRequestRef.current;
      const run = (async () => {
        if (!silent) setHydrating(true);
        setHydrationError("");

        const statusPayload = await refreshStatus({ silent: true });
        const fromStatus = normalizeBillingRenewalExperience(statusPayload?.renewal_experience);
        if (isRenewalExperienceHydrated(fromStatus)) {
          if (requestId === hydrateRequestRef.current) {
            setDedicatedExperience(null);
          }
          if (!silent) setHydrating(false);
          logBillingRenewalUiStateResolved(fromStatus, "subscription_status");
          return fromStatus;
        }

        const res = await fetchRenewalExperience();
        if (!res.ok) {
          const message = res.error || "renewal_experience_fetch_failed";
          if (requestId === hydrateRequestRef.current) {
            setHydrationError(message);
          }
          logBillingRenewalCheckoutBlocked("renewal_experience_fetch_failed", {
            http_status: res.status,
            message,
          });
          if (!silent) setHydrating(false);
          return fromStatus;
        }

        const fromEndpoint = normalizeBillingRenewalExperience(res.data?.renewal_experience);
        if (requestId === hydrateRequestRef.current) {
          setDedicatedExperience(fromEndpoint);
        }
        if (!silent) setHydrating(false);
        logBillingRenewalUiStateResolved(fromEndpoint ?? fromStatus, "renewal_experience_endpoint");
        return pickPreferredRenewalExperience(fromStatus, fromEndpoint);
      })();

      hydrateInFlightRef.current = run.finally(() => {
        hydrateInFlightRef.current = null;
      });
      return hydrateInFlightRef.current;
    },
    [refreshStatus]
  );

  useEffect(() => {
    if (authLoading || !authReady || statusLoading) return;
    if (isRenewalExperienceHydrated(statusExperience)) {
      setDedicatedExperience(null);
      logBillingRenewalUiStateResolved(statusExperience, "subscription_status");
      return;
    }
    refreshRenewalExperience({ silent: true });
  }, [
    authLoading,
    authReady,
    statusLoading,
    statusExperience?.renewal_state,
    statusExperience?.renewal_cycle_id,
    refreshRenewalExperience,
  ]);

  useEffect(() => {
    logBillingRenewalUiStateResolved(renewalExperience, "ui_resolved");
  }, [
    renewalExperience?.renewal_state,
    renewalExperience?.renewal_cycle_id,
    renewalExperience?.amount,
    renewalExperience?.due_state,
  ]);

  const openRenewalCheckout = useCallback(
    async () => {
      let experience = renewalExperience;
      if (!canOpenRenewalCheckout(experience)) {
        experience = await refreshRenewalExperience({ silent: false });
      }

      if (!canOpenRenewalCheckout(experience)) {
        logBillingRenewalCheckoutBlocked("missing_renewal_cycle_id", {
          renewal_state: experience?.renewal_state ?? null,
          has_primary_action: Boolean(experience?.primary_action?.action),
        });
        return { ok: false, experience, reason: "missing_renewal_cycle_id" };
      }

      setRenewalCheckoutOpen(true);
      return { ok: true, experience };
    },
    [renewalExperience, refreshRenewalExperience]
  );

  return {
    renewalExperience,
    loading: statusLoading || hydrating,
    refreshing,
    error: hydrationError,
    renewalCheckoutOpen,
    setRenewalCheckoutOpen,
    refreshRenewalExperience,
    openRenewalCheckout,
    showRenewalPrimaryAction: shouldShowRenewalPrimaryAction(renewalExperience),
    pendingRenewalAlert: resolvePendingRenewalAlert(renewalExperience),
  };
}

export function BillingRenewalExperienceProvider({ children }) {
  const value = useBillingRenewalExperienceState();
  return (
    <BillingRenewalExperienceContext.Provider value={value}>{children}</BillingRenewalExperienceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBillingRenewalExperience() {
  const ctx = useContext(BillingRenewalExperienceContext);
  if (!ctx) {
    throw new Error("useBillingRenewalExperience deve ser usado dentro de BillingRenewalExperienceProvider");
  }
  return ctx;
}
