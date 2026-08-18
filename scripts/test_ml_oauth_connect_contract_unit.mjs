#!/usr/bin/env node
/**
 * M6 OAuth connect — contrato frontend ↔ backend /api/ml/connect.
 * Impede regressão fetch+redirect:manual no iniciador OAuth (quebra com host proxy DEV).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const feRoot = join(root, "..");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const mlConnectApi = readFileSync(
  join(feRoot, "src/features/dashboard/configurationOnboarding/configurationOnboardingMlConnectApi.js"),
  "utf8",
);
const mlConnectJsx = readFileSync(join(feRoot, "src/ml/MLConnect.jsx"), "utf8");
const actionsHost = readFileSync(
  join(feRoot, "src/features/dashboard/configurationOnboarding/ConfigurationOnboardingActionsHost.jsx"),
  "utf8",
);

assert("SSOT montarUrlBackendMlConnect exported", mlConnectApi.includes("export function montarUrlBackendMlConnect"));
assert("SSOT montarUrlRotaMlConnectFrontend exported", mlConnectApi.includes("export function montarUrlRotaMlConnectFrontend"));
assert("SSOT builds backend connect path for navigation", mlConnectApi.includes("montarUrlBackendMlConnect"));
assert("SSOT does not fetch connect with redirect manual", !mlConnectApi.includes('redirect: "manual"'));
assert("SSOT connect path is string URL not fetch response", mlConnectApi.includes("return buildApiUrl(`/api/ml/connect"));
assert("SSOT does not use redirect manual for connect", !mlConnectApi.includes('redirect: "manual"'));
assert("SSOT does not expose iniciarConexaoMercadoLivreAutenticada fetch", !mlConnectApi.includes("iniciarConexaoMercadoLivreAutenticada"));
assert("SSOT does not expect authorization_url JSON from connect", !mlConnectApi.includes("authorization_url"));

assert("MLConnect uses browser navigation to backend", mlConnectJsx.includes("window.location.href = connectUrl"));
assert("MLConnect builds backend URL via SSOT", mlConnectJsx.includes("montarUrlBackendMlConnect"));
assert("MLConnect does not fetch /api/ml/connect", !mlConnectJsx.includes("iniciarConexaoMercadoLivreAutenticada"));
assert("MLConnect does not use redirect manual", !mlConnectJsx.includes('redirect: "manual"'));

assert("M6 preconfirm validates session before navigation", actionsHost.includes("validarSessaoParaConexaoMl"));
assert("M6 preconfirm navigates to /ml/connect route", actionsHost.includes("montarUrlRotaMlConnectFrontend"));
assert("M6 preconfirm uses window.location.assign not fetch connect", actionsHost.includes("window.location.assign(rotaConnect)"));
assert("M6 preconfirm preserves initial_configuration intent", actionsHost.includes('intent: "initial_configuration"'));
assert("M6 preconfirm does not show unexpected oauth response copy", !actionsHost.includes("Resposta inesperada ao iniciar OAuth"));

if (failures.length) {
  console.error("[ML OAuth connect contract unit] FAIL", failures);
  process.exit(1);
}

console.log("[ML OAuth connect contract unit] OK");
