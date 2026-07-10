// ======================================================================
// Ordenação operacional compartilhada — páginas de catálogo S7.
// Base: "Mais vendidos" como estado inicial onde houver métrica de vendas.
// ======================================================================

/** Chip padrão — mesmo visual de Precificações / Produtos. */
export const S7_OPERATIONAL_SORT_TOP_SALES_CHIP = {
  id: "top_sales",
  label: "Mais vendidos",
  icon: "catalog_filter_top_sales",
  iconTone: "fire",
};

export const S7_OPERATIONAL_DEFAULT_SORT_ID = S7_OPERATIONAL_SORT_TOP_SALES_CHIP.id;

/**
 * @param {Record<string, unknown>} row
 * @param {(row: Record<string, unknown>) => Record<string, unknown> | null | undefined} [getOwnListing]
 */
export function getConcorrenciaMonitoredRowSalesCount(row, getOwnListing) {
  const own = typeof getOwnListing === "function" ? getOwnListing(row) : null;
  const raw = own?.sales ?? row?.sales ?? row?.sold_quantity ?? row?.sold_units ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {readonly Record<string, unknown>[]} rows
 * @param {string} sortId
 * @param {(row: Record<string, unknown>) => number} [resolveSalesCount]
 */
export function sortOperationalCatalogRows(rows, sortId, resolveSalesCount) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (sortId !== S7_OPERATIONAL_DEFAULT_SORT_ID) return [...rows];

  const readSales =
    typeof resolveSalesCount === "function"
      ? resolveSalesCount
      : (row) => getConcorrenciaMonitoredRowSalesCount(row);

  return [...rows].sort((a, b) => {
    const aSales = readSales(a) || 0;
    const bSales = readSales(b) || 0;
    if (bSales !== aSales) return bSales - aSales;

    const aId = String(a?.monitored_listing_id ?? a?.id ?? a?.product_id ?? "");
    const bId = String(b?.monitored_listing_id ?? b?.id ?? b?.product_id ?? "");
    return aId.localeCompare(bId, undefined, { numeric: true });
  });
}
