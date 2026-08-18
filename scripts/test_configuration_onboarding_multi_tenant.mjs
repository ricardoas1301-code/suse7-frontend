#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01D.1 — isolamento multi-tenant (Case A / Case B).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const writeApi = readFileSync(
  join(root, "../src/features/dashboard/configurationOnboarding/configurationOnboardingWriteApi.js"),
  "utf8",
);
const actionsHost = readFileSync(
  join(root, "../src/features/dashboard/configurationOnboarding/ConfigurationOnboardingActionsHost.jsx"),
  "utf8",
);
const companiesHandler = readFileSync(
  join(root, "../../suse7-backend/src/handlers/seller/companies.js"),
  "utf8",
);

assert("write api scopes company id in path", writeApi.includes("encodeURIComponent(id)"));
assert("actions host resolves primary_seller_company_id", actionsHost.includes("primary_seller_company_id"));
assert("actions host no arbitrary company_id from payload", !actionsHost.includes("body.company_id"));
assert("backend patch filters by user_id", companiesHandler.includes('.eq("user_id", user.id)'));
assert("case A/B distinct path contract", writeApi.includes("/api/seller/companies/${encodeURIComponent(id)}"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ pass: true, test: "configuration_onboarding_multi_tenant_01d1", cases: 5 }, null, 2));
