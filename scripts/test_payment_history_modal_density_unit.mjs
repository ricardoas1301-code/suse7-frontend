#!/usr/bin/env node
/**
 * S1.HISTORICO-FINANCEIRO.4 — tooltip vencido + densidade interna modais Pix/Boleto
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PAYMENT_HISTORY_EXPIRED_TOOLTIP } from "../src/billing/paymentHistoryPresentation.js";

const root = dirname(fileURLToPath(import.meta.url));
const wideLayoutCssPath = join(root, "../src/billing/components/billingWideCheckoutLayout.css");
const pixCssPath = join(root, "../src/billing/components/PixCheckoutModal.css");
const boletoCssPath = join(root, "../src/billing/components/BillingBoletoModal.css");
const cardCssPath = join(root, "../src/billing/components/CardCheckoutModal.css");
const presentationPath = join(root, "../src/billing/paymentHistoryPresentation.js");

const wideLayoutCss = readFileSync(wideLayoutCssPath, "utf8");
const pixCss = readFileSync(pixCssPath, "utf8");
const boletoCss = readFileSync(boletoCssPath, "utf8");
const cardCss = readFileSync(cardCssPath, "utf8");
const presentationJs = readFileSync(presentationPath, "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const OLD_TOOLTIP =
  "Esta cobrança ultrapassou a data de vencimento e não pode mais ser paga por este boleto ou Pix.";
const NEW_TOOLTIP = "Esta cobrança ultrapassou a data de vencimento e não pode mais ser paga.";

assert("tooltip titulo preservado", PAYMENT_HISTORY_EXPIRED_TOOLTIP.title === "Cobrança vencida");
assert("tooltip texto novo", PAYMENT_HISTORY_EXPIRED_TOOLTIP.text === NEW_TOOLTIP);
assert("tooltip texto antigo removido da constante", !presentationJs.includes(OLD_TOOLTIP));
assert("tooltip texto antigo removido do export", PAYMENT_HISTORY_EXPIRED_TOOLTIP.text !== OLD_TOOLTIP);

assert("shell externo preservado largura", wideLayoutCss.includes("width: min(980px, calc(100vw - 48px))"));
assert("shell externo preservado padding", wideLayoutCss.includes("padding: 24px 28px 26px"));
assert("respiro vertical 12px pix boleto", wideLayoutCss.includes("--s7-billing-wide-checkout-viewport-gutter-y: 12px"));
assert("shell pix boleto ocupa area util", wideLayoutCss.includes("var(--s7-billing-wide-checkout-viewport-gutter-y, 12px) * 2"));
assert("shell externo preservado max-height cartao", wideLayoutCss.includes("- 48px"));
assert("densidade scoped pix boleto", /panel\.s7-billing-pix-checkout[\s\S]*panel\.s7-billing-boleto-checkout/.test(wideLayoutCss));
assert("tokens densidade compartilhados", wideLayoutCss.includes("--s7-billing-wide-density-visual-size"));
assert("breakpoint altura 820", wideLayoutCss.includes("@media (max-height: 820px)"));
assert("breakpoint altura 700 fallback scroll", wideLayoutCss.includes("@media (max-height: 700px)"));
assert("overflow fallback preservado", wideLayoutCss.includes("overflow-y: auto"));

assert("sem transform scale nos modais pix", !pixCss.includes("transform: scale"));
assert("sem css zoom nos modais pix", !/\bzoom\s*:/.test(pixCss));
assert("sem transform scale nos modais boleto", !boletoCss.includes("transform: scale"));
assert("sem css zoom nos modais boleto", !/\bzoom\s*:/.test(boletoCss));

assert("pix usa tokens densidade", pixCss.includes("var(--s7-billing-wide-density-visual-size)"));
assert("visual size dobrado no token base", wideLayoutCss.includes("clamp(336px, 56vh, 560px)"));
assert("pix qr quadrado", pixCss.includes("aspect-ratio: 1 / 1"));
assert("pix remove min-height 228", !pixCss.includes("min-height: 228px"));
assert("boleto usa tokens densidade", boletoCss.includes("var(--s7-billing-wide-density-visual-size)"));
assert("boleto remove min-height 228", !boletoCss.includes("min-height: 228px"));

assert("cartao nao recebe tokens densidade", !cardCss.includes("--s7-billing-wide-density-visual-size"));
assert("cartao preserva fit host", cardCss.includes("s7-billing-card-checkout__fit-host"));

if (failures.length) {
  console.error("[S1.HISTORICO-FINANCEIRO.4 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[S1.HISTORICO-FINANCEIRO.4 unit] OK");
