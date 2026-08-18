#!/usr/bin/env node
/**
 * Documentação Viva — sanity funcional mínimo (estrutura + deps + wiring).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const repo = join(root, "..");
const read = (rel) => readFileSync(join(repo, rel), "utf8");
const exists = (rel) => existsSync(join(repo, rel));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const panel = read("src/components/devCenter/toolbox/documentacaoViva/DocumentacaoVivaPanel.jsx");
const store = read("src/components/devCenter/toolbox/documentacaoViva/documentacaoVivaStore.jsx");
const api = read("src/services/documentacaoVivaApi.js");
const toolbox = read("src/pages/admin/DevCenterToolbox.jsx");

const docvivaDir = join(repo, "src/components/devCenter/toolbox/documentacaoViva");
const docvivaFiles = readdirSync(docvivaDir);

assert("panel export default", panel.includes("export default function DocumentacaoVivaPanel"));
assert("provider wraps conteudo", panel.includes("DocumentacaoVivaProvider") && panel.includes("DocumentacaoVivaConteudo"));
assert("subnav Source Of Truth", panel.includes("SOURCE_OF_TRUTH") && panel.includes("Source Of Truth Center"));
assert("subnav DB Diagram", panel.includes("DB_DIAGRAM") && panel.includes("DbDiagramRepository"));
assert("DomainCard + DomainDetail wired", panel.includes("DomainCard") && panel.includes("DomainDetail"));
assert("store imports documentacaoVivaApi", store.includes('from "../../../../services/documentacaoVivaApi"'));
assert("api uses buildApiUrl + apiFetch", api.includes("buildApiUrl") && api.includes("apiFetch"));
assert("api base path dev-center", api.includes("/api/dev-center/documentacao-viva"));
assert("toolbox renders DocumentacaoVivaPanel on tab", toolbox.includes('tabId === "documentacao_viva"') && toolbox.includes("<DocumentacaoVivaPanel"));
assert("no operationalTasks coupling", !panel.includes("operationalTasks") && !store.includes("operationalTasks"));
assert("no configurationOnboarding coupling", !panel.includes("configurationOnboarding") && !store.includes("configurationOnboarding"));
assert("no OAuth coupling", !panel.includes("OAuth") && !store.includes("OAuth"));
assert("documentacaoViva file count >= 20", docvivaFiles.length >= 20);
assert("css present", exists("src/components/devCenter/toolbox/documentacaoViva/documentacaoViva.css"));
assert("model + contract + history present", exists("src/components/devCenter/toolbox/documentacaoViva/documentacaoVivaModel.js") && exists("src/components/devCenter/toolbox/documentacaoViva/documentacaoVivaContract.js") && exists("src/components/devCenter/toolbox/documentacaoViva/documentacaoVivaHistory.js"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    { pass: true, test: "devcenter_documentacao_viva_sanity_unit", cases: 15, files: docvivaFiles.length },
    null,
    2,
  ),
);
