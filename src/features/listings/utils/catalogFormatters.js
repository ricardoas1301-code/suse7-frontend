import { formatCatalogBRL } from "../../../utils/productCatalogRow.js";

const HEALTH_BADGE_CLASS = {
  healthy: "products-catalog__health-badge--healthy",
  warn: "products-catalog__health-badge--warn",
  loss: "products-catalog__health-badge--loss",
  unknown: "products-catalog__health-badge--unknown",
};

const DASH = "—";
const SEM_DADO = "Sem dado";

/** Valores decimais serializados como string pela API — só formatação local. */
function formatBrlFromApiString(s) {
  if (s == null || s === "") return DASH;
  const n = Number(s);
  if (!Number.isFinite(n)) return DASH;
  return formatCatalogBRL(n);
}

/** Valor negativo (tarifa/frete) a partir da string decimal da API; null se inválido. */
function formatNegativeBrlFromApiString(s) {
  if (s == null || s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n === 0) return null;
  return `-${formatCatalogBRL(Math.abs(n))}`;
}

/**
 * “Você recebe” unitário: somente `marketplace_payout_amount` persistido (via `netReceiveBrl` na grid).
 * @param {{ netReceiveBrl?: string | null }} row
 */
function formatListingUnitNetBrl(row) {
  if (row.netReceiveBrl != null && String(row.netReceiveBrl).trim() !== "") {
    return formatBrlFromApiString(row.netReceiveBrl);
  }
  return DASH;
}

/** @param {number | null | undefined} v */
function formatMoneyOrDash(v) {
  if (v == null || !Number.isFinite(Number(v))) return DASH;
  return formatCatalogBRL(Number(v));
}

/** @param {string | null | undefined} pct */
function formatPercentFromApiString(pct) {
  if (pct == null || pct === "") return DASH;
  const n = Number(String(pct).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

/** Tarifa no modal “Raio-x”: mesma % consolidada da grid (`commission_percent`), sempre 2 casas decimais — só formatação. */
function formatCommissionPctForModal(pct) {
  if (pct == null || pct === "") return null;
  const n = Number(String(pct).trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * Tipo do anúncio + % da comissão: somente campos consolidados da grid (health/listing persistidos no backend).
 * Sem tipo isolado sem % — se faltar % persistida, exibe "—" ao lado do tipo.
 * @param {{ listingTypeLabel?: string | null; commissionPercent?: string | null }} row
 */
function buildListingTypeAndTariffSubtitle(row) {
  const label =
    row.listingTypeLabel != null && String(row.listingTypeLabel).trim() !== ""
      ? String(row.listingTypeLabel).trim()
      : null;
  const pct = formatCommissionPctForModal(row.commissionPercent);
  if (label && pct) return `${label} ${pct}`;
  if (label) return `${label} ${DASH}`;
  if (pct) return pct;
  return null;
}

/**
 * Raio-x — tarifa: somente `commission_amount_brl` (health/sync). Sem net_proceeds.
 * @param {{ commissionAmountBrl?: string | null }} row
 */
function pickModalSaleFeeFromBackend(row) {
  if (row.commissionAmountBrl != null && String(row.commissionAmountBrl).trim() !== "") {
    return formatNegativeBrlFromApiString(row.commissionAmountBrl) ?? DASH;
  }
  return DASH;
}

/**
 * @param {string | null | undefined} status
 * @param {number | null | undefined} score
 */
function qualityBadgeClass(status, score) {
  const s = String(status || "").toLowerCase();
  if (s.includes("prof") || s.includes("good") || s.includes("alto")) return "anuncios-catalog__metric-badge--good";
  if (s.includes("stand") || s.includes("med")) return "anuncios-catalog__metric-badge--mid";
  if (s.includes("basic") || s.includes("bajo") || s.includes("baix")) return "anuncios-catalog__metric-badge--low";
  if (score != null && Number.isFinite(Number(score))) {
    const n = Number(score) <= 1 ? Number(score) * 100 : Number(score);
    if (n >= 70) return "anuncios-catalog__metric-badge--good";
    if (n >= 40) return "anuncios-catalog__metric-badge--mid";
    return "anuncios-catalog__metric-badge--low";
  }
  return "anuncios-catalog__metric-badge--neutral";
}

/**
 * @param {string | null | undefined} status
 */
function experienceBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("green") || s.includes("good") || s.includes("ok") || s.includes("ótim") || s.includes("excel"))
    return "anuncios-catalog__metric-badge--good";
  if (s.includes("yellow") || s.includes("warn") || s.includes("med")) return "anuncios-catalog__metric-badge--mid";
  if (s.includes("red") || s.includes("bad") || s.includes("poor")) return "anuncios-catalog__metric-badge--low";
  return "anuncios-catalog__metric-badge--neutral";
}

/** Rótulo curto no Raio-x (apresentação; valores vêm do backend). */
const ML_MODAL_SHIPPING_TITLE = "Custo de envio";

/**
 * Raio-x — frete: colunas consolidadas da grid (health); sem net_proceeds.
 * @param {{ shippingCostBrl?: string | null; shippingCostAmountBrl?: string | null; shippingCostContext?: string | null; shippingCostSource?: string | null }} row
 */
function pickModalMercadoLivreShippingLine(row) {
  const src =
    row.shippingCostSource != null && String(row.shippingCostSource).trim() !== ""
      ? String(row.shippingCostSource).trim().toLowerCase()
      : "";
  const fmtNeg = (raw) => {
    if (raw == null || String(raw).trim() === "") return null;
    return formatNegativeBrlFromApiString(raw) ?? DASH;
  };
  const ctx = row.shippingCostContext ?? null;
  const sub =
    ctx === "free_for_buyer"
      ? "Grátis para o comprador"
      : ctx === "buyer_pays"
        ? "Por conta do comprador"
        : null;

  if (src === "unresolved") {
    return {
      title: ML_MODAL_SHIPPING_TITLE,
      value: DASH,
      sub,
    };
  }

  const rawAmt = row.shippingCostAmountBrl ?? row.shippingCostBrl;

  return {
    title: ML_MODAL_SHIPPING_TITLE,
    value: fmtNeg(rawAmt) ?? DASH,
    sub,
  };
}

export {
  HEALTH_BADGE_CLASS,
  DASH,
  SEM_DADO,
  formatBrlFromApiString,
  formatNegativeBrlFromApiString,
  formatListingUnitNetBrl,
  formatMoneyOrDash,
  formatPercentFromApiString,
  formatCommissionPctForModal,
  buildListingTypeAndTariffSubtitle,
  pickModalSaleFeeFromBackend,
  qualityBadgeClass,
  experienceBadgeClass,
  pickModalMercadoLivreShippingLine,
  ML_MODAL_SHIPPING_TITLE,
};
