// ======================================================
// Modal “Raio-x da venda” — dados e financeiro só via GET /api/sales/detail
// ======================================================

import { useEffect, useState } from "react";
import { buildApiUrl, apiFetch } from "../../config/api";
import MarketplaceRayXShell from "../rayx/MarketplaceRayXShell";
import SaleFinancialBreakdownCard from "./SaleFinancialBreakdownCard";
import SaleGeneralInfoLines from "./SaleGeneralInfoCard";
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
      const res = await apiFetch(url, { method: "GET" });
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.error ?? "Não foi possível carregar o detalhe.");
        setPayload(null);
        return;
      }
      setPayload(res.data);
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
  const listingInternalId = blocks?.pricing_comparison?.listing_internal_id ?? null;
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
        <div className="anuncios-pricing-modal__head-row">
          <div className="vendas-sale-rayx__modal-title-stack">
            <h2 id="vendas-detail-title" className="anuncios-sell-popover__title">
              Raio-x da venda
            </h2>
          </div>
        </div>

        <div
          className={`anuncios-compare-modal__body-scroll${loading ? " vendas-sale-rayx__body-scroll--loading" : ""}`}
        >
          {loading ? (
            <div className="vendas-sale-rayx__loading-host">
              <SaleRayXLoadingState listingTitle={listingTitle} />
            </div>
          ) : null}
          {err ? (
            <p className="vendas-page__error" role="alert">
              {err}
            </p>
          ) : null}

          {!loading && !err && product ? (
            <>
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
                    listingInternalId={listingInternalId}
                    onClose={onClose}
                  />
                </div>

                <div className="vendas-sale-rayx__compare anuncios-raiox-compare--spacious">
                  <div className="vendas-sale-rayx__right-stack">
                    <SaleRayXHealthSummary financial={fin} profitMargin={pm} />
                    <SaleFinancialBreakdownCard financial={fin} profitMargin={pm} />
                  </div>
                </div>
              </div>

            </>
          ) : null}
        </div>
      </div>
    </MarketplaceRayXShell>
  );
}
