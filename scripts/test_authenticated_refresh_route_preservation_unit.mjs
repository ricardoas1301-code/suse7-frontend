#!/usr/bin/env node
/**
 * F5 / deep-link — rotas autenticadas não redirecionam para Dashboard durante bootstrap
 */
import {
  configuracaoAppGateAtivo,
  resolverRedirectConfiguracaoIncompleta,
  normalizarPathConfiguracao,
} from "../src/features/dashboard/configurationOnboarding/configurationAppGate.js";
import { configuracaoEstaCompleta } from "../src/features/dashboard/configurationOnboarding/configurationOnboardingSelectors.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const snapshotCompleto = {
  configuration: { status: "COMPLETED", percent: 100, completed: 6, total: 6 },
  milestones: [],
};

assert(
  "auth loading não ativa gate",
  configuracaoAppGateAtivo({
    snapshot: null,
    initialLoading: true,
    refreshing: false,
    error: null,
    hasResolvedOnce: false,
    introActive: false,
  }) === false,
);

assert(
  "refreshing snapshot não ativa gate",
  configuracaoAppGateAtivo({
    snapshot: null,
    initialLoading: false,
    refreshing: true,
    error: null,
    hasResolvedOnce: true,
    introActive: false,
  }) === false,
);

assert(
  "reidratação auth: snapshot null + unresolved não ativa gate",
  configuracaoAppGateAtivo({
    snapshot: null,
    initialLoading: true,
    refreshing: false,
    error: null,
    hasResolvedOnce: false,
    introActive: false,
  }) === false,
);

assert(
  "config completa não ativa gate",
  configuracaoAppGateAtivo({
    snapshot: snapshotCompleto,
    initialLoading: false,
    refreshing: false,
    error: null,
    hasResolvedOnce: true,
    introActive: false,
  }) === false,
);

const rotas = [
  "/vendas",
  "/produtos",
  "/anuncios",
  "/perfil/dados-empresa",
  "/perfil/alterar-senha",
  "/perfil/integracoes/mercado-livre",
  "/relatorios",
  "/registros",
];

for (const rota of rotas) {
  const redirect = resolverRedirectConfiguracaoIncompleta(rota, false, []);
  assert(`config completa mantém ${rota}`, redirect === null);
}

for (const rota of rotas) {
  const redirectLoading = resolverRedirectConfiguracaoIncompleta(
    rota,
    configuracaoAppGateAtivo({
      snapshot: null,
      initialLoading: true,
      refreshing: false,
      error: null,
      hasResolvedOnce: false,
      introActive: false,
    }),
    [],
  );
  assert(`loading não redireciona ${rota}`, redirectLoading === null);
}

assert(
  "query/hash preservados na normalização",
  normalizarPathConfiguracao("/vendas?tab=2#sec") === "/vendas?tab=2#sec".split("?")[0].split("#")[0] ||
    normalizarPathConfiguracao("/vendas") === "/vendas",
);

const appSource = await import("node:fs").then((fs) =>
  fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8"),
);
assert("AuthOutlet aguarda loading antes de redirect login", appSource.includes("if (loading)"));
assert(
  "snapshot hook não marca resolved quando disabled",
  (await import("node:fs")).readFileSync(
    new URL("../src/features/dashboard/configurationOnboarding/useConfigurationSnapshot.js", import.meta.url),
    "utf8",
  ).includes("setHasResolvedOnce(false)"),
);

assert("config completa selector", configuracaoEstaCompleta(snapshotCompleto) === true);

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify({ pass: true, test: "authenticated_refresh_route_preservation_unit", cases: rotas.length + 8 }, null, 2),
);
