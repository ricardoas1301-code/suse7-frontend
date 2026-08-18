import { pickCatalogAccountFields } from "../catalog/S7CatalogAccountCell.jsx";

/**
 * @param {Record<string, unknown> | null | undefined} account
 * @param {(account: Record<string, unknown>) => string} [accountLabel]
 */
export function resolveAccountSelectFields(account, accountLabel) {
  if (!account || typeof account !== "object") {
    return { id: "", label: "Conta", logoUrl: null, initial: "?" };
  }
  const id = account.id != null ? String(account.id).trim() : "";
  const picked = pickCatalogAccountFields(account);
  const label =
    typeof accountLabel === "function"
      ? accountLabel(account)
      : picked.accountAlias != null && String(picked.accountAlias).trim() !== ""
        ? String(picked.accountAlias).trim()
        : "Conta";
  const logoUrl = picked.accountLogoUrl;
  const initial = (label || "?").charAt(0).toUpperCase();
  return { id, label, logoUrl, initial };
}
