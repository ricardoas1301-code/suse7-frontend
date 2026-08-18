// ======================================================
// Hook — abrir/fechar Raio-X da Venda (mesmo fluxo da página Vendas)
// ======================================================

import { useCallback, useState } from "react";
import { isSaleRayxDetailItemId } from "./saleRayxDetailItemId";

/**
 * @returns {{
 *   modalOpen: boolean;
 *   selectedItemId: string | null;
 *   openDetail: (itemId: unknown) => void;
 *   closeDetail: () => void;
 * }}
 */
export function useSaleDetailModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(/** @type {string | null} */ (null));

  const openDetail = useCallback((itemId) => {
    const id = String(itemId ?? "").trim();
    if (!isSaleRayxDetailItemId(id)) {
      if (import.meta.env.DEV) {
        console.warn("[S7 Raio-X] não abre modal: item_id ausente ou inválido", { itemId: id || null });
      }
      return;
    }
    setSelectedItemId(id);
    setModalOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setModalOpen(false);
    setSelectedItemId(null);
  }, []);

  return { modalOpen, selectedItemId, openDetail, closeDetail };
}
