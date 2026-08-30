#!/usr/bin/env node
/**
 * CPJ-2 T1 — regressão permanente: OT ml_initial_sync_pending + revalidação
 * por visibilidade (bug Rico: pós-OAuth Hosted cache antigo no Local).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  aplicarPayloadOperationalTasksAposRevalidacao,
  criarGateRevalidacaoVisibilidadeOperationalTasks,
  deveRevalidarOperationalTasksPorVisibilidade,
  resolverMarketplaceAccountIdDaTaskOperacional,
  resumirTasksSincronizacaoInicialMl,
} from "../src/features/dashboard/operationalTasks/operationalTasksVisibilityRevalidate.js";
import { OPERATIONAL_TASK_ACTION_TYPES } from "../src/features/dashboard/operationalTasks/operationalTaskTypes.js";
import { buildCollapsedOperationalTasksLabel } from "../src/features/dashboard/operationalTasks/operationalTaskDescriptions.js";

const root = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(root, "..", rel), "utf8");

const hookJs = read("src/features/dashboard/operationalTasks/useOperationalTasks.js");
const panelJsx = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx");
const dashJsx = read("src/features/dashboard/operationalTasks/DashboardOperationalTasks.jsx");
const apiJs = read("src/features/dashboard/operationalTasks/operationalTasksApi.js");

const ACCOUNT_RP = "9ee145d1-b6ff-4a44-a0ca-3bab5d7e9ef0";
const ACCOUNT_GO = "ab85841e-fa8f-44a1-8db1-853560170241";

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

/** Payload canônico live (SMR-GO awaiting_start) + pendências existentes. */
function buildFreshPayloadDual() {
  return [
    {
      id: "missing_product_costs",
      type: "missing_product_costs",
      title: "Custos pendentes",
      count: 12,
    },
    {
      id: `ml_initial_sync_pending:${ACCOUNT_GO}`,
      type: "ml_initial_sync_pending",
      title: "Sincronização necessária",
      description: "CHURRASCO SMR / Sincronizar Mercado Livre",
      marketplace_account_id: ACCOUNT_GO,
      account_label: "CHURRASCO SMR",
      phase: "awaiting_start",
      action: {
        type: OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_INITIAL_SYNC_MODAL,
        label: "Sincronizar",
      },
    },
  ];
}

function buildFreshPayloadDualAccounts() {
  return [
    {
      id: `ml_initial_sync_pending:${ACCOUNT_RP}`,
      type: "ml_initial_sync_pending",
      marketplace_account_id: ACCOUNT_RP,
      account_label: "SUPER METALRIO",
      action: { type: OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_INITIAL_SYNC_MODAL },
    },
    {
      id: `ml_initial_sync_pending:${ACCOUNT_GO}`,
      type: "ml_initial_sync_pending",
      marketplace_account_id: ACCOUNT_GO,
      account_label: "CHURRASCO SMR",
      action: { type: OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_INITIAL_SYNC_MODAL },
    },
  ];
}

// 8 — payload ml_initial_sync_pending aparece no painel (contrato de dados)
test("payload ml_initial_sync_pending aparece e é contado", () => {
  const tasks = buildFreshPayloadDual();
  const summary = resumirTasksSincronizacaoInicialMl(tasks);
  assert.equal(summary.total_tasks, 2);
  assert.equal(summary.sync_task_count, 1);
  assert.ok(summary.by_account_id[ACCOUNT_GO]);
  assert.equal(summary.by_account_id[ACCOUNT_GO].type, "ml_initial_sync_pending");
  assert.ok(panelJsx.includes("tasks.map"));
  assert.ok(panelJsx.includes("data-marketplace-account-id"));
});

// 9 — contador inclui a task
test("contador inclui a task de sync", () => {
  const tasks = buildFreshPayloadDual();
  assert.equal(tasks.length, 2);
  assert.equal(buildCollapsedOperationalTasksLabel(tasks.length), "2 pendências");
});

// 10 — marketplace_account_id preservado
test("marketplace_account_id SMR-GO preservado", () => {
  const tasks = buildFreshPayloadDual();
  const go = tasks.find((t) => t.type === "ml_initial_sync_pending");
  assert.equal(go?.marketplace_account_id, ACCOUNT_GO);
  assert.equal(resolverMarketplaceAccountIdDaTaskOperacional(go), ACCOUNT_GO);
});

// 11 — revalidation atualiza cache antigo sem F5
test("revalidação atualiza cache antigo sem F5/reload", () => {
  const stale = [{ id: "missing_product_costs", type: "missing_product_costs" }];
  const fresh = buildFreshPayloadDual();

  const before = aplicarPayloadOperationalTasksAposRevalidacao({
    cachedTasks: stale,
    freshTasks: fresh,
    revalidated: false,
  });
  assert.equal(before.total_tasks, 1);
  assert.equal(before.from_cache, true);

  const after = aplicarPayloadOperationalTasksAposRevalidacao({
    cachedTasks: stale,
    freshTasks: fresh,
    revalidated: true,
  });
  assert.equal(after.total_tasks, 2);
  assert.equal(after.from_cache, false);
  assert.ok(after.tasks.some((t) => t.marketplace_account_id === ACCOUNT_GO));

  assert.ok(hookJs.includes("visibilitychange"));
  assert.ok(hookJs.includes("invalidateOperationalTasksCache"));
  assert.ok(hookJs.includes("visibility_revalidate"));
  assert.ok(!hookJs.includes("window.location.reload"));
  assert.ok(!hookJs.includes("location.reload"));
});

test("gate: visibility hidden não revalida; visible sim", () => {
  assert.equal(
    deveRevalidarOperationalTasksPorVisibilidade({
      effectivelyEnabled: true,
      eventType: "visibilitychange",
      visibilityState: "hidden",
    }),
    false,
  );
  assert.equal(
    deveRevalidarOperationalTasksPorVisibilidade({
      effectivelyEnabled: true,
      eventType: "visibilitychange",
      visibilityState: "visible",
    }),
    true,
  );
  assert.equal(
    deveRevalidarOperationalTasksPorVisibilidade({
      effectivelyEnabled: false,
      eventType: "focus",
    }),
    false,
  );
});

test("gate cooldown coalesces focus+visibility (sem N+1)", () => {
  let now = 1_000;
  const gate = criarGateRevalidacaoVisibilidadeOperationalTasks({
    cooldownMs: 1500,
    now: () => now,
  });
  assert.equal(
    gate.tentar({ effectivelyEnabled: true, eventType: "visibilitychange", visibilityState: "visible" }),
    true,
  );
  now = 1_100;
  assert.equal(gate.tentar({ effectivelyEnabled: true, eventType: "focus" }), false);
  now = 2_600;
  assert.equal(gate.tentar({ effectivelyEnabled: true, eventType: "focus" }), true);
});

// 12 — duas contas geram tasks independentes
test("duas contas geram tasks independentes", () => {
  const tasks = buildFreshPayloadDualAccounts();
  const summary = resumirTasksSincronizacaoInicialMl(tasks);
  assert.equal(summary.sync_task_count, 2);
  assert.ok(summary.by_account_id[ACCOUNT_RP]);
  assert.ok(summary.by_account_id[ACCOUNT_GO]);
  assert.notEqual(
    summary.by_account_id[ACCOUNT_RP].id,
    summary.by_account_id[ACCOUNT_GO].id,
  );
});

// 13 — ação de uma conta abre somente aquela conta
test("ação de uma conta resolve somente aquele marketplace_account_id", () => {
  const tasks = buildFreshPayloadDualAccounts();
  const go = tasks.find((t) => t.marketplace_account_id === ACCOUNT_GO);
  const rp = tasks.find((t) => t.marketplace_account_id === ACCOUNT_RP);
  assert.equal(resolverMarketplaceAccountIdDaTaskOperacional(go), ACCOUNT_GO);
  assert.equal(resolverMarketplaceAccountIdDaTaskOperacional(rp), ACCOUNT_RP);
  assert.ok(dashJsx.includes("OPEN_ML_INITIAL_SYNC_MODAL"));
  assert.ok(dashJsx.includes("setSyncDetailsHost"));
  assert.match(
    dashJsx,
    /OPEN_ML_INITIAL_SYNC_MODAL[\s\S]{0,280}setSyncDetailsHost\(\{\s*open:\s*true,\s*accountId/,
  );
});

// 14 — single-account continua funcionando
test("single-account ml_initial_sync_pending funciona", () => {
  const tasks = [
    {
      id: `ml_initial_sync_pending:${ACCOUNT_RP}`,
      type: "ml_initial_sync_pending",
      marketplace_account_id: ACCOUNT_RP,
      action: { type: OPERATIONAL_TASK_ACTION_TYPES.OPEN_ML_INITIAL_SYNC_MODAL },
    },
  ];
  const summary = resumirTasksSincronizacaoInicialMl(tasks);
  assert.equal(summary.total_tasks, 1);
  assert.equal(summary.sync_task_count, 1);
  assert.equal(resolverMarketplaceAccountIdDaTaskOperacional(tasks[0]), ACCOUNT_RP);
});

// 15 — nenhuma request por item/conta (contrato de fetch único)
test("fetch OT é compartilhado (sem request por conta)", () => {
  assert.ok(apiJs.includes("runOperationalTasksFetchSerialized"));
  assert.ok(apiJs.includes("/api/dashboard/operational-tasks"));
  assert.ok(!apiJs.includes("/api/marketplace/accounts/${"));
  assert.ok(hookJs.includes("fetchOperationalTasks"));
  // hook não itera contas para fetch
  assert.ok(!/for\s*\(.*account.*\)[\s\S]{0,80}fetchOperationalTasks/.test(hookJs));
});

test("hook registra focus/pageshow além de visibilitychange", () => {
  assert.ok(hookJs.includes('addEventListener("pageshow"'));
  assert.ok(hookJs.includes('addEventListener("focus"'));
  assert.ok(hookJs.includes("criarGateRevalidacaoVisibilidadeOperationalTasks"));
});

if (failures.length > 0) {
  console.error(
    JSON.stringify({
      pass: false,
      test: "cpj2_t1_operational_tasks_visibility_revalidate",
      failed: failures,
      passed,
    }),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    pass: true,
    test: "cpj2_t1_operational_tasks_visibility_revalidate",
    assertions: passed,
  }),
);
