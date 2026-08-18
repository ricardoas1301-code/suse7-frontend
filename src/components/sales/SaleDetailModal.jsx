// ======================================================
// Modal “Raio-x da venda” — dados e financeiro só via GET /api/sales/detail
// ======================================================

import { useEffect, useState } from "react";
import { API_BASE_URL, buildApiUrl, apiFetch } from "../../config/api";
import MarketplaceRayXShell from "../rayx/MarketplaceRayXShell";
import SaleFinancialBreakdownCard from "./SaleFinancialBreakdownCard";
import { isSaleRayxDetailItemId } from "./saleRayxDetailItemId";
import SaleGeneralInfoLines from "./SaleGeneralInfoCard";
import SaleRayXOperationalActions from "./SaleRayXOperationalActions";
import SaleRayXHealthSummary from "./SaleRayXHealthSummary";
import SaleRayXLoadingState from "./SaleRayXLoadingState";
import "../../styles/VendasPage.css";

/**
 * @param {{ open: boolean; itemId: string | null; onClose: () => void }} props
 */
export default function SaleDetailModal({ open, itemId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    if (!open || !itemId) {
      setPayload(null);
      setErr(null);
      return;
    }
    if (!isSaleRayxDetailItemId(itemId)) {
      setPayload(null);
      setErr("Identificador da venda inválido — não foi possível carregar o Raio-X completo.");
      if (import.meta.env.DEV) {
        console.warn("[S7 Raio-X] item_id inválido (detail não será chamado)", { itemId });
      }
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      const url = buildApiUrl(`/api/sales/detail?item_id=${encodeURIComponent(itemId)}`);
      if (!url) {
        setErr("API não configurada.");
        setLoading(false);
        return;
      }
      if (import.meta.env.DEV) {
        console.debug("[S7 Raio-X][detail fetch]", {
          itemId,
          url,
          apiBase: API_BASE_URL || null,
        });
      }
      const res = await apiFetch(url, { method: "GET" });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        if (import.meta.env.DEV) {
          console.debug("[S7 Raio-X][detail fetch failed]", {
            itemId,
            url,
            status: res.status,
            error: res.error,
          });
        }
        setErr(res.error ?? "Não foi possível carregar o detalhe.");
        setPayload(null);
        return;
      }
      const detail = res.data;
      setPayload(detail);
      if (import.meta.env.DEV) {
        const fin = detail?.blocks?.financial_breakdown;
        const mr =
          fin?.marketplace_revenue && typeof fin.marketplace_revenue === "object"
            ? fin.marketplace_revenue
            : null;
        console.debug("[S7 Raio-X][detail usado no modal]", detail);
        console.debug("[S7 Raio-X][marketplace revenue usado]", mr);
        console.debug("[S7 Raio-X][applied promotion raw]", {
          root: fin?.applied_sale_promotion ?? null,
          nested: mr?.applied_sale_promotion ?? null,
        });
        if (fin && !mr?.applied_sale_promotion && !fin?.applied_sale_promotion) {
          console.warn(
            "[S7 Raio-X] applied_sale_promotion ausente na resposta de /api/sales/detail — confira deploy do backend (VITE_API_BASE_URL).",
            { apiBase: API_BASE_URL || null },
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  const blocks = payload?.blocks;
  const product = blocks?.product;
  const general = blocks?.general;
  const fin = blocks?.financial_breakdown;
  const pm = blocks?.profit_margin;
  const saleContextMetrics = blocks?.sale_context_metrics;
  const marketplace = general?.marketplace ?? product?.marketplace ?? null;
  const listingTitle =
    product?.title != null && String(product.title).trim() !== "" ? String(product.title).trim() : null;

  if (!open) return null;

  return (
    <MarketplaceRayXShell
      open={open}
      onClose={onClose}
      marketplace={marketplace}
      ariaLabelledBy="vendas-detail-title"
      shellClassName="vendas-sale-rayx-shell"
      maxWidth={646}
    >
      <div
        id="vendas-sale-rayx-print-root"
        className="anuncios-sell-popover__panel anuncios-sell-popover__panel--in-shell anuncios-sell-popover__panel--raiox-centered vendas-sale-rayx__panel vendas-sale-rayx__print-root"
      >
        <div className="anuncios-pricing-modal__head-row vendas-sale-rayx__modal-head-row">
          <div className="vendas-sale-rayx__modal-title-stack">
            <h2 id="vendas-detail-title" className="anuncios-sell-popover__title">
              Raio-x da venda
            </h2>
          </div>
          {!loading && !err && product ? (
            <SaleRayXOperationalActions
              placement="header"
              saleId={itemId}
              general={general}
              product={product}
              financial={fin}
              profitMargin={pm}
              listingTitle={listingTitle}
              saleContextMetrics={saleContextMetrics}
            />
          ) : null}
        </div>

        <div
          className={`anuncios-compare-modal__body-scroll${loading ? " vendas-sale-rayx__body-scroll--loading" : ""}`}
        >
          {loading ? (
            <div className="vendas-sale-rayx__loading-host">
              <SaleRayXLoadingState />
            </div>
          ) : null}
          {err ? (
            <p className="vendas-page__error" role="alert">
              {err}
            </p>
          ) : null}

          {!loading && !err && product ? (
            <div className="vendas-sale-rayx__body-layout">
              <div className="vendas-sale-rayx__info-column">
                <SaleGeneralInfoLines
                  general={general}
                  product={product}
                  financial={fin}
                  profitMargin={pm}
                  listingTitle={listingTitle}
                  itemId={itemId}
                  saleContextMetrics={saleContextMetrics}
                />
              </div>

              <div className="vendas-sale-rayx__compare anuncios-raiox-compare--spacious">
                <div className="vendas-sale-rayx__right-stack">
                  <SaleRayXHealthSummary financial={fin} profitMargin={pm} />
                  <SaleFinancialBreakdownCard financial={fin} profitMargin={pm} detail={payload} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </MarketplaceRayXShell>
  );
}
