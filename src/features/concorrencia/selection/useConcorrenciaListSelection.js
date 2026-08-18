// ======================================================================
// Seleção múltipla da lista de Concorrência (estado centralizado).
// ======================================================================

import { useCallback, useMemo, useState } from "react";
import { pickConcorrenciaProductRowId } from "./pickConcorrenciaProductRowId.js";

/**
 * @param {readonly Record<string, unknown>[]} pageRows — produtos da página atual
 * @param {readonly Record<string, unknown>[]} [allFilteredRows] — todos os filtrados (escopo do relatório)
 */
export function useConcorrenciaListSelection(pageRows, allFilteredRows = []) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const rowIdsOnPage = useMemo(() => {
    const ids = [];
    for (const row of pageRows ?? []) {
      const id = pickConcorrenciaProductRowId(row);
      if (id) ids.push(id);
    }
    return ids;
  }, [pageRows]);

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
      const allOnPage = rowIdsOnPage.length > 0 && rowIdsOnPage.every((id) => prev.has(id));
      if (allOnPage) return new Set();
      return new Set(rowIdsOnPage);
    });
  }, [rowIdsOnPage]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const scopeRows =
    Array.isArray(allFilteredRows) && allFilteredRows.length > 0 ? allFilteredRows : pageRows ?? [];

  const selectedProducts = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return scopeRows.filter((row) => {
      const id = pickConcorrenciaProductRowId(row);
      return id && selectedIds.has(id);
    });
  }, [scopeRows, selectedIds]);

  const selectedCount = selectedIds.size;
  const allPageSelected =
    rowIdsOnPage.length > 0 && rowIdsOnPage.every((id) => selectedIds.has(id));
  const somePageSelected =
    rowIdsOnPage.some((id) => selectedIds.has(id)) && !allPageSelected;

  return {
    selectedIds,
    selectedCount,
    selectedProducts,
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
