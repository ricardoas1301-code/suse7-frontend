#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01C + 01C.1 + 01D + 01D.1 — UI unit tests
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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
  celebracaoConfiguracaoAtiva,
  configuracaoInicialConcluida,
  configuracaoInicialPendente,
  painelCentralDeveSerVisivel,
  painelCentralOnboardingOverlay,
  painelCentralRecolhivel,
  possuiPendenciasOperacionaisAcionaveis,
  resolverContratoPainelCentral,
  resolverEstadoConfiguracaoInicial,
  CONFIGURACAO_INICIAL_ESTADO,
  resolverModoPainelCentral,
  rotuloPainelCentralRecolhido,
  secaoConfiguracaoDeveAparecer,
  secaoOperacionalPosOnboardingDeveAparecer,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingPanelVisibility.js";
import { buildCollapsedOperationalTasksLabel } from "../src/features/dashboard/operationalTasks/operationalTaskDescriptions.js";
import { CONFIGURATION_MILESTONE_STATUS } from "../src/features/dashboard/configurationOnboarding/configurationOnboardingTypes.js";
import {
  CONFIGURATION_MILESTONE_ACTION_TYPES,
  CONFIGURATION_MILESTONE_ACTION_REGISTRY,
  milestoneAcaoClicavel,
  resolverAcaoMilestone,
} from "../src/features/dashboard/configurationOnboarding/configurationMilestoneActionRegistry.js";
import {
  validateConfigurationPercentInput,
  validateConfigurationCompanyDataForm,
  validateConfigurationOperationalCycleForm,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingFormHelpers.js";
import { executarSalvarConfiguracaoComRefresh } from "../src/features/dashboard/configurationOnboarding/configurationOnboardingSaveFlow.js";
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

/** Espelha S7OperationalTasksPanel.showOperationalSection — detecta import quebrado no painel. */
function painelShowOperationalSection(input) {
  return secaoOperacionalPosOnboardingDeveAparecer(input);
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
  const celebrationInput = baseInput({
    configurationSnapshot: snap100,
    operationalTaskCount: 2,
    configurationCompletionCelebrationActive: true,
  });
  const celebrationContract = resolverContratoPainelCentral(celebrationInput);
  assert("POST-OAUTH celebration visible", celebrationContract.visible === true);
  assert("POST-OAUTH celebration expanded", celebrationContract.mode === CARD_PANEL_MODE.EXPANDED_FULL);
  assert("POST-OAUTH celebration config section", celebrationContract.showConfigurationSection === true);
  assert("POST-OAUTH celebration hides ops section", celebrationContract.showOperationalSection === false);
  assert("POST-OAUTH celebration not collapsible", celebrationContract.collapsible === false);
  assert(
    "POST-OAUTH panel branch case A celebration hides ops",
    painelShowOperationalSection(celebrationInput) === false,
  );
  assert(
    "POST-OAUTH panel branch parity with contract",
    painelShowOperationalSection(celebrationInput) === celebrationContract.showOperationalSection,
  );
}

{
  const snap100 = snapshotWithPercent(100, 6);
  const dismissedInput = baseInput({
    configurationSnapshot: snap100,
    operationalTaskCount: 2,
    configurationCompletionCelebrationActive: false,
  });
  assert(
    "POST-OAUTH panel branch case B dismissed shows ops",
    painelShowOperationalSection(dismissedInput) === true,
  );
}

{
  const incompleteInput = baseInput({
    configurationSnapshot: snapshotWithPercent(83, 5),
    operationalTaskCount: 3,
  });
  assert(
    "POST-ONBOARDING 5/6 hides ops section despite tasks",
    secaoOperacionalPosOnboardingDeveAparecer(incompleteInput) === false,
  );
  assert(
    "POST-ONBOARDING 5/6 onboarding section visible",
    secaoConfiguracaoDeveAparecer(incompleteInput) === true,
  );
  assert(
    "POST-ONBOARDING 5/6 panel visible for onboarding",
    painelCentralDeveSerVisivel(incompleteInput) === true,
  );
}

{
  const unresolvedOpsInput = baseInput({
    configurationHasResolvedOnce: false,
    configurationSnapshot: null,
    operationalTaskCount: 3,
  });
  assert(
    "POST-ONBOARDING unresolved config hides ops section",
    secaoOperacionalPosOnboardingDeveAparecer(unresolvedOpsInput) === false,
  );
  assert(
    "POST-ONBOARDING unresolved config treats onboarding pending",
    configuracaoInicialConcluida(unresolvedOpsInput) === false,
  );
  assert(
    "POST-ONBOARDING unresolved config not pending (no flash)",
    configuracaoInicialPendente(unresolvedOpsInput) === false,
  );
  assert(
    "POST-ONBOARDING unresolved config panel hidden",
    painelCentralDeveSerVisivel(unresolvedOpsInput) === false,
  );
}

{
  const incompleteInput = baseInput({
    configurationSnapshot: snapshotWithPercent(83, 5),
    operationalTaskCount: 0,
  });
  assert(
    "POST-OAUTH panel branch case C incomplete no ops crash",
    painelShowOperationalSection(incompleteInput) === false,
  );
  assert(
    "POST-OAUTH panel branch case C incomplete config visible",
    secaoConfiguracaoDeveAparecer(incompleteInput) === true,
  );
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
  assert(
    "01C.1 config+ops onboarding only config section",
    contract.showConfigurationSection && contract.showOperationalSection === false,
  );
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
  const loadingContract = resolverContratoPainelCentral(
    baseInput({
      configurationInitialLoading: true,
      configurationHasResolvedOnce: false,
      configurationSnapshot: null,
      userPrefersCollapsed: true,
    }),
  );
  assert("01C.1 loading config hidden (no flash)", loadingContract.visible === false);
  assert("01C.1 loading config no mode", loadingContract.mode === null);
  assert(
    "01C.1 loading config section off",
    loadingContract.showConfigurationSection === false,
  );
}

assert("shell content-adaptive baseline", CONFIGURATION_TASK_MODAL_SHELL_BASELINE.layout === "CONTENT_ADAPTIVE");
assert("shell compact width", CONFIGURATION_TASK_MODAL_SHELL_BASELINE.compactMaxWidth.includes("280px"));
assert("shell no cancel by default", CONFIGURATION_TASK_MODAL_SHELL_BASELINE.cancelButtonVisible === false);

assert("01D.1 tax empty message", validateConfigurationPercentInput("", { emptyMessage: "Informe a alíquota de imposto." }).message === "Informe a alíquota de imposto.");
assert("01D.1 M5 zero days invalid", validateConfigurationOperationalCycleForm({ closesAt: "18:00", workingDays: [] }).ok === false);

const feRoot = dirname(fileURLToPath(import.meta.url));
const shellCss = readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationTaskModalShell.css"), "utf8");
const shellJsx = readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationTaskModalShell.jsx"), "utf8");
assert("01D.2 modals centered by default", shellJsx.includes("anchorToTaskCenter = false"));
assert("01D.2 centered overlay baseline", shellCss.includes("align-items: center") && shellCss.includes("justify-content: center"));
assert("01D.1 percent modal no cancel", !readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationPercentModal.jsx"), "utf8").includes("Cancelar"));
assert(
  "01D.2 operational cost not applicable",
  readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationPercentModal.jsx"), "utf8").includes("showNotApplicable") &&
    readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationOnboardingActionsHost.jsx"), "utf8").includes("showNotApplicable"),
);
assert(
  "01D.2 operational cycle native time input",
  readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationOperationalCycleModal.jsx"), "utf8").includes('type="time"'),
);
assert(
  "01D.2 task panel blue border",
  readFileSync(join(feRoot, "../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.css"), "utf8").includes("border: 1px solid #5f9bff"),
);

const percentModalJsx = readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationPercentModal.jsx"), "utf8");
const percentModalCss = readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationOnboardingModals.css"), "utf8");
const actionsHostJsx = readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationOnboardingActionsHost.jsx"), "utf8");
const sectionJsx = readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/S7ConfigurationOnboardingSection.jsx"), "utf8");
const sectionCss = readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/S7ConfigurationOnboardingSection.css"), "utf8");
const cycleModalJsx = readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationOperationalCycleModal.jsx"), "utf8");

assert("01D.3 M3 helper copy", actionsHostJsx.includes('helperText="Percentual fiscal padrão da empresa."'));
assert("01D.3 M3 redundant visible label removed", !actionsHostJsx.includes('fieldLabel="Alíquota de imposto (%)"'));
assert("01D.3 M3 accessible input label", actionsHostJsx.includes('accessibleInputLabel="Alíquota de imposto (%)"'));
assert("01D.3 M3 helper typography", percentModalCss.includes("configuration-onboarding-modal-form__helper"));
assert("01D.3 M3 percent input narrow", readFileSync(join(feRoot, "../src/components/ui/S7PercentDirectInput.css"), "utf8").includes("clamp(96px, 50%, 140px)"));
assert("01D.3 M3 no horizontal overflow", percentModalCss.includes("overflow-x: hidden") && shellCss.includes("overflow-x: hidden"));

assert("01D.3 M4 field label preserved", actionsHostJsx.includes('fieldLabel="Custo operacional (%)"'));
assert(
  "01D.3 M4 helper copy",
  actionsHostJsx.includes(
    "Percentual facultativo. Caso não queira informar um custo operacional, clique em 'Não se aplica'.",
  ),
);
assert("01D.3 M4 helper style class", percentModalCss.includes("configuration-onboarding-modal-form__helper"));
assert("01D.3 M4 not applicable hover", percentModalCss.includes("configuration-onboarding-modal-form__not-applicable-btn"));
assert("01D.3 M4 not applicable focus-visible", percentModalCss.includes("focus-visible:not(:disabled)"));
assert("01D.3 M4 zero write contract", percentModalJsx.includes('buildConfigurationPercentPatchValue("0")'));

assert("01D.3 M5 no autofocus input", !shellJsx.includes("querySelector("));
assert("01D.3 M5 dialog initial focus", shellJsx.includes("dialog.focus()"));
assert("01D.3 M5 time input preserved", cycleModalJsx.includes('type="time"'));
assert("01D.3 M5 default 18:00 preserved", cycleModalJsx.includes("DEFAULT_OPERATIONAL_DAY_CLOSES_AT"));

assert("01D.3 pending empty square", sectionCss.includes("checklist-icon--pending"));
assert("01D.3 pending not circle char", !sectionJsx.includes('"○"'));
assert("01D.3 pending not checkbox input", !sectionJsx.includes('type="checkbox"'));
assert("01D.3 completed check preserved", sectionJsx.includes('"✓"'));

const percentInputUtil = readFileSync(join(feRoot, "../src/utils/s7PercentDirectInput.js"), "utf8");
const percentInputComponent = readFileSync(join(feRoot, "../src/components/ui/S7PercentDirectInput.jsx"), "utf8");
assert("01D.4 shared percent util", percentInputUtil.includes("formatarPercentualDiretoFinal"));
assert("01D.4 percent modal uses direct input", readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationPercentModal.jsx"), "utf8").includes("S7PercentDirectInput"));
assert("01D.4 not cents mask", percentInputUtil.includes("NÃO máscara centésimal"));
assert("01D.4 suffix non editable", percentInputComponent.includes("s7-percent-direct-input__suffix"));
assert("01D.4 M3 placeholder", actionsHostJsx.includes('placeholder="0,00"'));
assert("01D.4 M4 placeholder", actionsHostJsx.includes('placeholder="0,00"'));
assert("01D.4 pending blue border", sectionCss.includes("border: 1.5px solid #5f9bff"));
assert("01D.4 pending smaller square", sectionCss.includes("width: 11px") && sectionCss.includes("height: 11px"));

assert("01D action registry M3", CONFIGURATION_MILESTONE_ACTION_REGISTRY.TAX_RATE.actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.MODAL_TAX_RATE);
assert("01D M6 not clickable when locked", milestoneAcaoClicavel("FIRST_MARKETPLACE_CONNECTION", "PENDING", snapshotWithPercent(50, 3).milestones) === false);
assert("01D M4 clickable when sequential gate open", milestoneAcaoClicavel("OPERATIONAL_COST", "PENDING", snapshotWithPercent(50, 3).milestones) === true);
assert("01D M3 blocked before company data", milestoneAcaoClicavel("TAX_RATE", "PENDING", snapshotWithPercent(17, 1).milestones) === false);
assert("01D M3 not clickable when completed", milestoneAcaoClicavel("TAX_RATE", "COMPLETED", snapshotWithPercent(50, 3).milestones) === false);
assert("01D M2 legal reuse", resolverAcaoMilestone("LEGAL_ACCEPTANCE").actionType === CONFIGURATION_MILESTONE_ACTION_TYPES.LEGAL_FLOW);

assert("01D percent zero valid", validateConfigurationPercentInput("0").ok === true);
assert("01D percent empty invalid", validateConfigurationPercentInput("").ok === false);
assert("01D percent pt-BR valid", validateConfigurationPercentInput("18,50").ok === true);

assert(
  "01D company required field",
  validateConfigurationCompanyDataForm({
    company_name: "",
    trade_name: "X",
    document_cnpj: "62194333000156",
    contact_email: "a@b.com",
    whatsapp: "11999998888",
  }).ok === false,
);

{
  let writeCalls = 0;
  const outcome = await executarSalvarConfiguracaoComRefresh({
    writeFn: async () => {
      writeCalls += 1;
      return { ok: true };
    },
    refreshFn: async () => ({ ok: true }),
  });
  assert("01D save+refresh success", outcome.ok === true && writeCalls === 1);
}

{
  let refreshCalls = 0;
  const outcome = await executarSalvarConfiguracaoComRefresh({
    writeFn: async () => ({ ok: true }),
    refreshFn: async () => {
      refreshCalls += 1;
      return { ok: false, error: "refresh fail" };
    },
  });
  assert("01D refresh fail controlled", outcome.ok === false && outcome.phase === "refresh" && refreshCalls === 1);
}

{
  let writeCalls = 0;
  const outcome = await executarSalvarConfiguracaoComRefresh({
    writeFn: async () => {
      writeCalls += 1;
      return { ok: false, error: "write fail" };
    },
    refreshFn: async () => ({ ok: true }),
  });
  assert("01D write fail no refresh authority", outcome.ok === false && outcome.phase === "write" && writeCalls === 1);
}

const progressiveCases = [
  [2, 33, "TAX_RATE"],
  [3, 50, "OPERATIONAL_COST"],
  [4, 67, "OPERATIONAL_CYCLE"],
  [5, 83, "FIRST_MARKETPLACE_CONNECTION"],
];
for (const [completed, percent, nextId] of progressiveCases) {
  const snap = snapshotWithPercent(percent, completed);
  const next = selecionarProximoMilestonePendente(snap.milestones);
  assert(`01D progressive ${completed}/6 percent`, extrairResumoProgresso(snap).percent === percent);
  assert(`01D progressive next ${nextId}`, next?.milestone?.id === nextId);
}

assert("01D M6 pending at 83", snapshotWithPercent(83, 5).milestones.find((m) => m.id === "FIRST_MARKETPLACE_CONNECTION")?.status === "PENDING");

const costTooltipSource = readFileSync(join(feRoot, "../src/domain/costs/costSemanticsPresentation.js"), "utf8");
assert("01D.6 M4 tooltip source", costTooltipSource.includes("COMPANY_OPERATIONAL_COST_TOOLTIP"));
assert("01D.6 M4 tooltip wired", actionsHostJsx.includes("fieldLabelTooltip={COMPANY_OPERATIONAL_COST_TOOLTIP}"));
assert("01D.6 M4 tooltip component", percentModalJsx.includes("fieldLabelTooltip") && percentModalJsx.includes("S7Tooltip"));
assert("01D.6 percent no caret", percentInputComponent.includes("sanitizarPercentualDiretoEdicao(event.target.value)") && !percentInputComponent.includes("setSelectionRange"));
assert("01D.6 centered panel class", readFileSync(join(feRoot, "../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx"), "utf8").includes("s7-operational-tasks-panel--onboarding-centered"));
{
  const panelSrc = readFileSync(
    join(feRoot, "../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx"),
    "utf8",
  );
  assert(
    "POST-OAUTH panel imports celebracaoConfiguracaoAtiva",
    /import\s*\{[\s\S]*?\bcelebracaoConfiguracaoAtiva\b[\s\S]*?\}\s*from\s*["']\.\.\/configurationOnboarding\/configurationOnboardingPanelState\.js["']/.test(
      panelSrc,
    ),
  );
  assert(
    "POST-OAUTH panel uses secaoOperacionalPosOnboardingDeveAparecer",
    panelSrc.includes("secaoOperacionalPosOnboardingDeveAparecer(panelInput)"),
  );
  assert(
    "POST-ONBOARDING expanded title Central de pendências",
    panelSrc.includes('"Central de pendências"') && panelSrc.includes("showOnboardingExpandedHeader"),
  );
  assert(
    "POST-ONBOARDING expanded subtitle uses pending count",
    panelSrc.includes("s7-operational-tasks-panel__title-subtitle") &&
      panelSrc.includes("buildCollapsedOperationalTasksLabel(pendingTasksCount)"),
  );
  assert(
    "POST-ONBOARDING onboarding title preserved for modal stage",
    panelSrc.includes('"Sua operação começa aqui"') &&
      panelSrc.includes("showConfigurationSection"),
  );
}
assert(
  "POST-ONBOARDING collapsed label singular",
  buildCollapsedOperationalTasksLabel(1) === "1 pendência",
);
assert(
  "POST-ONBOARDING collapsed label plural",
  buildCollapsedOperationalTasksLabel(3) === "3 pendências",
);
assert("01D.6 onboarding logout", sectionJsx.includes("Sair da conta"));
assert("01D.6 progress footer", sectionJsx.includes('className="s7-configuration-onboarding__footer"') && sectionJsx.indexOf("s7-configuration-onboarding__progress") > sectionJsx.indexOf("s7-configuration-onboarding__checklist"));
assert(
  "01D.6 logout respiro abaixo do resumo",
  sectionCss.includes(".s7-configuration-onboarding__footer .s7-configuration-onboarding__logout") &&
    sectionCss.includes("--s7-onboarding-separated-gap: 16px"),
);
assert(
  "01D.6 importante respiro acima da checklist",
  sectionCss.includes(".s7-configuration-onboarding__main") &&
    sectionCss.includes("margin-top: calc(var(--s7-onboarding-separated-gap) - 10px)"),
);
assert("01D.6 centered main block", sectionCss.includes("s7-configuration-onboarding__main"));
assert("01D.6 header lock bell", readFileSync(join(feRoot, "../src/components/notifications/S7NotificationCenter.jsx"), "utf8").includes("interactionLocked"));
assert("01D.6 header lock avatar", readFileSync(join(feRoot, "../src/components/AvatarMenu.jsx"), "utf8").includes("interactionLocked"));

assert("COPY-PROGRESS-POLISH panel title preserved", readFileSync(join(feRoot, "../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx"), "utf8").includes("Sua operação começa aqui"));
assert("M6-UX-PREOAUTH loja label in checklist", CONFIGURATION_MILESTONE_PRESENTATION.COMPANY_DATA.label === "Dados da loja");

const preConfirmModal = readFileSync(
  join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationMarketplacePreConfirmModal.jsx"),
  "utf8",
);
const preConfirmCss = readFileSync(
  join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationOnboardingModals.css"),
  "utf8",
);
const mlCopy = readFileSync(
  join(feRoot, "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationCopy.js"),
  "utf8",
);
assert("M6-UX-PREOAUTH loja in preconfirm modal", preConfirmModal.includes("<dt>Loja</dt>") && !preConfirmModal.includes("<dt>Empresa</dt>"));
assert("M6-UX-PREOAUTH removed paragraph 1", !preConfirmModal.includes("Para conectar esta empresa"));
const mlCopyJs = readFileSync(
  join(feRoot, "../src/components/Profile/marketplaceIntegration/mercadoLivreIntegrationCopy.js"),
  "utf8",
);
assert("M6-SSOT oauth intro password sentence removed", !mlCopyJs.includes("nunca teremos acesso à sua senha"));
assert("M6-SSOT oauth intro ends at OAuth 2.0", mlCopyJs.includes("protocolo OAuth 2.0 de autenticação."));
assert("M6-UX-PREOAUTH reuses ML_INTEGRATION_OAUTH_INTRO", preConfirmModal.includes("ML_INTEGRATION_OAUTH_INTRO"));
assert("M6-UX-PREOAUTH reuses account confirm SSOT", preConfirmModal.includes("ML_INTEGRATION_PRE_AUTH_ACCOUNT_CONFIRM"));
assert("M6-UX-PREOAUTH connection visual reused", preConfirmModal.includes("MarketplaceConnectionVisual"));
assert("M6-UX-PREOAUTH alert triangle icon", readFileSync(join(feRoot, "../src/components/ui/S7ImportantNotice.jsx"), "utf8").includes('name="AlertTriangle"'));
assert("M6-UX-PREOAUTH important styling", readFileSync(join(feRoot, "../src/components/ui/S7ImportantNotice.css"), "utf8").includes(".s7-important-notice"));
assert("M6-UX-PREOAUTH reuses S7ImportantNotice", preConfirmModal.includes("S7ImportantNotice"));
assert("M6-UX-PREOAUTH wide modal size", preConfirmModal.includes("CONFIGURATION_TASK_MODAL_SIZE.WIDE"));
assert("M6-UX-PREOAUTH CTA Conectar", preConfirmModal.includes("Conectar ao Mercado Livre"));
assert("M6-UX-PREOAUTH CTA old removed", !preConfirmModal.includes("Continuar para o Mercado Livre"));
assert("M6-UX-PREOAUTH account confirm in copy SSOT", mlCopy.includes("ML_INTEGRATION_PRE_AUTH_ACCOUNT_CONFIRM"));
assert(
  "M6-UX-PREOAUTH panel operation illustration",
  readFileSync(join(feRoot, "../src/features/dashboard/operationalTasks/OperationalTasksPanelIcon.jsx"), "utf8").includes("onboarding-operacao-comercial.png"),
);
assert("M6-UX-PREOAUTH panel no title triangle", !readFileSync(join(feRoot, "../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx"), "utf8").includes("s7-operational-tasks-panel__title-attention"));
assert("M6-UX-PREOAUTH modal marketplace badge", preConfirmModal.includes("showMarketplaceChannelBadge"));
assert("M6-UX-PREOAUTH modal hide visual title", preConfirmModal.includes("hideTitle"));
assert("M6-UX-PREOAUTH modal white surface", preConfirmModal.includes('bodySurface="white"'));
assert("M6-UX-PREOAUTH modal historical copy SSOT", preConfirmModal.includes("ML_INTEGRATION_HISTORICAL_SALES_MESSAGE"));
assert("M6-UX-PREOAUTH modal channel badge prefix", preConfirmModal.includes('channelBadgePrefix="Conecte sua conta ao"'));
assert("M6-UX-PREOAUTH modal connect title a11y", preConfirmModal.includes("Conecte sua conta ao Mercado Livre"));
assert("M6-UX-PREOAUTH onboarding section spacing", readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/S7ConfigurationOnboardingSection.css"), "utf8").includes("gap: 10px"));
assert("M6-UX-PREOAUTH panel illustration right aligned", readFileSync(join(feRoot, "../src/features/dashboard/operationalTasks/S7OperationalTasksPanel.css"), "utf8").includes("margin-left: auto"));
assert("M6-UX-PREOAUTH modal ml theme class applied", readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationTaskModalShell.jsx"), "utf8").includes("configuration-task-modal-shell--${marketplaceTheme.resolvedKey}"));
assert("M6-UX-PREOAUTH modal no raiox shell class leak", !readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationTaskModalShell.jsx"), "utf8").includes("shellModifierClass"));
assert("M6-UX-PREOAUTH ml desktop body overflow visible", readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationTaskModalShell.css"), "utf8").includes("overflow-y: visible"));
assert("M6-UX-PREOAUTH ml border selector specificity", readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationTaskModalShell.css"), "utf8").includes(".configuration-task-modal-shell.configuration-task-modal-shell--mercado_livre"));
assert("COPY-PROGRESS-POLISH config inicial removed", !sectionJsx.includes("Configuração inicial"));
assert("COPY-PROGRESS-POLISH intro important notice", sectionJsx.includes("S7ImportantNotice"));
assert("COPY-PROGRESS-POLISH intro copy once", sectionJsx.includes("Completar estas etapas é essencial para preparar sua operação e começar a usar o SUSE7. Essa etapa leva menos de dois minutos."));
{
  const headerBlock =
    sectionJsx.match(/<div className="s7-configuration-onboarding__header">[\s\S]*?<\/div>/)?.[0] ?? "";
  assert("COPY-PROGRESS-POLISH percent removed from header", !headerBlock.includes("s7-configuration-onboarding__percent"));
}
assert("COPY-PROGRESS-POLISH summary row", sectionJsx.includes("s7-configuration-onboarding__summary-row"));
assert("COPY-PROGRESS-POLISH summary and percent same row", /s7-configuration-onboarding__summary-row[\s\S]*etapas concluídas[\s\S]*s7-configuration-onboarding__percent/.test(sectionJsx));
assert("COPY-PROGRESS-POLISH summary row flex css", sectionCss.includes(".s7-configuration-onboarding__summary-row") && sectionCss.includes("justify-content: space-between"));
assert("COPY-PROGRESS-POLISH progress bar unchanged", sectionJsx.includes('style={{ width: `${safePercent}%` }}'));

assert("ONBOARDING-SOCIAL terms portal body", readFileSync(join(feRoot, "../src/components/legal/TermsAcceptanceModal.jsx"), "utf8").includes("createPortal"));
assert("ONBOARDING-SOCIAL terms z-index modal-top", readFileSync(join(feRoot, "../src/components/legal/TermsAcceptanceModal.css"), "utf8").includes("--s7-z-modal-top"));
assert("ONBOARDING-SOCIAL modal body white default", !readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationTaskModalShell.css"), "utf8").includes("#f2f7ff"));
assert("ONBOARDING-SOCIAL dados loja signup grid", readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationCompanyDataModal.jsx"), "utf8").includes("configuration-onboarding-modal-form__row"));
assert("ONBOARDING-SOCIAL dados loja title", readFileSync(join(feRoot, "../src/features/dashboard/configurationOnboarding/ConfigurationCompanyDataModal.jsx"), "utf8").includes('title="Dados da Loja"'));

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_onboarding_ui_unit_01c_01c1_01d_01d1_01d3_01d4_01d6",
      cases: 132,
      failures: 0,
    },
    null,
    2,
  ),
);
