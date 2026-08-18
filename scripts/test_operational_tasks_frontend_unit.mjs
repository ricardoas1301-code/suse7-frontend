// ======================================================================
// Testes unitários — display/helper da Central de Tarefas (frontend)
// Executar: node scripts/test_operational_tasks_frontend_unit.mjs
// ======================================================================

import assert from "node:assert/strict";
import {
  buildCollapsedOperationalTasksLabel,
  buildMissingProductCostsDescription,
} from "../src/features/dashboard/operationalTasks/operationalTaskDescriptions.js";
import {
  buildOperationalTasksCacheFromRemainingCount,
  buildMissingProductCostsTaskPayload,
} from "../src/features/dashboard/operationalTasks/operationalTasksCachePatch.js";
import {
  readOperationalTasksCollapsedPreference,
  writeOperationalTasksCollapsedPreference,
} from "../src/features/dashboard/operationalTasks/operationalTasksCollapseStorage.js";
import {
  shouldShowOperationalTasks,
  normalizeOperationalTasksPathname,
  OPERATIONAL_TASKS_ENABLED_ROUTE_PREFIXES,
} from "../src/features/dashboard/operationalTasks/operationalTasksRoutes.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

test("pluralização 1 produto", () => {
  assert.equal(buildMissingProductCostsDescription(1), "1 produto aguarda cadastro de custos");
});

test("pluralização N produtos", () => {
  assert.equal(buildMissingProductCostsDescription(127), "127 produtos aguardam cadastro de custos");
});

test("cápsula recolhida usa contagem de tarefas", () => {
  assert.equal(buildCollapsedOperationalTasksLabel(1), "1 pendência");
  assert.equal(buildCollapsedOperationalTasksLabel(3), "3 pendências");
});

test("patch imediato atualiza count da tarefa", () => {
  const patched = buildOperationalTasksCacheFromRemainingCount(119);
  assert.equal(patched.total_tasks, 1);
  assert.equal(patched.tasks[0]?.count, 119);
  assert.equal(patched.tasks[0]?.description, "119 produtos aguardam cadastro de custos");
});

test("patch zero remove tarefa", () => {
  const patched = buildOperationalTasksCacheFromRemainingCount(0);
  assert.equal(patched.total_tasks, 0);
  assert.equal(patched.tasks.length, 0);
});

test("payload da tarefa mantém contrato", () => {
  const task = buildMissingProductCostsTaskPayload(118);
  assert.equal(task.type, "missing_product_costs");
  assert.equal(task.count, 118);
});

test("preferência recolhido persiste por usuário", () => {
  const store = /** @type {Record<string, string>} */ ({});
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  // @ts-expect-error mock leve para ambiente Node
  globalThis.window = globalThis;
  // @ts-expect-error mock leve
  globalThis.localStorage = {
    getItem(key) {
      return store[key] ?? null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
  };

  writeOperationalTasksCollapsedPreference("user-a", true);
  writeOperationalTasksCollapsedPreference("user-b", false);
  assert.equal(readOperationalTasksCollapsedPreference("user-a"), true);
  assert.equal(readOperationalTasksCollapsedPreference("user-b"), false);

  globalThis.window = originalWindow;
  globalThis.localStorage = originalLocalStorage;
});

test("rotas operacionais habilitadas — shell autenticado global", () => {
  assert.equal(shouldShowOperationalTasks("/"), true);
  assert.equal(shouldShowOperationalTasks("/perfil/alterar-senha"), true);
  assert.equal(shouldShowOperationalTasks("/perfil/dados-empresa"), true);
  assert.equal(shouldShowOperationalTasks("/clientes"), true);
  assert.equal(shouldShowOperationalTasks("/relatorios"), true);
  assert.equal(shouldShowOperationalTasks("/registros"), true);
  assert.equal(shouldShowOperationalTasks("/notificacoes"), true);
  assert.equal(shouldShowOperationalTasks("/admin/dev-center"), true);
});

test("rotas operacionais habilitadas — filhas operacionais", () => {
  assert.equal(shouldShowOperationalTasks("/produtos/abc123"), true);
  assert.equal(shouldShowOperationalTasks("/produtos/abc123/editar"), true);
  assert.equal(shouldShowOperationalTasks("/anuncios/MLB123"), true);
  assert.equal(shouldShowOperationalTasks("/precificacoes/inteligente/MLB123"), true);
  assert.equal(shouldShowOperationalTasks("/vendas/detalhe"), true);
  assert.equal(shouldShowOperationalTasks("/concorrencia/lista"), true);
});

test("rotas operacionais desabilitadas — públicas", () => {
  assert.equal(shouldShowOperationalTasks("/login"), false);
  assert.equal(shouldShowOperationalTasks("/signup"), false);
  assert.equal(shouldShowOperationalTasks("/cadastro"), false);
  assert.equal(shouldShowOperationalTasks("/planos"), false);
  assert.equal(shouldShowOperationalTasks("/termos"), false);
  assert.equal(shouldShowOperationalTasks("/privacidade"), false);
});

test("rotas operacionais excluídas explicitamente", () => {
  assert.equal(shouldShowOperationalTasks("/anuncios/debug-importacao"), false);
  assert.equal(shouldShowOperationalTasks("/anuncios-2"), false);
});

test("normalização de pathname", () => {
  assert.equal(normalizeOperationalTasksPathname(""), "/");
  assert.equal(normalizeOperationalTasksPathname("/produtos/"), "/produtos");
});

console.log(`\nResultado: ${passed} ok, ${failed} falhou`);
process.exit(failed > 0 ? 1 : 0);
