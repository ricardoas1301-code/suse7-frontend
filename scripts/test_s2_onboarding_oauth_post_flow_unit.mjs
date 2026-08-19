#!/usr/bin/env node
/**
 * Refino Lote S2 — onboarding 6/6 + pós-OAuth (sem modal Conta conectada, destino Dashboard).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const feRoot = join(root, "..");

function read(relativePath) {
  return readFileSync(join(feRoot, relativePath), "utf8");
}

const onboardingSection = read("src/features/dashboard/configurationOnboarding/S7ConfigurationOnboardingSection.jsx");
const onboardingCss = read("src/features/dashboard/configurationOnboarding/S7ConfigurationOnboardingSection.css");
const mercadoLivre = read("src/components/Profile/MercadoLivre.jsx");
const dashboardTasks = read("src/features/dashboard/operationalTasks/DashboardOperationalTasks.jsx");

assert.ok(onboardingSection.includes("Sair da conta"), "logout copy preserved for incomplete states");
assert.ok(
  onboardingSection.includes("renderLogoutButton(concluido)") ||
    onboardingSection.includes("hideLogout"),
  "logout hidden on completed state",
);
assert.ok(
  onboardingSection.includes("Preparação inicial concluída.") &&
    onboardingSection.includes("O SUSE7 está liberado para sua operação."),
  "completed copy uses O SUSE7 wording",
);
assert.doesNotMatch(
  onboardingSection,
  /Preparação inicial concluída\.\s*Sua SUSE7/,
  "old completion copy removed",
);
assert.ok(
  onboardingSection.includes("s7-configuration-onboarding__completion-card"),
  "completion message uses card surface",
);
assert.ok(onboardingCss.includes("s7-configuration-onboarding__completion-card"), "completion card css");

assert.doesNotMatch(mercadoLivre, /Conta conectada/, "Conta conectada modal removed from MercadoLivre page");
assert.doesNotMatch(mercadoLivre, /postConnectReadyOpen/, "postConnectReadyOpen state removed");
assert.ok(
  mercadoLivre.includes("ml_onboarding=connected") && mercadoLivre.includes("navigate("),
  "OAuth success redirects to Dashboard onboarding celebration",
);
assert.ok(
  mercadoLivre.includes("openTechnicalSyncDetails(mid)") &&
    mercadoLivre.includes("ml_post_connect_qs"),
  "Central de Pendências opens technical sync modal directly",
);
assert.doesNotMatch(
  mercadoLivre,
  /handleConfirmPostConnectStartSync/,
  "post-connect auto-start handler removed",
);

assert.ok(
  dashboardTasks.includes("ml_onboarding") && dashboardTasks.includes("markConfigurationOAuthReturnCelebration"),
  "Dashboard handles OAuth return celebration",
);
assert.ok(
  dashboardTasks.includes("OPEN_ML_INITIAL_SYNC_MODAL") &&
    dashboardTasks.includes("ml_post_connect"),
  "sync pendency still routes to integrations entrypoint",
);
assert.doesNotMatch(
  dashboardTasks,
  /handleStartInitialPipeline|start-initial-sync/,
  "Dashboard OAuth handler does not auto-start sync",
);

console.log("test_s2_onboarding_oauth_post_flow_unit: PASS");
