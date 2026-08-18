#!/usr/bin/env node
/**
 * S1.PERFIL-NOTIFICACOES.12 — auth gate + presentation + borda lateral
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const paths = {
  presentation: join(root, "../src/constants/notificationEventPresentation.js"),
  loadErrors: join(root, "../src/components/notifications/central/centralNotificationLoadErrors.js"),
  settingsHook: join(root, "../src/hooks/useCentralNotificationSettings.js"),
  categoryPage: join(root, "../src/components/Profile/NotificationCenterCategoryPage.jsx"),
  deliverySection: join(root, "../src/components/notifications/center/NotificationDeliverySection.jsx"),
  prefGroup: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.jsx"),
  prefGroupCss: join(root, "../src/components/notifications/central/NotificationPreferenceGroup.css"),
  visualVariants: join(root, "../src/components/notifications/center/notificationCenterVisualVariants.css"),
  requireAuthUser: join(root, "../../suse7-backend/src/handlers/ml/_helpers/requireAuthUser.js"),
  apiConfig: join(root, "../src/config/api.js"),
};

const files = Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, readFileSync(p, "utf8")]));

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

assert("presentation module", files.presentation.includes("NOTIFICATION_EVENT_PRESENTATION"));
assert("ORDER_CANCELLED copy", files.presentation.includes('Pedido cancelado.'));
assert("DAILY_SALES_SUMMARY copy", files.presentation.includes("Resumo automático de vendas."));
assert("MANUAL_SALE_RAYX copy", files.presentation.includes("Raio-X da venda"));
assert("MANUAL_SALES_REPORT copy", files.presentation.includes("Relatório de vendas"));
assert("apply helper", files.presentation.includes("applyNotificationEventPresentation"));

assert("load error consolidator", files.loadErrors.includes("resolveCentralNotificationLoadError"));
assert("session error detection", files.loadErrors.includes("isCentralNotificationSessionError"));

assert("hook auth gate", files.settingsHook.includes("useAuthBootstrap"));
assert("hook waits auth ready", files.settingsHook.includes("authLoading || !authReady"));

assert("category page single error", files.categoryPage.includes("consolidatedLoadError"));
assert("category page no multi error blocks", !files.categoryPage.includes("errorCategories ? <ErrorBlock"));

assert("delivery applies presentation", files.deliverySection.includes("applyNotificationEventPresentation"));
assert("delivery left accent prop", files.deliverySection.includes("showLeftAccent={isGrid}"));

assert("pref group left accent class", files.prefGroup.includes("s7-ncenter-card--left-accent-blue"));
assert("pref group showLeftAccent prop", files.prefGroup.includes("showLeftAccent"));

assert("left accent css token", files.visualVariants.includes("--s7-ncenter-left-accent-blue"));

assert("backend network error guard", files.requireAuthUser.includes("UND_ERR_CONNECT_TIMEOUT"));
assert("backend auth unavailable code", files.requireAuthUser.includes("AUTH_SERVICE_UNAVAILABLE"));

assert("api unauthorized flag", files.apiConfig.includes("unauthorized: res.status === 401"));

if (failures.length) {
  console.error("[S1.PERFIL-NOTIFICACOES.12 unit] FAIL");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("[OK] test_perfil_notificacoes_12_unit.mjs");
