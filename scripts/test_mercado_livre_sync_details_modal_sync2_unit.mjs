#!/usr/bin/env node
/**
 * S1.INTEGRATIONS-SYNC.2 — Cabeçalho contextual, sem seletor de conta.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const syncModalJsx = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.jsx"),
  "utf8"
);
const syncModalCss = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/MarketplaceSyncDetailsModal.css"),
  "utf8"
);
const pageJsx = readFileSync(join(root, "../src/components/Profile/MercadoLivre.jsx"), "utf8");
const sortJs = readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/sortMarketplaceIntegrationsChronologically.js"),
  "utf8"
);

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("large connected account card removed", !syncModalJsx.includes("Conta conectada"));
assert("account identity uses single left column", syncModalJsx.includes("s7-marketplace-sync-details-modal__account-column"));
assert("account meta lines stacked", syncModalJsx.includes("s7-marketplace-sync-details-modal__account-meta"));
assert("account picker removed from modal", !syncModalJsx.includes("accountPicker"));
assert("account select removed from modal", !syncModalJsx.includes("s7-marketplace-sync-details-modal__account-select"));
assert("context row with account and situation", syncModalJsx.includes("s7-marketplace-sync-details-modal__context-row"));
assert(
  "account block before situation block",
  /context-row[\s\S]*context-block--account[\s\S]*context-block--situation/.test(syncModalJsx)
);
assert("support message block removed", !syncModalJsx.includes("context-block--message"));
assert("support message text not rendered", !syncModalJsx.includes("header.supportMessage"));
assert("status badge below title", /heading[\s\S]*title[\s\S]*status[\s\S]*statusLabel/.test(syncModalJsx));
assert("situation block uses vertical rows", syncModalJsx.includes("s7-marketplace-sync-details-modal__situation-rows"));
assert("situation uses two-column grid layout", syncModalCss.includes("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)"));
assert("situation last update spans full row", syncModalJsx.includes("situation-row--full"));
assert("steps heading groups title and connect line", syncModalJsx.includes("s7-marketplace-sync-details-modal__steps-heading"));
assert("section title matches account name typography", /\.s7-marketplace-sync-details-modal__section-title[\s\S]*font-size:\s*14px[\s\S]*color:\s*#111827/.test(syncModalCss));
assert("situation title matches account name typography", /\.s7-marketplace-sync-details-modal__context-title[\s\S]*font-size:\s*14px[\s\S]*color:\s*#111827/.test(syncModalCss));
assert("context row includes vertical divider", syncModalJsx.includes("s7-marketplace-sync-details-modal__context-divider"));
assert("context row uses three-column layout with divider", syncModalCss.includes("grid-template-columns: minmax(0, 0.92fr) auto minmax(0, 1.08fr)"));
assert("connect line uses completed seller copy", readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/marketplaceSyncStepModalVisibility.js"),
  "utf8"
).includes("Conta conectada ao Mercado Livre"));
assert("step cards use inner text gap", syncModalCss.includes("--s7-sync-step-text-gap"));
assert("steps heading leaves breath before cards grid", /\.s7-marketplace-sync-details-modal__steps-heading[\s\S]*margin-bottom:\s*14px/.test(syncModalCss));
assert("context bottom breath before horizontal rule", syncModalCss.includes("--s7-sync-modal-context-bottom-breath"));
assert("steps section uses suspended divider", syncModalCss.includes("steps-section::before"));
assert("connect line left aligned", syncModalCss.includes("connect-line") && syncModalCss.includes("justify-content: flex-start"));
assert("step status font reduced", syncModalCss.includes("--s7-sync-step-status-size: 10px"));
assert("step icons doubled", syncModalCss.includes("--s7-sync-step-icon-size: 30px"));
assert("step icon spans two text lines", syncModalCss.includes("--s7-sync-step-icon-block-size"));
assert("duplicate situation label removed from rows", !syncModalJsx.includes("<dt>Situação</dt>"));
assert("summary strip removed", !syncModalJsx.includes("s7-marketplace-sync-details-modal__summary-strip"));
assert("context account id prop wired", syncModalJsx.includes("contextMarketplaceAccountId"));
assert("page passes explicit context account id", pageJsx.includes("contextMarketplaceAccountId={onboardingAccountId}"));
assert("page removed account picker wiring", !pageJsx.includes("accountPicker="));
assert("page removed sync account picker handler", !pageJsx.includes("handleSyncAccountPickerChange"));
assert("page uses sync context account resolver", pageJsx.includes("syncContextAccount"));
assert("page remounts modal per account", pageJsx.includes("key={`sync-details-${onboardingAccountId}`}"));
assert("page guards stale sync payload for presentation", pageJsx.includes("syncStatusForPresentation"));
assert(
  "sync modal top layer keeps backdrop dismiss",
  !/MarketplaceSyncDetailsModal[\s\S]{0,500}isCovered=\{integrationModalStacked\}/.test(pageJsx)
);
assert("steps use three-column grid", /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(syncModalCss));
assert("steps grid class used", syncModalJsx.includes("s7-marketplace-sync-details-modal__steps-grid"));
assert("running step shows progress bar", syncModalJsx.includes("s7-marketplace-sync-details-modal__step-progress"));
assert("step progress uses showProgressBar flag", syncModalJsx.includes("step.showProgressBar"));
assert("steps use nav pill active background", syncModalCss.includes("var(--s7-topnav-active-bg"));
assert("steps render status icon component", syncModalJsx.includes("MarketplaceSyncStepStatusIcon"));
assert("steps expose step key for compact labels", syncModalJsx.includes("data-step-key={step.key}"));
assert("connect step shown as badge line not grid card", syncModalJsx.includes("connectStepLine"));
assert("customers step hidden via visibility module", readFileSync(
  join(root, "../src/components/Profile/marketplaceIntegration/marketplaceSyncStepModalVisibility.js"),
  "utf8"
).includes('"customers"'));
assert("step title uses white active nav color", syncModalCss.includes("color: #ffffff"));
assert("step lines use tight line-height", /\.s7-marketplace-sync-details-modal__step-status[\s\S]*line-height:\s*1/.test(syncModalCss));
assert("step pills scaled +26% on prior compact size", syncModalCss.includes("--s7-sync-step-min-height: 38px"));
assert("profile modal step text forced white", syncModalCss.includes(".profile-modal.s7-marketplace-sync-details-modal .s7-marketplace-sync-details-modal__step-title"));
assert("compact step body tight spacing", syncModalCss.includes("s7-marketplace-sync-details-modal__step-body"));
assert("account block uses shared text column grid", syncModalCss.includes("grid-template-columns: 44px minmax(0, 1fr)"));
assert("compact step skeleton height", syncModalCss.includes("--s7-sync-step-min-height"));
assert("situation rows use compact label-value gap", syncModalCss.includes("gap: 4px 6px"));
assert("single content scroll area", syncModalJsx.includes("s7-marketplace-sync-details-modal__content"));
assert("no inner steps scroll container", !syncModalCss.includes("s7-marketplace-sync-details-modal__steps-scroll"));
assert("desktop two-column contextual header", /context-row[\s\S]*grid-template-columns:\s*minmax\(0,\s*0\.92fr\)\s+auto\s+minmax\(0,\s*1\.08fr\)/.test(syncModalCss));
assert("page uses chronological sort", pageJsx.includes("sortMarketplaceIntegrationsChronologically"));
assert("sort resolver exports pure function", sortJs.includes("export function sortMarketplaceIntegrationsChronologically"));
assert("sort uses primary company flag", sortJs.includes("is_primary"));
assert("mobile context single column", /@media \(max-width: 768px\)[\s\S]*context-row[\s\S]*grid-template-columns:\s*1fr/.test(syncModalCss));
assert("mobile steps single column", /@media \(max-width: 768px\)[\s\S]*steps-grid[\s\S]*grid-template-columns:\s*1fr/.test(syncModalCss));

if (failures.length) {
  console.error("[S1.INTEGRATIONS-SYNC.2 modal unit] FAIL", failures);
  process.exit(1);
}

console.log("[S1.INTEGRATIONS-SYNC.2 modal unit] OK");
