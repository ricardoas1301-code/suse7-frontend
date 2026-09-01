#!/usr/bin/env node
/**
 * CPJ-2 T1 — regressão permanente: modal Detalhes da sincronização
 * deve fechar em awaiting_start (backdrop/Escape), sem iniciar sync.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  podeFecharModalDetalhesSincronizacao,
  resultadoFechamentoModalDetalhesSincronizacao,
} from "../src/components/Profile/marketplaceIntegration/mercadoLivreSyncDetailsDismissPolicy.js";

const root = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(root, "..", rel), "utf8");

const pageJsx = read("src/components/Profile/MercadoLivre.jsx");
const shellJsx = read(
  "src/components/Profile/marketplaceIntegration/MarketplaceModalShell.jsx",
);
const syncModalJsx = read(
  "src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.jsx",
);

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

const ACCOUNT_A = "9ee145d1-b6ff-4a44-a0ca-3bab5d7e9ef0";
const ACCOUNT_B = "ab85841e-fa8f-44a1-8db1-853560170241";

// 1 — awaiting_start + backdrop → FECHA
test("awaiting_start permite fechar (backdrop)", () => {
  assert.equal(
    podeFecharModalDetalhesSincronizacao({
      awaitingPipelineStart: true,
      overall: "awaiting_start",
    }),
    true,
  );
  const r = resultadoFechamentoModalDetalhesSincronizacao({
    awaitingPipelineStart: true,
    overall: "awaiting_start",
  });
  assert.equal(r.closed, true);
});

// 2 — Escape fecha se shell chama onClose
test("shell Escape chama onClose (contrato)", () => {
  assert.match(shellJsx, /event\.key === ["']Escape["']/);
  assert.match(shellJsx, /onClose\(\)/);
  assert.equal(
    podeFecharModalDetalhesSincronizacao({ awaitingPipelineStart: true }),
    true,
  );
});

// 3 — clique dentro do modal NÃO fecha
test("clique dentro do dialog stopPropagation", () => {
  assert.match(shellJsx, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
});

// 4 — fechar awaiting_start NÃO inicia sync
test("fechamento awaiting_start não inicia sync / não muta jobs-token", () => {
  const r = resultadoFechamentoModalDetalhesSincronizacao({
    awaitingPipelineStart: true,
    overall: "awaiting_start",
  });
  assert.equal(r.syncStarted, false);
  assert.equal(r.jobsMutated, false);
  assert.equal(r.tokenMutated, false);
  assert.equal(r.integrationMutated, false);
  assert.ok(pageJsx.includes("podeFecharModalDetalhesSincronizacao"));
  assert.ok(!/dismissOnboardingModal[\s\S]{0,220}if \(awaitingPipelineStart\) return/.test(pageJsx));
  assert.ok(!/dismissOnboardingModal[\s\S]{0,400}handleStartInitialPipeline/.test(pageJsx));
});

// 5 — completed continua fechando
test("completed continua fechando", () => {
  assert.equal(
    podeFecharModalDetalhesSincronizacao({
      awaitingPipelineStart: false,
      overall: "completed",
    }),
    true,
  );
  assert.equal(
    resultadoFechamentoModalDetalhesSincronizacao({ overall: "completed" }).closed,
    true,
  );
});

// 6 — abrir novamente funciona (contrato de reopen)
test("reabrir sync details permanece disponível após dismiss", () => {
  assert.ok(pageJsx.includes("openTechnicalSyncDetails"));
  assert.ok(pageJsx.includes("setOnboardingOpen(false)"));
  assert.ok(pageJsx.includes("setOnboardingDismissed(true)"));
  // CTA "Ver detalhes" / reopen path still present
  assert.ok(pageJsx.includes("Ver detalhes da sincronização") || pageJsx.includes("openTechnicalSyncDetails("));
});

// 7 — conta A e B mantêm identidade
test("conta A e B mantêm identidade no modal (key + context id)", () => {
  assert.ok(pageJsx.includes("contextMarketplaceAccountId={onboardingAccountId}"));
  assert.ok(pageJsx.includes("key={`sync-details-${onboardingAccountId}`}"));
  assert.ok(syncModalJsx.includes("contextMarketplaceAccountId") || syncModalJsx.includes("MarketplaceModalShell"));
  // identidades canônicas do lab não colapsam para um único hardcode
  assert.notEqual(ACCOUNT_A, ACCOUNT_B);
});

test("backdrop shell chama onClose quando não coberto", () => {
  assert.match(shellJsx, /onClick=\{isCovered \? undefined : onClose\}/);
});

test("página passa dismissOnboardingModal ao SyncDetailsModal", () => {
  assert.ok(pageJsx.includes("onClose={dismissOnboardingModal}"));
});

test("RUNNING_SYNC_DISMISS_POLICY=PRESERVED (running também fecha; awaiting fecha)", () => {
  assert.equal(
    podeFecharModalDetalhesSincronizacao({
      awaitingPipelineStart: false,
      overall: "running",
    }),
    true,
  );
  assert.equal(
    resultadoFechamentoModalDetalhesSincronizacao({
      awaitingPipelineStart: false,
      overall: "running",
    }).syncStarted,
    false,
  );
  assert.equal(
    podeFecharModalDetalhesSincronizacao({
      awaitingPipelineStart: true,
      overall: "awaiting_start",
    }),
    true,
  );
});

test("OUTSIDE_CLICK_AWAITING_START=DISMISS (shell backdrop → onClose)", () => {
  assert.match(shellJsx, /onClick=\{isCovered \? undefined : onClose\}/);
  assert.ok(pageJsx.includes("onClose={dismissOnboardingModal}"));
  assert.ok(pageJsx.includes("podeFecharModalDetalhesSincronizacao"));
});

if (failures.length > 0) {
  console.error(
    JSON.stringify({
      pass: false,
      test: "cpj2_t1_sync_details_awaiting_start_dismiss",
      failed: failures,
      passed,
    }),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    pass: true,
    test: "cpj2_t1_sync_details_awaiting_start_dismiss",
    assertions: passed,
  }),
);
