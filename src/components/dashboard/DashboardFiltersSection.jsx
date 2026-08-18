// ======================================================================
// Filtro global do Dashboard — carrega contas via API Suse7 e renderiza o card.
// ======================================================================

import { useEffect, useState } from "react";
import { fetchMercadoLivreMarketplaceAccounts } from "../../services/marketplaceAccountsApi";
import DashboardFiltersCard from "./DashboardFiltersCard";

/** @param {Record<string, unknown> | null | undefined} a */
function dashboardMlAccountLabel(a) {
  if (!a || typeof a !== "object") return "Conta";
  if (a.ml_nickname != null && String(a.ml_nickname).trim() !== "") return String(a.ml_nickname).trim();
  if (a.account_alias != null && String(a.account_alias).trim() !== "") return String(a.account_alias).trim();
  if (a.external_seller_id != null) return String(a.external_seller_id);
  return "Conta";
}

/**
 * @param {{ className?: string }} props
 */
export default function DashboardFiltersSection({ className = "" }) {
  const [mlAccounts, setMlAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [mlAccountsReady, setMlAccountsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled) return;
      setMlAccountsReady(true);
      const list =
        res.ok && Array.isArray(res.data?.accounts) ? /** @type {Record<string, unknown>[]} */ (res.data.accounts) : [];
      setMlAccounts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardFiltersCard
      className={className}
      accounts={mlAccounts}
      accountLabel={dashboardMlAccountLabel}
      accountsReady={mlAccountsReady}
    />
  );
}
