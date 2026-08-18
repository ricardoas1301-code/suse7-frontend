#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-ML.4.1 — Regressão: ordem estável de hooks em MercadoLivre.jsx
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { renderToString } from "react-dom/server";

const root = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const HOOK_RE = /\buse(State|Effect|Memo|Callback|Ref)\s*\(/g;

function extractComponentBody(src) {
  const start = src.indexOf("export default function MercadoLivre()");
  if (start < 0) return null;
  const braceStart = src.indexOf("{", start);
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(braceStart + 1, i);
    }
  }
  return null;
}

const body = extractComponentBody(source);
assert("component body extracted", Boolean(body));

if (body) {
  const loadingReturnIdx = body.search(/\n\s*if\s*\(\s*loading\s*\)\s*\{/);
  assert("loading early return exists", loadingReturnIdx >= 0);

  const beforeLoading = body.slice(0, loadingReturnIdx);
  const afterLoading = body.slice(loadingReturnIdx);

  const hooksBefore = [...beforeLoading.matchAll(HOOK_RE)].map((m) => m[0]);
  const hooksAfter = [...afterLoading.matchAll(HOOK_RE)].map((m) => m[0]);

  assert("hooks declared before loading return", hooksBefore.length > 0);
  assert("no hooks after loading early return", hooksAfter.length === 0);
  assert(
    "dismissOnboardingModal hook before loading",
    beforeLoading.includes("const dismissOnboardingModal = useCallback")
  );
  assert(
    "scroll lock effect before loading",
    /document\.body\.style\.overflow = "hidden"/.test(beforeLoading)
  );
  assert(
    "sync details presentation hook before loading",
    beforeLoading.includes("const syncDetailsPresentation = useMemo")
  );
  assert(
    "sync context account resolver before loading",
    beforeLoading.includes("const syncContextAccount = useMemo")
  );
  assert(
    "sync fetch generation ref before loading",
    beforeLoading.includes("syncDetailsFetchGenRef")
  );
}

/** Espelha a ordem corrigida: hooks incondicionais + early return depois. */
function MercadoLivreHookOrderProbe({ loading, onboardingOpen, manageModalAccountId }) {
  const syncViewButtonRef = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setTick((v) => v);
  }, [loading]);

  const overall = "awaiting_start";
  const awaitingPipelineStart =
    onboardingOpen && manageModalAccountId && overall === "awaiting_start";

  const dismissOnboardingModal = useCallback(() => {
    if (awaitingPipelineStart) return;
    syncViewButtonRef.current = null;
  }, [awaitingPipelineStart, manageModalAccountId]);

  useEffect(() => {
    const anyModalOpen = Boolean(manageModalAccountId) || onboardingOpen;
    if (!anyModalOpen) return undefined;
    return undefined;
  }, [manageModalAccountId, onboardingOpen]);

  useEffect(() => {
    if (!onboardingOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      dismissOnboardingModal();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onboardingOpen, awaitingPipelineStart, dismissOnboardingModal, tick]);

  if (loading) return "loading";
  return "ready";
}

/** @type {string[]} */
const hookErrors = [];
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = args.map(String).join(" ");
  if (
    /Rendered more hooks|Rendered fewer hooks|order of Hooks|invalid hook call/i.test(msg)
  ) {
    hookErrors.push(msg);
  }
  originalConsoleError(...args);
};

const scenarios = [
  { loading: true, onboardingOpen: false, manageModalAccountId: null },
  { loading: false, onboardingOpen: false, manageModalAccountId: null },
  { loading: false, onboardingOpen: true, manageModalAccountId: "acc-1" },
  { loading: false, onboardingOpen: true, manageModalAccountId: "acc-2" },
  { loading: false, onboardingOpen: false, manageModalAccountId: "acc-1" },
];

for (const props of scenarios) {
  try {
    renderToString(React.createElement(MercadoLivreHookOrderProbe, props));
  } catch (error) {
    failures.push(`runtime render failed (${JSON.stringify(props)}): ${error.message}`);
  }
}

console.error = originalConsoleError;

assert("runtime renders without hook order errors", hookErrors.length === 0);

if (failures.length) {
  console.error("[S1.INTEGRATIONS-ML.4.1 hooks render unit] FAIL", failures);
  if (hookErrors.length) console.error("hookErrors", hookErrors);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-ML.4.1 hooks render unit] OK");
