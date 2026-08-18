#!/usr/bin/env node
/**
 * DEV.V2.SIGNUP-POSTCONFIRM-LEGAL-CLOSE.23 — callback auth bootstrap contract.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(root, rel), "utf8");

const authBootstrap = read("../src/auth/authBootstrapService.js");
const authContext = read("../src/contexts/AuthBootstrapContext.jsx");
const appSource = read("../src/App.jsx");
const callbackGate = read("../src/components/AuthCallbackGate.jsx");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("boot does not await birth completion inline", !/await maybeCompleteSignupBirthOnSession\(session, "boot"\)/.test(authBootstrap));
assert("birth scheduled asynchronously", /scheduleBirthCompletion\(session, "boot"\)/.test(authBootstrap));
assert("auth callback wait helper exists", /function waitForAuthCallbackSession/.test(authBootstrap));
assert("callback session missing sets controlled error", /AUTH_CALLBACK_SESSION_MISSING/.test(authBootstrap));
assert("hash cleanup on boot session", /hasAuthCallbackInUrl\(\)[\s\S]*limparAuthCallbackDaUrl/.test(authBootstrap));
assert("signed_in cleans callback hash", /event === "SIGNED_IN"[\s\S]*limparAuthCallbackDaUrl/.test(authBootstrap));
assert("auth context exposes callbackError", /callbackError/.test(authContext));
assert("ready gate excludes birth running", /birthCompletionState !== "running"/.test(authContext));
assert("AuthOutlet uses AuthCallbackGate", /AuthCallbackGate/.test(appSource));
assert("AuthOutlet no infinite loading div", !/if \(loading\) return <div>Carregando\.\.\.<\/div>/.test(appSource));
assert("callback gate failure UX", /Não conseguimos concluir sua entrada/.test(callbackGate));
assert("callback gate birth failure UX", /Cadastro confirmado, mas houve um problema/.test(callbackGate));

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log(JSON.stringify({ pass: true, test: "auth_bootstrap_callback_unit", cases: 12 }, null, 2));
