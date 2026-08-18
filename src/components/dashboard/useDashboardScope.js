// ======================================================================
// Hook — escopo executivo do Dashboard (período/conta por bloco).
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
  DEFAULT_SELLER_TIMEZONE,
  normalizeOperationalDayClosesAt,
} from "../../features/dashboard/operationalDayCycle.js";
import {
  DEFAULT_OPERATIONAL_WORKING_DAYS,
  normalizeOperationalWorkingDays,
} from "../../features/dashboard/operationalWorkingDays.js";
import { useDashboardBlockFilters } from "./DashboardBlockFiltersContext.jsx";
import { resolveDailySummaryScope, resolveTop10Scope } from "./dashboardScope.js";

/** @returns {{ resumo: ReturnType<typeof resolveDailySummaryScope>; top10: ReturnType<typeof resolveTop10Scope> }} */
export function useDashboardScope() {
  const {
    dailySummaryFilters,
    dailySummaryPeriodTouched,
    top10Filters,
    top10PeriodTouched,
  } = useDashboardBlockFilters();

  const [operationalConfig, setOperationalConfig] = useState({
    closesAt: DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
    timezone: DEFAULT_SELLER_TIMEZONE,
    workingDays: DEFAULT_OPERATIONAL_WORKING_DAYS,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    const loadOperationalConfig = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("operational_day_closes_at, operational_working_days")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          if (import.meta.env.DEV) {
            console.warn("[S7][Dashboard scope] Falha ao carregar operational_day_closes_at:", error.message);
          }
          setOperationalConfig({
            closesAt: DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
            timezone: DEFAULT_SELLER_TIMEZONE,
            workingDays: DEFAULT_OPERATIONAL_WORKING_DAYS,
            loaded: true,
          });
          return;
        }

        setOperationalConfig({
          closesAt: normalizeOperationalDayClosesAt(data?.operational_day_closes_at),
          timezone: DEFAULT_SELLER_TIMEZONE,
          workingDays: normalizeOperationalWorkingDays(data?.operational_working_days),
          loaded: true,
        });
      } catch (err) {
        if (!cancelled) {
          setOperationalConfig({
            closesAt: DEFAULT_OPERATIONAL_DAY_CLOSES_AT,
            timezone: DEFAULT_SELLER_TIMEZONE,
            workingDays: DEFAULT_OPERATIONAL_WORKING_DAYS,
            loaded: true,
          });
        }
        if (import.meta.env.DEV) {
          console.warn("[S7][Dashboard scope] Erro ao carregar config operacional:", err);
        }
      }
    };

    loadOperationalConfig();
    const onOperationalCloseUpdated = () => {
      loadOperationalConfig();
    };
    window.addEventListener("s7OperationalDayClosesAtUpdated", onOperationalCloseUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("s7OperationalDayClosesAtUpdated", onOperationalCloseUpdated);
    };
  }, []);

  const resumo = useMemo(
    () =>
      resolveDailySummaryScope(dailySummaryFilters, operationalConfig, {
        periodTouched: dailySummaryPeriodTouched,
      }),
    [dailySummaryFilters, operationalConfig, dailySummaryPeriodTouched],
  );

  const top10 = useMemo(
    () =>
      resolveTop10Scope(top10Filters, {
        periodTouched: top10PeriodTouched,
      }),
    [top10Filters, top10PeriodTouched],
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    console.info("[S7][Dashboard scope]", {
      resumoUsesOperationalCycle: resumo.resumoUsesOperationalCycle,
      resumoPeriodTouched: resumo.periodTouched,
      top10PeriodTouched: top10.periodTouched,
      resumoAccountScope: resumo.accountScopeLabel,
      top10AccountScope: top10.accountScopeLabel,
      resumoParams: resumo.resumoParams,
      top10Params: top10.executiveParams,
    });
  }, [resumo, top10]);

  return { resumo, top10, operationalConfigReady: operationalConfig.loaded };
}
