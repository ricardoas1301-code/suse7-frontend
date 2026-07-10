// ======================================================
// PI — Receita do Marketplace (render real v8, contratos isolados Clássico/Premium).
// ======================================================

import { useEffect, useMemo } from "react";

import { extrairValoresMarketplaceCenarioPromocao } from "../../features/pricing/promotions/buildPromotionRevenueRowsFinal.js";
import {
  PI_PROMO_PARITY_RENDER_VERSION,
  buildPromotionRevenueRowsFromContractV8,
  isCompareContractIsolatedFromOfficial,
  logPromoParityRollbackContractV8,
  resolvePromotionCompareContract,
} from "../../features/pricing/promotions/promotionParityContractV8.js";

import { PricingScenarioMetricValue } from "./PricingScenarioMetricValue.jsx";

const COMPONENT_NAME = "PromotionPiRevenueMarketplaceSection";
const previousValidContractsByKey = new Map();

/** @param {string | number | null | undefined} value */
function normalizeKeyPart(value) {
  if (value == null || String(value).trim() === "") return "none";
  return String(value).trim();
}

/**
 * @param {{ pending: boolean; className?: string; children: import("react").ReactNode }} props
 */
function ValorFinanceiroDerivadoPi({ pending, className, children }) {
  return (
    <PricingScenarioMetricValue pending={pending} className={className}>
      {children}
    </PricingScenarioMetricValue>
  );
}

/**
 * @param {{
 *   scenario: Record<string, unknown>;
 *   financialScenarioPending?: boolean;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 *   promotionRevenueSource?: string | null;
 *   promotionSelectedKey?: string | null;
 *   officialRowContract?: Record<string, unknown> | null;
 *   comparisonModel?: "classic" | "premium" | null;
 *   isCurrentListingType?: boolean;
 *   selectedPromotionRequestId?: string | number | null;
 *   listingTypeCard?: string | null;
 *   listingExternalId?: string | null;
 *   sku?: string | null;
 *   promotionId?: string | null;
 *   promotionName?: string | null;
 * }} props
 */
export function PromotionPiRevenueMarketplaceSection({
  scenario,
  financialScenarioPending = false,
  promocaoPrecoVendaExibicaoOverride = null,
  promotionRevenueSource = "official_listing_prices",
  promotionSelectedKey = null,
  officialRowContract = null,
  comparisonModel = null,
  isCurrentListingType = false,
  selectedPromotionRequestId = null,
  listingTypeCard = null,
  listingExternalId = null,
  sku = null,
  promotionId = null,
  promotionName = null,
}) {
  const finPend = financialScenarioPending === true;

  const model =
    comparisonModel === "classic" || comparisonModel === "premium"
      ? comparisonModel
      : listingTypeCard === "premium"
        ? "premium"
        : "classic";

  const marketplaceVals = useMemo(
    () => extrairValoresMarketplaceCenarioPromocao(scenario),
    [scenario],
  );

  const saleOverrideRaw =
    promocaoPrecoVendaExibicaoOverride != null &&
    String(promocaoPrecoVendaExibicaoOverride).trim() !== ""
      ? String(promocaoPrecoVendaExibicaoOverride)
          .trim()
          .replace(/[^\d,.-]/g, "")
          .replace(",", ".")
      : null;

  const contractCacheKey = [
    normalizeKeyPart(listingExternalId),
    normalizeKeyPart(model),
    normalizeKeyPart(promotionSelectedKey),
  ].join("|");

  const contract = useMemo(
    () =>
      resolvePromotionCompareContract({
        scenario,
        comparisonModel: model,
        isCurrentListingType: isCurrentListingType === true,
        officialRowContract,
        previousValidContract: previousValidContractsByKey.get(contractCacheKey) ?? null,
        salePriceOverrideBrl: saleOverrideRaw ?? marketplaceVals.sale,
        selectedPromotionKey: promotionSelectedKey,
        promotionId,
        promotionName,
      }),
    [
      scenario,
      model,
      isCurrentListingType,
      officialRowContract,
      contractCacheKey,
      saleOverrideRaw,
      marketplaceVals.sale,
      promotionSelectedKey,
      promotionId,
      promotionName,
    ],
  );

  const effectivePending = finPend && contract.is_valid !== true;

  const rowsBundle = useMemo(
    () => buildPromotionRevenueRowsFromContractV8(contract, { pending: effectivePending }),
    [contract, effectivePending],
  );

  useEffect(() => {
    if (contract.is_valid === true) {
      previousValidContractsByKey.set(contractCacheKey, contract);
    }
  }, [contractCacheKey, contract]);

  const off = officialRowContract ?? {};
  const parityIsolated =
    officialRowContract != null
      ? isCompareContractIsolatedFromOfficial(officialRowContract, contract)
      : true;

  if (typeof import.meta !== "undefined" && !import.meta.env.PROD) {
    logPromoParityRollbackContractV8({
      phase: effectivePending ? "render_loading" : "render_final",
      listing_id: listingExternalId,
      sku,
      selected_promotion_key: contract.promotion_selected_key ?? promotionSelectedKey,
      promotion_id: contract.promotion_id ?? promotionId,
      promotion_name: contract.promotion_name ?? promotionName,
      official_row: {
        final_price_brl: off.final_price_brl ?? null,
        receive_brl: off.receive_brl ?? null,
        fee_discount_brl: off.fee_discount_brl ?? null,
        source: off.receive_source ?? null,
      },
      [model === "classic" ? "classic_contract" : "premium_contract"]: {
        listing_type_id: contract.listing_type_id,
        listing_type_label: contract.listing_type_label,
        commission_percent: contract.commission_percent,
        final_price_brl: contract.final_price_brl,
        net_fee_brl: contract.net_fee_brl,
        shipping_brl: contract.shipping_brl,
        fee_discount_brl: contract.fee_discount_brl,
        receive_brl: contract.receive_brl,
        source: contract.sources?.receive ?? null,
      },
      parity_warnings: contract.warnings,
      is_official_row_matching_ml_fixture: null,
      is_classic_isolated: model === "classic" ? parityIsolated : null,
      is_premium_isolated: model === "premium" ? parityIsolated : null,
    });
  }

  const isDev = typeof import.meta !== "undefined" && import.meta.env.DEV;

  return (
    <div
      className="anuncios-sell-popover__section anuncios-sell-popover__section--receita-pi-promo"
      data-s7-render-version={PI_PROMO_PARITY_RENDER_VERSION}
      data-s7-comparison-model={model}
      data-s7-listing-type-id={contract.listing_type_id ?? undefined}
      data-s7-promotion-selected-key={promotionSelectedKey ?? undefined}
      data-s7-promotion-revenue-source={contract.sources?.receive ?? promotionRevenueSource ?? "financial_contract_incomplete"}
      data-s7-promotion-request-id={selectedPromotionRequestId ?? undefined}
    >
      <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>

      {rowsBundle.rows.map((row) => {
        const rowPending = row.isLoading === true;

        return (
          <div key={row.key} className="anuncios-sell-popover__block">
            <div
              className={[
                "anuncios-sell-popover__line",
                row.key === "sale"
                  ? "anuncios-sell-popover__line--key anuncios-sell-popover__line--promo-sale"
                  : "",
                row.key === "fee-discount" ? "anuncios-sell-popover__line--fee-discount-pi" : "",
                row.total === true ? "anuncios-sell-popover__line--total anuncios-sell-popover__line--key" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-s7-revenue-row-key={row.key}
            >
              <span>{row.label}</span>
              <ValorFinanceiroDerivadoPi pending={rowPending}>
                {rowPending ? null : row.positive === true ? (
                  <span className="anuncios-sell-popover__value--positive">{row.value}</span>
                ) : row.total === true ? (
                  <strong>{row.value}</strong>
                ) : (
                  row.value
                )}
              </ValorFinanceiroDerivadoPi>
            </div>
            {!rowPending && (row.subtitle_label != null || row.subtitle_value != null) ? (
              <div className="anuncios-sell-popover__muted" data-s7-revenue-row-subtitle={row.key}>
                {[row.subtitle_label, row.subtitle_value].filter(Boolean).join(" ")}
              </div>
            ) : null}
          </div>
        );
      })}

      {isDev ? (
        <div
          className="anuncios-sell-popover__block anuncios-sell-popover__pi-promo-debug"
          data-s7-promo-debug="true"
        >
          <pre className="anuncios-sell-popover__pi-promo-debug-text">
            {`S7 DEBUG PROMO:\nversion=${PI_PROMO_PARITY_RENDER_VERSION}\nmodel=${model}\nlistingType=${contract.listing_type_id ?? "—"}\ncommission=${contract.commission_percent ?? "—"}\nofficialReceive=${off.receive_brl ?? "—"}\ncardReceive=${contract.receive_brl ?? "—"}\nnetFee=${contract.net_fee_brl ?? "—"}\nshipping=${contract.shipping_brl ?? "—"}\nfeeDiscount=${contract.fee_discount_brl ?? "0.00"}\nsource=${contract.sources?.receive ?? "financial_contract_incomplete"}\nparityWarnings=${(contract.warnings ?? []).join(",") || "none"}\ncomponent=${COMPONENT_NAME}`}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export { PI_PROMO_PARITY_RENDER_VERSION, COMPONENT_NAME as PROMOTION_PI_REVENUE_COMPONENT_NAME };
