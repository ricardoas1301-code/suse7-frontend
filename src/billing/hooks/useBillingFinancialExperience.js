import { useCallback, useEffect, useState } from "react";
import {
  fetchBillingNotifications,
  fetchBillingTimeline,
  fetchRevenueHealth,
} from "../services/billingApi";
import {
  normalizeBillingNotificationList,
  normalizeRevenueHealth,
  normalizeTimelineList,
} from "../billingFinancialExperienceUi";
import {
  BILLING_RESILIENCE,
  withBillingFetchTimeout,
} from "../billingResilienceUi";

/**
 * Carrega timeline, revenue health e notificações em paralelo.
 * Falhas parciais não derrubam a página; timeout por bloco.
 */
export function useBillingFinancialExperience() {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [revenueHealth, setRevenueHealth] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [errors, setErrors] = useState({
    timeline: "",
    revenueHealth: "",
    notifications: "",
  });
  const [hints, setHints] = useState({
    timeline: "",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setHints({ timeline: "" });
    const nextErrors = { timeline: "", revenueHealth: "", notifications: "" };

    const [timelineSettled, healthSettled, notifySettled] = await Promise.allSettled([
      withBillingFetchTimeout(fetchBillingTimeline({ limit: 40 })),
      withBillingFetchTimeout(fetchRevenueHealth()),
      withBillingFetchTimeout(fetchBillingNotifications()),
    ]);

    if (timelineSettled.status === "fulfilled" && timelineSettled.value.ok) {
      setTimeline(normalizeTimelineList(timelineSettled.value.data));
    } else {
      const err =
        timelineSettled.status === "rejected"
          ? BILLING_RESILIENCE.timelineError
          : timelineSettled.value.error || BILLING_RESILIENCE.timelineError;
      nextErrors.timeline = err;
      setTimeline([]);
      setHints({ timeline: BILLING_RESILIENCE.timelineHint });
    }

    if (healthSettled.status === "fulfilled" && healthSettled.value.ok) {
      setRevenueHealth(normalizeRevenueHealth(healthSettled.value.data));
    } else {
      nextErrors.revenueHealth =
        healthSettled.status === "rejected"
          ? BILLING_RESILIENCE.healthError
          : healthSettled.value.error || BILLING_RESILIENCE.healthError;
      setRevenueHealth(normalizeRevenueHealth(null));
    }

    if (notifySettled.status === "fulfilled" && notifySettled.value.ok) {
      setNotifications(normalizeBillingNotificationList(notifySettled.value.data));
    } else {
      nextErrors.notifications =
        notifySettled.status === "rejected"
          ? BILLING_RESILIENCE.notificationsError
          : notifySettled.value.error || BILLING_RESILIENCE.notificationsError;
      setNotifications([]);
    }

    setErrors(nextErrors);
    setLoading(false);
    return {
      timeline: timelineSettled.status === "fulfilled" ? timelineSettled.value : null,
      health: healthSettled.status === "fulfilled" ? healthSettled.value : null,
      notify: notifySettled.status === "fulfilled" ? notifySettled.value : null,
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await refresh();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const hasErrors = Boolean(errors.timeline || errors.revenueHealth || errors.notifications);

  return {
    loading,
    timeline,
    revenueHealth,
    notifications,
    errors,
    hints,
    hasErrors,
    refresh,
  };
}
