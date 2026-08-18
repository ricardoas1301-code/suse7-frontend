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
import { buildPromotionCardViewModel } from "../features/pricing/promotions/buildPromotionMarketplaceRevenueViewModel.js";
import { PricingScenarioContingencySection } from "./pricing/PricingScenarioContingencySection.jsx";
import { PromotionCardManualPriceProvenanceFooter } from "./pricing/PromotionCardManualPriceProvenanceFooter.jsx";
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
 *   baselineListingTypeBadge?: string | null; // ex.: CLÁSSICO / PREMIUM (pill ML após "Anúncio")
 *   hideBreakEvenInResult?: boolean;
 *   showBaselineListingStatusBadge?: boolean;
 *   resultProfitLineLabel?: string | null;
 *   listingHintForAudit?: string;
 *   scheduledPromoBadgeAsAvailable?: boolean;
 *   baselineListingSaleDisplayOverride?: string | null;
 *   inlineEditSale?: {
 *     displayValue: string;
 *     onCommit: (raw: string) => void;
 *   } | null;
 *   inlineEditMargin?: {
 *     displayValue: string;
 *     onCommit: (raw: string) => void;
 *   } | null;
 *   contingencyLines?: { label: string; subtitlePct?: string | null; amountBrl: string }[];
 *   strategicReserveLines?: { label: string; subtitlePct?: string | null; amountBrl: string }[];
 *   listingUnitSaleDisplayOverride?: string | null;
 *   listingTypeSelectionBadge?: "Vendendo" | "Alternativa" | null;
 *   cardFooterNotice?: string | null;
 *   exibirRodapePrecoManualPromocao?: boolean;
 *   layoutPiFixo?: boolean;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 *   promocaoNomeExibicao?: string | null;
 *   exibirReservaEstrategica?: boolean;
 *   layoutCabecalhoPromocaoPi?: boolean;
 *   forcarLinhaDescontoSellerPromocao?: boolean;
 *   descontoSellerPromocaoExibicao?: string | null;
 *   promocaoPrecoOriginalExibicao?: string | null;
 *   promocaoSubsidiMlExibicao?: string | null;
 *   financialScenarioPending?: boolean;
 *   selectedPromotion?: unknown;
 *   promocaoSelecionada?: unknown;
 *   financialSnapshot?: unknown;
 *   listingTypeCard?: string | null;
 *   promocaoCardViewModel?: {
 *     revenue?: Record<string, unknown> | null;
 *     profit_brl?: string | null;
 *     margin_pct?: string | null;
 *     offer_status_semantic?: string | null;
 *     health_status?: string | null;
 *     auditPayload?: Record<string, unknown>;
 *   } | null;
 * }} props
 */
export function MercadoLivrePricingScenarioCompareCard({
  scenario,
  group,
  baselineHeadingOverride = null,
  baselineListingTypeBadge = null,
  hideBreakEvenInResult = false,
  showBaselineListingStatusBadge = false,
  resultProfitLineLabel = null,
  listingHintForAudit = "",
  scheduledPromoBadgeAsAvailable = false,
  baselineListingSaleDisplayOverride = null,
  inlineEditSale = null,
  inlineEditMargin = null,
  salePriceEditControl = null,
  contingencyLines = [],
  strategicReserveLines = [],
  listingUnitSaleDisplayOverride = null,
  listingTypeSelectionBadge = null,
  cardFooterNotice = null,
  exibirRodapePrecoManualPromocao = false,
  layoutPiFixo = false,
  promocaoPrecoVendaExibicaoOverride = null,
  promocaoNomeExibicao = null,
  exibirReservaEstrategica = true,
  layoutCabecalhoPromocaoPi = false,
  forcarLinhaDescontoSellerPromocao = false,
  descontoSellerPromocaoExibicao = null,
  promocaoPrecoOriginalExibicao = null,
  financialScenarioPending = false,
  selectedPromotion = null,
  promocaoSelecionada = null,
  promotionFeeDiscountBrl = null,
  snapshotFeeDiscountBrl = null,
  promotionOfficialAmountToReceiveBrl = null,
  promotionRevenueSource = null,
  promotionSelectedKey = null,
  promotionSnapshot = null,
  officialRowContract = null,
  comparisonModel = null,
  isCurrentListingType = false,
  selectedPromotionRequestId = null,
  listingTypeCard = null,
  promocaoCardViewModel: promocaoCardViewModelIn = null,
}) {
  const selectedPromotionEffective = selectedPromotion ?? promocaoSelecionada;

  const promocaoCardViewModelBuilt = useMemo(() => {
    if (promocaoCardViewModelIn != null) return null;
    if (
      !layoutCabecalhoPromocaoPi ||
      selectedPromotionEffective == null ||
      scenario == null ||
      typeof scenario !== "object"
    ) {
      return null;
    }
    const scenarioRec = /** @type {Record<string, unknown>} */ (scenario);
    if (scenarioRec.is_baseline === true) return null;
    return buildPromotionCardViewModel({
      selectedPromotion: selectedPromotionEffective,
      scenario,
      listingType: listingTypeCard,
      listingExternalId: listingHintForAudit || null,
      promocaoPrecoVendaExibicaoOverride,
      componentName: "MercadoLivrePricingScenarioCompareCard",
      renderPhase: financialScenarioPending ? "loading" : "final",
    });
  }, [
    promocaoCardViewModelIn,
    layoutCabecalhoPromocaoPi,
    selectedPromotionEffective,
    scenario,
    listingTypeCard,
    listingHintForAudit,
    promocaoPrecoVendaExibicaoOverride,
    financialScenarioPending,
  ]);

  const promocaoCardViewModel = promocaoCardViewModelIn ?? promocaoCardViewModelBuilt;

  if (scenario == null || typeof scenario !== "object") {
    return (
      <article className="s7-ml-scenario-compare__card" role="status">
        <p className="anuncios-sell-popover__muted">Cenário indisponível para exibição.</p>
      </article>
    );
  }

  const badgeInfo = resolveRaioxListingBadge(scenario);
  const scenarioRec = /** @type {Record<string, unknown>} */ (scenario);

  const res =
    scenarioRec.result != null && typeof scenarioRec.result === "object"
      ? /** @type {Record<string, unknown>} */ (scenarioRec.result)
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

  const listingTypeBadgeRaw =
    baselineListingTypeBadge != null ? String(baselineListingTypeBadge).trim() : "";
  const listingTypeSelectionRaw =
    listingTypeSelectionBadge === "Vendendo" || listingTypeSelectionBadge === "Alternativa"
      ? listingTypeSelectionBadge
      : "";
  const listingTypeSelectionClass =
    listingTypeSelectionBadge === "Alternativa"
      ? "pricing-intelligence-page__listing-type-selection-pill--alternativa"
      : "pricing-intelligence-page__listing-type-selection-pill--vendendo";
  const showListingTypeBadgeTitle = listingTypeBadgeRaw !== "";

  const statusPromoRotulo =
    group === "participating"
      ? participatingBadgeText
      : badgeInfo.label != null && String(badgeInfo.label).trim() !== ""
        ? String(badgeInfo.label).trim()
        : "Disponível";
  const linhaStatusVigenciaPromo =
    layoutCabecalhoPromocaoPi && group !== "baseline" && !baselineAdStatus
      ? `${statusPromoRotulo.toLocaleUpperCase("pt-BR")} · ${
          vigenciaLine != null && String(vigenciaLine).trim() !== ""
            ? String(vigenciaLine).trim()
            : "Sem data informada"
        }`
      : null;

  const cardTitleNode = showListingTypeBadgeTitle ? (
    <>
      <span className="s7-ml-scenario-compare__card-title-prefix">Anúncio</span>
      <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available pricing-intelligence-page__listing-type-pill">
        {listingTypeBadgeRaw}
      </span>
      {listingTypeSelectionRaw !== "" ? (
        <span
          className={[
            "s7-ml-scenario-compare__badge",
            "pricing-intelligence-page__listing-type-selection-pill",
            listingTypeSelectionClass,
          ].join(" ")}
        >
          {listingTypeSelectionRaw}
        </span>
      ) : null}
    </>
  ) : group === "baseline" &&
    baselineHeadingOverride != null &&
    String(baselineHeadingOverride).trim() !== "" ? (
    String(baselineHeadingOverride).trim()
  ) : (
    cardHeadingLabel(scenario)
  );

  return (
    <article
      className={cardClass}
      data-scenario-key={resolveMlScenarioTabId(scenario) || "baseline"}
      data-scenario-ux-group={group}
      data-profit-brl={profitRaw !== "" ? profitRaw : undefined}
    >
      <header
        className={[
          "s7-ml-scenario-compare__card-head",
          layoutCabecalhoPromocaoPi ? "s7-ml-scenario-compare__card-head--promo-pi" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={[
            "s7-ml-scenario-compare__card-head-line",
            layoutCabecalhoPromocaoPi ? "s7-ml-scenario-compare__card-head-line--promo-pi" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="s7-ml-scenario-compare__card-title-stack">
            <span
              className={[
                "s7-ml-scenario-compare__card-title",
                showListingTypeBadgeTitle ? "s7-ml-scenario-compare__card-title--listing-type" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {cardTitleNode}
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
            ) : layoutCabecalhoPromocaoPi && linhaStatusVigenciaPromo ? (
              <span className="s7-ml-scenario-compare__card-vigencia s7-ml-scenario-compare__card-vigencia--promo-status">
                {linhaStatusVigenciaPromo}
              </span>
            ) : !layoutCabecalhoPromocaoPi && vigenciaLine ? (
              <span className="s7-ml-scenario-compare__card-vigencia">{vigenciaLine}</span>
            ) : null}
            {layoutCabecalhoPromocaoPi &&
            promocaoNomeExibicao != null &&
            String(promocaoNomeExibicao).trim() !== "" ? (
              <div className="s7-ml-scenario-compare__card-promo-pi-row">
                <span className="s7-ml-scenario-compare__card-promotion-name">
                  {String(promocaoNomeExibicao).trim()}
                </span>
                {promocaoPrecoOriginalExibicao != null &&
                String(promocaoPrecoOriginalExibicao).trim() !== "" ? (
                  <span className="s7-ml-scenario-compare__card-original-price">
                    {String(promocaoPrecoOriginalExibicao).trim()}
                  </span>
                ) : null}
              </div>
            ) : !layoutCabecalhoPromocaoPi &&
              promocaoNomeExibicao != null &&
              String(promocaoNomeExibicao).trim() !== "" ? (
              <span className="s7-ml-scenario-compare__card-promotion-name">{String(promocaoNomeExibicao).trim()}</span>
            ) : null}
          </div>
          {!layoutCabecalhoPromocaoPi && group === "participating" ? (
            <span className={participatingBadgeClass}>{participatingBadgeText}</span>
          ) : null}
          {!layoutCabecalhoPromocaoPi && group === "available" ? (
            <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available">
              {badgeInfo.label != null && String(badgeInfo.label).trim() !== "" ? badgeInfo.label : "Disponível"}
            </span>
          ) : null}
        </div>
      </header>
      <div
        className={[
          "s7-ml-scenario-compare__card-body",
          layoutPiFixo ? "s7-ml-scenario-compare__card-body--pi-layout-fixo" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <MercadoLivrePricingScenarioRevenueSection
          scenario={scenario}
          showSubsidy={false}
          showShippingSubsidyMlLine={false}
          baselineListingSaleDisplayOverride={
            inlineEditSale != null || salePriceEditControl != null
              ? null
              : baselineListingSaleDisplayOverride
          }
          listingUnitSaleDisplayOverride={listingUnitSaleDisplayOverride}
          inlineEditSale={inlineEditSale}
          salePriceEditControl={salePriceEditControl}
          promocaoPrecoVendaExibicaoOverride={promocaoPrecoVendaExibicaoOverride}
          forcarLinhaDescontoSellerPromocao={forcarLinhaDescontoSellerPromocao}
          descontoSellerPromocaoExibicao={descontoSellerPromocaoExibicao}
          ocultarDescontoPromocaoReceitaMarketplace={layoutCabecalhoPromocaoPi}
          financialScenarioPending={financialScenarioPending}
          layoutReceitaPiPromocoes={layoutCabecalhoPromocaoPi}
          promocaoCardViewModel={promocaoCardViewModel}
          promotionFeeDiscountBrl={promotionFeeDiscountBrl}
          snapshotFeeDiscountBrl={snapshotFeeDiscountBrl}
          promotionOfficialAmountToReceiveBrl={promotionOfficialAmountToReceiveBrl}
          promotionRevenueSource={promotionRevenueSource}
          promotionSelectedKey={promotionSelectedKey}
          promotionSnapshot={promotionSnapshot}
          officialRowContract={officialRowContract}
          comparisonModel={comparisonModel}
          isCurrentListingType={isCurrentListingType}
          selectedPromotionRequestId={selectedPromotionRequestId}
          listingTypeCard={listingTypeCard}
          listingExternalId={listingHintForAudit || null}
        />
        {exibirReservaEstrategica !== false &&
        (layoutPiFixo || (Array.isArray(strategicReserveLines) && strategicReserveLines.length > 0)) ? (
          <PricingScenarioContingencySection
            title="Reserva estratégica"
            lines={strategicReserveLines}
            sectionClassName="anuncios-sell-popover__section--strategic-reserve"
            financialScenarioPending={financialScenarioPending}
          />
        ) : null}
        {layoutPiFixo || (Array.isArray(contingencyLines) && contingencyLines.length > 0) ? (
          <PricingScenarioContingencySection
            lines={contingencyLines}
            financialScenarioPending={financialScenarioPending}
          />
        ) : null}
        <MercadoLivrePricingScenarioInternalAndResultSection
          scenario={scenario}
          hideBreakEvenRow={hideBreakEvenInResult}
          profitLineLabel={resultProfitLineLabel}
          inlineEditMargin={inlineEditMargin}
          layoutPiFixo={layoutPiFixo}
          financialScenarioPending={financialScenarioPending}
          promocaoCardViewModel={promocaoCardViewModel}
        />
        {layoutCabecalhoPromocaoPi ? (
          <PromotionCardManualPriceProvenanceFooter visible={exibirRodapePrecoManualPromocao === true} />
        ) : null}
      </div>
      {cardFooterNotice != null && String(cardFooterNotice).trim() !== "" ? (
        <p className="pricing-listing-type-compare__card-footnote anuncios-sell-popover__muted" role="note">
          {cardFooterNotice}
        </p>
      ) : null}
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
