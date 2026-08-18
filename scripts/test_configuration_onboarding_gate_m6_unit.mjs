#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01D.5 — M6 prerequisite lock + app gate.
 */
import {
  configuracaoAppGateAtivo,
  resolverRedirectConfiguracaoIncompleta,
  rotaIntegracaoBloqueada,
  CONFIGURATION_OAUTH_SERVER_PRECONDITION_01E,
} from "../src/features/dashboard/configurationOnboarding/configurationAppGate.js";
import {
  milestoneM6BloqueadoPorPrerequisites,
  milestoneM6Elegivel,
  milestoneVisualmenteBloqueado,
} from "../src/features/dashboard/configurationOnboarding/configurationMilestoneEligibility.js";
import { milestoneAcaoClicavel } from "../src/features/dashboard/configurationOnboarding/configurationMilestoneActionRegistry.js";
import { configuracaoEstaCompleta } from "../src/features/dashboard/configurationOnboarding/configurationOnboardingSelectors.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function milestone(id, status) {
  return { id, status };
}

const m1m5Incomplete = [
  milestone("COMPANY_DATA", "COMPLETED"),
  milestone("LEGAL_ACCEPTANCE", "COMPLETED"),
  milestone("TAX_RATE", "PENDING"),
  milestone("OPERATIONAL_COST", "COMPLETED"),
  milestone("OPERATIONAL_CYCLE", "COMPLETED"),
  milestone("FIRST_MARKETPLACE_CONNECTION", "PENDING"),
];

const m1m5Complete = [
  milestone("COMPANY_DATA", "COMPLETED"),
  milestone("LEGAL_ACCEPTANCE", "COMPLETED"),
  milestone("TAX_RATE", "COMPLETED"),
  milestone("OPERATIONAL_COST", "COMPLETED"),
  milestone("OPERATIONAL_CYCLE", "COMPLETED"),
  milestone("FIRST_MARKETPLACE_CONNECTION", "PENDING"),
];

assert("M6 locked when M3 pending", milestoneM6BloqueadoPorPrerequisites(m1m5Incomplete) === true);
assert("M6 visual locked", milestoneVisualmenteBloqueado("FIRST_MARKETPLACE_CONNECTION", m1m5Incomplete) === true);
assert(
  "M6 not clickable when locked",
  milestoneAcaoClicavel("FIRST_MARKETPLACE_CONNECTION", "PENDING", m1m5Incomplete) === false,
);

assert("M6 eligible at 83", milestoneM6Elegivel(m1m5Complete) === true);
assert("M6 not visually locked at 83", milestoneVisualmenteBloqueado("FIRST_MARKETPLACE_CONNECTION", m1m5Complete) === false);
assert(
  "M6 clickable when implemented at 83",
  milestoneAcaoClicavel("FIRST_MARKETPLACE_CONNECTION", "PENDING", m1m5Complete) === true,
);

const snap50 = {
  configuration: { percent: 50, completed: 3, total: 6, status: "IN_PROGRESS" },
  milestones: m1m5Incomplete,
};

assert("gate active at 50%", configuracaoAppGateAtivo({
  snapshot: snap50,
  initialLoading: false,
  error: null,
  hasResolvedOnce: true,
  introActive: false,
}) === true);

assert("gate inactive at 100%", configuracaoAppGateAtivo({
  snapshot: {
    configuration: { percent: 100, completed: 6, total: 6, status: "COMPLETED" },
    milestones: m1m5Complete.map((m) => ({ ...m, status: "COMPLETED" })),
  },
  initialLoading: false,
  error: null,
  hasResolvedOnce: true,
  introActive: false,
}) === false);

assert("gate fail-closed on error", configuracaoAppGateAtivo({
  snapshot: null,
  initialLoading: false,
  error: "fail",
  hasResolvedOnce: true,
  introActive: false,
}) === true);

assert("redirect /vendas to /", resolverRedirectConfiguracaoIncompleta("/vendas", true, m1m5Incomplete) === "/");
assert("dashboard allowed", resolverRedirectConfiguracaoIncompleta("/", true, m1m5Incomplete) === null);
assert(
  "integration blocked before eligible",
  rotaIntegracaoBloqueada("/perfil/integracoes/mercado-livre", true, m1m5Incomplete) === true,
);
assert(
  "integration ready architecture at 83",
  rotaIntegracaoBloqueada("/perfil/integracoes/mercado-livre", true, m1m5Complete) === false,
);

assert("oauth precondition registered", CONFIGURATION_OAUTH_SERVER_PRECONDITION_01E.requiredMilestones.length === 5);
assert("100 complete selector", configuracaoEstaCompleta({
  configuration: { percent: 100, status: "COMPLETED" },
  milestones: [],
}) === true);

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_onboarding_gate_m6_01d5",
      cases: 16,
      failures: 0,
    },
    null,
    2,
  ),
);
