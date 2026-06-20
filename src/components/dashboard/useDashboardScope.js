// ======================================================================

// Hook — escopo executivo do Dashboard (período/conta por bloco).

// ======================================================================



import { useEffect, useMemo, useState } from "react";

import { supabase } from "../../supabaseClient";

import { useVendasFilters } from "../../features/vendas/filters/VendasFiltersContext.jsx";

import {

  DEFAULT_OPERATIONAL_DAY_CLOSES_AT,

  DEFAULT_SELLER_TIMEZONE,

  normalizeOperationalDayClosesAt,

} from "../../features/dashboard/operationalDayCycle.js";

import { resolveDashboardScope } from "./dashboardScope.js";



/** @returns {ReturnType<typeof resolveDashboardScope>} */

export function useDashboardScope() {

  const { filters, dashboardFilterParams } = useVendasFilters();

  const [operationalConfig, setOperationalConfig] = useState({

    closesAt: DEFAULT_OPERATIONAL_DAY_CLOSES_AT,

    timezone: DEFAULT_SELLER_TIMEZONE,

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

          .select("operational_day_closes_at")

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

            loaded: true,

          });

          return;

        }



        setOperationalConfig({

          closesAt: normalizeOperationalDayClosesAt(data?.operational_day_closes_at),

          timezone: DEFAULT_SELLER_TIMEZONE,

          loaded: true,

        });

      } catch (err) {

        if (!cancelled) {

          setOperationalConfig({

            closesAt: DEFAULT_OPERATIONAL_DAY_CLOSES_AT,

            timezone: DEFAULT_SELLER_TIMEZONE,

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



  const scope = useMemo(

    () => resolveDashboardScope(filters, operationalConfig),

    [filters, operationalConfig],

  );



  useEffect(() => {

    if (!import.meta.env.DEV) return;

    const accountId = String(filters.marketplaceAccountId ?? "").trim();

    console.info("[S7][Dashboard scope]", {

      filterActive: scope.filterActive,

      accountScopeLabel: scope.accountScopeLabel,

      marketplaceAccountIdSelected: accountId || null,

      dashboardFilterParams,

      operationalConfig: scope.operationalConfig,

      operationalCycle: scope.operationalCycle,

      resumoParams: scope.resumoParams,

      executiveParams: scope.executiveParams,

      resumoFilterParams: scope.resumoFilterParams,

      executiveFilterParams: scope.executiveFilterParams,

    });

  }, [filters, scope, dashboardFilterParams]);



  return scope;

}

