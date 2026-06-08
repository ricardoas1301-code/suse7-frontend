// ======================================================================
// Rótulo de contas — relatório de vendas selecionadas (P_2.8.2).
// ======================================================================

import { pickCatalogAccountFields } from "../../../components/catalog/S7CatalogAccountCell.jsx";
import { formatVendasTableTitleCase } from "../utils/vendasTableDisplayFormat.js";

/**
 * @param {Record<string, unknown> | null | undefined} account
 * @returns {string | null}
 */
function pickAccountScopeId(account) {
  if (!account || typeof account !== "object") return null;
  const id = account.id ?? account.marketplace_account_id ?? null;
  const s = id != null ? String(id).trim() : "";
  return s || null;
}

/**
 * @param {Record<string, unknown>} row
 * @param {(account: Record<string, unknown>) => string} accountLabelFn
 * @param {readonly Record<string, unknown>[]} accountsCatalog
 * @returns {{ id: string | null; label: string }}
 */
function resolveRowAccountLabel(row, accountLabelFn, accountsCatalog) {
  const fields = pickCatalogAccountFields(row);
  const id =
    fields.marketplaceAccountId != null ? String(fields.marketplaceAccountId).trim() : "";
  const aliasRaw = fields.accountAlias != null ? String(fields.accountAlias).trim() : "";

  if (id) {
    const fromCatalog = accountsCatalog.find((a) => pickAccountScopeId(a) === id);
    if (fromCatalog) return { id, label: accountLabelFn(fromCatalog) };
    if (aliasRaw) return { id, label: formatVendasTableTitleCase(aliasRaw) };
    return { id, label: "Conta" };
  }

  if (aliasRaw) return { id: null, label: formatVendasTableTitleCase(aliasRaw) };
  return { id: null, label: "Conta não definida" };
}

/**
 * Distribuição por conta da seleção manual (P_2.8.12C).
 * Apenas contagem de linhas selecionadas por conta — sem cálculo monetário.
 *
 * @param {readonly Record<string, unknown>[]} selectedSales
 * @param {readonly Record<string, unknown>[]} accountsCatalog
 * @param {(account: Record<string, unknown>) => string} accountLabelFn
 * @returns {{ contaId: string | null; conta: string; quantidadeVendas: number }[]}
 */
export function buildVendasSelectionAccountDistribution(selectedSales, accountsCatalog, accountLabelFn) {
  const rows = Array.isArray(selectedSales) ? selectedSales : [];
  const catalog = Array.isArray(accountsCatalog) ? accountsCatalog : [];

  /** @type {Map<string, { contaId: string | null; conta: string; quantidadeVendas: number }>} */
  const byAccount = new Map();

  for (const row of rows) {
    const resolved = resolveRowAccountLabel(row, accountLabelFn, catalog);
    const key = resolved.id ?? `label::${resolved.label}`;
    const existing = byAccount.get(key);
    if (existing) {
      existing.quantidadeVendas += 1;
    } else {
      byAccount.set(key, {
        contaId: resolved.id,
        conta: resolved.label,
        quantidadeVendas: 1,
      });
    }
  }

  return [...byAccount.values()].sort((a, b) => b.quantidadeVendas - a.quantidadeVendas);
}

/**
 * Contas presentes na seleção. "Todas as contas" só quando a seleção cobre
 * todas as contas do recorte atual (filtro de conta da página).
 *
 * @param {readonly Record<string, unknown>[]} selectedSales
 * @param {readonly Record<string, unknown>[]} accountsCatalog
 * @param {(account: Record<string, unknown>) => string} accountLabelFn
 * @param {string} marketplaceAccountIdFilter — conta ativa nos filtros (vazio = todas)
 */
export function resolveVendasSelectionAccountLabel(
  selectedSales,
  accountsCatalog,
  accountLabelFn,
  marketplaceAccountIdFilter = "",
) {
  const rows = Array.isArray(selectedSales) ? selectedSales : [];
  if (rows.length === 0) return "Todas as contas";

  const filterAccountId = String(marketplaceAccountIdFilter ?? "").trim();
  const recorteAccounts = filterAccountId
    ? accountsCatalog.filter((a) => pickAccountScopeId(a) === filterAccountId)
    : accountsCatalog.filter((a) => pickAccountScopeId(a));

  const recorteIds = new Set(
    recorteAccounts.map((a) => pickAccountScopeId(a)).filter(Boolean),
  );

  /** @type {Map<string, string>} */
  const labelsById = new Map();
  /** @type {string[]} */
  const orphanLabels = [];

  for (const row of rows) {
    const resolved = resolveRowAccountLabel(row, accountLabelFn, accountsCatalog);
    if (resolved.id) {
      if (!labelsById.has(resolved.id)) labelsById.set(resolved.id, resolved.label);
    } else if (resolved.label && resolved.label !== "Conta não definida") {
      if (!orphanLabels.includes(resolved.label)) orphanLabels.push(resolved.label);
    }
  }

  const selectedIds = new Set(labelsById.keys());
  const displayLabels = [...labelsById.values(), ...orphanLabels];

  if (displayLabels.length === 0) return "Todas as contas";

  if (
    !filterAccountId &&
    recorteIds.size > 1 &&
    selectedIds.size >= recorteIds.size &&
    [...recorteIds].every((id) => selectedIds.has(id))
  ) {
    return "Todas as contas";
  }

  if (displayLabels.length === 1) return displayLabels[0];

  return displayLabels.join(" • ");
}
