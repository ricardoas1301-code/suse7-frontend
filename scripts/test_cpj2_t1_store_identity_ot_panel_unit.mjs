#!/usr/bin/env node
/**
 * CPJ-2 T1 — identidade da loja na Central de Pendências + label Loja no modal.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizarTituloPendenciaMarketplace,
  resolverIdentidadeLojaDaTaskOperacional,
} from "../src/features/dashboard/operationalTasks/operationalTaskStoreIdentity.js";

const root = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(root, "..", rel), "utf8");

const panelJsx = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx");
const integrationModal = read(
  "src/components/Profile/marketplaceIntegration/MarketplaceIntegrationModal.jsx",
);
const syncModal = read(
  "src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.jsx",
);
const storeBlock = read("src/components/store/S7StoreIdentityBlock.jsx");

const ACCOUNT_A = "9ee145d1-b6ff-4a44-a0ca-3bab5d7e9ef0";
const ACCOUNT_B = "ab85841e-fa8f-44a1-8db1-853560170241";

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

const taskA = {
  type: "ml_initial_sync_in_progress",
  title: "Sincronizando Mercado Livre — CHURRASCO SMR",
  marketplace_account_id: ACCOUNT_A,
  store_name: "SMR - RP",
  store_document_cnpj: "73151110000128",
  store_logo_url: "https://cdn.example/rp.png",
  ml_nickname: "SUPER METALRIO",
  account_label: "SMR - RP",
};

const taskB = {
  type: "ml_initial_sync_pending",
  title: "Sincronizar Mercado Livre — CHURRASCO SMR",
  marketplace_account_id: ACCOUNT_B,
  store_name: "SMR - GO",
  store_document_cnpj: "73151110000209",
  store_logo_url: "https://cdn.example/go.png",
  ml_nickname: "CHURRASCO SMR",
  account_label: "SMR - GO",
};

test("STORE_IDENTITY_ACCOUNT_A=SMR-RP", () => {
  const id = resolverIdentidadeLojaDaTaskOperacional(taskA);
  assert.equal(id.storeName, "SMR - RP");
  assert.equal(id.documentFormatted, "73.151.110/0001-28");
  assert.equal(id.logoUrl, "https://cdn.example/rp.png");
});

test("STORE_IDENTITY_ACCOUNT_B=SMR-GO", () => {
  const id = resolverIdentidadeLojaDaTaskOperacional(taskB);
  assert.equal(id.storeName, "SMR - GO");
  assert.equal(id.documentFormatted, "73.151.110/0002-09");
  assert.ok(id.logoUrl);
});

test("ACCOUNT_B_PENDING_CARD_USES_STORE_NAME/CNPJ/LOGO", () => {
  const id = resolverIdentidadeLojaDaTaskOperacional(taskB);
  assert.equal(id.storeName, "SMR - GO");
  assert.equal(id.documentFormatted, "73.151.110/0002-09");
  assert.ok(id.logoUrl || id.fallbackInitial);
  assert.ok(storeBlock.includes("onError"));
  assert.ok(storeBlock.includes("s7-store-identity__fallback"));
});

test("MARKETPLACE_ACCOUNT_NICKNAME_NOT_USED_AS_PRIMARY_STORE_IDENTITY", () => {
  const id = resolverIdentidadeLojaDaTaskOperacional(taskB);
  assert.notEqual(id.storeName, "CHURRASCO SMR");
  assert.equal(
    normalizarTituloPendenciaMarketplace(taskB.title, taskB.type),
    "Sincronizar Mercado Livre",
  );
  assert.ok(!normalizarTituloPendenciaMarketplace(taskB.title, taskB.type).includes("CHURRASCO"));
});

test("CONNECT_STATE_STORE_IDENTITY title canônico", () => {
  assert.equal(
    normalizarTituloPendenciaMarketplace("Conectar marketplace", "marketplace_connect_pending"),
    "Conectar Mercado Livre",
  );
});

test("AWAITING_START_STORE_IDENTITY title sem nickname", () => {
  assert.equal(
    normalizarTituloPendenciaMarketplace(
      "Sincronizar Mercado Livre — CHURRASCO SMR",
      "ml_initial_sync_pending",
    ),
    "Sincronizar Mercado Livre",
  );
});

test("RUNNING_STATE_STORE_IDENTITY title sem nickname", () => {
  assert.equal(
    normalizarTituloPendenciaMarketplace(
      "Sincronizando Mercado Livre — SUPER METALRIO",
      "ml_initial_sync_in_progress",
    ),
    "Sincronizando Mercado Livre",
  );
});

test("MODAL_LABEL_EMPRESA_VINCULADA_REMOVED / MODAL_LABEL_LOJA", () => {
  assert.ok(!integrationModal.includes("Empresa vinculada:"));
  assert.ok(integrationModal.includes(">Loja:</span>") || integrationModal.includes("Loja:"));
  assert.ok(!syncModal.includes("Empresa vinculada:"));
  assert.ok(syncModal.includes("Loja:"));
});

test("panel renders store block when hasStoreIdentity", () => {
  assert.ok(panelJsx.includes("storeIdentity.hasStoreIdentity"));
  assert.ok(panelJsx.includes("<S7StoreIdentityBlock"));
  // wiring: marketplace task + identity → bloco visível
  assert.match(
    panelJsx,
    /isMarketplaceTask && storeIdentity\.hasStoreIdentity \? \(\s*<S7StoreIdentityBlock/,
  );
});

test("fallback seguro sem logo", () => {
  const id = resolverIdentidadeLojaDaTaskOperacional({
    type: "ml_initial_sync_pending",
    store_name: "SMR - GO",
    store_document_cnpj: "73151110000209",
  });
  assert.equal(id.logoUrl, null);
  assert.equal(id.fallbackInitial, "S");
  assert.equal(id.hasStoreIdentity, true);
});

if (failures.length > 0) {
  console.error(JSON.stringify({ pass: false, failed: failures, passed }));
  process.exit(1);
}

console.log(
  JSON.stringify({
    pass: true,
    test: "cpj2_t1_store_identity_ot_panel",
    assertions: passed,
  }),
);
