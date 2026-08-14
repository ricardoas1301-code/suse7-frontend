#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01C + 01C.1 — UI unit tests
 */
import {
  CONFIGURATION_MILESTONE_PRESENTATION,
  CONFIGURATION_MILESTONE_PRESENTATION_ORDER,
  obterApresentacaoMilestone,
} from "../src/features/dashboard/configurationOnboarding/configurationMilestonePresentationRegistry.js";
import {
  configuracaoEstaCompleta,
  extrairResumoProgresso,
  selecionarProximoMilestonePendente,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingSelectors.js";
import {
  CARD_PANEL_MODE,
  painelCentralDeveSerVisivel,
  painelCentralRecolhivel,
  possuiPendenciasOperacionaisAcionaveis,
  resolverContratoPainelCentral,
  resolverModoPainelCentral,
  rotuloPainelCentralRecolhido,
  secaoConfiguracaoDeveAparecer,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingPanelVisibility.js";
import { CONFIGURATION_MILESTONE_STATUS } from "../src/features/dashboard/configurationOnboarding/configurationOnboardingTypes.js";
import { CONFIGURATION_TASK_MODAL_SHELL_BASELINE } from "../src/features/dashboard/configurationOnboarding/configurationTaskModalShellBaseline.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function snapshotWithPercent(percent, completed, pendingFrom = completed) {
  void pendingFrom;
  const order = CONFIGURATION_MILESTONE_PRESENTATION_ORDER;
  const milestones = order.map((id, index) => ({
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
    configurationSnapshot: snapshotWithPercent(33, 2),
    operationalHasResolvedOnce: true,
    operationalTaskCount: 0,
    operationalError: null,
    userPrefersCollapsed: true,
    ...overrides,
  };
}

for (const [completed, percent] of [
  [0, 0],
  [1, 17],
  [2, 33],
  [3, 50],
  [4, 67],
  [5, 83],
  [6, 100],
]) {
  const snap = snapshotWithPercent(percent, completed);
  const resumo = extrairResumoProgresso(snap);
  assert(`${completed}/6 percent ${percent}`, resumo.percent === percent);
}

{
  const snap = snapshotWithPercent(33, 2);
  const next = selecionarProximoMilestonePendente(snap.milestones);
  assert("next milestone TAX_RATE", next?.milestone?.id === "TAX_RATE");
  assert("next label", next?.presentation?.label === "Alíquota de imposto");
}

assert("6/6 mapped", CONFIGURATION_MILESTONE_PRESENTATION_ORDER.length === 6);
for (const id of CONFIGURATION_MILESTONE_PRESENTATION_ORDER) {
  assert(`presentation ${id}`, Boolean(CONFIGURATION_MILESTONE_PRESENTATION[id]?.label));
}

{
  const unknown = obterApresentacaoMilestone("FUTURE_MILESTONE_X");
  assert("unknown fallback", unknown.isUnknown === true);
  assert("unknown label", unknown.label.length > 0);
}

{
  const snap100 = snapshotWithPercent(100, 6);
  assert("100 complete", configuracaoEstaCompleta(snap100) === true);
  const snap33 = snapshotWithPercent(33, 2);
  assert("33 not complete", configuracaoEstaCompleta(snap33) === false);
}

for (const [completed, percent] of [
  [0, 0],
  [1, 17],
  [2, 33],
  [3, 50],
  [4, 67],
  [5, 83],
]) {
  const snap = snapshotWithPercent(percent, completed);
  const input = baseInput({ configurationSnapshot: snap, userPrefersCollapsed: true });
  const contract = resolverContratoPainelCentral(input);
  assert(`01C.1 ${percent}% visible`, contract.visible === true);
  assert(`01C.1 ${percent}% EXPANDED_FULL`, contract.mode === CARD_PANEL_MODE.EXPANDED_FULL);
  assert(`01C.1 ${percent}% non-collapsible`, contract.collapsible === false);
  assert(`01C.1 ${percent}% config section`, contract.showConfigurationSection === true);
}

{
  const snap100 = snapshotWithPercent(100, 6);
  const input = baseInput({ configurationSnapshot: snap100, operationalTaskCount: 0 });
  const contract = resolverContratoPainelCentral(input);
  assert("01C.1 100% + 0 ops hidden", contract.visible === false);
  assert("01C.1 100% + 0 ops no mode", contract.mode === null);
  assert(
    "01C.1 100% + 0 ops host hidden",
    painelCentralDeveSerVisivel(input) === false,
  );
}

{
  const snap100 = snapshotWithPercent(100, 6);
  const input = baseInput({ configurationSnapshot: snap100, operationalTaskCount: 3 });
  const contract = resolverContratoPainelCentral(input);
  assert("01C.1 100% + SKU visible", contract.visible === true);
  assert("01C.1 100% + SKU no config section", contract.showConfigurationSection === false);
  assert("01C.1 100% + SKU operational section", contract.showOperationalSection === true);
}

{
  const snap100 = snapshotWithPercent(100, 6);
  const input = baseInput({ configurationSnapshot: snap100, operationalTaskCount: 5 });
  const contract = resolverContratoPainelCentral(input);
  assert("01C.1 100% + costs visible", contract.visible === true);
  assert("01C.1 100% + costs no config section", contract.showConfigurationSection === false);
}

{
  const snap100 = snapshotWithPercent(100, 6);
  const input = baseInput({ configurationSnapshot: snap100, operationalTaskCount: 4, userPrefersCollapsed: true });
  const contract = resolverContratoPainelCentral(input);
  assert("01C.1 100% + ops default COLLAPSED", contract.mode === CARD_PANEL_MODE.COLLAPSED);
  assert("01C.1 100% + ops collapsible", contract.collapsible === true);
}

{
  const snap100 = snapshotWithPercent(100, 6);
  const input = baseInput({ configurationSnapshot: snap100, operationalTaskCount: 2, userPrefersCollapsed: false });
  const mode = resolverModoPainelCentral(input);
  assert("01C.1 100% + ops click EXPANDED_FULL", mode === CARD_PANEL_MODE.EXPANDED_FULL);
}

{
  const snap33 = snapshotWithPercent(33, 2);
  const input = baseInput({
    configurationSnapshot: snap33,
    operationalTaskCount: 2,
    userPrefersCollapsed: true,
  });
  const contract = resolverContratoPainelCentral(input);
  assert("01C.1 config+ops EXPANDED_FULL", contract.mode === CARD_PANEL_MODE.EXPANDED_FULL);
  assert("01C.1 config+ops both sections", contract.showConfigurationSection && contract.showOperationalSection);
}

{
  const snap100 = snapshotWithPercent(100, 6);
  assert(
    "01C.1 config section absent at 100%",
    secaoConfiguracaoDeveAparecer({
      configurationInitialLoading: false,
      configurationError: null,
      configurationHasResolvedOnce: true,
      configurationSnapshot: snap100,
    }) === false,
  );
}

{
  const snap100ops = snapshotWithPercent(100, 6);
  assert(
    "100% + operational visible",
    painelCentralDeveSerVisivel({
      configurationHasResolvedOnce: true,
      configurationInitialLoading: false,
      configurationError: null,
      configurationSnapshot: snap100ops,
      operationalHasResolvedOnce: true,
      operationalTaskCount: 2,
    }),
  );
}

{
  assert(
    "config error still visible",
    painelCentralDeveSerVisivel({
      configurationHasResolvedOnce: true,
      configurationInitialLoading: false,
      configurationError: "fail",
      configurationSnapshot: null,
      operationalHasResolvedOnce: true,
      operationalTaskCount: 0,
    }),
  );
}

{
  const snap33 = snapshotWithPercent(33, 2);
  assert(
    "config 33 visible without ops",
    painelCentralDeveSerVisivel({
      configurationHasResolvedOnce: true,
      configurationInitialLoading: false,
      configurationError: null,
      configurationSnapshot: snap33,
      operationalHasResolvedOnce: true,
      operationalTaskCount: 0,
    }),
  );
}

{
  const label = rotuloPainelCentralRecolhido({ operationalTaskCount: 2 });
  assert("collapsed label operational only", label === "2 pendências");
  assert("collapsed label no config percent", !label.includes("%"));
}

{
  assert(
    "01C.1 no partial mode enum",
    !Object.prototype.hasOwnProperty.call(CARD_PANEL_MODE, "PARTIAL_EXPANDED") &&
      !Object.prototype.hasOwnProperty.call(CARD_PANEL_MODE, "SUMMARY_EXPANDED"),
  );
}

{
  const snap100 = snapshotWithPercent(100, 6);
  assert(
    "01C.1 resolved config not actionable",
    possuiPendenciasOperacionaisAcionaveis({
      operationalHasResolvedOnce: true,
      operationalTaskCount: 0,
    }) === false &&
      secaoConfiguracaoDeveAparecer({
        configurationInitialLoading: false,
        configurationError: null,
        configurationHasResolvedOnce: true,
        configurationSnapshot: snap100,
      }) === false,
  );
}

{
  assert(
    "01C.1 loading config visible",
    resolverContratoPainelCentral(
      baseInput({
        configurationInitialLoading: true,
        configurationSnapshot: null,
        userPrefersCollapsed: true,
      }),
    ).mode === CARD_PANEL_MODE.EXPANDED_FULL,
  );
}

assert("shell width baseline", CONFIGURATION_TASK_MODAL_SHELL_BASELINE.maxWidthDesktop === "1120px");
assert("shell height baseline", CONFIGURATION_TASK_MODAL_SHELL_BASELINE.heightDesktop.includes("720px"));

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_onboarding_ui_unit_01c_01c1",
      cases: 40,
      failures: 0,
    },
    null,
    2,
  ),
);
