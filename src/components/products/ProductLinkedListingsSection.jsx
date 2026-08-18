// ======================================================================
// Anúncios vinculados ao produto — lista informativa (sem link por enquanto).
// Padrão visual: Histórico de vendas (Raio-X / aba Anúncios).
// Financeiro: executive-summary via listingMetricsLookup (mesma fonte Vendas & desempenho).
// ======================================================================

import { useEffect, useMemo, useState } from "react";
import {
  formatBrlFromApiString,
  formatPercentFromApiString,
} from "../../features/listings/utils/catalogFormatters";
import { formatExecutiveCountOrDash } from "../../features/sales/executiveSummaryDisplay.js";
import { pickListingFinancialMetrics } from "../../features/products/financial/fetchProductSalesHistory.js";
import { fetchMercadoLivreMarketplaceAccounts } from "../../services/marketplaceAccountsApi";
import { formatMarketplaceListingDisplayId } from "../../utils/marketplaceListingId";
import { formatCatalogBRL } from "../../utils/productCatalogRow";
import {
  formatarIdAnuncioMlbParaCopia,
  resolverLinkAnuncioProprio,
} from "../concorrencia/concorrenciaCompetitorDisplay.js";
import S7CatalogAccountCell, {
  normalizeCatalogLogoUrl,
  pickCatalogAccountFields,
  S7CatalogChannelCell,
} from "../catalog/S7CatalogAccountCell.jsx";
import "../catalog/S7CatalogAccountCell.css";
import S7CatalogListingHeadline from "../catalog/S7CatalogListingHeadline.jsx";
import S7CopyButton, { S7_COPY_OFFICIAL_FLASH_MS } from "../ui/S7CopyButton";
import S7Tooltip from "../ui/S7Tooltip";
import "../catalog/S7CatalogListingHeadline.css";
import "./ProductLinkedListingsSection.css";

const DASH = "—";

/**
 * @param {unknown} raw
 */
function parseListingMetricDecimal(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} metrics
 */
function parseListingMetricQty(metrics) {
  if (!metrics) return null;
  const n = Number(metrics.quantity_sold);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Chaves de ordenação visual — usa métricas já normalizadas no lookup (sem recalcular).
 * @param {Record<string, unknown>} listing
 * @param {Map<string, Record<string, unknown>> | null | undefined} listingMetricsLookup
 */
function resolveLinkedListingSortKeys(listing, listingMetricsLookup) {
  const L = listing && typeof listing === "object" ? listing : {};
  const marketplace = L.marketplace != null ? String(L.marketplace) : "";
  const extRaw = L.external_listing_id != null ? String(L.external_listing_id).trim() : "";

  const listingMetrics =
    listingMetricsLookup != null
      ? pickListingFinancialMetrics(listingMetricsLookup, marketplace, extRaw)
      : null;

  const qtyRaw = listingMetrics?.quantity_sold;
  const qtyNum = qtyRaw != null ? Number(qtyRaw) : NaN;
  const salesCount = Number.isFinite(qtyNum) ? qtyNum : 0;

  const faturamentoRaw =
    listingMetrics?.gross_sales_brl ?? listingMetrics?.gross_revenue_brl ?? null;
  const grossSales = parseListingMetricDecimal(
    faturamentoRaw != null ? String(faturamentoRaw) : null,
  );
  const grossSalesCount = grossSales != null ? grossSales : 0;

  const idFallback =
    extRaw ||
    (L.id != null ? String(L.id).trim() : "") ||
    (L.title != null ? String(L.title).trim() : "");

  const title = L.title != null ? String(L.title).trim() : "";

  return { salesCount, grossSalesCount, idFallback, title };
}

/**
 * @param {Record<string, unknown> | null | undefined} account
 */
function pickMlAccountLabel(account) {
  if (!account || typeof account !== "object") return null;
  if (account.ml_nickname != null && String(account.ml_nickname).trim() !== "") {
    return String(account.ml_nickname).trim();
  }
  if (account.account_alias != null && String(account.account_alias).trim() !== "") {
    return String(account.account_alias).trim();
  }
  if (account.alias != null && String(account.alias).trim() !== "") {
    return String(account.alias).trim();
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} account
 */
function pickMlAccountLogoUrl(account) {
  if (!account || typeof account !== "object") return null;
  const raw =
    account.account_logo_url ??
    account.logo_url ??
    account.avatar_url ??
    account.company_logo_url ??
    account.ml_picture_url ??
    null;
  return normalizeCatalogLogoUrl(raw);
}

/**
 * @param {Record<string, unknown>} listing
 * @param {Record<string, unknown> | null | undefined} listingMetrics
 * @param {Record<string, unknown>[]} mlAccounts
 */
function resolveLinkedListingAccountFields(listing, listingMetrics, mlAccounts) {
  const merged = {
    ...listingMetrics,
    ...listing,
    account_alias:
      listing.account_alias ??
      listing.account_label ??
      listingMetrics?.account_alias ??
      listingMetrics?.account_label ??
      null,
    account_logo_url:
      listing.account_logo_url ??
      listingMetrics?.account_logo_url ??
      listingMetrics?.marketplace_account_logo_url ??
      null,
    marketplace_account_id:
      listing.marketplace_account_id ??
      listingMetrics?.marketplace_account_id ??
      null,
  };

  let fields = pickCatalogAccountFields(merged);
  const accountId =
    fields.marketplaceAccountId != null ? String(fields.marketplaceAccountId).trim() : "";

  if (accountId && mlAccounts.length > 0) {
    const account = mlAccounts.find((a) => String(a?.id ?? "").trim() === accountId);
    if (account) {
      fields = {
        marketplaceAccountId: accountId,
        accountAlias: fields.accountAlias ?? pickMlAccountLabel(account),
        accountLogoUrl: fields.accountLogoUrl ?? pickMlAccountLogoUrl(account),
      };
    }
  }

  return fields;
}

/**
 * @param {string | null | undefined} raw
 */
function formatPriceCell(raw) {
  if (raw == null || String(raw).trim() === "") return DASH;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return formatCatalogBRL(n);
}

/**
 * @param {string | null | undefined} raw
 */
function formatMoneyMetricCell(raw) {
  if (raw == null || String(raw).trim() === "") return { text: DASH, tone: "" };
  const text = formatBrlFromApiString(String(raw));
  const n = Number(String(raw).replace(",", "."));
  const tone =
    Number.isFinite(n) && n < 0
      ? "pf-product-listings__money--negative"
      : Number.isFinite(n) && n > 0
        ? "pf-product-listings__money--positive"
        : "";
  return { text, tone };
}

/**
 * @param {string | null | undefined} raw
 */
function formatMarginMetricCell(raw) {
  if (raw == null || String(raw).trim() === "") return { text: DASH, tone: "" };
  const text = formatPercentFromApiString(String(raw));
  const n = Number(String(raw).replace(",", "."));
  const tone =
    Number.isFinite(n) && n < 0
      ? "pf-product-listings__money--negative"
      : Number.isFinite(n) && n > 0
        ? "pf-product-listings__money--positive"
        : "";
  return { text, tone };
}

/**
 * @param {{
 *   value: string | null;
 *   display?: string | null;
 *   ariaLabel: string;
 *   tooltipText: string;
 *   toastLabel: string;
 *   flashKey: string;
 *   toastEventType?: string;
 *   toastFailEventType?: string;
 *   toastEntityType?: string;
 *   className?: string;
 * }} props
 */
function CopyableListingIdCell({
  value,
  display,
  ariaLabel,
  tooltipText,
  toastLabel,
  flashKey,
  toastEventType,
  toastFailEventType,
  toastEntityType,
  className = "pf-product-listings__id-text",
}) {
  if (value == null || String(value).trim() === "") {
    return <span className={className}>{DASH}</span>;
  }

  const copyValue = String(value).trim();
  const text = display != null && String(display).trim() !== "" ? String(display).trim() : copyValue;

  return (
    <span
      className="s7-copy-group pf-product-listings__copy-row"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <span className={className}>{text}</span>
      <S7CopyButton
        value={copyValue}
        ariaLabel={ariaLabel}
        tooltipText={tooltipText}
        toastLabel={toastLabel}
        showToast={true}
        iconMode="unicode"
        flashMs={S7_COPY_OFFICIAL_FLASH_MS}
        flashKey={flashKey}
        toastEventType={toastEventType}
        toastFailEventType={toastFailEventType}
        toastEntityType={toastEntityType}
      />
    </span>
  );
}

/**
 * @param {{
 *   value: string;
 *   tooltipText: string;
 * }} props
 */
function SubMetricUnitRow({ value, tooltipText }) {
  if (value === DASH) {
    return <span className="pf-product-listings__sub-metric-row">{DASH}</span>;
  }

  return (
    <span className="pf-product-listings__sub-metric-row">
      <S7Tooltip content={tooltipText} placement="top-start" offset={4}>
        <span
          className="pf-product-listings__sub-metric pf-product-listings__sub-metric--tip"
          tabIndex={0}
          aria-label={tooltipText}
        >
          {value}
        </span>
      </S7Tooltip>
    </span>
  );
}

/**
 * @param {{
 *   listings: readonly Record<string, unknown>[];
 *   listingMetricsLookup: Map<string, Record<string, unknown>> | null;
 *   loading: boolean;
 *   error: string | null;
 *   hasProduct: boolean;
 * }} props
 */
export default function ProductLinkedListingsSection({
  listings,
  listingMetricsLookup,
  loading,
  error,
  hasProduct,
}) {
  const [mlAccounts, setMlAccounts] = useState(/** @type {Record<string, unknown>[]} */ ([]));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetchMercadoLivreMarketplaceAccounts();
      if (cancelled || !res.ok) return;
      const list =
        res.ok && Array.isArray(res.data?.accounts)
          ? /** @type {Record<string, unknown>[]} */ (res.data.accounts)
          : [];
      setMlAccounts(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedListings = useMemo(() => {
    if (!Array.isArray(listings) || listings.length <= 1) return listings;

    return [...listings].sort((rawA, rawB) => {
      const a = rawA && typeof rawA === "object" ? rawA : {};
      const b = rawB && typeof rawB === "object" ? rawB : {};
      const keysA = resolveLinkedListingSortKeys(a, listingMetricsLookup);
      const keysB = resolveLinkedListingSortKeys(b, listingMetricsLookup);

      if (keysB.salesCount !== keysA.salesCount) {
        return keysB.salesCount - keysA.salesCount;
      }
      if (keysB.grossSalesCount !== keysA.grossSalesCount) {
        return keysB.grossSalesCount - keysA.grossSalesCount;
      }

      const idCmp = keysA.idFallback.localeCompare(keysB.idFallback, undefined, { numeric: true });
      if (idCmp !== 0) return idCmp;

      return keysA.title.localeCompare(keysB.title, "pt-BR", { sensitivity: "base" });
    });
  }, [listings, listingMetricsLookup]);

  if (!hasProduct) {
    return <p className="hint pf-product-listings__hint">Salve o produto para listar os anúncios vinculados.</p>;
  }

  if (loading) {
    return <p className="hint pf-product-listings__hint">Carregando anúncios…</p>;
  }

  if (error) {
    return (
      <p className="hint pf-performance-error pf-product-listings__hint" role="alert">
        {error}
      </p>
    );
  }

  if (listings.length === 0) {
    return (
      <p className="hint pf-product-listings__hint">Nenhum anúncio vinculado a este produto ainda.</p>
    );
  }

  return (
    <section className="pf-product-listings" aria-label="Anúncios vinculados">
      <div className="pf-product-listings__table-block">
        <div className="pf-product-listings__table-card">
          <div className="pf-product-listings__table-hscroll">
            <table className="pf-product-listings__table">
              <thead>
                <tr>
                  <th scope="col">Nº</th>
                  <th scope="col">Anúncio</th>
                  <th scope="col">Loja</th>
                  <th scope="col">Canal</th>
                  <th scope="col">Vendas</th>
                  <th scope="col">Preço</th>
                  <th scope="col">Faturamento</th>
                  <th scope="col">Lucro (R$)</th>
                  <th scope="col">Lucro (%)</th>
                </tr>
              </thead>
              <tbody>
                {sortedListings.map((raw) => {
                  const L = raw && typeof raw === "object" ? raw : {};
                  const marketplace = L.marketplace != null ? String(L.marketplace) : "";
                  const extRaw =
                    L.external_listing_id != null ? String(L.external_listing_id).trim() : "";
                  const adNo = formatMarketplaceListingDisplayId(marketplace, extRaw) || extRaw || DASH;
                  const adCopyValue = formatarIdAnuncioMlbParaCopia(extRaw) || extRaw || null;
                  const title =
                    L.title != null && String(L.title).trim() !== "" ? String(L.title).trim() : DASH;
                  const sku =
                    L.sku != null && String(L.sku).trim() !== "" ? String(L.sku).trim() : null;
                  const priceDisplay = formatPriceCell(
                    L.price_brl != null ? String(L.price_brl) : null,
                  );
                  const listingUrl = resolverLinkAnuncioProprio(L);
                  const rowKey =
                    L.id != null && String(L.id).trim() !== ""
                      ? String(L.id)
                      : `${marketplace || "mkt"}-${extRaw || "ad"}`;

                  const listingMetrics =
                    listingMetricsLookup != null
                      ? pickListingFinancialMetrics(listingMetricsLookup, marketplace, extRaw)
                      : null;

                  const accountFields = resolveLinkedListingAccountFields(L, listingMetrics, mlAccounts);

                  const vendasQtyRaw = listingMetrics?.quantity_sold;
                  const vendasQty =
                    vendasQtyRaw != null ? formatExecutiveCountOrDash(vendasQtyRaw) : DASH;
                  const qty = parseListingMetricQty(listingMetrics);

                  const faturamentoRaw =
                    listingMetrics?.gross_sales_brl ?? listingMetrics?.gross_revenue_brl ?? null;
                  const faturamento = formatMoneyMetricCell(
                    faturamentoRaw != null ? String(faturamentoRaw) : null,
                  );
                  const gross = parseListingMetricDecimal(faturamentoRaw);
                  const ticketPorUnidade =
                    qty != null && gross != null
                      ? formatBrlFromApiString((gross / qty).toFixed(2))
                      : DASH;

                  const lucroRaw =
                    listingMetrics?.contribution_profit_brl ??
                    listingMetrics?.profit_brl ??
                    listingMetrics?.net_profit_brl ??
                    null;
                  const lucro = formatMoneyMetricCell(
                    lucroRaw != null ? String(lucroRaw) : null,
                  );
                  const profit = parseListingMetricDecimal(lucroRaw);
                  const lucroPorUnidadeBrl =
                    qty != null && profit != null
                      ? formatBrlFromApiString((profit / qty).toFixed(2))
                      : DASH;

                  const margemRaw =
                    listingMetrics?.contribution_margin_percent ??
                    listingMetrics?.margin_percent ??
                    null;
                  const margem = formatMarginMetricCell(
                    margemRaw != null ? String(margemRaw) : null,
                  );

                  return (
                    <tr key={rowKey}>
                      <td className="pf-product-listings__ad-col">
                        <CopyableListingIdCell
                          value={adCopyValue}
                          display={adNo}
                          ariaLabel={`Copiar anúncio ${adCopyValue ?? ""}`}
                          tooltipText="Copiar número do anúncio"
                          toastLabel="Anúncio"
                          flashKey={`product-rayx-listing-ad-${adCopyValue ?? rowKey}`}
                          toastEventType="LISTING_SKU_COPIED"
                          toastFailEventType="LISTING_SKU_COPY_FAILED"
                          toastEntityType="listing"
                        />
                      </td>
                      <td className="pf-product-listings__title-col">
                        {title !== DASH ? (
                          <S7CatalogListingHeadline
                            layout="stacked"
                            className="pf-product-listings__listing-headline"
                            title={title}
                            titleHref={listingUrl || null}
                            titleTooltip={title}
                            titleCopyValue={title}
                            sku={sku || ""}
                            stopTitlePropagation
                            copyTitleFlashKey={`product-rayx-listing-title-${rowKey}`}
                            copySkuFlashKey={`product-rayx-listing-sku-${rowKey}-${sku || "empty"}`}
                          />
                        ) : (
                          DASH
                        )}
                      </td>
                      <td className="pf-product-listings__account-col">
                        <S7CatalogAccountCell
                          compact
                          marketplaceAccountId={accountFields.marketplaceAccountId}
                          accountAlias={accountFields.accountAlias}
                          accountLogoUrl={accountFields.accountLogoUrl}
                        />
                      </td>
                      <td className="pf-product-listings__channel-col">
                        <S7CatalogChannelCell
                          marketplace={marketplace || null}
                          marketplaceLabel={
                            L.marketplace_label != null ? String(L.marketplace_label) : null
                          }
                        />
                      </td>
                      <td className="pf-product-listings__num-col">{vendasQty}</td>
                      <td className="pf-product-listings__num-col">{priceDisplay}</td>
                      <td
                        className={["pf-product-listings__metric-col", faturamento.tone]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className="pf-product-listings__metric-main">{faturamento.text}</span>
                        <SubMetricUnitRow
                          value={ticketPorUnidade}
                          tooltipText="Faturamento por unidade vendida"
                        />
                      </td>
                      <td
                        className={["pf-product-listings__metric-col", lucro.tone]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className="pf-product-listings__metric-main">{lucro.text}</span>
                        <SubMetricUnitRow
                          value={lucroPorUnidadeBrl}
                          tooltipText="Lucro por unidade vendida"
                        />
                      </td>
                      <td
                        className={["pf-product-listings__metric-col", margem.tone]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className="pf-product-listings__metric-main">{margem.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
