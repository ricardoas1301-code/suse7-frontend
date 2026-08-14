import { pickCatalogAccountFields } from "../../../components/catalog/S7CatalogAccountCell.jsx";

/**
 * Enriquece logo/alias da conta a partir do cadastro ML (sem alterar payload da listagem).
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown>[]} mlAccounts
 */
export function enrichListingRowAccountVisual(row, mlAccounts) {
  const base = pickCatalogAccountFields(row);
  if (base.accountLogoUrl) return row;
  const accountId = base.marketplaceAccountId != null ? String(base.marketplaceAccountId).trim() : "";
  if (!accountId || !Array.isArray(mlAccounts) || mlAccounts.length === 0) return row;
  const match = mlAccounts.find((account) => String(account?.id ?? "").trim() === accountId);
  if (!match) return row;
  const fromAccount = pickCatalogAccountFields(match);
  return {
    ...row,
    marketplace_account_id: base.marketplaceAccountId ?? fromAccount.marketplaceAccountId,
    account_alias: base.accountAlias ?? fromAccount.accountAlias,
    account_logo_url: fromAccount.accountLogoUrl,
    accountLogoUrl: fromAccount.accountLogoUrl,
  };
}

/**
 * @param {Record<string, unknown>[]} items
 * @param {Record<string, unknown>[]} mlAccounts
 */
export function enrichListingRowsAccountVisual(items, mlAccounts) {
  if (!Array.isArray(items) || items.length === 0) return items;
  return items.map((item) => enrichListingRowAccountVisual(item, mlAccounts));
}
