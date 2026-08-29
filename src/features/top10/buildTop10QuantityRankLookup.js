// ======================================================================
// Lookup O(1): listing_id → { rank, quantitySold } a partir de listings_by_quantity.
// ======================================================================

import { isMercadoLivreMarketplace } from "../../utils/marketplaceListingId.js";
import { normalizarListingIdParaMatch } from "../listings/rayx/listingIdentity.js";
import { extrairListingIdDaVenda, resolverListingIdCompleto } from "../listings/rayx/listingIdentity.js";

/**
 * @typedef {{ rank: number; quantitySold: number | null }} Top10RankEntry
 */

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function parseRank(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
export function parseTop10QuantitySold(raw) {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

/**
 * @param {Map<string, Top10RankEntry>} map
 * @param {unknown} listingId
 * @param {Top10RankEntry} entry
 * @param {string} [marketplace]
 */
function indexListingId(map, listingId, entry, marketplace = "mercado_livre") {
  const raw = listingId != null ? String(listingId).trim() : "";
  if (!raw) return;
  if (!map.has(raw)) map.set(raw, entry);

  const norm = normalizarListingIdParaMatch(marketplace, raw);
  if (norm && !map.has(norm)) map.set(norm, entry);

  if (norm && /^\d+$/.test(norm)) {
    const withMlb = `MLB${norm}`;
    if (!map.has(withMlb)) map.set(withMlb, entry);
  }
}

/**
 * Constrói o mapa a partir do ranking canônico `listings_by_quantity`.
 *
 * @param {unknown} rankings
 * @returns {Map<string, Top10RankEntry>}
 */
export function buildTop10QuantityRankLookup(rankings) {
  /** @type {Map<string, Top10RankEntry>} */
  const map = new Map();
  if (!Array.isArray(rankings)) return map;

  for (const item of rankings) {
    if (item == null || typeof item !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (item);
    const rank = parseRank(row.rank);
    if (rank == null) continue;

    const marketplace =
      row.marketplace != null && String(row.marketplace).trim() !== ""
        ? String(row.marketplace).trim()
        : "mercado_livre";

    /** @type {Top10RankEntry} */
    const entry = {
      rank,
      quantitySold: parseTop10QuantitySold(row.quantity_sold),
    };

    indexListingId(map, row.listing_id, entry, marketplace);
    indexListingId(map, row.external_listing_id, entry, marketplace);
  }

  return map;
}

/**
 * @param {Map<string, Top10RankEntry> | null | undefined} rankByListingId
 * @param {unknown} listingId
 * @param {string} [marketplace]
 * @returns {Top10RankEntry | null}
 */
export function lookupTop10RankEntry(rankByListingId, listingId, marketplace = "mercado_livre") {
  if (!rankByListingId || rankByListingId.size === 0) return null;
  const raw = listingId != null ? String(listingId).trim() : "";
  if (!raw) return null;
  if (rankByListingId.has(raw)) return rankByListingId.get(raw) ?? null;

  const norm = normalizarListingIdParaMatch(marketplace, raw);
  if (norm && rankByListingId.has(norm)) return rankByListingId.get(norm) ?? null;
  if (norm && /^\d+$/.test(norm)) {
    const withMlb = `MLB${norm}`;
    if (rankByListingId.has(withMlb)) return rankByListingId.get(withMlb) ?? null;
  }
  return null;
}

/**
 * @param {Map<string, Top10RankEntry> | null | undefined} rankByListingId
 * @param {unknown} listingId
 * @param {string} [marketplace]
 * @returns {number | null}
 */
export function lookupTop10Rank(rankByListingId, listingId, marketplace = "mercado_livre") {
  return lookupTop10RankEntry(rankByListingId, listingId, marketplace)?.rank ?? null;
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {string}
 */
export function pickListingIdForTop10Badge(row) {
  if (!row || typeof row !== "object") return "";
  const fromVenda = extrairListingIdDaVenda(row);
  if (fromVenda) return fromVenda;
  const fromResolver = resolverListingIdCompleto(row);
  if (fromResolver) return fromResolver;
  // rankings.products: só correlaciona troféu 30d quando há exatamente 1 listing vinculado.
  const linked = Array.isArray(row.linked_listing_ids) ? row.linked_listing_ids : [];
  const uniq = [];
  const seen = new Set();
  for (const v of linked) {
    const id = v != null ? String(v).trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    uniq.push(id);
  }
  if (uniq.length === 1) return uniq[0];
  return "";
}

/**
 * Exibição amigável do nº do anúncio (ML: garante prefixo MLB quando for só dígitos).
 * @param {unknown} listingId
 * @param {unknown} [marketplace]
 */
export function formatListingIdForTop10Popover(listingId, marketplace) {
  const raw = listingId != null ? String(listingId).trim() : "";
  if (!raw) return "não informado";
  if (!isMercadoLivreMarketplace(marketplace)) return raw;
  if (/^MLB\d+$/i.test(raw)) return `MLB${raw.replace(/^MLB/i, "")}`;
  if (/^\d+$/.test(raw)) return `MLB${raw}`;
  return raw;
}

/**
 * @param {number} rank
 * @param {{ mode?: "last_30_days" | "dashboard"; periodLabel?: string | null; salesCount?: number | null }} [opts]
 */
export function buildTop10BadgeAriaLabel(rank, opts = {}) {
  const mode = opts.mode ?? "last_30_days";
  const salesCount = parseTop10QuantitySold(opts.salesCount);
  const hasCount = salesCount != null;
  const unit = salesCount === 1 ? "venda" : "vendas";

  if (mode === "last_30_days") {
    if (hasCount) {
      return `${rank}º anúncio mais vendido nos últimos 30 dias — ${salesCount} ${unit}`;
    }
    return `${rank}º anúncio mais vendido nos últimos 30 dias`;
  }

  const label = opts.periodLabel != null ? String(opts.periodLabel).trim() : "";
  if (hasCount && label) {
    return `${rank}º anúncio no ranking de mais vendidos — ${label} · ${salesCount} ${unit}`;
  }
  if (label) return `${rank}º anúncio no ranking de mais vendidos — ${label}`;
  if (hasCount) return `${rank}º anúncio no ranking de mais vendidos · ${salesCount} ${unit}`;
  return `${rank}º anúncio no ranking de mais vendidos`;
}

/**
 * Tooltip padrão do troféu (quando showTooltip=true).
 * Nunca inventa quantidade: sem salesCount canônico, omite o número.
 *
 * @param {number} rank
 * @param {{ mode?: "last_30_days" | "dashboard"; periodLabel?: string | null; salesCount?: number | null }} [opts]
 */
export function buildTop10BadgeTooltip(rank, opts = {}) {
  const mode = opts.mode ?? "last_30_days";
  const salesCount = parseTop10QuantitySold(opts.salesCount);
  const hasCount = salesCount != null;
  const unit = salesCount === 1 ? "venda" : "vendas";

  if (mode === "last_30_days") {
    if (hasCount) {
      return `${rank}º mais vendido nos últimos 30 dias — ${salesCount} ${unit}`;
    }
    return `${rank}º mais vendido nos últimos 30 dias`;
  }

  const label = opts.periodLabel != null ? String(opts.periodLabel).trim() : "";
  if (hasCount) {
    const base = label
      ? `${rank}º no ranking de mais vendidos — ${label}`
      : `${rank}º no ranking de mais vendidos`;
    return `${base} · ${salesCount} ${unit}`;
  }
  if (label) return `${rank}º no ranking de mais vendidos — ${label}`;
  return `${rank}º no ranking de mais vendidos`;
}
