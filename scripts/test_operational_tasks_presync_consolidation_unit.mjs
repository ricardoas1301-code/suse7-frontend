#!/usr/bin/env node
/**
 * Pré-sync consolidation — flash onboarding, collapse, SSOT initial sync, copy
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CARD_PANEL_MODE,
  CONFIGURACAO_INICIAL_ESTADO,
  configuracaoInicialPendente,
  painelCentralDeveSerVisivel,
  painelCentralOnboardingOverlay,
  resolverContratoPainelCentral,
  resolverEstadoConfiguracaoInicial,
  secaoConfiguracaoDeveAparecer,
} from "../src/features/dashboard/configurationOnboarding/configurationOnboardingPanelVisibility.js";
import { CONFIGURATION_MILESTONE_PRESENTATION_ORDER } from "../src/features/dashboard/configurationOnboarding/configurationMilestonePresentationRegistry.js";
import { CONFIGURATION_MILESTONE_STATUS } from "../src/features/dashboard/configurationOnboarding/configurationOnboardingTypes.js";
import {
  estadoInicialRecolhidoPainelOperacional,
  devePersistirPreferenciaRecolhido,
} from "../src/features/dashboard/operationalTasks/operationalTasksCollapsePolicy.js";
import {
  extrairFaseSincronizacaoInicialOperacional,
  sincronizacaoInicialAguardandoInicio,
} from "../src/features/dashboard/operationalTasks/operationalTasksMarketplaceSyncState.js";
import {
  readOperationalTasksCollapsedPreference,
  writeOperationalTasksCollapsedPreference,
} from "../src/features/dashboard/operationalTasks/operationalTasksCollapseStorage.js";
import { buildOperationalTasksPayload } from "../../suse7-backend/src/domain/dashboard/operationalTasksPayload.js";

const root = dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => readFileSync(join(root, "..", relativePath), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function snapshotWithPercent(percent, completed) {
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
    configurationSnapshot: snapshotWithPercent(100, 6),
    operationalHasResolvedOnce: true,
    operationalTaskCount: 2,
    operationalError: null,
    userPrefersCollapsed: true,
    ...overrides,
  };
}

{
  const loadingDismissed = baseInput({
    configurationInitialLoading: true,
    configurationHasResolvedOnce: false,
    configurationSnapshot: null,
    configurationCompletionCelebrationActive: false,
  });
  assert(
    "6/6 dismissed reload — estado UNKNOWN while loading",
    resolverEstadoConfiguracaoInicial(loadingDismissed) === CONFIGURACAO_INICIAL_ESTADO.UNKNOWN,
  );
  assert(
    "6/6 dismissed reload — onboarding not pending while loading",
    configuracaoInicialPendente(loadingDismissed) === false,
  );
  assert(
    "6/6 dismissed reload — config section hidden while loading",
    secaoConfiguracaoDeveAparecer(loadingDismissed) === false,
  );
  assert(
    "6/6 dismissed reload — overlay off while loading",
    painelCentralOnboardingOverlay(loadingDismissed) === false,
  );
  assert(
    "6/6 dismissed reload — panel hidden while loading (no flash mount)",
    painelCentralDeveSerVisivel(loadingDismissed) === false,
  );

  const resolvedDismissed = baseInput({
    configurationCompletionCelebrationActive: false,
    operationalTaskCount: 2,
  });
  const contract = resolverContratoPainelCentral(resolvedDismissed);
  assert(
    "6/6 dismissed resolved — onboarding modal section off",
    contract.showConfigurationSection === false,
  );
  assert(
    "6/6 dismissed resolved — operational section on",
    contract.showOperationalSection === true,
  );
}

{
  const incomplete = baseInput({
    configurationSnapshot: snapshotWithPercent(83, 5),
    operationalTaskCount: 0,
  });
  assert("5/6 — estado INCOMPLETE", resolverEstadoConfiguracaoInicial(incomplete) === CONFIGURACAO_INICIAL_ESTADO.INCOMPLETE);
  assert("5/6 — onboarding pending", configuracaoInicialPendente(incomplete) === true);
  assert("5/6 — panel visible", painelCentralDeveSerVisivel(incomplete) === true);
  assert(
    "5/6 — config section visible",
    resolverContratoPainelCentral(incomplete).showConfigurationSection === true,
  );
}

{
  const celebration = baseInput({
    configurationCompletionCelebrationActive: true,
    operationalTaskCount: 2,
  });
  assert("6/6 celebration — panel visible", painelCentralDeveSerVisivel(celebration) === true);
  assert("6/6 celebration — overlay on", painelCentralOnboardingOverlay(celebration) === true);
  assert(
    "6/6 celebration — expanded",
    resolverContratoPainelCentral(celebration).mode === CARD_PANEL_MODE.EXPANDED_FULL,
  );
}

assert("initial sync SSOT awaiting_start", sincronizacaoInicialAguardandoInicio("awaiting_start") === true);
assert("initial sync SSOT in_progress false", sincronizacaoInicialAguardandoInicio("in_progress") === false);
assert(
  "initial sync SSOT from API payload",
  extrairFaseSincronizacaoInicialOperacional({ ml_initial_sync_phase: "awaiting_start" }) === "awaiting_start",
);

{
  const store = /** @type {Record<string, string>} */ ({});
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;
  // @ts-expect-error mock
  globalThis.window = globalThis;
  // @ts-expect-error mock
  globalThis.localStorage = {
    getItem(key) {
      return store[key] ?? null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
  };

  writeOperationalTasksCollapsedPreference("user-x", false);
  assert(
    "awaiting_start — nasce recolhido mesmo com pref expandida",
    estadoInicialRecolhidoPainelOperacional({ userId: "user-x", initialSyncPhase: "awaiting_start" }) === true,
  );
  assert(
    "awaiting_start — não persiste preferência",
    devePersistirPreferenciaRecolhido("awaiting_start") === false,
  );
  assert(
    "sync iniciada — respeita preferência expandida",
    estadoInicialRecolhidoPainelOperacional({ userId: "user-x", initialSyncPhase: "in_progress" }) === false,
  );
  assert(
    "sync iniciada — persiste preferência",
    devePersistirPreferenciaRecolhido("in_progress") === true,
  );

  globalThis.window = originalWindow;
  globalThis.localStorage = originalLocalStorage;
}

const panelSource = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx");
assert("collapse before action — recolherPainelAntesAcao", panelSource.includes("recolherPainelAntesAcao"));
assert(
  "collapse before action — called in handleActionClick",
  /handleActionClick[\s\S]*recolherPainelAntesAcao\(\)/.test(panelSource),
);
assert("panel receives mlInitialSyncPhase", panelSource.includes("mlInitialSyncPhase"));
assert(
  "refetch awaiting_start recentraliza recolhido",
  panelSource.includes('mlInitialSyncPhase !== "awaiting_start"') && panelSource.includes("refreshing"),
);

const preConfirmModal = read("src/features/dashboard/configurationOnboarding/ConfigurationMarketplacePreConfirmModal.jsx");
assert("ML CTA Conectar ao Mercado Livre", preConfirmModal.includes("Conectar ao Mercado Livre"));
assert("ML CTA old text removed", !preConfirmModal.includes("Continuar para o Mercado Livre"));

const backendHandler = readFileSync(
  join(root, "../../suse7-backend/src/handlers/dashboard/operationalTasks.js"),
  "utf8",
);
assert("API expõe ml_initial_sync_phase", backendHandler.includes("ml_initial_sync_phase: mlSyncPhase.phase"));

const payload = buildOperationalTasksPayload({
  mlInitialSyncPhase: "awaiting_start",
  mlMarketplaceAccountId: "9ee145d1-0000-4000-8000-000000000001",
  universeStable: true,
  profilePhotoUrl: null,
  companyLogoUrl: null,
  primaryCompany: { cep: "", address_street: "", address_number: "" },
});

const descriptions = payload.tasks.map((t) => String(t.description ?? "")).join("\n");
assert("copy — sync no SUSE7", descriptions.includes("produtos no SUSE7"));
assert("copy — no na SUSE7 in sync", !descriptions.includes("na SUSE7"));
assert("copy — address no SUSE7", descriptions.includes("atualizados no SUSE7"));

const avatarTask = payload.tasks.find((t) => t.id === "store_avatar_pending");
assert("copy — avatar do SUSE7", String(avatarTask?.description ?? "").includes("do SUSE7"));
assert("copy — avatar sem da SUSE7", !String(avatarTask?.description ?? "").includes("da SUSE7"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify({ pass: true, test: "operational_tasks_presync_consolidation_unit", cases: 28 }, null, 2),
);
