#!/usr/bin/env node
/**
 * Regressão — fechamento de modal por backdrop (origem da interação).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  isDirectBackdropPointerTarget,
  resolveBackdropPointerDownStarted,
  shouldDismissModalOnBackdropPointerUp,
} from "../src/utils/modalBackdropDismiss.js";

const root = dirname(fileURLToPath(import.meta.url));
const sellerModalJsx = readFileSync(
  join(root, "../src/components/Profile/SellerCompanyModal.jsx"),
  "utf8",
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

function mockPointerEvent(target, currentTarget) {
  return { target, currentTarget };
}

const backdrop = { id: "backdrop" };
const modal = { id: "modal" };
const input = { id: "input" };

assert(
  "backdrop direct target",
  isDirectBackdropPointerTarget(mockPointerEvent(backdrop, backdrop)) === true,
);
assert(
  "modal child is not direct backdrop target",
  isDirectBackdropPointerTarget(mockPointerEvent(modal, backdrop)) === false,
);
assert(
  "input bubbled to backdrop is not direct backdrop target",
  isDirectBackdropPointerTarget(mockPointerEvent(input, backdrop)) === false,
);

assert(
  "pointer down on backdrop registers start",
  resolveBackdropPointerDownStarted(mockPointerEvent(backdrop, backdrop)) === true,
);
assert(
  "pointer down on input bubbling to backdrop does not register start",
  resolveBackdropPointerDownStarted(mockPointerEvent(input, backdrop)) === false,
);

assert(
  "backdrop to backdrop closes",
  shouldDismissModalOnBackdropPointerUp(true, mockPointerEvent(backdrop, backdrop)) === true,
);
assert(
  "modal/input to backdrop does not close",
  shouldDismissModalOnBackdropPointerUp(false, mockPointerEvent(backdrop, backdrop)) === false,
);
assert(
  "modal to modal does not close",
  shouldDismissModalOnBackdropPointerUp(false, mockPointerEvent(modal, backdrop)) === false,
);
assert(
  "backdrop down but up on modal does not close",
  shouldDismissModalOnBackdropPointerUp(true, mockPointerEvent(modal, backdrop)) === false,
);

assert(
  "SellerCompanyModal uses pointer backdrop dismiss hook",
  sellerModalJsx.includes("useModalBackdropDismiss") &&
    sellerModalJsx.includes("onPointerDown={handleBackdropPointerDown}") &&
    sellerModalJsx.includes("onPointerUp={handleBackdropPointerUp}") &&
    !sellerModalJsx.match(/profile-modal-backdrop[\s\S]*?onClick=\{onClose\}/),
);

if (failures.length > 0) {
  console.error("FAIL modal backdrop dismiss unit tests:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`PASS modal backdrop dismiss (${failures.length === 0 ? 9 : 0} assertions)`);
