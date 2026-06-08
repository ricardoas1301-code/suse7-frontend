// ======================================================================
// Seleção múltipla da lista de vendas (estado centralizado, por página).
// ======================================================================

import { useCallback, useMemo, useState } from "react";
import { pickVendasSaleRowId } from "./pickVendasSaleRowId.js";

/**
 * @param {readonly Record<string, unknown>[]} rows — linhas da página atual
 */
export function useVendasListSelection(rows) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const rowIdsOnPage = useMemo(() => {
    const ids = [];
    for (const row of rows ?? []) {
      const id = pickVendasSaleRowId(row);
      if (id) ids.push(id);
    }
    return ids;
  }, [rows]);

  const isSelected = useCallback((id) => selectedIds.has(String(id).trim()), [selectedIds]);

  const toggle = useCallback((id) => {
    const key = String(id ?? "").trim();
    if (!key) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const allOnPage =
        rowIdsOnPage.length > 0 && rowIdsOnPage.every((id) => prev.has(id));
      if (allOnPage) return new Set();
      return new Set(rowIdsOnPage);
    });
  }, [rowIdsOnPage]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedSales = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return (rows ?? []).filter((row) => {
      const id = pickVendasSaleRowId(row);
      return id && selectedIds.has(id);
    });
  }, [rows, selectedIds]);

  const selectedCount = selectedIds.size;
  const allPageSelected =
    rowIdsOnPage.length > 0 && rowIdsOnPage.every((id) => selectedIds.has(id));
  const somePageSelected =
    rowIdsOnPage.some((id) => selectedIds.has(id)) && !allPageSelected;

  return {
    selectedIds,
    selectedCount,
    selectedSales,
    rowIdsOnPage,
    isSelected,
    toggle,
    toggleAllOnPage,
    clearSelection,
    allPageSelected,
    somePageSelected,
    hasSelection: selectedCount > 0,
  };
}
