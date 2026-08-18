// ======================================================================
// Testes unitários — navegação do Perfil (menu avatar)
// Executar: node scripts/test_profile_navigation_unit.mjs
// ======================================================================

import assert from "node:assert/strict";
import { STATIC_PROFILE_NAVIGATION_GROUPS } from "../src/components/Profile/profileNavigationStatic.js";
import {
  resolveActiveProfileNavItemIdFromItems,
  isProfileNavItemActiveFromItems,
} from "../src/components/Profile/profileNavigationActive.js";

const STATIC_ITEMS = STATIC_PROFILE_NAVIGATION_GROUPS.flatMap((group) => group.items);

/** @type {import("../src/components/Profile/profileNavigationActive.js").ProfileNavItem[]} */
const TEST_PREFERENCIAS_ITEMS = [
  {
    id: "notifications-hub",
    label: "Central de notificações",
    route: "/perfil/preferencias/notificacoes",
    isActive: ({ pathname, search }) =>
      pathname === "/perfil/preferencias/notificacoes" &&
      !new URLSearchParams(search).has("tab") &&
      !new URLSearchParams(search).has("focus"),
  },
  {
    id: "notifications-recipients",
    label: "Destinatários de notificações",
    route: "/perfil/preferencias/notificacoes?tab=recipients",
    isActive: ({ pathname, search }) =>
      pathname === "/perfil/preferencias/notificacoes" &&
      new URLSearchParams(search).get("tab") === "recipients",
  },
  {
    id: "notifications-focus-sales",
    label: "Vendas e lucro",
    route: "/perfil/preferencias/notificacoes?focus=sales",
    isActive: ({ pathname, search }) =>
      pathname === "/perfil/preferencias/notificacoes" &&
      new URLSearchParams(search).get("focus") === "sales",
  },
  {
    id: "popup-alerts-sales",
    label: "Vendas e lucro",
    route: "/perfil/preferencias/alertas-pop-up/sales",
    isActive: ({ pathname }) => pathname === "/perfil/preferencias/alertas-pop-up/sales",
  },
];

const ALL_TEST_ITEMS = [...STATIC_ITEMS, ...TEST_PREFERENCIAS_ITEMS];

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

test("config estática contém grupos principais", () => {
  const labels = STATIC_PROFILE_NAVIGATION_GROUPS.map((group) => group.label);
  assert.deepEqual(labels, ["MINHA CONTA", "INTEGRAÇÕES", "ASSINATURA"]);
});

test("config estática inclui itens principais da missão", () => {
  const labels = STATIC_ITEMS.map((item) => item.label);
  assert.ok(labels.includes("Perfil da Empresa"));
  assert.ok(labels.includes("Alterar Senha"));
  assert.ok(labels.includes("Mercado Livre"));
  assert.ok(labels.includes("Minha assinatura"));
  assert.ok(labels.includes("Planos"));
  assert.ok(labels.includes("Formas de pagamento"));
  assert.ok(labels.includes("Histórico de pagamentos"));
});

test("active state — Perfil da Empresa", () => {
  assert.equal(
    resolveActiveProfileNavItemIdFromItems({ pathname: "/perfil", search: "" }, ALL_TEST_ITEMS),
    "company-profile"
  );
});

test("active state — Alterar Senha", () => {
  assert.equal(
    resolveActiveProfileNavItemIdFromItems(
      { pathname: "/perfil/alterar-senha", search: "" },
      ALL_TEST_ITEMS
    ),
    "change-password"
  );
});

test("active state — assinatura", () => {
  assert.equal(
    resolveActiveProfileNavItemIdFromItems(
      { pathname: "/perfil/assinatura/planos", search: "" },
      ALL_TEST_ITEMS
    ),
    "plans"
  );
});

test("active state — notificações com query", () => {
  assert.equal(
    resolveActiveProfileNavItemIdFromItems(
      { pathname: "/perfil/preferencias/notificacoes", search: "" },
      ALL_TEST_ITEMS
    ),
    "notifications-hub"
  );
  assert.equal(
    resolveActiveProfileNavItemIdFromItems(
      { pathname: "/perfil/preferencias/notificacoes", search: "?tab=recipients" },
      ALL_TEST_ITEMS
    ),
    "notifications-recipients"
  );
});

test("active state — alertas pop-up", () => {
  assert.equal(
    resolveActiveProfileNavItemIdFromItems(
      { pathname: "/perfil/preferencias/alertas-pop-up/sales", search: "" },
      ALL_TEST_ITEMS
    ),
    "popup-alerts-sales"
  );
});

test("apenas um item ativo por rota", () => {
  const location = { pathname: "/perfil/alterar-senha", search: "" };
  const activeCount = ALL_TEST_ITEMS.filter((item) =>
    isProfileNavItemActiveFromItems(location, ALL_TEST_ITEMS, item)
  ).length;
  assert.equal(activeCount, 1);
});

console.log(`\nResultado: ${passed} ok, ${failed} falhou`);
process.exit(failed > 0 ? 1 : 0);
