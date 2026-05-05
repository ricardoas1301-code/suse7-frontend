// ======================================================
// Comparativo Raio-X — Concorrência S7
// Estrutura DOM alinhada a MercadoLivrePricingScenarioCompareCard +
// MercadoLivrePricingScenarioRaiox (seções Receita / Custos / Resultado).
// Valores exibidos vêm da API; rótulos PT-BR de ação são só apresentação.
// ======================================================

import S7Button from "../ui/S7Button";

const DASH = "—";

/**
 * @param {unknown} n
 * @returns {string}
 */
function formatBrl(n) {
  if (n == null || n === "") return DASH;
  const x = Number(String(n).replace(",", "."));
  if (!Number.isFinite(x)) return DASH;
  return x.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @param {unknown} n
 * @returns {string}
 */
function formatPct(n) {
  if (n == null || n === "") return DASH;
  const x = Number(String(n).replace(",", "."));
  if (!Number.isFinite(x)) return DASH;
  return `${x.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} %`;
}

/**
 * @param {string | undefined} status
 */
function statusValueClass(status) {
  const s = String(status || "");
  if (s === "GANHANDO" || s === "OPORTUNIDADE") return "anuncios-sell-popover__offer-sem--great";
  if (s === "PERDENDO") return "anuncios-sell-popover__offer-sem--danger";
  if (s === "RISCO") return "anuncios-sell-popover__offer-sem--critical";
  if (s === "MANTER") return "anuncios-sell-popover__offer-sem--acceptable";
  return "";
}

/**
 * @param {string | undefined} status
 */
function suggestedActionLabel(status) {
  const s = String(status || "");
  if (s === "OPORTUNIDADE") return "Avaliar ajuste de preço";
  if (s === "RISCO") return "Revisar margem / custos";
  if (s === "PERDENDO") return "Analisar competitividade";
  if (s === "GANHANDO") return "Manter posição";
  return "Aguardar sinal da engine";
}

/**
 * @param {{ label: string; value: string; lineClass?: string; strongClass?: string }} props
 */
function RaioxLine({ label, value, lineClass = "", strongClass = "" }) {
  return (
    <div className={["anuncios-sell-popover__line", lineClass].filter(Boolean).join(" ")}>
      <span>{label}</span>
      <strong className={[strongClass || "", value === DASH ? "anuncios-sell-popover__value--empty" : ""].filter(Boolean).join(" ") || undefined}>
        {value}
      </strong>
    </div>
  );
}

/**
 * @param {{
 *   listing: Record<string, unknown> | null | undefined;
 *   insight: Record<string, unknown> | null | undefined;
 * }} props
 */
export function ConcorrenciaSellerRaioxCard({ listing, insight }) {
  const st = insight?.status != null ? String(insight.status) : DASH;
  const stClass = statusValueClass(st);
  const rawListingTitle = String(listing?.title ?? "").trim();
  const titleLine = rawListingTitle
    ? `${rawListingTitle.slice(0, 64)}${rawListingTitle.length > 64 ? "…" : ""}`
    : null;

  return (
    <article className="s7-ml-scenario-compare__card s7-ml-scenario-compare__card--baseline" data-concorrencia-card="seller">
      <header className="s7-ml-scenario-compare__card-head">
        <div className="s7-ml-scenario-compare__card-head-line">
          <div className="s7-ml-scenario-compare__card-title-stack">
            <span className="s7-ml-scenario-compare__card-title">Seu produto</span>
            {titleLine ? (
              <span className="s7-ml-scenario-compare__card-vigencia" title={String(listing?.title ?? "")}>
                {titleLine}
              </span>
            ) : null}
          </div>
        </div>
      </header>
      <div className="s7-ml-scenario-compare__card-body">
        <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block">
          <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Preço atual" value={formatBrl(listing?.price)} lineClass="anuncios-sell-popover__line--key" />
          </div>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Comissão" value={DASH} />
            <RaioxLine label="Frete" value={DASH} />
            <RaioxLine label="Taxa fixa" value={DASH} />
            <RaioxLine label="Você recebe" value={DASH} />
          </div>
        </div>

        <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block">
          <h4 className="anuncios-sell-popover__section-title">Custos internos</h4>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Custo do produto" value={DASH} />
          </div>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Impostos" value={DASH} />
          </div>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Operação + embalagem" value={DASH} />
          </div>
        </div>

        <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block anuncios-sell-popover__section--raiox-resultado">
          <h4 className="anuncios-sell-popover__section-title">Resultado</h4>
          <div className="anuncios-sell-popover__block">
            <RaioxLine
              label="Lucro líquido"
              value={formatBrl(insight?.estimated_profit)}
              lineClass="anuncios-sell-popover__line--raiox-result-metric"
              strongClass={stClass}
            />
          </div>
          <div className="anuncios-sell-popover__block">
            <RaioxLine
              label="Margem"
              value={insight?.estimated_margin != null ? formatPct(insight.estimated_margin) : DASH}
              lineClass="anuncios-sell-popover__line--raiox-result-metric"
              strongClass={stClass}
            />
          </div>
          <div className="anuncios-sell-popover__block">
            <RaioxLine
              label="Status"
              value={st}
              lineClass="anuncios-sell-popover__line--status-offer anuncios-sell-popover__line--raiox-result-metric"
              strongClass={stClass}
            />
          </div>
        </div>
        <p className="anuncios-sell-popover__note">
          Tarifas detalhadas e repasse líquido vêm da Precificação inteligente; aqui apenas leitura do snapshot da engine de
          concorrência.
        </p>
      </div>
    </article>
  );
}

/**
 * @param {{
 *   slotIndex: number;
 *   competitor: Record<string, unknown> | null;
 *   myPrice: number | null;
 *   insight: Record<string, unknown> | null | undefined;
 *   onSelectClick: () => void;
 *   selectBusy?: boolean;
 *   marketplaceBadge?: string | null;
 * }} props
 */
export function ConcorrenciaCompetitorRaioxCard({
  slotIndex,
  competitor,
  myPrice,
  insight,
  onSelectClick,
  selectBusy,
  marketplaceBadge = null,
}) {
  const title = `Concorrente ${slotIndex + 1}`;

  if (!competitor) {
    return (
      <article className="s7-ml-scenario-compare__card s7-ml-scenario-compare__card--baseline" data-concorrencia-card={`empty-${slotIndex}`}>
        <header className="s7-ml-scenario-compare__card-head">
          <div className="s7-ml-scenario-compare__card-head-line">
            <div className="s7-ml-scenario-compare__card-title-stack">
              <span className="s7-ml-scenario-compare__card-title">{title}</span>
            </div>
          </div>
        </header>
        <div className="s7-ml-scenario-compare__card-body">
          <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block">
            <p className="anuncios-sell-popover__future-placeholder">Nenhum concorrente selecionado.</p>
            <div style={{ marginTop: 12 }}>
              <S7Button type="button" variant="primary" size="sm" onClick={onSelectClick} disabled={selectBusy} loading={selectBusy}>
                Selecionar concorrente
              </S7Button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  const compPriceRaw = competitor.competitor_price;
  const compPrice = compPriceRaw != null ? Number(String(compPriceRaw).replace(",", ".")) : null;
  let diffBrl = DASH;
  let diffPct = DASH;
  let posicao = DASH;
  if (myPrice != null && Number.isFinite(myPrice) && compPrice != null && Number.isFinite(compPrice) && myPrice !== 0) {
    const d = compPrice - myPrice;
    diffBrl = formatBrl(d);
    diffPct = `${((d / myPrice) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} %`;
    if (compPrice < myPrice) posicao = "Abaixo do seu preço";
    else if (compPrice > myPrice) posicao = "Acima do seu preço";
    else posicao = "Alinhado ao seu preço";
  }

  const st = insight?.status != null ? String(insight.status) : DASH;
  const stClass = statusValueClass(st);
  const sug =
    insight?.suggested_price != null && String(insight.suggested_price).trim() !== "" ? formatBrl(insight.suggested_price) : DASH;

  const rawCompTitle = String(competitor.competitor_title ?? "").trim();
  const subTitle = rawCompTitle
    ? `${rawCompTitle.slice(0, 64)}${rawCompTitle.length > 64 ? "…" : ""}`
    : competitor.competitor_seller_id != null
      ? `Seller ${String(competitor.competitor_seller_id).slice(0, 20)}`
      : null;

  return (
    <article className="s7-ml-scenario-compare__card s7-ml-scenario-compare__card--available" data-concorrencia-card={`competitor-${slotIndex}`}>
      <header className="s7-ml-scenario-compare__card-head">
        <div className="s7-ml-scenario-compare__card-head-line">
          <div className="s7-ml-scenario-compare__card-title-stack">
            <span className="s7-ml-scenario-compare__card-title">{title}</span>
            {subTitle ? (
              <span className="s7-ml-scenario-compare__card-vigencia" title={String(competitor.competitor_title ?? "")}>
                {subTitle}
              </span>
            ) : null}
          </div>
          {marketplaceBadge != null && String(marketplaceBadge).trim() !== "" ? (
            <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available">{String(marketplaceBadge).trim()}</span>
          ) : null}
        </div>
      </header>
      <div className="s7-ml-scenario-compare__card-body">
        <div className="anuncios-sell-popover__section anuncios-pricing-modal__raiox-block">
          <h4 className="anuncios-sell-popover__section-title">Receita do marketplace</h4>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Preço anunciado" value={formatBrl(competitor.competitor_price)} lineClass="anuncios-sell-popover__line--key" />
          </div>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Frete" value={DASH} />
            <RaioxLine label="Tipo de anúncio" value={competitor.competitor_listing_type != null ? String(competitor.competitor_listing_type) : DASH} />
            <RaioxLine label="Reputação" value={competitor.competitor_reputation != null ? String(competitor.competitor_reputation) : DASH} />
          </div>
        </div>

        <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block">
          <h4 className="anuncios-sell-popover__section-title">Comparação</h4>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Diferença vs. você" value={diffBrl} />
            <RaioxLine label="Diferença %" value={diffPct} />
            <RaioxLine label="Posição" value={posicao} />
          </div>
        </div>

        <div className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block anuncios-sell-popover__section--raiox-resultado">
          <h4 className="anuncios-sell-popover__section-title">Sugestão S7</h4>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Ação sugerida" value={suggestedActionLabel(st)} lineClass="anuncios-sell-popover__line--raiox-result-metric" />
          </div>
          <div className="anuncios-sell-popover__block">
            <RaioxLine label="Preço sugerido" value={sug} lineClass="anuncios-sell-popover__line--raiox-result-metric" strongClass={stClass} />
          </div>
          <div className="anuncios-sell-popover__block">
            <RaioxLine
              label="Status"
              value={st}
              lineClass="anuncios-sell-popover__line--status-offer anuncios-sell-popover__line--raiox-result-metric"
              strongClass={stClass}
            />
          </div>
        </div>

        {competitor.competitor_permalink ? (
          <p className="anuncios-sell-popover__note" style={{ marginTop: 8 }}>
            <a className="concorrencia-raiox__permalink" href={String(competitor.competitor_permalink)} target="_blank" rel="noreferrer">
              Abrir no marketplace
            </a>
          </p>
        ) : null}
      </div>
    </article>
  );
}
