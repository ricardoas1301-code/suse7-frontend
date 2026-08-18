#!/usr/bin/env node
/**
 * LOTE A.1 — regressão shell/topnav canônico (sem rede).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

test("topnav token compacto S1.1 — bar height 48px", () => {
  const css = fs.readFileSync(path.join(SRC, "styles/tokens/topnav.css"), "utf8");
  assert.match(css, /--s7-topnav-bar-height:\s*48px/);
  assert.match(css, /--s7-topnav-logo-size:\s*44px/);
});

test("Layout.css usa tokens — sem height hardcoded 64px", () => {
  const css = fs.readFileSync(path.join(SRC, "components/Layout.css"), "utf8");
  assert.match(css, /height:\s*var\(--s7-topnav-bar-height\)/);
  assert.doesNotMatch(css, /height:\s*64px/);
  assert.doesNotMatch(css, /width:\s*63px/);
});

test("s7-topnav-shared pill S1.1B presente", () => {
  const css = fs.readFileSync(path.join(SRC, "styles/s7-topnav-shared.css"), "utf8");
  assert.match(css, /\.nav-item::before/);
  assert.match(css, /--s7-topnav-pill-height/);
});

test("global.css scrollport flex — page-content min-height 0", () => {
  const css = fs.readFileSync(path.join(SRC, "global.css"), "utf8");
  assert.match(css, /\.page-content\.s7-page[\s\S]*min-height:\s*0/);
  assert.doesNotMatch(css, /\.s7-page\s*\{[^}]*min-height:\s*100vh/s);
});

test("Dashboard route padding 12px canônico", () => {
  const css = fs.readFileSync(path.join(SRC, "components/Dashboard.css"), "utf8");
  assert.match(css, /\.page-content:has\(> \.vendas-page\.dashboard-page\)[\s\S]*padding:\s*12px/);
});

test("Layout logo tooltip sem onboarding gate", () => {
  const layout = fs.readFileSync(path.join(SRC, "components/Layout.jsx"), "utf8");
  assert.match(layout, /S7Tooltip/);
  assert.doesNotMatch(layout, /ConfigurationAppGateProvider/);
  assert.doesNotMatch(layout, /ConfigurationAppGateShell/);
});

test("Dashboard Lote A core intacto", () => {
  const dash = fs.readFileSync(path.join(SRC, "components/Dashboard.jsx"), "utf8");
  assert.match(dash, /S7Top10BlockSection/);
  assert.match(dash, /S7ImportIntelligencePanel/);
});

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "dashboard_shell_exact_lote_a1_unit",
      viewportReference: "1366x768",
      cases: [
        "topnav_tokens_48px",
        "layout_css_vars",
        "topnav_shared_pill",
        "global_scrollport",
        "dashboard_padding_12px",
        "no_onboarding_gate",
        "dashboard_core_intact",
      ],
    },
    null,
    2,
  ),
);
