#!/usr/bin/env node
/**
 * DEV.V2.SIGNUP-POSTCONFIRM-LEGAL-CLOSE.23 — hash/code cleanup pós-confirmação Supabase.
 */
import { hasAuthCallbackInUrl, limparAuthCallbackDaUrl } from "../src/auth/authCallbackCleanup.js";

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function mockLocation({ pathname = "/", search = "", hash = "" }) {
  return { pathname, search, hash };
}

assert("detects access_token in hash", hasAuthCallbackInUrl(mockLocation({ hash: "#access_token=abc&type=signup" })));
assert("detects code in query", hasAuthCallbackInUrl(mockLocation({ search: "?code=xyz" })));
assert("detects signup type without token yet", hasAuthCallbackInUrl(mockLocation({ hash: "#type=signup" })));
assert("ignores plain hash route", !hasAuthCallbackInUrl(mockLocation({ hash: "#/" })));
assert("ignores empty url", !hasAuthCallbackInUrl(mockLocation({})));

/** @type {{ replaceStateCalls: string[]; location: { pathname: string; search: string; hash: string } }} */
const state = {
  replaceStateCalls: [],
  location: { pathname: "/", search: "", hash: "#access_token=abc&refresh_token=def&type=signup" },
};

global.window = {
  location: state.location,
  history: {
    state: null,
    replaceState(_state, _title, url) {
      state.replaceStateCalls.push(url);
    },
  },
};

limparAuthCallbackDaUrl("/");
assert("replaceState called once", state.replaceStateCalls.length === 1);
assert("tokens removed from cleaned url", state.replaceStateCalls[0] === "/");

state.location.hash = "#access_token=keep";
state.location.search = "?code=abc&foo=bar";
state.replaceStateCalls.length = 0;
limparAuthCallbackDaUrl("/dashboard");
assert("removes auth code from cleaned url", state.replaceStateCalls[0] === "/dashboard?foo=bar");
assert("navigates to safe path", state.replaceStateCalls[0].startsWith("/dashboard"));

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log(JSON.stringify({ pass: true, test: "auth_callback_cleanup_unit", cases: 9 }, null, 2));
