#!/usr/bin/env node
/**
 * CPJ 4 — unit: tooltip com quantity_sold + lookup + Dashboard sem tooltip + Top 3 label.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseHTML } from "linkedom";

const feRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const lookupUrl = pathToFileURL(
  path.join(feRoot, "src/features/top10/buildTop10QuantityRankLookup.js"),
).href;
const paramsUrl = pathToFileURL(
  path.join(feRoot, "src/features/top10/buildLocalLast30DaysTop10Params.js"),
).href;
const periodUrl = pathToFileURL(
  path.join(feRoot, "src/features/vendas/filters/vendasFiltersPeriod.js"),
).href;

const {
  buildTop10QuantityRankLookup,
  lookupTop10Rank,
  lookupTop10RankEntry,
  pickListingIdForTop10Badge,
  buildTop10BadgeAriaLabel,
  buildTop10BadgeTooltip,
} = await import(lookupUrl);

const { buildLocalLast30DaysTop10Params } = await import(paramsUrl);
const { getDefaultLast30DaysRange } = await import(periodUrl);

// —— Lookup + quantitySold ——
const rankings = [
  { rank: 1, listing_id: "MLB111", external_listing_id: "MLB111", quantity_sold: 50 },
  { rank: 2, listing_id: "222", external_listing_id: "MLB222", quantity_sold: 1 },
  { rank: 7, listing_id: "MLB777", external_listing_id: null, quantity_sold: 20 },
  { rank: 10, listing_id: "MLB999", external_listing_id: "MLB999", quantity_sold: 0 },
];

const map = buildTop10QuantityRankLookup(rankings);
assert.equal(lookupTop10Rank(map, "MLB111"), 1);
assert.equal(lookupTop10RankEntry(map, "MLB111")?.quantitySold, 50);
assert.equal(lookupTop10RankEntry(map, "222")?.quantitySold, 1);
assert.equal(lookupTop10RankEntry(map, "MLB777")?.quantitySold, 20);
assert.equal(lookupTop10Rank(map, "ghost"), null);

assert.equal(pickListingIdForTop10Badge({ listing_id_display: "MLB111" }), "MLB111");
assert.equal(pickListingIdForTop10Badge({ externalId: "MLB222" }), "MLB222");
assert.equal(
  pickListingIdForTop10Badge({ linked_listing_ids: ["MLB555"], linked_listings_count: 1 }),
  "MLB555",
);
assert.equal(
  pickListingIdForTop10Badge({ linked_listing_ids: ["MLB1", "MLB2"], linked_listings_count: 2 }),
  "",
);

/** Espelha normalizeLinkedListingIds (evita import Vite sem extensão no Node). */
function normalizeLinkedListingIdsLocal(item) {
  const raw = item?.linked_listing_ids;
  if (!Array.isArray(raw)) return [];
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const v of raw) {
    const id = v != null ? String(v).trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

assert.deepEqual(normalizeLinkedListingIdsLocal({ linked_listing_ids: ["MLB2", "MLB1", "MLB2"] }), [
  "MLB2",
  "MLB1",
]);
assert.equal(normalizeLinkedListingIdsLocal({ linked_listing_ids: ["MLB555"] }).length, 1);
assert.equal(normalizeLinkedListingIdsLocal({ linked_listing_ids: ["A", "B"] }).length, 2);
assert.equal(
  normalizeLinkedListingIdsLocal({ linked_listing_ids: ["A", "B"] }).length === 2 &&
    pickListingIdForTop10Badge({ linked_listing_ids: ["A", "B"] }) === "",
  true,
);

// —— Tooltip singular/plural ——
assert.equal(
  buildTop10BadgeTooltip(1, { mode: "last_30_days", salesCount: 50 }),
  "1º mais vendido nos últimos 30 dias — 50 vendas",
);
assert.equal(
  buildTop10BadgeTooltip(7, { mode: "last_30_days", salesCount: 20 }),
  "7º mais vendido nos últimos 30 dias — 20 vendas",
);
assert.equal(
  buildTop10BadgeTooltip(7, { mode: "last_30_days", salesCount: 1 }),
  "7º mais vendido nos últimos 30 dias — 1 venda",
);
assert.equal(
  buildTop10BadgeTooltip(3, { mode: "last_30_days", salesCount: null }),
  "3º mais vendido nos últimos 30 dias",
);
assert.ok(buildTop10BadgeAriaLabel(1, { mode: "last_30_days", salesCount: 50 }).includes("50 vendas"));
assert.equal(
  buildTop10BadgeAriaLabel(4, { mode: "last_30_days", salesCount: 17 }),
  "4º anúncio mais vendido nos últimos 30 dias — 17 vendas",
);

// —— Scope 30 dias ——
const range = getDefaultLast30DaysRange();
const params = buildLocalLast30DaysTop10Params({ marketplaceAccountId: "acc-a" });
assert.equal(params.period_preset, "custom");
assert.equal(params.start_date, range.startDate);
assert.equal(params.end_date, range.endDate);
assert.equal(params.marketplace_account_id, "acc-a");

// —— Arte / showTooltip ——
const badgeSrc = fs.readFileSync(path.join(feRoot, "src/components/top10/S7Top10Badge.jsx"), "utf8");
assert.ok(badgeSrc.includes("salesCount"));
assert.ok(badgeSrc.includes("showTooltip"));
assert.ok(badgeSrc.includes("if (!showTooltip)"));
assert.ok(badgeSrc.includes("fitContent"));
assert.ok(badgeSrc.includes("translateX(-2.5px)") === false); // translate is CSS
assert.ok(!badgeSrc.includes('id="s7-metal-a"'));

const tooltipCss = fs.readFileSync(path.join(feRoot, "src/components/ui/S7Tooltip.css"), "utf8");
assert.ok(tooltipCss.includes("s7-tooltip-portal__bubble--fit-content"));
assert.ok(tooltipCss.includes("max-width: min(420px, calc(100vw - 16px))"));
assert.ok(!/bubble--fit-content[\s\S]{0,200}text-overflow:\s*ellipsis/.test(tooltipCss));

const tip =
  buildTop10BadgeTooltip(1, { mode: "last_30_days", salesCount: 78 });
assert.equal(tip, "1º mais vendido nos últimos 30 dias — 78 vendas");
assert.ok(!tip.includes("…"));
assert.ok(!tip.includes("..."));
assert.ok(tip.includes("últimos 30 dias"));
assert.ok(tip.endsWith("78 vendas"));

const cssSrc = fs.readFileSync(path.join(feRoot, "src/components/top10/S7Top10Badge.css"), "utf8");
assert.ok(cssSrc.includes("translateX(-2.5px)"));
assert.ok(cssSrc.includes("prefers-reduced-motion"));
assert.ok(badgeSrc.includes("s7-top10-badge__tip-sales"));
assert.ok(badgeSrc.includes("tipContent"));
assert.ok(cssSrc.includes("s7-top10-badge__tip-sales"));
assert.ok(cssSrc.includes("#16a34a"));

const cardSrc = fs.readFileSync(path.join(feRoot, "src/components/sales/SalesTopRankingCard.jsx"), "utf8");
assert.ok(cardSrc.includes("showTooltip={false}") || cardSrc.includes("trophyShowTooltip"));
assert.ok(cardSrc.includes("listRankArrayOffset"));
assert.ok(cardSrc.includes("resolveTrophyRank"));

// Dashboard quantity podium still disables tooltip
assert.ok(cardSrc.includes("showTooltip={false}"));

const top3Src = fs.readFileSync(
  path.join(feRoot, "src/components/dashboard/S7DailySummaryTopProducts.jsx"),
  "utf8",
);
assert.ok(top3Src.includes("Top 3 do dia"));
assert.ok(!top3Src.includes("Top 3 Produtos"));
assert.ok(top3Src.includes("listRankArrayOffset={0}"));
assert.ok(top3Src.includes("resolveTrophyRank"));
assert.ok(top3Src.includes("pickListingIdForTop10Badge"));
assert.ok(top3Src.includes("normalizeLinkedListingIds"));
assert.ok(top3Src.includes("linked.length !== 1"));
assert.ok(top3Src.includes('trophyPlacement="after-thumb"'));
assert.ok(top3Src.includes('listAriaLabel="Top 3 do dia"'));

const listSrc = fs.readFileSync(
  path.join(feRoot, "src/components/sales/SalesTopRankingCard.jsx"),
  "utf8",
);
assert.ok(listSrc.includes('trophyPlacement = "replace-rank"'));
assert.ok(listSrc.includes("trophyAfterThumb"));
assert.ok(listSrc.includes("list-trophy-after"));
assert.ok(listSrc.includes("hasTrophyResolver"));

const listCss = fs.readFileSync(
  path.join(feRoot, "src/components/sales/SalesTopRankingCard.css"),
  "utf8",
);
assert.ok(listCss.includes("list-item--trophy-after-thumb-has-badge"));
assert.ok(listCss.includes("list-trophy-after"));

const popoverUtils = fs.readFileSync(
  path.join(feRoot, "src/components/sales/salesTopRankingUtils.js"),
  "utf8",
);
assert.ok(popoverUtils.includes("formatListingIdForPopoverDisplay"));
assert.ok(popoverUtils.includes("normalizeLinkedListingIds"));
assert.ok(popoverUtils.includes("Anúncios vinculados:"));
assert.ok(popoverUtils.includes("MLB"));

const popoverSrc = fs.readFileSync(
  path.join(feRoot, "src/components/sales/TopRankingListingPopover.jsx"),
  "utf8",
);
assert.ok(popoverSrc.includes("isMultiListing"));
assert.ok(popoverSrc.includes("linkedListingIdsDisplay"));

const beSerializeHint = fs.readFileSync(
  path.join(feRoot, "src/components/dashboard/S7DailySummaryTopProducts.jsx"),
  "utf8",
);
assert.ok(beSerializeHint.includes("exatamente 1 listing") || beSerializeHint.includes("length !== 1"));

// —— DOM smoke ——
const { document, window } = parseHTML("<!doctype html><html><body></body></html>");
globalThis.document = document;
globalThis.window = window;
globalThis.HTMLElement = window.HTMLElement;

const ranksToRender = [1, 2, 3, 4, 10];
const gradientIds = new Set();
for (const r of ranksToRender) {
  const id = `s7-top10-metal-test${r}`;
  gradientIds.add(id);
  const el = document.createElement("div");
  el.setAttribute("data-rank", String(r));
  el.innerHTML = `<svg><defs><linearGradient id="${id}"></linearGradient></defs></svg>`;
  if (r <= 3) el.innerHTML += `<svg class="s7-top10-badge__fire"></svg>`;
  document.body.appendChild(el);
}
assert.equal(gradientIds.size, 5);
assert.equal(document.querySelectorAll(".s7-top10-badge__fire").length, 3);

assert.ok(cardSrc.includes("trophySize={listTrophySize}"));
assert.ok(cardSrc.includes("list--compact-trophy"));
assert.ok(cardSrc.includes("listTrophySize = 26"));

const panelSrc = fs.readFileSync(
  path.join(feRoot, "src/components/sales/VendasExecutivePanel.jsx"),
  "utf8",
);
assert.ok(panelSrc.includes("listTrophySize={tituloExternoTop10 ? 22 : 26}"));

const concorrenciaSrc = fs.readFileSync(
  path.join(feRoot, "src/pages/ConcorrenciaPage.jsx"),
  "utf8",
);
assert.ok(concorrenciaSrc.includes("useS7Top10Ranking"));
assert.ok(concorrenciaSrc.includes("S7RankedThumbnail"));
assert.ok(concorrenciaSrc.includes("resolverListingIdCanonicoConcorrencia"));
assert.ok(concorrenciaSrc.includes("getTop10EntryForMonitoredRow"));
assert.ok(concorrenciaSrc.includes("top10Rank"));
assert.ok(concorrenciaSrc.includes("concorrencia-catalog__ranked-thumb"));
assert.ok(concorrenciaSrc.includes("size={26}"));
assert.ok(!/comp-thumb[\s\S]{0,200}S7RankedThumbnail/.test(concorrenciaSrc));

const concorrenciaCss = fs.readFileSync(path.join(feRoot, "src/pages/ConcorrenciaPage.css"), "utf8");
assert.ok(concorrenciaCss.includes("concorrencia-catalog__ranked-thumb"));

console.log("[OK] test_cpj4_top10_badge_lookup_unit");
