#!/usr/bin/env node
/**
 * CPJ-2 T1 — Conta A done NÃO esconde Conta B awaiting_start no card
 * de Importação inteligente (Dashboard).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDashboardImportCompactSummaryAccountAware,
  contaExigeInicioDeSincronizacao,
  deveMostrarCtaIdleGlobalImportacao,
  particionarContasImportIntelligence,
  rotuloCtaImportacaoPorConta,
  sellerTemImportacaoTotalmenteConcluida,
} from "../src/components/import/s7ImportIntelligenceAccountVisibility.js";

const root = dirname(fileURLToPath(import.meta.url));
const panelJsx = readFileSync(
  join(root, "../src/components/import/S7ImportIntelligencePanel.jsx"),
  "utf8",
);

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

const accountADone = {
  marketplace_account_id: ACCOUNT_A,
  display_name: "SUPER METALRIO",
  account_label: "SUPER METALRIO",
  overall: "done",
  hot_sync_complete: true,
  historical_backfill_active: false,
  status_headline: "Histórico em dia",
};

const accountBAwaiting = {
  marketplace_account_id: ACCOUNT_B,
  display_name: "CHURRASCO SMR",
  account_label: "CHURRASCO SMR",
  overall: "awaiting_start",
  hot_sync_complete: false,
  historical_backfill_active: false,
  status_headline: "Pronto para importar dados recentes",
};

test("MULTI_ACCOUNT_VISIBILITY: A done + B awaiting → B permanece visível", () => {
  const parts = particionarContasImportIntelligence([accountADone, accountBAwaiting]);
  assert.equal(parts.awaitingStart.length, 1);
  assert.equal(parts.awaitingStart[0].marketplace_account_id, ACCOUNT_B);
  assert.equal(parts.done.length, 1);
  assert.equal(parts.done[0].marketplace_account_id, ACCOUNT_A);
  assert.equal(sellerTemImportacaoTotalmenteConcluida([accountADone, accountBAwaiting]), false);
});

test("ACCOUNT_A_PENDING_SYNC_CARD=NO / ACCOUNT_B_PENDING_SYNC_CARD=YES", () => {
  assert.equal(contaExigeInicioDeSincronizacao(accountADone), false);
  assert.equal(contaExigeInicioDeSincronizacao(accountBAwaiting), true);
  assert.equal(rotuloCtaImportacaoPorConta(accountADone), "Ver sincronização em andamento");
  assert.equal(rotuloCtaImportacaoPorConta(accountBAwaiting), "Iniciar sincronização");
});

test("compact summary nomeia Conta B awaiting (não some atrás de A)", () => {
  const summary = buildDashboardImportCompactSummaryAccountAware(
    [accountADone, accountBAwaiting],
    false,
  );
  assert.match(summary.primary, /CHURRASCO SMR|sincronização necessária/i);
});

test("any_engaged global NÃO esconde B awaiting no dashboard", () => {
  assert.equal(
    deveMostrarCtaIdleGlobalImportacao({
      accounts: [accountADone, accountBAwaiting],
      layout: "dashboard",
      anyEngaged: true,
    }),
    false,
  );
  // Mistura cai no render account-aware (não no CTA idle “Conecte ML”)
  assert.ok(panelJsx.includes("contaExigeInicioDeSincronizacao"));
  assert.ok(panelJsx.includes('data-cta="iniciar-sincronizacao"'));
  assert.ok(panelJsx.includes("s7-import-intel__account--awaiting-start"));
});

test("single-account awaiting + !any_engaged ainda mostra CTA idle", () => {
  assert.equal(
    deveMostrarCtaIdleGlobalImportacao({
      accounts: [accountBAwaiting],
      layout: "dashboard",
      anyEngaged: false,
    }),
    true,
  );
});

test("painel ordena awaiting antes de done (B não fica escondida)", () => {
  assert.ok(panelJsx.includes("accountsOrdered"));
  assert.ok(panelJsx.includes("contasParticionadas.awaitingStart"));
});

test("FIRST_ACCOUNT_REGRESSION: A done sozinha continua concluída", () => {
  assert.equal(sellerTemImportacaoTotalmenteConcluida([accountADone]), true);
  assert.equal(
    buildDashboardImportCompactSummaryAccountAware([accountADone], true).primary,
    "Todas as contas sincronizadas",
  );
});

if (failures.length > 0) {
  console.error(
    JSON.stringify({
      pass: false,
      test: "cpj2_t1_import_intelligence_multiconta_visibility",
      failed: failures,
      passed,
    }),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    pass: true,
    test: "cpj2_t1_import_intelligence_multiconta_visibility",
    assertions: passed,
  }),
);
