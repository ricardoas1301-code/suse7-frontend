// ======================================================================
// Regressão — wiring do card flutuante de pendências (montagem + visible)
// Executar: node scripts/test_operational_tasks_wiring_regression_unit.mjs
// ======================================================================

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (relativePath) =>
  readFileSync(join(root, "..", relativePath), "utf8");

const layoutSource = read("src/components/Layout.jsx");
const hostSource = read("src/features/dashboard/operationalTasks/GlobalOperationalTasksHost.jsx");
const dashboardSource = read("src/features/dashboard/operationalTasks/DashboardOperationalTasks.jsx");
const panelSource = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx");
const panelCss = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.css");

assert.match(
  layoutSource,
  /GlobalOperationalTasksHost/,
  "Layout deve montar o host global da Central de Pendências",
);
assert.match(
  layoutSource,
  /\{authReady \? <GlobalOperationalTasksHost/,
  "Host global deve respeitar authReady no shell autenticado",
);

assert.match(
  hostSource,
  /<DashboardOperationalTasks visible=\{true\}/,
  "Host global deve manter fetch ativo em todo shell autenticado",
);

assert.ok(
  dashboardSource.includes("useOperationalTasks({ enabled: visible })"),
  "DashboardOperationalTasks deve repassar visible ao hook",
);
assert.match(
  dashboardSource,
  /<S7OperationalTasksPanel[\s\S]*visible=\{visible\}/,
  "DashboardOperationalTasks deve repassar visible ao painel",
);

assert.match(panelSource, /if \(!visible \|\| !panelShouldRender\) \{/);
assert.match(
  panelSource,
  /painelCentralDeveSerVisivel/,
  "Visibilidade final continua centralizada no contrato de painel",
);
assert.match(panelSource, /createPortal\(panel, document\.body\)/);

assert.match(panelCss, /position:\s*fixed/);
assert.match(panelCss, /right:\s*var\(--s7-floating-anchor-right\)/);
assert.match(panelCss, /bottom:\s*calc\(/);
assert.match(layoutSource, /GlobalSellerCompanyModalProvider/);

console.log("[test_operational_tasks_wiring_regression_unit] OK");
