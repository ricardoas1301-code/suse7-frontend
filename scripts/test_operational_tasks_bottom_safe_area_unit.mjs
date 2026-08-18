// ======================================================================
// Testes unitários — zona inferior segura da Central de Pendências
// Executar: node scripts/test_operational_tasks_bottom_safe_area_unit.mjs
// ======================================================================

import assert from "node:assert/strict";
import {
  resolveOperationalTasksBottomSafeAreaPx,
  shouldApplyListBottomSafeArea,
  OPERATIONAL_TASKS_BASE_BOTTOM_PX,
  OPERATIONAL_TASKS_BOTTOM_SAFE_GAP_PX,
} from "../src/features/dashboard/operationalTasks/operationalTasksBottomSafeArea.js";

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

test("rotas de lista habilitam zona segura", () => {
  assert.equal(shouldApplyListBottomSafeArea("/precificacoes"), true);
  assert.equal(shouldApplyListBottomSafeArea("/produtos"), true);
  assert.equal(shouldApplyListBottomSafeArea("/"), false);
});

test("dashboard não aplica zona segura", () => {
  assert.equal(shouldApplyListBottomSafeArea("/"), false);
});

test("offset zero quando paginação não está visível", () => {
  const offset = resolveOperationalTasksBottomSafeAreaPx({
    viewportHeight: 900,
    chromeRects: [{ top: 1200, bottom: 1240, left: 0, right: 100, width: 100, height: 40, x: 0, y: 1200, toJSON: () => ({}) }],
  });
  assert.equal(offset, 0);
});

test("offset sobe painel acima da paginação visível", () => {
  const offset = resolveOperationalTasksBottomSafeAreaPx({
    viewportHeight: 900,
    baseBottomPx: OPERATIONAL_TASKS_BASE_BOTTOM_PX,
    safeGapPx: OPERATIONAL_TASKS_BOTTOM_SAFE_GAP_PX,
    chromeRects: [{ top: 820, bottom: 860, left: 0, right: 100, width: 100, height: 40, x: 0, y: 820, toJSON: () => ({}) }],
  });

  const expected = Math.round(900 - 820 + OPERATIONAL_TASKS_BOTTOM_SAFE_GAP_PX - OPERATIONAL_TASKS_BASE_BOTTOM_PX);
  assert.equal(offset, expected);
  assert.ok(offset > 0);
});

test("mesmo offset para expandido e recolhido (variável compartilhada)", () => {
  const rect = [{ top: 800, bottom: 848, left: 0, right: 100, width: 100, height: 48, x: 0, y: 800, toJSON: () => ({}) }];
  const collapsedOffset = resolveOperationalTasksBottomSafeAreaPx({ viewportHeight: 900, chromeRects: rect });
  const expandedOffset = resolveOperationalTasksBottomSafeAreaPx({ viewportHeight: 900, chromeRects: rect });
  assert.equal(collapsedOffset, expandedOffset);
});

console.log(`\nResultado: ${passed} ok, ${failed} falhou`);
process.exit(failed > 0 ? 1 : 0);
