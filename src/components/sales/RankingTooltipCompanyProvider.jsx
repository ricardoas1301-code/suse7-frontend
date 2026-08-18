// ======================================================================
// Provider — mapa canônico conta → empresa para tooltips de ranking.
// Carrega uma vez por seção (Dashboard Top 3 / Vendas Top 10).
// ======================================================================

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildApiUrl, apiFetch } from "../../config/api";
import { fetchMercadoLivreMarketplaceAccounts } from "../../services/marketplaceAccountsApi";
import { buildRankingTooltipCompanyLookup } from "./rankingTooltipCompanyLookup.js";

/** @type {import("react").Context<ReturnType<typeof buildRankingTooltipCompanyLookup> | null>} */
const RankingTooltipCompanyContext = createContext(null);

const EMPTY_LOOKUP = buildRankingTooltipCompanyLookup([], []);

/**
 * @param {{
 *   children: import("react").ReactNode;
 *   marketplaceAccounts?: Record<string, unknown>[] | null;
 * }} props
 */
export function RankingTooltipCompanyProvider({ children, marketplaceAccounts = null }) {
  const [companies, setCompanies] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [accounts, setAccounts] = useState(
    /** @type {Record<string, unknown>[]} */ (Array.isArray(marketplaceAccounts) ? marketplaceAccounts : []),
  );
  const [accountsReady, setAccountsReady] = useState(Array.isArray(marketplaceAccounts));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = buildApiUrl("/api/seller/companies");
      if (!url) {
        if (!cancelled) setCompanies([]);
        return;
      }
      const { ok, data } = await apiFetch(url, { method: "GET" });
      if (!cancelled) {
        setCompanies(ok && Array.isArray(data?.companies) ? data.companies : []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Array.isArray(marketplaceAccounts)) {
      setAccounts(marketplaceAccounts);
      setAccountsReady(true);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled) return;
      setAccountsReady(true);
      setAccounts(
        res.ok && Array.isArray(res.data?.accounts) ? /** @type {Record<string, unknown>[]} */ (res.data.accounts) : [],
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [marketplaceAccounts]);

  const lookup = useMemo(() => {
    if (!accountsReady) return EMPTY_LOOKUP;
    return buildRankingTooltipCompanyLookup(companies, accounts);
  }, [companies, accounts, accountsReady]);

  return (
    <RankingTooltipCompanyContext.Provider value={lookup}>{children}</RankingTooltipCompanyContext.Provider>
  );
}

export function useRankingTooltipCompany() {
  return useContext(RankingTooltipCompanyContext) ?? EMPTY_LOOKUP;
}
