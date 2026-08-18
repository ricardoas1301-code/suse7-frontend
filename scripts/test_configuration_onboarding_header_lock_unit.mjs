#!/usr/bin/env node
/**
 * CARD.CONFIGURATION.ONBOARDING.01D.6 — header lock (bell + profile).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { configuracaoAppGateAtivo } from "../src/features/dashboard/configurationOnboarding/configurationAppGate.js";

const root = dirname(fileURLToPath(import.meta.url));
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const layoutJsx = readFileSync(join(root, "../src/components/Layout.jsx"), "utf8");
const notificationJsx = readFileSync(join(root, "../src/components/notifications/S7NotificationCenter.jsx"), "utf8");
const avatarJsx = readFileSync(join(root, "../src/components/AvatarMenu.jsx"), "utf8");
const gateCss = readFileSync(join(root, "../src/features/dashboard/configurationOnboarding/ConfigurationAppGate.css"), "utf8");

const snap67 = {
  configuration: { percent: 67, completed: 4, total: 6, status: "IN_PROGRESS" },
  milestones: [],
};

const snap100 = {
  configuration: { percent: 100, completed: 6, total: 6, status: "COMPLETED" },
  milestones: [],
};

assert("gate active at 67%", configuracaoAppGateAtivo({
  snapshot: snap67,
  initialLoading: false,
  error: null,
  hasResolvedOnce: true,
  introActive: false,
}) === true);

assert("gate inactive at 100%", configuracaoAppGateAtivo({
  snapshot: snap100,
  initialLoading: false,
  error: null,
  hasResolvedOnce: true,
  introActive: false,
}) === false);

assert("layout passes lock to bell", layoutJsx.includes("interactionLocked={configGateLocked}") && layoutJsx.includes("S7NotificationCenter"));
assert("layout passes lock to avatar", layoutJsx.includes("AvatarMenu") && layoutJsx.includes("interactionLocked={configGateLocked}"));

assert("bell locked prop", notificationJsx.includes("interactionLocked"));
assert("bell click blocked when locked", notificationJsx.includes("if (interactionLocked) return"));
assert("bell keyboard blocked when locked", notificationJsx.includes("handleBellKeyDown"));
assert("bell disabled attr", notificationJsx.includes("disabled={interactionLocked}"));
assert("bell closes when locked", notificationJsx.includes("if (interactionLocked && open) setOpen(false)"));

assert("profile locked prop", avatarJsx.includes("interactionLocked"));
assert("profile click blocked when locked", avatarJsx.includes("if (interactionLocked) return"));
assert("profile keyboard blocked when locked", avatarJsx.includes("handleTriggerKeyDown"));
assert("profile disabled attr", avatarJsx.includes("disabled={interactionLocked}"));
assert("profile closes when locked", avatarJsx.includes("if (interactionLocked && open) closeMenu()"));

assert("nav-right pointer-events none", gateCss.includes(".nav-right") && gateCss.includes("pointer-events: none"));
assert("nav operational locked css", gateCss.includes(".nav-center") && gateCss.includes("pointer-events: none"));
assert("bell cursor not-allowed css", gateCss.includes(".s7-nc__bell"));
assert("avatar cursor not-allowed css", gateCss.includes(".avatar-menu-trigger"));

assert("navbar operational preventDefault preserved", layoutJsx.includes("if (configGateLocked) event.preventDefault()"));

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      pass: true,
      test: "configuration_onboarding_header_lock_01d6",
      cases: 18,
      failures: 0,
    },
    null,
    2,
  ),
);
