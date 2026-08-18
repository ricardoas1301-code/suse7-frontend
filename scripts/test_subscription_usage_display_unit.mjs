import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Decimal from "decimal.js";
import { resolveMonthlyUsageDisplay } from "../src/billing/subscriptionUsage.js";

const root = dirname(fileURLToPath(import.meta.url));

const metered = resolveMonthlyUsageDisplay(
  {
    used_sales: 191,
    total_sales_month: 191,
    sales_limit: 5000,
    limit_sales_month: 5000,
    usage_percent: 3.82,
    period_start: "2026-06-17",
    period_end: "2026-07-16",
    usage_status: "available",
  },
  { monthly_sales_limit: 5000, usage_percent: 3.82 },
  5000,
);

assert.equal(metered.mode, "metered");
assert.equal(metered.percent, 3.82);
assert.equal(metered.barPercent, 3.82);
assert.match(metered.usageLabel, /191 de 5\.000/);
assert.match(metered.periodLabel, /2026/);

const meteredSource = readFileSync(join(root, "../src/billing/subscriptionUsage.js"), "utf8");
assert.doesNotMatch(meteredSource, /Math\.round\(\(used \/ limitNumber\)/);

const usageBarSource = readFileSync(join(root, "../src/billing/components/SubscriptionUsageBar.jsx"), "utf8");
assert.match(usageBarSource, /s7-billing-card-eyebrow/);
assert.match(usageBarSource, /s7-billing-usage-bar__meta-row/);

const zero = resolveMonthlyUsageDisplay(
  {
    used_sales: 0,
    total_sales_month: 0,
    sales_limit: 5000,
    usage_percent: 0,
    usage_status: "available",
  },
  { monthly_sales_limit: 5000, usage_percent: 0 },
  5000,
);
assert.equal(zero.used, 0);
assert.equal(zero.percent, 0);

const unavailable = resolveMonthlyUsageDisplay(null, null, null, { usageUnavailable: true });
assert.equal(unavailable.mode, "unavailable");
assert.equal(unavailable.usageLabel, "Consumo indisponível");

const loading = resolveMonthlyUsageDisplay(null, null, null, { loading: true });
assert.equal(loading.mode, "loading");

assert.equal(
  new Decimal(838).div(5000).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
  16.76,
);
assert.equal(
  new Decimal(887).div(5000).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
  17.74,
);

const cancelModalSource = readFileSync(join(root, "../src/billing/components/SubscriptionCancelModal.jsx"), "utf8");
assert.doesNotMatch(cancelModalSource, /Manter assinatura/);
assert.match(cancelModalSource, /profile-modal-backdrop/);
assert.match(cancelModalSource, /profile-modal s7-billing-cancel-modal/);

const pageSource = readFileSync(join(root, "../src/billing/pages/SubscriptionPage.jsx"), "utf8");
assert.doesNotMatch(pageSource, /Atualizar status/);
assert.doesNotMatch(pageSource, /BillingUsageNotice/);
assert.match(pageSource, /Status financeiro, acesso e consumo consolidados\./);
assert.match(pageSource, /actions=\{/);
const alterarPlanoMatches = pageSource.match(/Alterar plano/g) ?? [];
assert.equal(alterarPlanoMatches.length, 1, "Alterar plano deve aparecer uma única vez");
assert.match(pageSource, /Cancelar assinatura/);

const summarySource = readFileSync(join(root, "../src/billing/components/SubscriptionSummaryCard.jsx"), "utf8");
assert.doesNotMatch(summarySource, /Consumo atual do m/i);
assert.match(summarySource, /s7-billing-card-eyebrow/);

console.log("[OK] test_subscription_usage_display_unit.mjs");
