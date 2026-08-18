#!/usr/bin/env node
/**
 * Admin Global — contrato funcional (placeholder deliberado vs import fantasma).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TOOLBOX_TABS } from "../src/components/devCenter/toolbox/devCenterToolboxTabs.js";

const root = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(root, "..", rel), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const toolbox = read("src/pages/admin/DevCenterToolbox.jsx");
const css = read("src/components/devCenter/toolbox/devCenterToolbox.css");
const adminTab = TOOLBOX_TABS.find((t) => t.id === "admin_global");

assert("admin_global tab exists", Boolean(adminTab));
assert("admin_global label", adminTab?.label === "Administração Global");
assert("admin_global reachable (enabled true on main contract)", adminTab?.enabled === true);
assert("no external AdminGlobalPanel import", !toolbox.match(/^import AdminGlobalPanel/m) && toolbox.includes("// import AdminGlobalPanel"));
assert("local AdminGlobalPanel function", toolbox.includes("function AdminGlobalPanel"));
assert("admin_global tab wired in ToolboxTabContent", toolbox.includes('tabId === "admin_global"'));
assert("uses ToolboxTabPlaceholder pattern", toolbox.includes("ToolboxTabPlaceholder"));
assert("explicit em preparação copy", toolbox.includes("em preparação"));
assert("explicit próxima fase copy", toolbox.includes("Será habilitada em uma próxima fase"));
assert("placeholder css class exists", css.includes(".s7-toolbox__placeholder"));
assert("not silent empty div", !toolbox.includes("return null") || !toolbox.includes("function AdminGlobalPanel() {\n  return null"));
assert("no operationalTasks import", !toolbox.includes("operationalTasks"));
assert("no configurationOnboarding import", !toolbox.includes("configurationOnboarding"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "devcenter_admin_global_contract_unit",
      cases: 13,
      contract: "INTENTIONAL_PLACEHOLDER",
    },
    null,
    2,
  ),
);
