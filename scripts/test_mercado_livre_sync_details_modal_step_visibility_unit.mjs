#!/usr/bin/env node
/**
 * Visibilidade das etapas no modal de sincronização (v2 — ocultar Clientes 360).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildMercadoLivreSyncDetailsPresentation } from "../src/components/Profile/marketplaceIntegration/mercadoLivreSyncDetailsAdapter.js";
import {
  MARKETPLACE_SYNC_HIDDEN_STEP_KEYS,
  buildMarketplaceSyncConnectStepLine,
  partitionMarketplaceSyncStepsForModal,
  resolveConnectStepDisplayLabel,
} from "../src/components/Profile/marketplaceIntegration/marketplaceSyncStepModalVisibility.js";
import { buildMarketplaceSyncStepsPresentation } from "../src/components/Profile/marketplaceIntegration/marketplaceSyncStepPresentation.js";

const root = dirname(fileURLToPath(import.meta.url));
const syncModalJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.jsx"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const checklist = [
  { key: "ml_connect", label: "Conectando conta Mercado Livre", status: "done" },
  { key: "sales_recent", label: "Vendas recentes", status: "error" },
  { key: "customers", label: "Clientes 360", status: "pending" },
  { key: "listings", label: "Anúncios", status: "pending" },
];

const allSteps = buildMarketplaceSyncStepsPresentation(checklist);
const { connectStep, gridSteps } = partitionMarketplaceSyncStepsForModal(allSteps);

assert("customers hidden from seller modal keys", MARKETPLACE_SYNC_HIDDEN_STEP_KEYS.has("customers"));
assert("connect step partitioned out of grid", connectStep?.key === "ml_connect");
assert("grid excludes connect and customers", gridSteps.length === 2);
assert("grid keeps visible operational steps", gridSteps.some((s) => s.key === "sales_recent") && gridSteps.some((s) => s.key === "listings"));
assert("grid never renders customers", !gridSteps.some((s) => s.key === "customers"));

const presentation = buildMercadoLivreSyncDetailsPresentation(
  { id: "acc-1", status: "active", account_alias: "LOJA", seller_company_id: "sc-1" },
  { overall: "error", title: "Sincronização com pendências", checklist },
  { checklist }
);

assert("presentation exposes connect line", presentation.connectStepLine?.label === "Conta conectada ao Mercado Livre");
assert("presentation connect line hides status when done", presentation.connectStepLine?.statusLabel === "");
assert("connect label while pending", resolveConnectStepDisplayLabel({ status: "pending" }) === "Conectando conta Mercado Livre");
assert("connect label when completed", resolveConnectStepDisplayLabel({ status: "done" }) === "Conta conectada ao Mercado Livre");
assert("connect line builder omits status suffix when done", buildMarketplaceSyncConnectStepLine({ status: "done", label: "Conectando conta Mercado Livre", statusLabel: "Concluído" })?.statusLabel === "");
assert("presentation grid steps filtered", presentation.steps.length === 2);
assert("presentation keeps full checklist in stepsAll", presentation.stepsAll.length === 4);
assert("summary excludes hidden customers from pending count", presentation.executionSummary.pendingCount === 1);

assert("modal renders connect line badge", syncModalJsx.includes("s7-marketplace-sync-details-modal__connect-line"));
assert("modal uses connectStepLine from presentation", syncModalJsx.includes("connectStepLine"));

if (failures.length) {
  console.error("[S1.INTEGRATIONS-SYNC.3 step visibility unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-SYNC.3 step visibility unit] OK");
