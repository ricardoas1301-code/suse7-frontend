// ======================================================================
// DASH.6B — Distribuição compacta de pedidos por conta (multi-contas).
// Visual alinhado ao Top 3 Produtos (lista textual, sem chips).
// ======================================================================

/** @param {Record<string, unknown> | null | undefined} account */
function resolveMarketplaceAccountLabel(account) {
  if (!account || typeof account !== "object") return "Conta";
  if (account.ml_nickname != null && String(account.ml_nickname).trim() !== "") {
    return String(account.ml_nickname).trim();
  }
  if (account.account_alias != null && String(account.account_alias).trim() !== "") {
    return String(account.account_alias).trim();
  }
  if (account.external_seller_id != null) return String(account.external_seller_id);
  return "Conta";
}

/**
 * @param {number} count
 */
function formatAccountOrdersPhrase(count) {
  if (count === 1) return "1 venda";
  return `${count.toLocaleString("pt-BR")} vendas`;
}

/**
 * @param {{
 *   entries: readonly Record<string, unknown>[];
 *   accounts: readonly Record<string, unknown>[];
 * }} props
 */
export default function S7DailySummaryAccountDistribution({ entries, accounts }) {
  const rows = entries
    .map((entry) => {
      const accountId =
        entry.marketplace_account_id != null ? String(entry.marketplace_account_id).trim() : "";
      const ordersCount = Number.parseInt(String(entry.orders_count ?? "0"), 10);
      if (!accountId || !Number.isFinite(ordersCount) || ordersCount <= 0) return null;

      const account = accounts.find((a) => (a?.id != null ? String(a.id).trim() : "") === accountId);
      const label = account ? resolveMarketplaceAccountLabel(account) : "Conta";

      return {
        key: accountId,
        label,
        ordersCount,
      };
    })
    .filter(Boolean);

  if (rows.length < 2) return null;

  return (
    <div className="s7-daily-summary__account-dist" aria-label="Distribuição por conta">
      <span className="s7-daily-summary__account-dist-label">Distribuição por conta</span>
      <ul className="s7-daily-summary__account-dist-list">
        {rows.map((row) => (
          <li key={row.key} className="s7-daily-summary__account-dist-item">
            <div className="s7-daily-summary__account-dist-copy">
              <span className="s7-daily-summary__account-dist-name" title={row.label}>
                {row.label}
              </span>
              <span className="s7-daily-summary__account-dist-metric">
                {formatAccountOrdersPhrase(row.ordersCount)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
