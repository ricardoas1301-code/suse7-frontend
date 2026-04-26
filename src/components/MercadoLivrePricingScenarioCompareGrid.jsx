// ======================================================
// Modal Precificação / Raio-x — grade responsiva de cenários ML.
// Sem cálculo financeiro; ordenação via shared puro.
// ======================================================

import { useMemo } from "react";
import {
  MercadoLivrePricingScenarioInternalAndResultSection,
  MercadoLivrePricingScenarioRevenueSection,
  resolveMlScenarioTabId,
} from "./MercadoLivrePricingScenarioRaiox.jsx";
import {
  buildOrderedScenarioRows,
  cardHeadingLabel,
  resolveRaioxBaselineListingStatusBadge,
  resolveRaioxCardVigenciaLine,
  resolveRaioxListingBadge,
  resolveSaleXrayArticleKey,
  saleXrayListingHintFromScenarios,
  shouldSaleXrayDebugTrace,
  shouldSaleXrayVigenciaAuditTrace,
} from "./mercadoLivrePricingScenarioCompareShared.js";

/**
 * Um card do comparativo (reutilizado na grade e na página Precificação Inteligente).
 *
 * @param {{
 *   scenario: unknown;
 *   group: string;
 *   baselineHeadingOverride?: string | null;
 *   hideBreakEvenInResult?: boolean;
 *   showBaselineListingStatusBadge?: boolean;
 *   resultProfitLineLabel?: string | null;
 *   listingHintForAudit?: string;
 *   scheduledPromoBadgeAsAvailable?: boolean;
 *   baselineListingSaleDisplayOverride?: string | null;
 * }} props
 */
export function MercadoLivrePricingScenarioCompareCard({
  scenario,
  group,
  baselineHeadingOverride = null,
  hideBreakEvenInResult = false,
  showBaselineListingStatusBadge = false,
  resultProfitLineLabel = null,
  listingHintForAudit = "",
  scheduledPromoBadgeAsAvailable = false,
  baselineListingSaleDisplayOverride = null,
}) {
  const badgeInfo = resolveRaioxListingBadge(scenario);
  const res =
    /** @type {Record<string, unknown>} */ (scenario).result != null &&
    typeof /** @type {Record<string, unknown>} */ (scenario).result === "object"
      ? /** @type {Record<string, unknown>} */ (
          /** @type {Record<string, unknown>} */ (scenario).result
        )
      : null;
  const profitRaw = res?.profit_brl != null ? String(res.profit_brl).trim() : "";
  const vigenciaResolved = resolveRaioxCardVigenciaLine(scenario);
  if (group !== "baseline" && shouldSaleXrayVigenciaAuditTrace(listingHintForAudit)) {
    console.info("[SALE_XRAY_VIGENCIA_CARD]", {
      listing: listingHintForAudit || null,
      ...vigenciaResolved.audit,
    });
  }
  const vigenciaLine = group === "baseline" ? null : vigenciaResolved.line;
  const baselineAdStatus =
    group === "baseline" && showBaselineListingStatusBadge
      ? resolveRaioxBaselineListingStatusBadge(scenario)
      : null;

  const cardClass = [
    "s7-ml-scenario-compare__card",
    group === "baseline" ? "s7-ml-scenario-compare__card--baseline" : "",
    group === "participating" ? "s7-ml-scenario-compare__card--participating" : "",
    group === "available" ? "s7-ml-scenario-compare__card--available" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const participatingBadgeLabelRaw =
    badgeInfo.label != null && String(badgeInfo.label).trim() !== ""
      ? String(badgeInfo.label).trim()
      : "";
  const participatingBadgeLabelLc = participatingBadgeLabelRaw.toLowerCase();
  const participatingBadgeLooksScheduled =
    participatingBadgeLabelLc.includes("program") || participatingBadgeLabelLc.includes("agend");
  const participatingBadgeClass =
    scheduledPromoBadgeAsAvailable && group === "participating" && participatingBadgeLooksScheduled
      ? "s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available"
      : "s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--participating";
  const participatingBadgeText =
    participatingBadgeLabelRaw !== "" ? participatingBadgeLabelRaw : "Ativa";

  return (
    <article
      className={cardClass}
      data-scenario-key={resolveMlScenarioTabId(scenario) || "baseline"}
      data-scenario-ux-group={group}
      data-profit-brl={profitRaw !== "" ? profitRaw : undefined}
    >
      <header className="s7-ml-scenario-compare__card-head">
        <div className="s7-ml-scenario-compare__card-head-line">
          <div className="s7-ml-scenario-compare__card-title-stack">
            <span className="s7-ml-scenario-compare__card-title">
              {group === "baseline" &&
              baselineHeadingOverride != null &&
              String(baselineHeadingOverride).trim() !== ""
                ? String(baselineHeadingOverride).trim()
                : cardHeadingLabel(scenario)}
            </span>
            {baselineAdStatus ? (
              <span className="s7-ml-scenario-compare__card-vigencia s7-ml-scenario-compare__card-vigencia--baseline-badge">
                <span
                  className={
                    baselineAdStatus.badgeClass === "participating"
                      ? "s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--participating"
                      : "s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available"
                  }
                >
                  {baselineAdStatus.label}
                </span>
              </span>
            ) : vigenciaLine ? (
              <span className="s7-ml-scenario-compare__card-vigencia">{vigenciaLine}</span>
            ) : null}
          </div>
          {group === "participating" ? (
            <span className={participatingBadgeClass}>{participatingBadgeText}</span>
          ) : null}
          {group === "available" ? (
            <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available">
              {badgeInfo.label != null && String(badgeInfo.label).trim() !== "" ? badgeInfo.label : "Disponível"}
            </span>
          ) : null}
        </div>
      </header>
      <div className="s7-ml-scenario-compare__card-body">
        <MercadoLivrePricingScenarioRevenueSection
          scenario={scenario}
          showSubsidy={false}
          showShippingSubsidyMlLine={false}
          baselineListingSaleDisplayOverride={baselineListingSaleDisplayOverride}
        />
        <MercadoLivrePricingScenarioInternalAndResultSection
          scenario={scenario}
          hideBreakEvenRow={hideBreakEvenInResult}
          profitLineLabel={resultProfitLineLabel}
        />
      </div>
    </article>
  );
}

/**
 * @param {{
 *   scenarios: unknown[];
 *   baselineHeadingOverride?: string | null;
 *   hideBreakEvenInResult?: boolean;
 *   showBaselineListingStatusBadge?: boolean;
 *   resultProfitLineLabel?: string | null;
 * }} props
 * Props extras: só modal Raio-x venda (Anúncios), via `ComparePanel`.
 */
export function MercadoLivrePricingScenarioCompareGrid({
  scenarios,
  baselineHeadingOverride = null,
  hideBreakEvenInResult = false,
  showBaselineListingStatusBadge = false,
  resultProfitLineLabel = null,
}) {
  const listingHintForAudit = saleXrayListingHintFromScenarios(scenarios);
  const rows = useMemo(() => {
    const built = buildOrderedScenarioRows(scenarios);
    if (shouldSaleXrayDebugTrace(scenarios)) {
      console.info("[SALE_XRAY_DEBUG][RENDER_INPUT]", {
        total_cards: built.length,
        cards: built.map(({ scenario: card }) => {
          const c = card && typeof card === "object" ? /** @type {Record<string, unknown>} */ (card) : {};
          const sx = c.sale_xray_pricing != null && typeof c.sale_xray_pricing === "object" ? /** @type {Record<string, unknown>} */ (c.sale_xray_pricing) : null;
          const pr = c.pricing != null && typeof c.pricing === "object" ? /** @type {Record<string, unknown>} */ (c.pricing) : null;
          return {
            scenario_key: c.scenario_key ?? c.scenario_id ?? null,
            scenario_type: c.scenario_type ?? null,
            ux_group: c._sale_xray_ux_group != null ? String(c._sale_xray_ux_group) : null,
            promotion_name: c.promotion_name ?? null,
            subsidy_text: sx?.subsidy_text ?? pr?.subsidy_text ?? c._sale_xray_subsidy_text ?? null,
          };
        }),
      });
    }
    return built;
  }, [scenarios]);

  /** Base + promoções: no máximo 4 cards por linha no Raio-x / precificação. */
  const colsPerRow = Math.min(4, Math.max(1, rows.length));

  return (
    <div
      className="s7-ml-scenario-compare"
      data-s7-chart-hook="ml-scenario-compare"
      role="region"
      aria-label="Comparativo de cenários Mercado Livre"
    >
      <div
        className="s7-ml-scenario-compare__grid s7-ml-scenario-compare__grid--comfortable"
        style={
          /** @type {import("react").CSSProperties} */
          ({ "--raiox-ml-compare-cols": colsPerRow })
        }
      >
        {rows.map(({ scenario, group }, rowIndex) => (
          <MercadoLivrePricingScenarioCompareCard
            key={resolveSaleXrayArticleKey(scenario, rowIndex)}
            scenario={scenario}
            group={group}
            baselineHeadingOverride={baselineHeadingOverride}
            hideBreakEvenInResult={hideBreakEvenInResult}
            showBaselineListingStatusBadge={showBaselineListingStatusBadge}
            resultProfitLineLabel={resultProfitLineLabel}
            listingHintForAudit={listingHintForAudit}
          />
        ))}
      </div>
    </div>
  );
}
