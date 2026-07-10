// ======================================================
// Raio-x / Precificação — blocos por cenário (baseline + promoções ML).
// Valores apenas como strings da API (sem cálculo de dinheiro no JSX).
// ======================================================

import { useEffect, useId, useMemo, useState } from "react";
import { formatCatalogBRL } from "../utils/productCatalogRow";
import { PricingInlineEditableMetric } from "./pricing/PricingInlineEditableMetric.jsx";
import {
  ROTULO_LUCRO_RESULTADO,
  TOOLTIP_LUCRO_MARGEM_CONTRIBUICAO,
} from "./pricing/pricingLucroMargemContribuicaoUi.js";
import { PricingScenarioSalePriceControl } from "./pricing/PricingScenarioSalePriceControl.jsx";
import { PricingScenarioMetricValue } from "./pricing/PricingScenarioMetricValue.jsx";
import { PromotionPiRevenueMarketplaceSection } from "./pricing/PromotionPiRevenueMarketplaceSection.jsx";
import { obterAjustesFinanceirosPromocao } from "../features/pricing/promotions/aplicarReducaoTarifaPromocaoNoCenario.js";
import {
  buildPromotionCardViewModel,
  logPromotionCardRenderViewModel,
} from "../features/pricing/promotions/buildPromotionMarketplaceRevenueViewModel.js";
import {
  calcularReceitaPiPromocaoRenderFinal,
  logPromotionRevenueSectionFinalFromSnapshot,
} from "../features/pricing/promotions/calcularReceitaPiPromocaoRenderFinal.js";
import S7Icon from "./ui/S7Icon";
import S7Tooltip from "./ui/S7Tooltip";
import {
  cardHeadingLabel,
  getOfferStatusFromMargin,
  logSaleXrayPayoutPickInRender,
  offerSemanticSuffixToCssClass,
  pickPricingShippingCostContext,
  pickSaleXrayShippingRawString,
  resolveVoceRecebeExibicaoRaw,
  shouldSaleXrayShippingAuditTrace,
} from "./mercadoLivrePricingScenarioCompareShared.js";
import { logPiPromoFlowAudit } from "./pricing/piPromoFlowAudit.js";
import {
  formatarPercentualPromocaoPtBr,
  normalizarPercentualPromocaoExibicao,
  parsePercentualPromocaoApiDecimal,
} from "./pricing/pricingPromotionMiniCardUi.js";

const DASH = "—";

/**
 * @param {{ pending: boolean; className?: string; children: import("react").ReactNode }} props
 */
function ValorFinanceiroDerivado({ pending, className, children }) {
  return (
    <PricingScenarioMetricValue pending={pending} className={className}>
      {children}
    </PricingScenarioMetricValue>
  );
}

/**
 * Rótulo "Lucro" com tooltip opcional (margem de contribuição).
 * @param {{ label: string; tooltip?: string | null }} props
 */
function RotuloLucroResultado({ label, tooltip = null }) {
  const texto = label != null && String(label).trim() !== "" ? String(label).trim() : ROTULO_LUCRO_RESULTADO;
  if (tooltip == null || String(tooltip).trim() === "") {
    return texto;
  }

  return (
    <span className="anuncios-sell-popover__status-line-head">
      <span className="anuncios-sell-popover__status-line-label">{texto}</span>
      <S7Tooltip content={tooltip} placement="top-start" offset={6} wrap>
        <button
          type="button"
          className="anuncios-sell-popover__status-tip"
          aria-label={`Sobre ${texto}`}
        >
          <S7Icon name="info" size={12} strokeWidth={2} />
        </button>
      </S7Tooltip>
    </span>
  );
}

/**
 * Chave estável do cenário (scenario_id da API, com fallbacks) — tabs e `data-scenario-key`.
 * Evita `String(undefined) === "undefined"` e divergência com `key` / `promotion_id`.
 * @param {unknown} s
 * @returns {string}
 */
export function resolveMlScenarioTabId(s) {
  if (!s || typeof s !== "object") return "";
  const rec = /** @type {Record<string, unknown>} */ (s);
  const sid = rec.scenario_id != null ? String(rec.scenario_id).trim() : "";
  if (sid !== "" && sid !== "undefined") return sid;
  const pid = rec.promotion_id != null ? String(rec.promotion_id).trim() : "";
  if (pid !== "") return pid;
  const k = rec.key != null ? String(rec.key).trim() : "";
  if (k.startsWith("ml:promotion:")) return k.slice("ml:promotion:".length);
  if (k !== "" && k !== "base") return k;
  return "";
}
const ML_SHIPPING_TITLE = "Custo de envio";

/** @param {string | null | undefined} s */
function formatBrlFromApiString(s) {
  if (s == null || s === "") return DASH;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return formatCatalogBRL(n);
}

/** Tarifa/frete — negativo como no Raio-x legado. */
function formatNegativeBrlFromApiString(s) {
  if (s == null || s === "") return null;
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n) || n === 0) return null;
  return `-${formatCatalogBRL(Math.abs(n))}`;
}

/** Custos internos no layout PI — sempre negativo na exibição. */
function formatCustoInternoPiDisplay(raw) {
  if (raw == null || String(raw).trim() === "") return DASH;
  const limpo = String(raw).trim().replace(/^-/, "");
  return formatNegativeBrlFromApiString(limpo) ?? DASH;
}

/** @param {string | null | undefined} pct */
function formatCommissionPctForModal(pct) {
  if (pct == null || pct === "") return null;
  const n = Number(String(pct).trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * @param {{ listingTypeLabel?: string | null; saleFeePercent?: string | null }} m
 */
/** @param {string | null | undefined} ctx */
function shippingContextDisplayLabel(ctx) {
  if (ctx == null || String(ctx).trim() === "") return null;
  const s = String(ctx).trim().toLowerCase();
  if (s === "free_for_buyer") return "Grátis para o comprador";
  if (s === "buyer_pays") return "Por conta do comprador";
  return null;
}

function buildTariffSubtitleFromScenarioMarketplace(m) {
  const label =
    m.listingTypeLabel != null && String(m.listingTypeLabel).trim() !== ""
      ? String(m.listingTypeLabel).trim()
      : null;
  const pct = formatCommissionPctForModal(m.saleFeePercent);
  if (label && pct) return `${label} ${pct}`;
  if (label) return `${label} ${DASH}`;
  if (pct) return pct;
  return null;
}

/** @param {{ sellerDiscountPercent?: string | null }} m */
function buildSellerDiscountSubtitleFromMarketplace(m) {
  if (m.sellerDiscountPercent == null || String(m.sellerDiscountPercent).trim() === "") return null;
  const raw = String(m.sellerDiscountPercent).trim();
  if (raw.toLowerCase().startsWith("desconto ")) return raw;
  const parsed = parsePercentualPromocaoApiDecimal(raw);
  if (parsed == null) return null;
  const normalizado = normalizarPercentualPromocaoExibicao(parsed);
  return `Desconto ${formatarPercentualPromocaoPtBr(normalizado)}%`;
}

/**
 * Converte string monetária pt-BR da API em número (fallback leve; valores vêm do backend).
 * @param {string | null | undefined} s
 */
function brlApiStringToNumber(s) {
  if (s == null || String(s).trim() === "") return NaN;
  const t = String(s)
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Number(t);
}

/**
 * Descompacta o texto do backend (`buildDiscountBlock`: `R$ X,XX (Y,YY%)`) — só exibição.
 *
 * @param {string | null | undefined} discountText
 * @returns {{
 *   discountMoneyFormatted: string;
 *   pctRounded: number | null;
 *   discountAmountRaw: string;
 * } | null}
 */
function parseSaleXrayDiscountTextForDisplay(discountText) {
  if (discountText == null || String(discountText).trim() === "") return null;
  const s = String(discountText).trim();
  const m = s.match(/^R\$\s*([\d.,]+)\s*\(\s*([\d.,]+)\s*%\)\s*$/);
  if (!m) return null;
  const pctNum = Number(String(m[2]).replace(",", "."));
  const pctRounded = Number.isFinite(pctNum) ? Math.round(pctNum) : null;
  const discountMoneyFormatted = formatBrlFromApiString(String(m[1]));
  return {
    discountMoneyFormatted,
    pctRounded,
    discountAmountRaw: String(m[1]),
    /** Legado / fallback de uma linha só */
    amountLine: `R$ ${m[1]}`,
    percentLine: pctRounded != null ? `${pctRounded}%` : `${m[2]}%`,
  };
}

/**
 * Conteúdo do tooltip de preço promocional (strings já vindas da API / formatação local).
 */
function MercadoLivrePromoPriceTooltipBody({ originalPriceDisplay, saleXrayDiscountDisplay, saleXrayDisc, sale }) {
  return (
    <div className="anuncios-raiox-promo-price-tip">
      {originalPriceDisplay != null ? (
        <div className="anuncios-raiox-promo-price-tip__row anuncios-raiox-promo-price-tip__row--split">
          <span className="anuncios-raiox-promo-price-tip__label">Valor de venda</span>
          <span className="anuncios-raiox-promo-price-tip__value">{originalPriceDisplay}</span>
        </div>
      ) : null}
      {saleXrayDiscountDisplay != null ? (
        <div className="anuncios-raiox-promo-price-tip__row anuncios-raiox-promo-price-tip__row--split">
          <span className="anuncios-raiox-promo-price-tip__label">
            Desconto na promoção
            {saleXrayDiscountDisplay.pctRounded != null ? ` (${saleXrayDiscountDisplay.pctRounded}%)` : ""}
          </span>
          <span className="anuncios-raiox-promo-price-tip__value">{saleXrayDiscountDisplay.discountMoneyFormatted}</span>
        </div>
      ) : saleXrayDisc != null ? (
        <div className="anuncios-raiox-promo-price-tip__row anuncios-raiox-promo-price-tip__row--split">
          <span className="anuncios-raiox-promo-price-tip__label">Desconto na promoção</span>
          <span className="anuncios-raiox-promo-price-tip__value">{saleXrayDisc}</span>
        </div>
      ) : null}
      <div className="anuncios-raiox-promo-price-tip__sep" role="separator" />
      <div className="anuncios-raiox-promo-price-tip__row anuncios-raiox-promo-price-tip__row--split anuncios-raiox-promo-price-tip__row--accent">
        <span className="anuncios-raiox-promo-price-tip__label">Valor de venda na promoção</span>
        <span className="anuncios-raiox-promo-price-tip__value">{sale}</span>
      </div>
    </div>
  );
}

/**
 * Rail vertical **externo** ao card: [ rail ] [ card ] — padrão SaaS (cenários ML).
 * @param {{ rail: import("react").ReactNode; children: import("react").ReactNode }} props
 */
export function MarketplaceScenarioRail({ rail, children }) {
  return (
    <div className="s7-scenario-rail-shell">
      <aside className="s7-scenario-rail-shell__rail">{rail}</aside>
      <div className="s7-scenario-rail-shell__card">{children}</div>
    </div>
  );
}

/** @deprecated Prefer `MarketplaceScenarioRail` — alias com API antiga (`tabs`). */
export function MercadoLivreScenarioTabsLayout({ tabs, children }) {
  return <MarketplaceScenarioRail rail={tabs}>{children}</MarketplaceScenarioRail>;
}

/**
 * Abas verticais à esquerda: baseline + 1 botão por promoção (`scenario_id` = chave React).
 * Estado normal: trilho estreito + ellipsis; hover: painel à esquerda com o nome completo.
 * @param {{
 *   scenarios: { scenario_id: string; promotion_name?: string | null }[];
 *   activeId: string;
 *   onChange: (id: string) => void;
 * }} props
 */
export function MercadoLivrePricingScenarioTabs({ scenarios, activeId, onChange }) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return null;
  const baselineLabel = "Sem promoção";
  return (
    <div
      className="anuncios-ml-scenarios-tabs anuncios-ml-scenarios-tabs--vertical anuncios-ml-scenarios-tabs--external"
      role="tablist"
      aria-label="Cenários de precificação"
    >
      <div className="anuncios-ml-scenarios-tabs__slot">
        <button
          type="button"
          role="tab"
          aria-selected={activeId === "baseline"}
          title={baselineLabel}
          className={
            activeId === "baseline"
              ? "anuncios-ml-scenarios-tabs__btn anuncios-ml-scenarios-tabs__btn--vertical anuncios-ml-scenarios-tabs__btn--active"
              : "anuncios-ml-scenarios-tabs__btn anuncios-ml-scenarios-tabs__btn--vertical"
          }
          onClick={() => onChange("baseline")}
        >
          <span className="anuncios-ml-scenarios-tabs__label">{baselineLabel}</span>
        </button>
        <span className="anuncios-ml-scenarios-tabs__flyout" aria-hidden>
          {baselineLabel}
        </span>
      </div>
      {scenarios.map((s) => {
        const id = String(s.scenario_id);
        const label = cardHeadingLabel(s) || id;
        const active = activeId === id;
        return (
          <div key={id} className="anuncios-ml-scenarios-tabs__slot">
            <button
              type="button"
              role="tab"
              aria-selected={active}
              title={label}
              className={
                active
                  ? "anuncios-ml-scenarios-tabs__btn anuncios-ml-scenarios-tabs__btn--vertical anuncios-ml-scenarios-tabs__btn--active"
                  : "anuncios-ml-scenarios-tabs__btn anuncios-ml-scenarios-tabs__btn--vertical"
              }
              onClick={() => onChange(id)}
            >
              <span className="anuncios-ml-scenarios-tabs__label">{label}</span>
            </button>
            <span className="anuncios-ml-scenarios-tabs__flyout" aria-hidden>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {{ scenario: Record<string, unknown> }} props
 */
export function MercadoLivrePricingScenarioSubsidyCollapsible({ scenario }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const sub = scenario?.subsidies;
  if (sub == null || typeof sub !== "object") return null;
  const s = /** @type {Record<string, unknown>} */ (sub);
  const fee = s.subsidy_fee_brl != null ? String(s.subsidy_fee_brl) : null;
  const ship = s.subsidy_shipping_brl != null ? String(s.subsidy_shipping_brl) : null;
  const tot = s.subsidy_total_brl != null ? String(s.subsidy_total_brl) : null;
  const promoMl = s.promotion_subsidy_ml_brl != null ? String(s.promotion_subsidy_ml_brl) : null;
  const sellerD = s.seller_discount_brl != null ? String(s.seller_discount_brl) : null;
  if (
    (fee == null || fee === "") &&
    (ship == null || ship === "") &&
    (tot == null || tot === "") &&
    (promoMl == null || promoMl === "") &&
    (sellerD == null || sellerD === "")
  ) {
    return null;
  }
  return (
    <div className="anuncios-ml-scenarios-subsidy">
      <button
        type="button"
        className="anuncios-ml-scenarios-subsidy__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        Subsídios vs. sem promoção {open ? "▼" : "▶"}
      </button>
      {open ? (
        <div id={panelId} className="anuncios-ml-scenarios-subsidy__panel">
          {fee != null && fee !== "" ? (
            <div className="anuncios-sell-popover__line">
              <span>Subsídio em tarifa (estim.)</span>
              <strong>{formatBrlFromApiString(fee)}</strong>
            </div>
          ) : null}
          {ship != null && ship !== "" ? (
            <div className="anuncios-sell-popover__line">
              <span>Subsídio em frete (estim.)</span>
              <strong>{formatBrlFromApiString(ship)}</strong>
            </div>
          ) : null}
          {tot != null && tot !== "" ? (
            <div className="anuncios-sell-popover__line">
              <span>Δ Repasse vs. baseline (estim.)</span>
              <strong>{formatBrlFromApiString(tot)}</strong>
            </div>
          ) : null}
          {promoMl != null && promoMl !== "" ? (
            <div className="anuncios-sell-popover__line">
              <span>Subsídio promocional ML (painel)</span>
              <strong>{formatBrlFromApiString(promoMl)}</strong>
            </div>
          ) : null}
          {sellerD != null && sellerD !== "" ? (
            <div className="anuncios-sell-popover__line">
              <span>Desconto seller (painel)</span>
              <strong>{formatBrlFromApiString(sellerD)}</strong>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function MercadoLivrePricingScenarioRevenueSection(props) {
  const {
    layoutReceitaPiPromocoes = false,
    scenario,
    financialScenarioPending = false,
    promocaoPrecoVendaExibicaoOverride = null,
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
    listingExternalId = null,
  } = props;

  if (
    layoutReceitaPiPromocoes === true &&
    scenario != null &&
    typeof scenario === "object" &&
    /** @type {Record<string, unknown>} */ (scenario).is_baseline !== true
  ) {
    const promoRec = /** @type {Record<string, unknown>} */ (scenario);
    return (
      <PromotionPiRevenueMarketplaceSection
        scenario={promoRec}
        financialScenarioPending={financialScenarioPending === true}
        promocaoPrecoVendaExibicaoOverride={promocaoPrecoVendaExibicaoOverride}
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
        listingExternalId={listingExternalId}
        promotionId={
          promoRec.promotion_id != null ? String(promoRec.promotion_id) : null
        }
        promotionName={
          promoRec.promotion_name != null
            ? String(promoRec.promotion_name)
            : promoRec.label != null
              ? String(promoRec.label)
              : null
        }
      />
    );
  }

  return <MercadoLivrePricingScenarioRevenueSectionLegacy {...props} />;
}

/**
 * Seção Receita do marketplace — legado (baseline, Raio-x, promoções fora do layout PI).
 * `baselineListingSaleDisplayOverride`: só exibição — alinha “Valor de venda” do baseline ao preço do catálogo (página Precificação).
 *
 * @param {{
 *   scenario: Record<string, unknown>;
 *   showSubsidy?: boolean;
 *   showShippingSubsidyMlLine?: boolean;
 *   baselineListingSaleDisplayOverride?: string | null;
 *   listingUnitSaleDisplayOverride?: string | null;
 *   inlineEditSale?: {
 *     displayValue: string;
 *     onCommit: (raw: string) => void;
 *   } | null;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 *   forcarLinhaDescontoSellerPromocao?: boolean;
 *   descontoSellerPromocaoExibicao?: string | null;
 *   ocultarDescontoPromocaoReceitaMarketplace?: boolean;
 *   financialScenarioPending?: boolean;
 *   layoutReceitaPiPromocoes?: boolean;
 *   selectedPromotion?: unknown;
 *   promocaoSelecionada?: unknown;
 *   financialSnapshot?: unknown;
 *   promotionFeeDiscountBrl?: string | null;
 *   promotionOfficialAmountToReceiveBrl?: string | null;
 *   promotionRevenueSource?: string | null;
 *   promotionSelectedKey?: string | null;
 *   listingTypeCard?: string | null;
 *   listingExternalId?: string | null;
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
function MercadoLivrePricingScenarioRevenueSectionLegacy({
  scenario,
  showSubsidy = true,
  showShippingSubsidyMlLine = true,
  baselineListingSaleDisplayOverride = null,
  listingUnitSaleDisplayOverride = null,
  inlineEditSale = null,
  salePriceEditControl = null,
  promocaoPrecoVendaExibicaoOverride = null,
  forcarLinhaDescontoSellerPromocao = false,
  descontoSellerPromocaoExibicao = null,
  ocultarDescontoPromocaoReceitaMarketplace = false,
  financialScenarioPending = false,
  layoutReceitaPiPromocoes = false,
  promocaoCardViewModel = null,
  selectedPromotion = null,
  promocaoSelecionada = null,
  financialSnapshot = null,
  listingTypeCard = null,
  listingExternalId = null,
}) {
  const finPend = financialScenarioPending === true;

  const selectedPromotionEffective = selectedPromotion ?? promocaoSelecionada;
  const temSnapshotFinanceiro =
    financialSnapshot != null &&
    typeof financialSnapshot === "object" &&
    /** @type {Record<string, unknown>} */ (financialSnapshot).has_snapshot === true;

  const promocaoCardViewModelResolved = useMemo(() => {
    if (promocaoCardViewModel != null) return promocaoCardViewModel;
    if (!layoutReceitaPiPromocoes || scenario.is_baseline === true) return null;
    if (selectedPromotionEffective == null) return null;
    return buildPromotionCardViewModel({
      selectedPromotion: selectedPromotionEffective,
      scenario,
      listingType: listingTypeCard,
      listingExternalId,
      promocaoPrecoVendaExibicaoOverride,
      componentName: "MercadoLivrePricingScenarioRevenueSection",
      renderPhase: finPend ? "loading" : "final",
    });
  }, [
    promocaoCardViewModel,
    layoutReceitaPiPromocoes,
    scenario,
    selectedPromotionEffective,
    listingTypeCard,
    listingExternalId,
    promocaoPrecoVendaExibicaoOverride,
    finPend,
  ]);

  const receitaPiAtiva = layoutReceitaPiPromocoes === true && scenario.is_baseline !== true;

  const piRenderFinal = useMemo(() => {
    if (!receitaPiAtiva) return null;
    return calcularReceitaPiPromocaoRenderFinal({
      selectedPromotion: temSnapshotFinanceiro ? null : selectedPromotionEffective,
      financialSnapshot,
      scenario,
      listingType: listingTypeCard,
      listingExternalId,
      promocaoPrecoVendaExibicaoOverride,
    });
  }, [
    receitaPiAtiva,
    temSnapshotFinanceiro,
    selectedPromotionEffective,
    financialSnapshot,
    scenario,
    listingTypeCard,
    listingExternalId,
    promocaoPrecoVendaExibicaoOverride,
  ]);

  useEffect(() => {
    if (!receitaPiAtiva || finPend || piRenderFinal == null) return;
    logPromotionRevenueSectionFinalFromSnapshot(piRenderFinal);
  }, [receitaPiAtiva, finPend, piRenderFinal]);

  useEffect(() => {
    if (promocaoCardViewModelResolved?.auditPayload == null) return;
    if (finPend) return;
    logPromotionCardRenderViewModel(promocaoCardViewModelResolved.auditPayload);
  }, [promocaoCardViewModelResolved, finPend]);

  const receitaVm = promocaoCardViewModelResolved?.revenue ?? null;
  const m =
    scenario.marketplace != null && typeof scenario.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.marketplace)
      : {};
  const sx =
    scenario.sale_xray_pricing != null && typeof scenario.sale_xray_pricing === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.sale_xray_pricing)
      : null;
  const prFlat =
    scenario.pricing != null && typeof scenario.pricing === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.pricing)
      : null;
  const saleXraySimple =
    String(m.marketplace_payout_source ?? "").trim() === "suse7_sale_xray_simple" ||
    prFlat?.sale_xray_simple_financials === true ||
    (sx != null && sx.sale_xray_simple_financials === true);
  const hasFeeSubsidy =
    scenario.is_baseline !== true &&
    (sx?.has_fee_subsidy === true || prFlat?.has_fee_subsidy === true || m.has_fee_subsidy === true);

  const hasBillingTariffContract =
    sx != null &&
    sx.charged_fee_gross_brl != null &&
    String(sx.charged_fee_gross_brl).trim() !== "" &&
    sx.charged_fee_net_brl != null &&
    String(sx.charged_fee_net_brl).trim() !== "";
  const hasSuse7PreviewTariff =
    scenario.is_baseline !== true &&
    !hasBillingTariffContract &&
    m.preview_is_estimated === true &&
    m.preview_fee_gross_brl != null &&
    String(m.preview_fee_gross_brl).trim() !== "";
  const suse7ReductionNum = (() => {
    if (!hasSuse7PreviewTariff || m.preview_fee_reduction_brl == null) return 0;
    const n = Number(String(m.preview_fee_reduction_brl).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  })();
  const showSuse7TariffReduction = suse7ReductionNum > 0.0005;
  const tariffReductionNum = (() => {
    if (!hasBillingTariffContract || sx?.charged_fee_reduction_brl == null) return 0;
    const n = Number(String(sx.charged_fee_reduction_brl).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  })();
  const showBillingTariffReduction = tariffReductionNum > 0.0005;
  const billingTariffApplied =
    sx?.billing_tariff_applied === true || prFlat?.billing_tariff_applied === true || m.billing_tariff_applied === true;
  const tariffContractEstimated = sx?.charged_fee_is_estimated === true && billingTariffApplied !== true;

  /** Contrato backend: tarifa cobrada real (NP API) — habilita bloco teórico × cobrada × redução. */
  const chargedFeeRaw =
    m.charged_fee_brl != null && String(m.charged_fee_brl).trim() !== ""
      ? String(m.charged_fee_brl).trim()
      : "";
  const chargedFeeLabel =
    m.charged_fee_label != null && String(m.charged_fee_label).trim() !== ""
      ? String(m.charged_fee_label).trim()
      : "Tarifa cobrada pelo Mercado Livre";
  const hasChargedFeeFromApi = chargedFeeRaw !== "";

  const feeSub = buildTariffSubtitleFromScenarioMarketplace({
    listingTypeLabel: m.listing_type_label != null ? String(m.listing_type_label) : null,
    saleFeePercent: m.sale_fee_percent != null ? String(m.sale_fee_percent) : null,
  });
  const feeGrossRaw =
    sx?.fee_amount_gross_brl != null && String(sx.fee_amount_gross_brl).trim() !== ""
      ? String(sx.fee_amount_gross_brl).trim()
      : m.promotion_fee_gross_brl != null && String(m.promotion_fee_gross_brl).trim() !== ""
        ? String(m.promotion_fee_gross_brl).trim()
        : "";
  const feeReductionRaw =
    sx?.subsidy_ml_brl != null && String(sx.subsidy_ml_brl).trim() !== ""
      ? String(sx.subsidy_ml_brl).trim()
      : sx?.subsidy_amount_brl != null && String(sx.subsidy_amount_brl).trim() !== ""
        ? String(sx.subsidy_amount_brl).trim()
        : m.promotion_subsidy_amount_brl != null && String(m.promotion_subsidy_amount_brl).trim() !== ""
          ? String(m.promotion_subsidy_amount_brl).trim()
          : m.fee_discount_brl != null && String(m.fee_discount_brl).trim() !== ""
            ? String(m.fee_discount_brl).trim()
            : "";
  const feeNetAfterRaw =
    sx?.fee_amount_net_display_brl != null && String(sx.fee_amount_net_display_brl).trim() !== ""
      ? String(sx.fee_amount_net_display_brl).trim()
      : m.sale_fee_net_display_brl != null && String(m.sale_fee_net_display_brl).trim() !== ""
        ? String(m.sale_fee_net_display_brl).trim()
        : "";
  const feeSinglePromo =
    sx?.fee_amount_brl != null && String(sx.fee_amount_brl).trim() !== ""
      ? String(sx.fee_amount_brl).trim()
      : prFlat?.fee_amount_brl != null && String(prFlat.fee_amount_brl).trim() !== ""
        ? String(prFlat.fee_amount_brl).trim()
        : m.sale_fee_amount_brl != null && String(m.sale_fee_amount_brl).trim() !== ""
          ? String(m.sale_fee_amount_brl).trim()
          : "";
  const feeDisplayRaw =
    m.sale_fee_net_display_brl != null && String(m.sale_fee_net_display_brl).trim() !== ""
      ? String(m.sale_fee_net_display_brl).trim()
      : m.promotion_fee_net_brl != null && String(m.promotion_fee_net_brl).trim() !== ""
        ? String(m.promotion_fee_net_brl).trim()
        : m.sale_fee_amount_brl != null && String(m.sale_fee_amount_brl).trim() !== ""
          ? String(m.sale_fee_amount_brl).trim()
          : "";
  const feeAmtSingleLine =
    scenario.is_baseline !== true && !hasFeeSubsidy && feeSinglePromo !== ""
      ? formatNegativeBrlFromApiString(feeSinglePromo) ?? DASH
      : feeDisplayRaw !== ""
        ? formatNegativeBrlFromApiString(feeDisplayRaw) ?? DASH
        : DASH;
  const shipPick = pickSaleXrayShippingRawString(m, sx, /** @type {Record<string, unknown>} */ (scenario));
  const shipRaw = shipPick.raw != null ? shipPick.raw : "";
  const shipRawPi =
    piRenderFinal?.shipping_cost_brl != null && String(piRenderFinal.shipping_cost_brl).trim() !== ""
      ? String(piRenderFinal.shipping_cost_brl).trim()
      : receitaVm?.shipping_cost_brl != null && String(receitaVm.shipping_cost_brl).trim() !== ""
        ? String(receitaVm.shipping_cost_brl).trim()
        : shipRaw;
  const shipVal =
    shipRawPi !== "" ? formatNegativeBrlFromApiString(shipRawPi) ?? DASH : DASH;
  const saleFromMarketplace =
    m.sale_price_brl != null && String(m.sale_price_brl).trim() !== ""
      ? formatBrlFromApiString(String(m.sale_price_brl))
      : DASH;
  const promocaoSaleOverride =
    promocaoPrecoVendaExibicaoOverride != null &&
    String(promocaoPrecoVendaExibicaoOverride).trim() !== ""
      ? String(promocaoPrecoVendaExibicaoOverride).trim()
      : null;
  const saleFromPiRenderFinal =
    piRenderFinal?.sale_price_brl != null && String(piRenderFinal.sale_price_brl).trim() !== ""
      ? formatBrlFromApiString(String(piRenderFinal.sale_price_brl))
      : null;
  const sale =
    receitaPiAtiva && saleFromPiRenderFinal != null && saleFromPiRenderFinal !== DASH
      ? saleFromPiRenderFinal
      : promocaoSaleOverride ?? saleFromMarketplace;
  const unitSaleOverride =
    listingUnitSaleDisplayOverride != null && String(listingUnitSaleDisplayOverride).trim() !== ""
      ? String(listingUnitSaleDisplayOverride).trim()
      : null;
  const saleBaselineDisplay =
    scenario.is_baseline === true &&
    baselineListingSaleDisplayOverride != null &&
    String(baselineListingSaleDisplayOverride).trim() !== ""
      ? String(baselineListingSaleDisplayOverride).trim()
      : sale;
  const useListingSalePriceLine =
    scenario.is_baseline === true ||
    (unitSaleOverride != null && String(unitSaleOverride).trim() !== "");
  const saleLineDisplay = unitSaleOverride ?? (scenario.is_baseline === true ? saleBaselineDisplay : sale);
  const receivePick = resolveVoceRecebeExibicaoRaw(m, sx, /** @type {Record<string, unknown>} */ (scenario));
  const receiveFromPiRenderFinal =
    piRenderFinal?.final_amount_to_receive_brl != null &&
    String(piRenderFinal.final_amount_to_receive_brl).trim() !== ""
      ? formatBrlFromApiString(String(piRenderFinal.final_amount_to_receive_brl))
      : null;
  const receiveFromViewModel =
    receitaVm?.amount_to_receive_brl != null && String(receitaVm.amount_to_receive_brl).trim() !== ""
      ? formatBrlFromApiString(String(receitaVm.amount_to_receive_brl))
      : null;
  const receive =
    receitaPiAtiva && receiveFromPiRenderFinal != null
      ? receiveFromPiRenderFinal
      : receitaPiAtiva && temSnapshotFinanceiro
        ? receiveFromPiRenderFinal ?? DASH
        : receitaPiAtiva && receiveFromViewModel != null
          ? receiveFromViewModel
          : receiveFromViewModel ??
            (receivePick.raw != null && String(receivePick.raw).trim() !== ""
              ? formatBrlFromApiString(String(receivePick.raw))
              : DASH);
  const forcePayoutLog =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_SALE_XRAY_PAYOUT_TRACE === "1";
  logSaleXrayPayoutPickInRender(
    /** @type {Record<string, unknown>} */ (scenario),
    m,
    sx,
    receivePick,
    forcePayoutLog
  );

  const marketplaceParticipationAmt =
    m.marketplace_participation_amount_brl != null && String(m.marketplace_participation_amount_brl).trim() !== ""
      ? formatBrlFromApiString(String(m.marketplace_participation_amount_brl))
      : null;
  const marketplaceParticipationLabel =
    m.marketplace_participation_label != null && String(m.marketplace_participation_label).trim() !== ""
      ? String(m.marketplace_participation_label).trim()
      : null;
  const marketplaceBenefitAmt =
    m.marketplace_benefit_amount_brl != null && String(m.marketplace_benefit_amount_brl).trim() !== ""
      ? formatBrlFromApiString(String(m.marketplace_benefit_amount_brl))
      : null;
  const marketplaceBenefitLabel =
    m.marketplace_benefit_label != null && String(m.marketplace_benefit_label).trim() !== ""
      ? String(m.marketplace_benefit_label).trim()
      : "Subsídio do marketplace";
  const benefitLineAmt = marketplaceParticipationAmt ?? marketplaceBenefitAmt;
  const benefitLineLabel = marketplaceParticipationLabel ?? marketplaceBenefitLabel;

  const shipCtxCanon = pickPricingShippingCostContext(
    /** @type {Record<string, unknown>} */ ({
      ml_shipping_cost_context: m.ml_shipping_cost_context ?? sx?.ml_shipping_cost_context,
      shipping_cost_context: m.shipping_cost_context ?? sx?.shipping_cost_context,
      shipping_context: m.shipping_context,
    }),
  );
  const lr = scenario._raiox_listing_row;
  const extForAudit =
    lr && typeof lr === "object" ? /** @type {Record<string, unknown>} */ (lr).externalId : null;
  if (shouldSaleXrayShippingAuditTrace(extForAudit)) {
    console.info("[SALE_XRAY_SHIPPING_AUDIT][card_render]", {
      listing_external_id: extForAudit ?? null,
      scenario_key: scenario.scenario_key ?? scenario.scenario_id ?? null,
      shipCtxCanon,
      m_shipping_context: m.shipping_context ?? null,
      sx_shipping_cost_context: sx?.shipping_cost_context ?? null,
      sx_ml_shipping_cost_context: sx?.ml_shipping_cost_context ?? null,
      shipPick_source: shipPick.source,
      shipRaw: shipPick.raw ?? null,
    });
  }
  const shipCtxLabel = shippingContextDisplayLabel(shipCtxCanon);
  const shipSub =
    m.shipping_subsidy_amount_brl != null && String(m.shipping_subsidy_amount_brl).trim() !== ""
      ? formatBrlFromApiString(String(m.shipping_subsidy_amount_brl))
      : null;
  const promoSubMl =
    m.promotion_subsidy_amount_brl != null && String(m.promotion_subsidy_amount_brl).trim() !== ""
      ? formatBrlFromApiString(String(m.promotion_subsidy_amount_brl))
      : null;
  const sellerDisc =
    m.seller_discount_amount_brl != null && String(m.seller_discount_amount_brl).trim() !== ""
      ? formatBrlFromApiString(String(m.seller_discount_amount_brl))
      : null;
  const sellerDiscSub = buildSellerDiscountSubtitleFromMarketplace({
    sellerDiscountPercent: m.seller_discount_percent != null ? String(m.seller_discount_percent) : null,
  });
  const sellerDiscExibicao =
    sellerDisc ??
    (forcarLinhaDescontoSellerPromocao
      ? descontoSellerPromocaoExibicao != null && String(descontoSellerPromocaoExibicao).trim() !== ""
        ? String(descontoSellerPromocaoExibicao).trim()
        : DASH
      : null);
  const exibirBlocoDescontoSeller =
    !ocultarDescontoPromocaoReceitaMarketplace &&
    sellerDiscExibicao != null &&
    (sellerDisc != null || forcarLinhaDescontoSellerPromocao);
  if (import.meta.env.DEV && scenario.is_baseline !== true) {
    const promoName =
      scenario.promotion_name != null
        ? String(scenario.promotion_name)
        : scenario.label != null
          ? String(scenario.label)
          : "";
    if (promoName.toLowerCase().includes("aumente") && promoName.toLowerCase().includes("vendas")) {
      logPiPromoFlowAudit("frontend_PricingScenarioDetail_render_fields", {
        promotion_name: promoName,
        promotion_id: scenario.promotion_id ?? null,
        type: scenario.promotion_type ?? null,
        ref_id: scenario.offer_id ?? null,
        discount_seller_brl: m.seller_discount_amount_brl ?? null,
        discount_seller_pct: m.seller_discount_percent ?? null,
        discount_meli_brl: m.promotion_subsidy_amount_brl ?? null,
        fee_before_subsidy: m.fee_amount_before_promo_subsidy_brl ?? m.sale_fee_amount_brl ?? null,
        fee_after_subsidy: m.fee_amount_after_promo_subsidy_brl ?? null,
        shipping_brl: m.shipping_cost_amount_brl ?? null,
        payout: receivePick.raw ?? m.marketplace_payout_amount_brl ?? null,
        source_field_used: receivePick.source ?? "marketplace_fields",
      });
    }
  }

  const saleXrayDisc =
    scenario._sale_xray_discount_text != null && String(scenario._sale_xray_discount_text).trim() !== ""
      ? String(scenario._sale_xray_discount_text).trim()
      : null;
  const saleXrayDiscountDisplay = saleXrayDisc != null ? parseSaleXrayDiscountTextForDisplay(saleXrayDisc) : null;

  const originalPriceRaw = sx?.original_price_brl ?? prFlat?.original_price_brl ?? null;
  let originalPriceDisplay =
    originalPriceRaw != null && String(originalPriceRaw).trim() !== ""
      ? formatBrlFromApiString(String(originalPriceRaw))
      : null;
  if (
    originalPriceDisplay == null &&
    scenario.is_baseline !== true &&
    saleXrayDiscountDisplay != null &&
    m.sale_price_brl != null
  ) {
    const sv = brlApiStringToNumber(String(m.sale_price_brl));
    const dv = brlApiStringToNumber(String(saleXrayDiscountDisplay.discountAmountRaw));
    if (Number.isFinite(sv) && Number.isFinite(dv) && sv > 0 && dv >= 0) {
      originalPriceDisplay = formatBrlFromApiString((sv + dv).toFixed(2));
    }
  }
  const tSubsSx =
    sx?.subsidy_text != null && String(sx.subsidy_text).trim() !== "" ? String(sx.subsidy_text).trim() : null;
  const tSubsPr =
    prFlat?.subsidy_text != null && String(prFlat.subsidy_text).trim() !== ""
      ? String(prFlat.subsidy_text).trim()
      : null;
  const tSubsLegacy =
    scenario._sale_xray_subsidy_text != null && String(scenario._sale_xray_subsidy_text).trim() !== ""
      ? String(scenario._sale_xray_subsidy_text).trim()
      : null;
  const saleXraySubsidyTxt = tSubsSx ?? tSubsPr ?? tSubsLegacy ?? null;

  const feeSimpleRaw =
    prFlat?.fee_amount_brl != null && String(prFlat.fee_amount_brl).trim() !== ""
      ? String(prFlat.fee_amount_brl)
      : m.sale_fee_amount_brl != null && String(m.sale_fee_amount_brl).trim() !== ""
        ? String(m.sale_fee_amount_brl)
        : "";
  const feeSimpleLine = feeSimpleRaw !== "" ? formatNegativeBrlFromApiString(feeSimpleRaw) ?? DASH : DASH;

  const piAjustesFinanceiros =
    receitaPiAtiva && piRenderFinal == null && receitaVm == null
      ? obterAjustesFinanceirosPromocao(
          selectedPromotionEffective != null && typeof selectedPromotionEffective === "object"
            ? /** @type {Record<string, unknown>} */ (selectedPromotionEffective)
            : /** @type {Record<string, unknown>} */ (scenario),
        )
      : null;
  const piFeeDiscountRaw =
    receitaPiAtiva && piRenderFinal?.should_render_fee_discount_line === true
      ? piRenderFinal.selected_promotion_fee_discount_brl != null &&
        String(piRenderFinal.selected_promotion_fee_discount_brl).trim() !== "" &&
        piRenderFinal.selected_promotion_fee_discount_brl !== "0.00"
        ? String(piRenderFinal.selected_promotion_fee_discount_brl).trim()
        : ""
      : receitaPiAtiva && receitaVm != null
        ? receitaVm.should_render_fee_discount_line === true &&
          receitaVm.marketplace_fee_discount_brl != null &&
          String(receitaVm.marketplace_fee_discount_brl).trim() !== "" &&
          receitaVm.marketplace_fee_discount_brl !== "0.00"
          ? String(receitaVm.marketplace_fee_discount_brl).trim()
          : ""
        : piAjustesFinanceiros?.has_marketplace_fee_discount === true &&
            piAjustesFinanceiros.marketplace_fee_discount_brl != null &&
            String(piAjustesFinanceiros.marketplace_fee_discount_brl).trim() !== ""
          ? String(piAjustesFinanceiros.marketplace_fee_discount_brl).trim()
          : layoutReceitaPiPromocoes && m.fee_discount_brl != null && String(m.fee_discount_brl).trim() !== ""
            ? String(m.fee_discount_brl).trim()
            : layoutReceitaPiPromocoes && hasFeeSubsidy && feeReductionRaw !== ""
              ? feeReductionRaw
              : "";
  const piFeeDiscountLabel =
    piRenderFinal?.fee_discount_label != null && String(piRenderFinal.fee_discount_label).trim() !== ""
      ? String(piRenderFinal.fee_discount_label).trim()
      : receitaVm?.fee_discount_label != null && String(receitaVm.fee_discount_label).trim() !== ""
        ? String(receitaVm.fee_discount_label).trim()
        : piAjustesFinanceiros?.marketplace_fee_discount_label != null &&
            String(piAjustesFinanceiros.marketplace_fee_discount_label).trim() !== ""
          ? String(piAjustesFinanceiros.marketplace_fee_discount_label).trim()
          : "Reduzimos sua tarifa";
  const piTarifaBrutaRaw =
    piRenderFinal?.gross_sale_fee_brl != null && String(piRenderFinal.gross_sale_fee_brl).trim() !== ""
      ? String(piRenderFinal.gross_sale_fee_brl).trim()
      : receitaVm?.gross_sale_fee_brl != null && String(receitaVm.gross_sale_fee_brl).trim() !== ""
        ? String(receitaVm.gross_sale_fee_brl).trim()
        : feeGrossRaw !== ""
          ? feeGrossRaw
          : m.promotion_fee_gross_brl != null && String(m.promotion_fee_gross_brl).trim() !== ""
            ? String(m.promotion_fee_gross_brl).trim()
            : feeSinglePromo !== ""
              ? feeSinglePromo
              : feeDisplayRaw;

  return (
    <div
      className={[
        "anuncios-sell-popover__section",
        layoutReceitaPiPromocoes ? "anuncios-sell-popover__section--receita-pi-promo" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
        <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>
        <div className="anuncios-sell-popover__block">
          {useListingSalePriceLine ? (
            salePriceEditControl != null ? (
              <PricingScenarioSalePriceControl control={salePriceEditControl} />
            ) : inlineEditSale != null ? (
              <PricingInlineEditableMetric
                label="Valor de venda"
                displayValue={inlineEditSale.displayValue}
                onCommit={inlineEditSale.onCommit}
                prefix="R$"
                inputMode="decimal"
                ariaLabelEdit="Editar valor de venda"
              />
            ) : (
              <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key anuncios-sell-popover__line--promo-sale">
                <span className="anuncios-sell-popover__promo-sale-label">
                  <span className="anuncios-sell-popover__promo-sale-title-inline">
                    <span className="anuncios-sell-popover__promo-sale-title-text">Valor de venda</span>
                  </span>
                </span>
                <strong>{saleLineDisplay}</strong>
              </div>
            )
          ) : (
            <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key anuncios-sell-popover__line--promo-sale">
              <span className="anuncios-sell-popover__promo-sale-label">
                <span className="anuncios-sell-popover__promo-sale-title-inline">
                  <span className="anuncios-sell-popover__promo-sale-title-text">Valor de venda na promoção</span>
                  {saleXrayDisc != null ? (
                    <S7Tooltip
                      richContent={
                        <MercadoLivrePromoPriceTooltipBody
                          originalPriceDisplay={originalPriceDisplay}
                          saleXrayDiscountDisplay={saleXrayDiscountDisplay}
                          saleXrayDisc={saleXrayDisc}
                          sale={sale}
                        />
                      }
                      offset={4}
                    >
                      <button
                        type="button"
                        className="anuncios-sell-popover__promo-price-tip-btn"
                        aria-label="Detalhes do preço e desconto da promoção"
                      >
                        <S7Icon name="info" size={13} strokeWidth={2} />
                      </button>
                    </S7Tooltip>
                  ) : null}
                </span>
              </span>
              <strong>{sale}</strong>
            </div>
          )}
        </div>
        <div className="anuncios-sell-popover__block">
          {layoutReceitaPiPromocoes ? (
            <div className="anuncios-sell-popover__line">
              <span>Tarifa de venda</span>
              <ValorFinanceiroDerivado pending={finPend}>
                {formatNegativeBrlFromApiString(piTarifaBrutaRaw) ?? feeAmtSingleLine}
              </ValorFinanceiroDerivado>
            </div>
          ) : saleXraySimple ? (
            <div className="anuncios-sell-popover__line">
              <span>Tarifa de venda</span>
              <ValorFinanceiroDerivado pending={finPend}>{feeSimpleLine}</ValorFinanceiroDerivado>
            </div>
          ) : hasBillingTariffContract ? (
            <>
              <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
                <span>
                  Tarifa de venda
                  {tariffContractEstimated ? (
                    <span className="anuncios-sell-popover__muted"> · Estimado</span>
                  ) : null}
                </span>
              </div>
              {showBillingTariffReduction ? (
                <>
                  <div className="anuncios-sell-popover__line">
                    <span>Tarifa bruta</span>
                    <ValorFinanceiroDerivado pending={finPend}>
                      {formatNegativeBrlFromApiString(String(sx.charged_fee_gross_brl)) ?? DASH}
                    </ValorFinanceiroDerivado>
                  </div>
                  <div className="anuncios-sell-popover__line">
                    <span>Redução da tarifa</span>
                    <ValorFinanceiroDerivado pending={finPend}>
                      {formatNegativeBrlFromApiString(String(sx.charged_fee_reduction_brl)) ?? DASH}
                    </ValorFinanceiroDerivado>
                  </div>
                </>
              ) : null}
              <div className="anuncios-sell-popover__line">
                <span>Tarifa cobrada</span>
                <ValorFinanceiroDerivado pending={finPend}>
                  {formatNegativeBrlFromApiString(String(sx.charged_fee_net_brl)) ?? DASH}
                </ValorFinanceiroDerivado>
              </div>
            </>
          ) : hasSuse7PreviewTariff ? (
            <>
              <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
                <span>
                  Tarifa de venda
                  <span className="anuncios-sell-popover__muted"> · Estimado pelo Suse7</span>
                </span>
              </div>
              <div className="anuncios-sell-popover__line">
                <span>Tarifa bruta</span>
                <ValorFinanceiroDerivado pending={finPend}>
                  {formatNegativeBrlFromApiString(String(m.preview_fee_gross_brl)) ?? DASH}
                </ValorFinanceiroDerivado>
              </div>
              {showSuse7TariffReduction ? (
                <div className="anuncios-sell-popover__line">
                  <span>Redução da tarifa</span>
                  <ValorFinanceiroDerivado pending={finPend}>
                    + {formatBrlFromApiString(String(m.preview_fee_reduction_brl))}
                  </ValorFinanceiroDerivado>
                </div>
              ) : null}
              <div className="anuncios-sell-popover__line">
                <span>Tarifa cobrada</span>
                <ValorFinanceiroDerivado pending={finPend}>
                  {formatNegativeBrlFromApiString(String(m.preview_fee_net_brl)) ?? DASH}
                </ValorFinanceiroDerivado>
              </div>
            </>
          ) : scenario.is_baseline !== true && (hasChargedFeeFromApi && feeGrossRaw !== "" || (hasFeeSubsidy && feeGrossRaw !== "")) ? (
            <>
              <div className="anuncios-sell-popover__line">
                <span>Tarifa de venda cheia</span>
                <ValorFinanceiroDerivado pending={finPend}>
                  {formatNegativeBrlFromApiString(feeGrossRaw) ?? DASH}
                </ValorFinanceiroDerivado>
              </div>
              {hasFeeSubsidy && feeReductionRaw !== "" ? (
                <div className="anuncios-sell-popover__line">
                  <span>Redução ML nas tarifas</span>
                  <ValorFinanceiroDerivado pending={finPend}>+ {formatBrlFromApiString(feeReductionRaw)}</ValorFinanceiroDerivado>
                </div>
              ) : null}
              {hasFeeSubsidy && feeNetAfterRaw !== "" ? (
                <div className="anuncios-sell-popover__line">
                  <span>Tarifa de venda líquida</span>
                  <ValorFinanceiroDerivado pending={finPend}>
                    {formatNegativeBrlFromApiString(feeNetAfterRaw) ?? DASH}
                  </ValorFinanceiroDerivado>
                </div>
              ) : hasChargedFeeFromApi ? (
                <div className="anuncios-sell-popover__line">
                  <span>{chargedFeeLabel}</span>
                  <ValorFinanceiroDerivado pending={finPend}>
                    {formatNegativeBrlFromApiString(chargedFeeRaw) ?? DASH}
                  </ValorFinanceiroDerivado>
                </div>
              ) : null}
              {sx?.show_fee_subsidy_breakdown === true &&
              Array.isArray(sx?.subsidy_ml_breakdown_brl) &&
              /** @type {unknown[]} */ (sx.subsidy_ml_breakdown_brl).length > 1
                ? /** @type {unknown[]} */ (sx.subsidy_ml_breakdown_brl).map((part, idx) => (
                    <div
                      key={`sx-brk-${idx}`}
                      className="anuncios-sell-popover__line anuncios-sell-popover__muted"
                    >
                      <span>Redução da tarifa (detalhe)</span>
                      <ValorFinanceiroDerivado pending={finPend}>+ {formatBrlFromApiString(String(part))}</ValorFinanceiroDerivado>
                    </div>
                  ))
                : null}
            </>
          ) : (
            <div className="anuncios-sell-popover__line">
              <span>Tarifa de venda</span>
              <ValorFinanceiroDerivado pending={finPend}>{feeAmtSingleLine}</ValorFinanceiroDerivado>
            </div>
          )}
          {feeSub != null ? <div className="anuncios-sell-popover__muted">{feeSub}</div> : null}
        </div>
        <div className="anuncios-sell-popover__block">
          <div className="anuncios-sell-popover__line">
            <span>{ML_SHIPPING_TITLE}</span>
            <ValorFinanceiroDerivado pending={finPend}>{shipVal}</ValorFinanceiroDerivado>
          </div>
          {shipCtxLabel != null ? (
            <div className="anuncios-sell-popover__muted">{shipCtxLabel}</div>
          ) : null}
          {layoutReceitaPiPromocoes && piFeeDiscountRaw !== "" ? (
            <div className="anuncios-sell-popover__line anuncios-sell-popover__line--fee-discount-pi">
              <span>{piFeeDiscountLabel}</span>
              <ValorFinanceiroDerivado pending={finPend}>
                <span className="anuncios-sell-popover__value--positive">
                  + {formatBrlFromApiString(piFeeDiscountRaw)}
                </span>
              </ValorFinanceiroDerivado>
            </div>
          ) : null}
          {showShippingSubsidyMlLine && shipSub != null && !saleXraySimple ? (
            <div className="anuncios-sell-popover__line">
              <span>Subsídio de frete (ML)</span>
              <ValorFinanceiroDerivado pending={finPend}>{shipSub}</ValorFinanceiroDerivado>
            </div>
          ) : null}
        </div>
        {benefitLineAmt != null && !hasFeeSubsidy && !saleXraySimple ? (
          <div className="anuncios-sell-popover__block">
            <div className="anuncios-sell-popover__line">
              <span>{benefitLineLabel}</span>
              <ValorFinanceiroDerivado pending={finPend}>+ {benefitLineAmt}</ValorFinanceiroDerivado>
            </div>
          </div>
        ) : null}
        {exibirBlocoDescontoSeller ? (
          <div className="anuncios-sell-popover__block">
            <div className="anuncios-sell-popover__line">
              <span>Desconto da promoção</span>
              <strong>{sellerDiscExibicao}</strong>
            </div>
            {sellerDiscSub != null ? (
              <div className="anuncios-sell-popover__muted">{sellerDiscSub}</div>
            ) : null}
          </div>
        ) : null}
        {!saleXraySimple && promoSubMl != null && !hasFeeSubsidy ? (
          <div className="anuncios-sell-popover__block">
            <div className="anuncios-sell-popover__line">
              <span>Subsídio promocional (ML)</span>
              <strong className="anuncios-sell-popover__value--positive">
                + {promoSubMl}
              </strong>
            </div>
          </div>
        ) : null}
        <div className="anuncios-sell-popover__block">
          <div className="anuncios-sell-popover__line anuncios-sell-popover__line--total anuncios-sell-popover__line--key">
            <span>Você recebe</span>
            <ValorFinanceiroDerivado pending={finPend}>{receive}</ValorFinanceiroDerivado>
          </div>
        </div>
        {scenario.is_baseline !== true && saleXraySubsidyTxt != null && !hasFeeSubsidy && !saleXraySimple ? (
          <div className="anuncios-sell-popover__block">
            <div className="anuncios-sell-popover__line">
              <span>Subsídio (ML)</span>
              <strong className="anuncios-sell-popover__muted">{saleXraySubsidyTxt}</strong>
            </div>
          </div>
        ) : null}
        {showSubsidy && scenario.is_baseline !== true && !saleXraySimple ? (
          <MercadoLivrePricingScenarioSubsidyCollapsible scenario={scenario} />
        ) : null}
        {scenario.data_quality != null &&
        typeof scenario.data_quality === "object" &&
        Array.isArray(/** @type {{ warnings?: unknown }} */ (scenario.data_quality).warnings) &&
        /** @type {{ warnings: string[] }} */ (scenario.data_quality).warnings.length > 0 ? (
          <p
            className={
              /** @type {{ source?: string }} */ (scenario.data_quality).source === "partial"
                ? "anuncios-ml-scenarios-dq-partial"
                : "anuncios-sell-popover__raiox-warn"
            }
            role="status"
          >
            ⚠{" "}
            {/** @type {{ warnings: string[] }} */ (scenario.data_quality).warnings.join(" ")}
          </p>
        ) : null}
    </div>
  );
}

/**
 * Custos internos + resultado para um único cenário ML (dados normalizados da API; sem cálculo no JSX).
 * @param {{
 *   scenario: Record<string, unknown>;
 *   hideBreakEvenRow?: boolean;
 *   profitLineLabel?: string | null;
 *   inlineEditMargin?: {
 *     displayValue: string;
 *     onCommit: (raw: string) => void;
 *   } | null;
 *   financialScenarioPending?: boolean;
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
export function MercadoLivrePricingScenarioInternalAndResultSection({
  scenario,
  hideBreakEvenRow = false,
  profitLineLabel = null,
  inlineEditMargin = null,
  layoutPiFixo = false,
  financialScenarioPending = false,
  promocaoCardViewModel = null,
}) {
  const finPend = financialScenarioPending === true;
  const ic =
    scenario.internal_costs != null && typeof scenario.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.internal_costs)
      : null;
  const ui =
    scenario.ui != null && typeof scenario.ui === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.ui)
      : null;
  const block2Mode = ui?.block2_mode != null ? String(ui.block2_mode) : "no_product";
  const block3Mode = ui?.block3_mode != null ? String(ui.block3_mode) : "blocked";
  const simResBase =
    scenario.result != null && typeof scenario.result === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.result)
      : null;
  const simRes =
    promocaoCardViewModel != null && simResBase != null
      ? {
          ...simResBase,
          ...(promocaoCardViewModel.profit_brl != null
            ? { profit_brl: promocaoCardViewModel.profit_brl }
            : {}),
          ...(promocaoCardViewModel.margin_pct != null
            ? { margin_pct: promocaoCardViewModel.margin_pct }
            : {}),
          ...(promocaoCardViewModel.offer_status_semantic != null
            ? { offer_status_semantic: promocaoCardViewModel.offer_status_semantic }
            : {}),
          ...(promocaoCardViewModel.health_status != null
            ? { health_status: promocaoCardViewModel.health_status }
            : {}),
        }
      : simResBase;
  const taxPercentLabel =
    ic?.tax_percent_label != null && String(ic.tax_percent_label).trim() !== ""
      ? String(ic.tax_percent_label)
      : null;
  const offerFromMargin = getOfferStatusFromMargin(simRes?.margin_pct);
  const semRawBackend =
    simRes?.offer_status_semantic != null ? String(simRes.offer_status_semantic).trim() : "";
  const semSuffixForClass = offerFromMargin != null ? offerFromMargin.color : semRawBackend;
  const offerSemClass = offerSemanticSuffixToCssClass(semSuffixForClass);
  const offerStatusLineText =
    offerFromMargin != null
      ? offerFromMargin.label
      : simRes?.offer_status_label != null
        ? String(simRes.offer_status_label)
        : simRes?.offer_status != null
          ? String(simRes.offer_status)
          : DASH;

  const formatarCustoInterno =
    layoutPiFixo === true ? formatCustoInternoPiDisplay : formatBrlFromApiString;

  const rotuloLucroPersonalizado =
    profitLineLabel != null && String(profitLineLabel).trim() !== "" ? String(profitLineLabel).trim() : null;
  const rotuloLucroExibicao = rotuloLucroPersonalizado ?? ROTULO_LUCRO_RESULTADO;
  const tooltipLucroMargemContribuicao =
    layoutPiFixo && rotuloLucroPersonalizado == null ? TOOLTIP_LUCRO_MARGEM_CONTRIBUICAO : null;

  return (
    <>
      <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block">
        <h4 className="anuncios-sell-popover__section-title">Custos internos</h4>
        {block2Mode === "no_product" ? (
          <p className="anuncios-sell-popover__raiox-alert">
            Este anúncio não está vinculado a um produto.
          </p>
        ) : (
          <>
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line">
                <span>Custo do produto</span>
                <strong
                  className={
                    ic?.product_cost_brl != null && String(ic.product_cost_brl).trim() !== ""
                      ? undefined
                      : "anuncios-sell-popover__value--empty"
                  }
                >
                  {ic?.product_cost_brl != null && String(ic.product_cost_brl).trim() !== ""
                    ? formatarCustoInterno(String(ic.product_cost_brl))
                    : DASH}
                </strong>
              </div>
            </div>
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line">
                <span>Impostos</span>
                <ValorFinanceiroDerivado
                  pending={finPend}
                  className={
                    ic?.tax_amount_brl != null && String(ic.tax_amount_brl).trim() !== ""
                      ? undefined
                      : "anuncios-sell-popover__value--empty"
                  }
                >
                  {ic?.tax_amount_brl != null && String(ic.tax_amount_brl).trim() !== ""
                    ? formatarCustoInterno(String(ic.tax_amount_brl))
                    : DASH}
                </ValorFinanceiroDerivado>
              </div>
              {taxPercentLabel != null ? (
                <div className="anuncios-sell-popover__muted">{taxPercentLabel}</div>
              ) : null}
            </div>
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line">
                <span>Operação + Embalagem</span>
                <strong
                  className={
                    ic?.operational_packaging_total_brl != null &&
                    String(ic.operational_packaging_total_brl).trim() !== ""
                      ? undefined
                      : "anuncios-sell-popover__value--empty"
                  }
                >
                  {ic?.operational_packaging_total_brl != null &&
                  String(ic.operational_packaging_total_brl).trim() !== ""
                    ? formatarCustoInterno(String(ic.operational_packaging_total_brl))
                    : DASH}
                </strong>
              </div>
            </div>
            {block2Mode === "incomplete" && ui?.block2_message != null ? (
              <p className="anuncios-sell-popover__raiox-warn">
                ⚠ {String(ui.block2_message)}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block anuncios-sell-popover__section--raiox-resultado">
        <h4 className="anuncios-sell-popover__section-title">Resultado</h4>
        {block3Mode === "ok" && simRes != null ? (
          <>
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line anuncios-sell-popover__line--raiox-result-metric">
                <span className={offerSemClass || undefined}>
                  <RotuloLucroResultado
                    label={rotuloLucroExibicao}
                    tooltip={tooltipLucroMargemContribuicao}
                  />
                </span>
                <ValorFinanceiroDerivado pending={finPend} className={offerSemClass || undefined}>
                  {simRes?.profit_brl != null ? formatBrlFromApiString(String(simRes.profit_brl)) : DASH}
                </ValorFinanceiroDerivado>
              </div>
            </div>
            <div className="anuncios-sell-popover__block">
              {inlineEditMargin != null ? (
                <PricingInlineEditableMetric
                  label="Margem"
                  displayValue={inlineEditMargin.displayValue}
                  onCommit={inlineEditMargin.onCommit}
                  suffix="%"
                  inputMode="decimal"
                  ariaLabelEdit="Editar margem"
                />
              ) : (
                <div className="anuncios-sell-popover__line anuncios-sell-popover__line--raiox-result-metric">
                  <span className={offerSemClass || undefined}>Margem</span>
                  <ValorFinanceiroDerivado pending={finPend} className={offerSemClass || undefined}>
                    {simRes?.margin_pct != null && String(simRes.margin_pct).trim() !== ""
                      ? `${String(simRes.margin_pct).replace(".", ",")} %`
                      : DASH}
                  </ValorFinanceiroDerivado>
                </div>
              )}
            </div>
            {!hideBreakEvenRow ? (
              <div className="anuncios-sell-popover__block">
                <div className="anuncios-sell-popover__line">
                  <span>Preço mínimo saudável</span>
                  <strong>
                    {simRes?.break_even_price_brl != null && String(simRes.break_even_price_brl).trim() !== ""
                      ? formatBrlFromApiString(String(simRes.break_even_price_brl))
                      : DASH}
                  </strong>
                </div>
              </div>
            ) : null}
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line anuncios-sell-popover__line--status-offer anuncios-sell-popover__line--raiox-result-metric">
                <span className={offerSemClass || undefined}>Status da oferta</span>
                <ValorFinanceiroDerivado pending={finPend} className={offerSemClass || undefined}>
                  {offerStatusLineText}
                </ValorFinanceiroDerivado>
              </div>
            </div>
          </>
        ) : (
          <p className="anuncios-sell-popover__result-placeholder">
            {ui?.block3_message != null && String(ui.block3_message).trim() !== ""
              ? String(ui.block3_message)
              : DASH}
          </p>
        )}
      </div>
    </>
  );
}
