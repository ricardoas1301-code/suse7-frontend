#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-ML.3 — Densidade dos cards, grid 3/2/1, logo lockup, altura útil.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const cardCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationCard.css"),
  "utf8"
);
const cardJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationCard.jsx"),
  "utf8"
);
const pageCss = readFileSync(join(root, "../src/components/Profile/MercadoLivre.css"), "utf8");
const jsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");
const layoutJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceIntegrationPageLayout.jsx"),
  "utf8"
);
const presentationJs = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/mercadoLivrePresentation.js"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const heroBlock =
  pageCss.match(/\.ml-integrations-page \.profile-card\.ml-card\.s7-ml-integrations-hero\s*\{[^}]+\}/s)?.[0] ??
  "";
const gridBlock = cardCss.match(/\.s7-marketplace-integration-cards\s*\{[^}]+\}/s)?.[0] ?? "";
const cardBlock = cardCss.match(/\.s7-marketplace-integration-card\s*\{[^}]+\}/s)?.[0] ?? "";
const neutralFrameBlock =
  cardCss.match(/\.s7-marketplace-integration-card__logo-wrap--neutral\s*\{[^}]+\}/s)?.[0] ?? "";

assert("grid uses three columns on desktop", /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(gridBlock));
assert("grid falls back to two columns", /max-width:\s*1024px[\s\S]*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(cardCss));
assert("grid falls back to one column", /max-width:\s*640px[\s\S]*grid-template-columns:\s*1fr/.test(cardCss));
assert("card has no transform scale", !/transform:\s*scale/.test(cardCss));
assert("card uses structural min-height not fixed 115px", /min-height:\s*76px/.test(cardBlock));
assert("card avoids legacy 115px height lock", !/height:\s*115px/.test(cardCss));
assert("logo frame neutral variant has gray border", /border:\s*1px solid #e5e7eb/.test(neutralFrameBlock));
assert("logo frame neutral variant avoids yellow border", !/#fde68a/.test(neutralFrameBlock));
assert("market title uses primary text token", /\.s7-marketplace-integration-card__market[\s\S]*var\(--s7-text/.test(cardCss));
assert("market title is not blue", !/\.s7-marketplace-integration-card__market[\s\S]*#2563eb/.test(cardCss));
assert("internal gap tokens exist", /--s7-mi-card-gap-standard/.test(cardCss) && /--s7-mi-card-gap-after-market/.test(cardCss));
assert("generic card has no hardcoded Mercado Livre", !cardJsx.includes("Mercado Livre"));
assert("generic card accepts logo from props", cardJsx.includes("logoSrc") && cardJsx.includes("logoFrameVariant"));
assert("presentation exports oval card logo asset", presentationJs.includes("mercadolivre-logo-oval.png"));
assert("page passes presentation card logo", jsx.includes("mercadoLivrePresentation.logoCardSrc"));
assert("hero content wrapper present", layoutJsx.includes("s7-ml-integrations-hero__content"));
assert("redundant security footer removed from page", !jsx.includes("securityFooter="));
assert("market title uses account-scale typography", /\.s7-marketplace-integration-card__market[\s\S]*font-size:\s*13px/.test(cardCss));
assert("account name uses market-scale typography", /\.s7-marketplace-integration-card__account[\s\S]*font-size:\s*10px/.test(cardCss));
assert("hero uses min-height viewport fill", /min-height:\s*calc\([\s\S]*100dvh/.test(heroBlock));
assert("hero keeps auto growth", /height:\s*auto/.test(heroBlock));
assert("hero has no rigid 100vh height", !/height:\s*100vh/.test(heroBlock));
assert("redundant security footer css removed", !/ml-security-hint--footer/.test(pageCss));
assert("card meta column exists", cardJsx.includes("s7-marketplace-integration-card__meta"));
assert("no account-count conditional layout", !/:has\(\s*\.s7-marketplace-integration-card:nth|accounts\.length.*hero/.test(pageCss));
assert("presentation frame variant neutral", /logoFrameVariant:\s*"neutral"/.test(presentationJs));

if (failures.length) {
  console.error("[S1.INTEGRATIONS-ML.3 cards/layout unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-ML.3 cards/layout unit] OK");
