#!/usr/bin/env node
/**
 * LOTE A — testes canônicos Dashboard / Painel Executivo (sem rede).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isExecutiveSummaryQueryEnabled } from "../src/components/dashboard/dashboardScope.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "src");

/** @type {Array<{ name: string; detail?: unknown }>} */
const failures = [];

function fail(name, detail) {
  failures.push({ name, detail });
}

function test(name, fn) {
  try {
    fn();
  } catch (error) {
    fail(name, error instanceof Error ? error.message : error);
  }
}

test("Dashboard entry importa Top10 sem import de onboarding", () => {
  const dash = fs.readFileSync(path.join(SRC, "components/Dashboard.jsx"), "utf8");
  assert.match(dash, /S7Top10BlockSection/);
  assert.doesNotMatch(dash, /^import .*CompleteProfileModal/m);
  assert.doesNotMatch(dash, /^import .*ConfigurationOnboarding/m);
});

test("S7Top10BlockSection usa sourceMode top10", () => {
  const top10 = fs.readFileSync(path.join(SRC, "components/dashboard/S7Top10BlockSection.jsx"), "utf8");
  assert.match(top10, /sourceMode="top10"/);
  assert.match(top10, /VendasExecutivePanelSection/);
});

test("Painel executivo expõe 4 KPIs via hook display", () => {
  const ux = fs.readFileSync(path.join(SRC, "components/sales/useVendasExecutiveKpiDisplay.js"), "utf8");
  assert.match(ux, /quantityKpi/);
  assert.match(ux, /revenueKpi/);
  assert.match(ux, /netProfitKpi/);
  assert.match(ux, /profitPercentKpi/);
});

test("Top10 API aponta para /api/sales/top10", () => {
  const api = fs.readFileSync(path.join(SRC, "services/salesTop10Api.js"), "utf8");
  assert.match(api, /\/api\/sales\/top10/);
  assert.match(api, /buildSalesTop10QueryKey/);
});

test("dashboardScope habilita query com preset válido", () => {
  assert.equal(isExecutiveSummaryQueryEnabled({ period_preset: "today" }), true);
  assert.equal(isExecutiveSummaryQueryEnabled({}), false);
});

test("sem imports de onboarding no bundle dashboard", () => {
  const forbiddenImport = [
    "ConfigurationAppGate",
    "S7ConfigurationOnboardingSection",
    "ConfigurationOnboarding",
    "CompleteProfileModal",
  ];
  const files = [
    "components/Dashboard.jsx",
    "components/dashboard/S7Top10BlockSection.jsx",
    "components/sales/VendasExecutivePanelSection.jsx",
  ];
  for (const rel of files) {
    const lines = fs.readFileSync(path.join(SRC, rel), "utf8").split(/\r?\n/);
    const importLines = lines.filter((line) => /^\s*import\s/.test(line)).join("\n");
    for (const token of forbiddenImport) {
      assert.doesNotMatch(importLines, new RegExp(token));
    }
  }
});

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "dashboard_executive_lote_a_unit",
      cases: [
        "dashboard_entry",
        "top10_section",
        "executive_kpis",
        "top10_api_query",
        "top10_url",
        "dashboard_scope",
        "no_onboarding_imports",
      ],
    },
    null,
    2,
  ),
);
