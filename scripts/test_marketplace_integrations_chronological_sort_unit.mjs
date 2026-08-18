#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-SYNC.2 — Ordenação cronológica das integrações marketplace.
 */
import {
  resolveIsPrimaryCompanyIntegration,
  resolveMarketplaceIntegrationConnectionCreatedAt,
  sortMarketplaceIntegrationsChronologically,
} from "../src/components/Profile/marketplaceIntegration/sortMarketplaceIntegrationsChronologically.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const companies = [
  { id: "co-primary", is_primary: true },
  { id: "co-b", is_primary: false },
  { id: "co-c", is_primary: false },
];

const integrations = [
  { id: "acc-newest", seller_company_id: "co-c", created_at: "2026-07-16T12:00:00.000Z" },
  { id: "acc-primary", seller_company_id: "co-primary", created_at: "2026-07-10T08:00:00.000Z" },
  { id: "acc-middle", seller_company_id: "co-b", created_at: "2026-07-12T09:00:00.000Z" },
  { id: "acc-oldest", seller_company_id: "co-b", created_at: "2026-07-08T07:00:00.000Z" },
];

const sorted = sortMarketplaceIntegrationsChronologically({ integrations, companies });

assert("primary integration always first", sorted[0].id === "acc-primary");
assert("non-primary sorted ascending by created_at", sorted.map((item) => item.id).join("|") === "acc-primary|acc-oldest|acc-middle|acc-newest");
assert("does not mutate source array", integrations[0].id === "acc-newest");
assert("timestamp resolver prefers connected_at", resolveMarketplaceIntegrationConnectionCreatedAt({
  connected_at: "2026-01-02T00:00:00.000Z",
  created_at: "2026-01-01T00:00:00.000Z",
}) === Date.parse("2026-01-02T00:00:00.000Z"));
assert("primary resolved by seller company id", resolveIsPrimaryCompanyIntegration({ seller_company_id: "co-primary" }, companies));
assert("missing timestamp goes after known timestamps", sortMarketplaceIntegrationsChronologically({
  integrations: [
    { id: "z-no-ts", seller_company_id: "co-b" },
    { id: "a-ts", seller_company_id: "co-b", created_at: "2026-01-01T00:00:00.000Z" },
  ],
  companies,
}).map((item) => item.id).join("|") === "a-ts|z-no-ts");
assert("timestamp tie breaks by stable id", sortMarketplaceIntegrationsChronologically({
  integrations: [
    { id: "b-acc", seller_company_id: "co-b", created_at: "2026-01-01T00:00:00.000Z" },
    { id: "a-acc", seller_company_id: "co-b", created_at: "2026-01-01T00:00:00.000Z" },
  ],
  companies,
}).map((item) => item.id).join("|") === "a-acc|b-acc");

const apiDesc = [
  { id: "acc-4", seller_company_id: "co-b" },
  { id: "acc-3", seller_company_id: "co-b" },
  { id: "acc-2", seller_company_id: "co-primary" },
  { id: "acc-1", seller_company_id: "co-b" },
];

assert(
  "api desc fallback becomes chronological asc for non-primary",
  sortMarketplaceIntegrationsChronologically({ integrations: apiDesc, companies }).map((item) => item.id).join("|") === "acc-2|acc-1|acc-3|acc-4"
);

if (failures.length) {
  console.error("[S1.INTEGRATIONS-SYNC.2 sort unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-SYNC.2 sort unit] OK");
