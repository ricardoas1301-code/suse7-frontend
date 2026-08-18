#!/usr/bin/env node
/**
 * DEV.V2.AUTH-LOGIN-INTRO-VIDEO-SEQUENCING.24
 * Prova estática do gate intro → dashboard (sem flash).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const layout = readFileSync(join(root, "../src/components/Layout.jsx"), "utf8");
const introGate = readFileSync(join(root, "../src/auth/useLoginIntroGate.js"), "utf8");
const introSplash = readFileSync(join(root, "../src/components/S7LoginIntroSplash.jsx"), "utf8");
const introSession = readFileSync(join(root, "../src/auth/introAuthSession.js"), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("layout uses login intro gate hook", /useLoginIntroGate/.test(layout));
assert("layout returns intro splash before app shell", /if \(introActive\)[\s\S]*S7LoginIntroSplash/.test(layout));
assert("layout does not early-return outlet before intro gate", layout.indexOf("introActive") < layout.indexOf("<Outlet"));
assert(
  "layout no longer clears intro when auth not ready",
  !/if \(!authReady[\s\S]*setShowLoginIntro\(false\)/.test(layout) &&
    !/if \(!authReady[\s\S]*setIntroActive\(false\)/.test(layout)
);
assert(
  "intro gate never disables intro on missing auth",
  !/if \(!authReady \|\| !user\) \{\s*setIntroActive\(false\)/.test(introGate)
);
assert("intro gate initializes from pending flag", /getIntroPlaybackDecision\(\)\.shouldPlay/.test(introGate));
assert("intro splash uses onEnded", /onEnded=\{/.test(introSplash));
assert("intro rule uses pending login flag", /S7_INTRO_PENDING_KEY/.test(introSession));
assert("intro plays on explicit login mark", /markIntroPendingForNextLogin/.test(
  readFileSync(join(root, "../src/components/Login.jsx"), "utf8")
));

if (failures.length) {
  console.error("FAIL", failures);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "login_intro_sequencing_unit",
      intro_component: "S7LoginIntroSplash.jsx",
      video_asset: "brand/abertura-oficial-s7.mp4",
      intro_rule: "pending_login_intro (localStorage s7_login_intro_pending after login)",
      root_cause: "Layout useEffect set showLoginIntro(false) when !authReady",
    },
    null,
    2
  )
);
