#!/usr/bin/env node
/**
 * CPJ-2 T1 hotfix — CTA Reconectar account-aware inicia OAuth da conta certa.
 * Contrato: open_marketplace_connect + marketplace_account_id + seller_company_id
 * → /ml/connect?seller_company_id=…&intent=reconnect (não só Integrações).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROTA_INTEGRACOES_MERCADO_LIVRE,
  resolveOperationalMarketplaceConnectRoute,
} from "../src/features/dashboard/operationalTasks/resolveOperationalMarketplaceConnectRoute.js";

const root = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(root, "..", rel), "utf8");

const ACCOUNT_GO = "22222222-2222-4222-8222-222222222222";
const ACCOUNT_RP = "11111111-1111-4111-8111-111111111111";
const COMPANY_GO = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const COMPANY_RP = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

let passed = 0;
/** @type {string[]} */
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`✗ ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

const reconnectGoTask = {
  id: `ml_initial_sync_pending:${ACCOUNT_GO}`,
  type: "ml_initial_sync_pending",
  title: "Reconectar Mercado Livre",
  marketplace_account_id: ACCOUNT_GO,
  seller_company_id: COMPANY_GO,
  store_name: "SMR - GO",
  action: { type: "open_marketplace_connect", label: "Reconectar" },
};

const reconnectRpTask = {
  id: `ml_initial_sync_pending:${ACCOUNT_RP}`,
  type: "ml_initial_sync_pending",
  title: "Reconectar Mercado Livre",
  marketplace_account_id: ACCOUNT_RP,
  seller_company_id: COMPANY_RP,
  store_name: "SMR - RP",
  action: { type: "open_marketplace_connect", label: "Reconectar" },
};

const connectInitialTask = {
  id: "marketplace_connect_pending",
  type: "marketplace_connect_pending",
  title: "Conectar Mercado Livre",
  action: { type: "open_marketplace_connect", label: "Conectar" },
};

test("CTA_RECONNECT_GO_RESOLVES_OAUTH_ROUTE", () => {
  const r = resolveOperationalMarketplaceConnectRoute(reconnectGoTask);
  assert.equal(r.kind, "oauth_reconnect");
  assert.equal(r.marketplace_account_id, ACCOUNT_GO);
  assert.equal(r.seller_company_id, COMPANY_GO);
  assert.ok(r.path?.startsWith("/ml/connect?"));
  assert.ok(r.path?.includes(`seller_company_id=${COMPANY_GO}`));
  assert.ok(r.path?.includes("intent=reconnect"));
  assert.notEqual(r.path, ROTA_INTEGRACOES_MERCADO_LIVRE);
});

test("CTA_RECONNECT_DOES_NOT_COLLAPSE_AS_PRIMARY_ACTION", () => {
  // O recolhimento do painel é UX controlada; a ação principal é a rota OAuth.
  const r = resolveOperationalMarketplaceConnectRoute(reconnectGoTask);
  assert.equal(r.kind, "oauth_reconnect");
  assert.ok(r.path);
});

test("TWO_ACCOUNTS_NOT_CONFUSED", () => {
  const go = resolveOperationalMarketplaceConnectRoute(reconnectGoTask);
  const rp = resolveOperationalMarketplaceConnectRoute(reconnectRpTask);
  assert.notEqual(go.path, rp.path);
  assert.notEqual(go.seller_company_id, rp.seller_company_id);
  assert.notEqual(go.marketplace_account_id, rp.marketplace_account_id);
  assert.ok(go.path?.includes(COMPANY_GO));
  assert.ok(rp.path?.includes(COMPANY_RP));
  assert.ok(!go.path?.includes(COMPANY_RP));
  assert.ok(!rp.path?.includes(COMPANY_GO));
});

test("HEALTHY_ACCOUNT_IDENTITY_NOT_USED_FOR_GO_RECONNECT", () => {
  const go = resolveOperationalMarketplaceConnectRoute(reconnectGoTask);
  assert.equal(go.seller_company_id, COMPANY_GO);
  assert.notEqual(go.seller_company_id, COMPANY_RP);
});

test("INITIAL_CONNECT_WITHOUT_ACCOUNT_GOES_TO_INTEGRATIONS", () => {
  const r = resolveOperationalMarketplaceConnectRoute(connectInitialTask);
  assert.equal(r.kind, "integrations_page");
  assert.equal(r.path, ROTA_INTEGRACOES_MERCADO_LIVRE);
  assert.equal(r.marketplace_account_id, null);
  assert.equal(r.seller_company_id, null);
});

test("ACCOUNT_WITHOUT_SELLER_COMPANY_DOES_NOT_START_GENERIC_OAUTH", () => {
  const r = resolveOperationalMarketplaceConnectRoute({
    marketplace_account_id: ACCOUNT_GO,
    action: { type: "open_marketplace_connect", label: "Reconectar" },
  });
  assert.equal(r.kind, "missing_seller_company");
  assert.equal(r.path, null);
  assert.equal(r.marketplace_account_id, ACCOUNT_GO);
});

test("HANDLER_USES_RESOLVER_NOT_HARDCODED_INTEGRATIONS_ONLY", () => {
  const dash = read("src/features/dashboard/operationalTasks/DashboardOperationalTasks.jsx");
  assert.ok(dash.includes("resolveOperationalMarketplaceConnectRoute"));
  assert.ok(dash.includes("marketplaceConnectInFlightRef"));
  // Não pode restar o atalho antigo que só ia à página de integrações.
  assert.ok(!/OPEN_MARKETPLACE_CONNECT\) \{\s*navigate\("\/perfil\/integracoes\/mercado-livre"\);/.test(dash));
});

test("PANEL_CTA_STOPS_PROPAGATION", () => {
  const panel = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx");
  assert.ok(panel.includes("event.stopPropagation()"));
  assert.ok(panel.includes("handleActionClick(task)"));
  // Header toggle permanece independente do CTA.
  assert.ok(panel.includes("recolherPainel") || panel.includes("recolherPainelAntesAcao"));
});

test("ACCESSIBILITY_BUTTON_TYPE_AND_ARIA", () => {
  const panel = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx");
  assert.ok(panel.includes('type="button"'));
  assert.ok(panel.includes("aria-label={`${actionLabel} — ${title}`}"));
});

test("SINGLE_CLICK_GUARD_PRESENT", () => {
  const dash = read("src/features/dashboard/operationalTasks/DashboardOperationalTasks.jsx");
  assert.ok(dash.includes("marketplaceConnectInFlightRef.current"));
  assert.ok(dash.includes("if (marketplaceConnectInFlightRef.current) return;"));
});

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failed: failures, passed }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "cpj2_t1_reconnect_cta_oauth_route_unit",
      passed,
      single_account_regression: "PASS",
      multi_account_regression: "PASS",
      initial_connect_regression: "PASS",
    },
    null,
    2,
  ),
);
