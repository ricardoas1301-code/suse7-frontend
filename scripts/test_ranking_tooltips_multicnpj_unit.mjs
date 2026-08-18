#!/usr/bin/env node
/**
 * S1.RANKING-TOOLTIPS-MULTICNPJ.1 — tooltips laterais + logo multicNPJ
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildRankingTooltipCompanyLookup } from "../src/components/sales/rankingTooltipCompanyLookup.js";

const root = dirname(fileURLToPath(import.meta.url));
const popoverJsx = readFileSync(join(root, "../src/components/sales/TopRankingListingPopover.jsx"), "utf8");
const popoverCss = readFileSync(join(root, "../src/components/sales/SalesTopRankingCard.css"), "utf8");
const rankingCardJsx = readFileSync(join(root, "../src/components/sales/SalesTopRankingCard.jsx"), "utf8");
const topProductsJsx = readFileSync(
  join(root, "../src/components/dashboard/S7DailySummaryTopProducts.jsx"),
  "utf8"
);
const providerJsx = readFileSync(
  join(root, "../src/components/sales/RankingTooltipCompanyProvider.jsx"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("left-center placement supported", popoverJsx.includes('"left-center"'));
assert("right-center placement supported", popoverJsx.includes('"right-center"'));
assert("vendas list defaults left-center", popoverJsx.includes('placement = "left-center"'));
assert("sales list passes popover placement", rankingCardJsx.includes("popoverPlacement"));
assert("dashboard top3 uses right-center", topProductsJsx.includes('popoverPlacement="right-center"'));
assert("popover pointer-events none", /sales-top-ranking__listing-popover[\s\S]*pointer-events:\s*none/.test(popoverCss));
assert("copy controls pointer-events auto", popoverCss.includes("pointer-events: auto"));
assert("company mark in panel", popoverJsx.includes("sales-top-ranking__listing-popover__company-mark"));
assert("uses ranking company provider", popoverJsx.includes("useRankingTooltipCompany"));
assert("provider loads companies once", providerJsx.includes("/api/seller/companies"));
assert("no api fetch on hover in popover", !popoverJsx.includes("apiFetch"));

const oneCompany = buildRankingTooltipCompanyLookup([{ id: "c1", company_name: "A" }], []);
assert("one company hides logo", oneCompany.showCompanyLogo === false);
assert("one company resolves null", oneCompany.resolveCompanyForRankingItem({ marketplace_account_id: "acc1" }) === null);

const multi = buildRankingTooltipCompanyLookup(
  [
    { id: "c1", company_name: "Empresa A", logo_url: "https://x/a.png" },
    { id: "c2", company_name: "Empresa B" },
  ],
  [{ id: "acc1", seller_company_id: "c1" }]
);
assert("two companies shows logo", multi.showCompanyLogo === true);
const resolved = multi.resolveCompanyForRankingItem({ marketplace_account_id: "acc1" });
assert("resolves correct company", resolved?.id === "c1" && resolved?.logoUrl.includes("a.png"));
assert("fallback initial when no logo", multi.resolveCompanyForRankingItem({ marketplace_account_id: "acc2" }) === null);

const wrongAcc = multi.resolveCompanyForRankingItem({ marketplace_account_id: "unknown" });
assert("unknown account no arbitrary logo", wrongAcc === null);

if (failures.length) {
  console.error("[S1.RANKING-TOOLTIPS-MULTICNPJ.1 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.RANKING-TOOLTIPS-MULTICNPJ.1 unit] OK");
