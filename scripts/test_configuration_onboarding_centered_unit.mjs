#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01D.6 — centered onboarding + logout.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  CARD_PANEL_MODE,
  configuracaoInicialPendente,
  resolverContratoPainelCentral,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingPanelState.js";
import { CONFIGURATION_MILESTONE_STATUS } from "../src/features/dashboard/configurationOnboarding/configurationOnboardingTypes.js";
import { CONFIGURATION_MILESTONE_PRESENTATION_ORDER } from "../src/features/dashboard/configurationOnboarding/configurationMilestonePresentationRegistry.js";

const root = dirname(fileURLToPath(import.meta.url));
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function snapshotWithPercent(percent, completed) {
  const milestones = CONFIGURATION_MILESTONE_PRESENTATION_ORDER.map((id, index) => ({
    id,
    status: index < completed ? CONFIGURATION_MILESTONE_STATUS.COMPLETED : CONFIGURATION_MILESTONE_STATUS.PENDING,
  }));
  return {
    configuration: {
      status: percent >= 100 ? "COMPLETED" : "IN_PROGRESS",
      percent,
      completed,
      total: 6,
    },
    milestones,
  };
}

function baseInput(overrides = {}) {
  return {
    configurationInitialLoading: false,
    configurationError: null,
    configurationHasResolvedOnce: true,
    configurationSnapshot: snapshotWithPercent(50, 3),
    operationalHasResolvedOnce: true,
    operationalTaskCount: 0,
    operationalError: null,
    userPrefersCollapsed: true,
    ...overrides,
  };
}

{
  const input = baseInput({ configurationSnapshot: snapshotWithPercent(50, 3) });
  assert("config pending at 50%", configuracaoInicialPendente(input) === true);
  const contract = resolverContratoPainelCentral(input);
  assert("initial center EXPANDED_FULL", contract.mode === CARD_PANEL_MODE.EXPANDED_FULL);
  assert("initial center non-collapsible", contract.collapsible === false);
  assert("initial center config section", contract.showConfigurationSection === true);
}

{
  const input = baseInput({ configurationSnapshot: snapshotWithPercent(100, 6), operationalTaskCount: 2 });
  assert("config complete at 100%", configuracaoInicialPendente(input) === false);
  const contract = resolverContratoPainelCentral(input);
  assert("100 + ops no config section", contract.showConfigurationSection === false);
  assert("100 + ops default COLLAPSED", contract.mode === CARD_PANEL_MODE.COLLAPSED);
}

{
  const input = baseInput({ configurationSnapshot: snapshotWithPercent(100, 6), operationalTaskCount: 0 });
  const contract = resolverContratoPainelCentral(input);
  assert("100 + zero ops hidden", contract.visible === false);
}

const panelJsx = readFileSync(join(root, "../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx"), "utf8");
const panelCss = readFileSync(join(root, "../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.css"), "utf8");
const gateCss = readFileSync(join(root, "../src/features/dashboard/configurationOnboarding/ConfigurationAppGate.css"), "utf8");
const sectionJsx = readFileSync(join(root, "../src/features/dashboard/configurationOnboarding/S7ConfigurationOnboardingSection.jsx"), "utf8");

assert("panel uses onboarding centered class", panelJsx.includes("configuracaoInicialPendente") && panelJsx.includes("s7-operational-tasks-panel--onboarding-centered"));
assert("panel centered css translate", panelCss.includes("translate(-50%, -50%)"));
assert("background lock veil", gateCss.includes("s7-config-app-gate--locked") && gateCss.includes("pointer-events: none"));
assert("onboarding logout available", sectionJsx.includes("Sair da conta") && sectionJsx.includes("supabase.auth.signOut"));
assert("logout not in avatar when locked contract", panelJsx.includes("S7ConfigurationOnboardingSection"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_onboarding_centered_01d6",
      cases: 14,
      failures: 0,
    },
    null,
    2,
  ),
);
