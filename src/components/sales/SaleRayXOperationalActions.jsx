// ======================================================
// Ações operacionais — compartilhar e imprimir.
// ======================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import {
  buildSaleRayxShareText,
  openEmailShare,
  openWhatsAppShare,
  printSaleRayx,
  tryNativeShare,
} from "./saleRayxSharePrint";

/**
 * @param {{
 *   general?: Record<string, unknown> | null;
 *   product?: Record<string, unknown> | null;
 *   financial?: Record<string, unknown> | null;
 *   profitMargin?: Record<string, unknown> | null;
 *   listingTitle?: string | null;
 *   itemId?: string | null;
 * }} props
 */
export default function SaleRayXOperationalActions({
  general,
  product,
  financial,
  profitMargin,
  listingTitle,
  itemId,
}) {
  const { addNotification } = useNotifications();
  const [shareOpen, setShareOpen] = useState(false);
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const shareText = buildSaleRayxShareText({
    general,
    product,
    financial,
    profitMargin,
    listingTitle,
    itemId,
  });
  const shareSubject = "Raio-x da venda — Suse7";

  useEffect(() => {
    if (!shareOpen) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(/** @type {Node} */ (e.target))) {
        setShareOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  const notifyCopied = useCallback(() => {
    addNotification({
      event_type: "LISTING_ID_COPIED",
      entity_type: "marketplace_listing",
      title: "Resumo copiado",
      message: "O resumo da venda foi copiado para a área de transferência.",
      severity: NOTIFICATION_SEVERITY.INFO,
    });
  }, [addNotification]);

  const copySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setShareOpen(false);
      notifyCopied();
    } catch {
      addNotification({
        event_type: "LISTING_ID_COPY_FAILED",
        entity_type: "marketplace_listing",
        title: "Não foi possível copiar",
        message: "Verifique permissões do navegador ou use HTTPS.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
    }
  }, [addNotification, notifyCopied, shareText]);

  const handleNativeShare = useCallback(async () => {
    const ok = await tryNativeShare({ title: shareSubject, text: shareText });
    if (ok) setShareOpen(false);
    else await copySummary();
  }, [copySummary, shareSubject, shareText]);

  return (
    <div className="vendas-sale-rayx__ops-actions" ref={wrapRef}>
      <div className="vendas-sale-rayx__share-wrap">
        <button
          type="button"
          className="vendas-sale-rayx__ops-btn"
          aria-expanded={shareOpen}
          aria-haspopup="menu"
          onClick={() => setShareOpen((v) => !v)}
        >
          Compartilhar
        </button>
        {shareOpen ? (
          <div className="vendas-sale-rayx__share-menu" role="menu" aria-label="Opções de compartilhamento">
            <button type="button" role="menuitem" className="vendas-sale-rayx__share-menu-item" onClick={() => {
              openWhatsAppShare(shareText);
              setShareOpen(false);
            }}>
              WhatsApp
            </button>
            <button type="button" role="menuitem" className="vendas-sale-rayx__share-menu-item" onClick={() => {
              openEmailShare(shareSubject, shareText);
              setShareOpen(false);
            }}>
              E-mail
            </button>
            <button type="button" role="menuitem" className="vendas-sale-rayx__share-menu-item" onClick={() => void copySummary()}>
              Copiar resumo
            </button>
            {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
              <button type="button" role="menuitem" className="vendas-sale-rayx__share-menu-item" onClick={() => void handleNativeShare()}>
                Compartilhar…
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <button type="button" className="vendas-sale-rayx__ops-btn" onClick={printSaleRayx}>
        Imprimir dados
      </button>
    </div>
  );
}
