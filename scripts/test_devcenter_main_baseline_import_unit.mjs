#!/usr/bin/env node
/**
 * Regressão mínima — imports DevCenter Toolbox resolvem após baseline fix.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(root, "..", rel), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const toolboxSource = read("src/pages/admin/DevCenterToolbox.jsx");

assert("import DocumentacaoVivaPanel", toolboxSource.includes("documentacaoViva/DocumentacaoVivaPanel"));
assert(
  "DocumentacaoVivaPanel file exists",
  existsSync(join(root, "..", "src/components/devCenter/toolbox/documentacaoViva/DocumentacaoVivaPanel.jsx")),
);
assert(
  "documentacaoVivaApi exists",
  existsSync(join(root, "..", "src/services/documentacaoVivaApi.js")),
);
assert("toolbox css exists", existsSync(join(root, "..", "src/components/devCenter/toolbox/devCenterToolbox.css")));
assert(
  "AdminGlobal local stub (import externo comentado)",
  toolboxSource.includes("// import AdminGlobalPanel") && toolboxSource.includes("function AdminGlobalPanel"),
);
assert("documentacao_viva tab wired", toolboxSource.includes('tabId === "documentacao_viva"'));
assert("no configurationOnboarding import", !toolboxSource.includes("configurationOnboarding"));
assert("no operationalTasks import", !toolboxSource.includes("operationalTasks"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ pass: true, test: "devcenter_main_baseline_import_unit", cases: 8 }, null, 2));
