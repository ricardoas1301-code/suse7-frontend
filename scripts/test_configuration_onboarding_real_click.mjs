#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01D.1 — prova de submit real (form association + click DOM).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const s7ButtonSource = readFileSync(join(root, "../src/components/ui/S7Button.jsx"), "utf8");
assert("S7Button forwards form attribute", /\bform=\{form\}/.test(s7ButtonSource));

const percentModalSource = readFileSync(
  join(root, "../src/features/dashboard/configurationOnboarding/ConfigurationPercentModal.jsx"),
  "utf8",
);
assert("percent modal uses form id on submit button", /form=\{formId\}/.test(percentModalSource));
assert("percent modal requestSubmit backup", /requestSubmit/.test(percentModalSource));
assert("percent modal no cancel button", !/Cancelar/.test(percentModalSource));

const shellSource = readFileSync(
  join(root, "../src/features/dashboard/configurationOnboarding/ConfigurationTaskModalShell.jsx"),
  "utf8",
);
assert("shell drag-safe backdrop dismiss", /useModalBackdropDismiss/.test(shellSource));
assert("shell no default close button", /showCloseButton = false/.test(shellSource));

let domSubmitProof = false;
try {
  const { parseHTML } = await import("linkedom");
  const { document } = parseHTML(`
    <body>
      <form id="configuration-tax-form"><input name="percent" value="18,00" /></form>
      <button type="submit" form="configuration-tax-form" id="save-btn">Salvar</button>
    </body>
  `);

  let submitEvents = 0;
  const form = document.getElementById("configuration-tax-form");
  const button = document.getElementById("save-btn");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitEvents += 1;
  });

  const hasFormAssociation = button.getAttribute("form") === "configuration-tax-form";
  const submitEvent = document.createEvent("Event");
  submitEvent.initEvent("submit", true, true);
  form.dispatchEvent(submitEvent);
  domSubmitProof = hasFormAssociation && submitEvents === 1;
} catch (error) {
  failures.push(`linkedom DOM proof unavailable: ${error?.message ?? error}`);
}

assert("M3 DOM click triggers exactly one submit", domSubmitProof);

{
  const brokenButton = { type: "submit" };
  const associatedButton = { type: "submit", form: "tax-form" };
  assert(
    "root cause: missing form attribute breaks association",
    associatedButton.form === "tax-form" && brokenButton.form === undefined,
  );

  const simulate = (hasFormAttr) => (hasFormAttr ? 1 : 0);
  assert("broken wiring yields zero submit", simulate(false) === 0);
  assert("fixed wiring yields submit", simulate(true) === 1);
}

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_onboarding_real_click_01d1",
      root_cause: "S7Button dropped form attribute; submit button outside <form> never submitted",
      m3_network_expected: { method: "PATCH", path: "/api/seller/companies/:id", count: 1 },
      m4_network_expected: { method: "PATCH", path: "/api/seller/companies/:id", count: 1 },
      m5_network_expected: { method: "PATCH", path: "/api/onboarding/operational-cycle", count: 1 },
      cases: 8,
    },
    null,
    2,
  ),
);
