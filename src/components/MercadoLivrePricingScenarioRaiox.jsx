// ======================================================
// Raio-x / Precificação — blocos por cenário (baseline + promoções ML).
// Valores apenas como strings da API (sem cálculo de dinheiro no JSX).
// ======================================================

import { useId, useState } from "react";
import { formatCatalogBRL } from "../utils/productCatalogRow";
import S7Tooltip from "./ui/S7Tooltip";

const DASH = "—";

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
 * Texto truncado na aba; nome completo no hover via S7Tooltip (DS, horizontal).
 * @param {{
 *   scenarios: { scenario_id?: string; promotion_name?: string | null; promotion_id?: string | null; key?: string | null }[];
 *   activeId: string;
 *   onChange: (id: string) => void;
 * }} props
 */
export function MercadoLivrePricingScenarioTabs({ scenarios, activeId, onChange }) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return null;
  const baselineLabel = "Preço normal";
  return (
    <div
      className="anuncios-ml-scenarios-tabs anuncios-ml-scenarios-tabs--vertical anuncios-ml-scenarios-tabs--external"
      role="tablist"
      aria-label="Cenários de precificação"
    >
      <div className="anuncios-ml-scenarios-tabs__slot">
        <S7Tooltip content={baselineLabel} placement="bottom-start" offset={6} className="anuncios-ml-scenarios-tabs__tip-host">
          <span className="anuncios-ml-scenarios-tabs__tip-anchor">
            <button
              type="button"
              role="tab"
              aria-selected={activeId === "baseline"}
              aria-label={baselineLabel}
              className={
                activeId === "baseline"
                  ? "anuncios-ml-scenarios-tabs__btn anuncios-ml-scenarios-tabs__btn--vertical anuncios-ml-scenarios-tabs__btn--active"
                  : "anuncios-ml-scenarios-tabs__btn anuncios-ml-scenarios-tabs__btn--vertical"
              }
              onClick={() => onChange("baseline")}
            >
              <span className="anuncios-ml-scenarios-tabs__label">{baselineLabel}</span>
            </button>
          </span>
        </S7Tooltip>
      </div>
      {scenarios.map((s, idx) => {
        const id = resolveMlScenarioTabId(s) || `promo-${idx}`;
        const label =
          s.promotion_name != null && String(s.promotion_name).trim() !== ""
            ? String(s.promotion_name).trim()
            : id;
        const active = activeId === id;
        return (
          <div key={id} className="anuncios-ml-scenarios-tabs__slot">
            <S7Tooltip content={label} placement="bottom-start" offset={6} className="anuncios-ml-scenarios-tabs__tip-host">
              <span className="anuncios-ml-scenarios-tabs__tip-anchor">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={label}
                  className={
                    active
                      ? "anuncios-ml-scenarios-tabs__btn anuncios-ml-scenarios-tabs__btn--vertical anuncios-ml-scenarios-tabs__btn--active"
                      : "anuncios-ml-scenarios-tabs__btn anuncios-ml-scenarios-tabs__btn--vertical"
                  }
                  onClick={() => onChange(id)}
                >
                  <span className="anuncios-ml-scenarios-tabs__label">{label}</span>
                </button>
              </span>
            </S7Tooltip>
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

/**
 * Seção Receita do marketplace para um cenário isolado.
 * @param {{
 *   scenario: Record<string, unknown>;
 *   showSubsidy?: boolean;
 *   showShippingSubsidyMlLine?: boolean;
 * }} props
 */
export function MercadoLivrePricingScenarioRevenueSection({
  scenario,
  showSubsidy = true,
  showShippingSubsidyMlLine = true,
}) {
  const m =
    scenario.marketplace != null && typeof scenario.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.marketplace)
      : {};
  const feeSub = buildTariffSubtitleFromScenarioMarketplace({
    listingTypeLabel: m.listing_type_label != null ? String(m.listing_type_label) : null,
    saleFeePercent: m.sale_fee_percent != null ? String(m.sale_fee_percent) : null,
  });
  const feeAmt =
    m.sale_fee_amount_brl != null && String(m.sale_fee_amount_brl).trim() !== ""
      ? formatNegativeBrlFromApiString(String(m.sale_fee_amount_brl)) ?? DASH
      : DASH;
  const shipRaw = m.shipping_cost_amount_brl != null ? String(m.shipping_cost_amount_brl) : "";
  const shipVal = shipRaw !== "" ? formatNegativeBrlFromApiString(shipRaw) ?? DASH : DASH;
  const sale =
    m.sale_price_brl != null && String(m.sale_price_brl).trim() !== ""
      ? formatBrlFromApiString(String(m.sale_price_brl))
      : DASH;
  const receive =
    m.marketplace_payout_amount_brl != null && String(m.marketplace_payout_amount_brl).trim() !== ""
      ? formatBrlFromApiString(String(m.marketplace_payout_amount_brl))
      : DASH;

  const shipCtxLabel =
    m.shipping_context != null ? shippingContextDisplayLabel(String(m.shipping_context)) : null;
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

  /** Baseline = preço de tabela; abas promocionais = só o efetivo da oferta (sem repetir “original”). */
  const saleLineLabel = scenario.is_baseline === true ? "Valor de venda" : "Valor de venda na promoção";

  return (
    <div className="anuncios-sell-popover__section">
        <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>
        <div className="anuncios-sell-popover__block">
          <div className="anuncios-sell-popover__line anuncios-sell-popover__line--key">
            <span>{saleLineLabel}</span>
            <strong>{sale}</strong>
          </div>
        </div>
        <div className="anuncios-sell-popover__block">
          <div className="anuncios-sell-popover__line">
            <span>Tarifa de venda</span>
            <strong>{feeAmt}</strong>
          </div>
          {feeSub != null ? <div className="anuncios-sell-popover__muted">{feeSub}</div> : null}
        </div>
        <div className="anuncios-sell-popover__block">
          <div className="anuncios-sell-popover__line">
            <span>{ML_SHIPPING_TITLE}</span>
            <strong>{shipVal}</strong>
          </div>
          {shipCtxLabel != null ? (
            <div className="anuncios-sell-popover__muted">{shipCtxLabel}</div>
          ) : null}
          {showShippingSubsidyMlLine && shipSub != null ? (
            <div className="anuncios-sell-popover__line">
              <span>Subsídio de frete (ML)</span>
              <strong>{shipSub}</strong>
            </div>
          ) : null}
        </div>
        {promoSubMl != null || sellerDisc != null ? (
          <div className="anuncios-sell-popover__block">
            {promoSubMl != null ? (
              <div className="anuncios-sell-popover__line">
                <span>Subsídio promocional (ML)</span>
                <strong>{promoSubMl}</strong>
              </div>
            ) : null}
            {sellerDisc != null ? (
              <div className="anuncios-sell-popover__line">
                <span>Desconto bancado pelo seller</span>
                <strong>{sellerDisc}</strong>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="anuncios-sell-popover__block">
          <div className="anuncios-sell-popover__line anuncios-sell-popover__line--total anuncios-sell-popover__line--key">
            <span>Você recebe</span>
            <strong>{receive}</strong>
          </div>
        </div>
        {showSubsidy && scenario.is_baseline !== true ? (
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
 * @param {{ scenario: Record<string, unknown> }} props
 */
export function MercadoLivrePricingScenarioInternalAndResultSection({ scenario }) {
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
  const simRes =
    scenario.result != null && typeof scenario.result === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.result)
      : null;
  const taxPercentLabel =
    ic?.tax_percent_label != null && String(ic.tax_percent_label).trim() !== ""
      ? String(ic.tax_percent_label)
      : null;
  const semRaw =
    simRes?.offer_status_semantic != null ? String(simRes.offer_status_semantic).trim() : "";
  const offerSemClass =
    ["critical", "danger", "acceptable", "great", "excellent"].includes(semRaw)
      ? `anuncios-sell-popover__offer-sem--${semRaw}`
      : "";

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
                    ? formatBrlFromApiString(String(ic.product_cost_brl))
                    : DASH}
                </strong>
              </div>
            </div>
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line">
                <span>Impostos</span>
                <strong
                  className={
                    ic?.tax_amount_brl != null && String(ic.tax_amount_brl).trim() !== ""
                      ? undefined
                      : "anuncios-sell-popover__value--empty"
                  }
                >
                  {ic?.tax_amount_brl != null && String(ic.tax_amount_brl).trim() !== ""
                    ? formatBrlFromApiString(String(ic.tax_amount_brl))
                    : DASH}
                </strong>
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
                    ? formatBrlFromApiString(String(ic.operational_packaging_total_brl))
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

      <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block">
        <h4 className="anuncios-sell-popover__section-title">Resultado</h4>
        {block3Mode === "ok" && simRes != null ? (
          <>
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line">
                <span>Lucro líquido</span>
                <strong className={offerSemClass || undefined}>
                  {simRes?.profit_brl != null ? formatBrlFromApiString(String(simRes.profit_brl)) : DASH}
                </strong>
              </div>
            </div>
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line">
                <span>Margem</span>
                <strong className={offerSemClass || undefined}>
                  {simRes?.margin_pct != null && String(simRes.margin_pct).trim() !== ""
                    ? `${String(simRes.margin_pct).replace(".", ",")} %`
                    : DASH}
                </strong>
              </div>
            </div>
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
            <div className="anuncios-sell-popover__block">
              <div className="anuncios-sell-popover__line anuncios-sell-popover__line--status-offer">
                <span>Status da oferta</span>
                <strong className={offerSemClass || undefined}>
                  {simRes?.offer_status_label != null
                    ? String(simRes.offer_status_label)
                    : simRes?.offer_status != null
                      ? String(simRes.offer_status)
                      : DASH}
                </strong>
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
