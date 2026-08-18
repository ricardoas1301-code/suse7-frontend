#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const iconSource = readFileSync(join(root, "..", "src/features/dashboard/operationalTasks/OperationalTasksPanelIcon.jsx"), "utf8");
const panelSource = readFileSync(join(root, "..", "src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx"), "utf8");
const failures = [];
function assert(name, cond) { if (!cond) failures.push(name); }

assert("componente export default", iconSource.includes("export default function OperationalTasksPanelIcon"));
assert("variant collapsed class", iconSource.includes('"collapsed"') && iconSource.includes("collapsed-illustration"));
assert("variant expanded class", iconSource.includes('"expanded"') && iconSource.includes("header-illustration"));
assert("variant onboarding class estrutural", iconSource.includes('"onboarding"') && iconSource.includes("title-illustration"));
assert("aria-hidden decorativo", iconSource.includes("aria-hidden"));
assert("alt vazio decorativo", iconSource.includes('alt=""'));
assert("sem import configurationOnboarding", !iconSource.includes("configurationOnboarding"));
assert("painel usa collapsed", panelSource.includes('<OperationalTasksPanelIcon variant="collapsed"'));
assert("painel usa expanded", panelSource.includes('<OperationalTasksPanelIcon variant="expanded"'));
assert("onboarding variant guard", !panelSource.includes('variant="onboarding"') || panelSource.includes("showOnboardingExpandedHeader"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ pass: true, test: "operational_tasks_panel_icon_unit", cases: 10 }, null, 2));
