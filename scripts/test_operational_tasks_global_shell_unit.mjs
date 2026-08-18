#!/usr/bin/env node
/**
 * Shell global — card + modal Editar empresa sem navegação
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { shouldShowOperationalTasks } from "../src/features/dashboard/operationalTasks/operationalTasksRoutes.js";
import { buildCollapsedOperationalTasksLabel } from "../src/features/dashboard/operationalTasks/operationalTaskDescriptions.js";

const root = dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => readFileSync(join(root, "..", relativePath), "utf8");

/** @type {string[]} */
const failures = [];

function assert(name, cond) {
  if (!cond) failures.push(name);
}

const layoutSource = read("src/components/Layout.jsx");
const hostSource = read("src/features/dashboard/operationalTasks/GlobalOperationalTasksHost.jsx");
const modalHostSource = read("src/features/dashboard/operationalTasks/globalSellerCompanyModalContext.jsx");
const dashboardSource = read("src/features/dashboard/operationalTasks/DashboardOperationalTasks.jsx");
const panelSource = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.jsx");
const panelCssSource = read("src/features/dashboard/operationalTasks/S7OperationalTasksPanel.css");
const iconSource = read("src/features/dashboard/operationalTasks/OperationalTasksPanelIcon.jsx");

assert("Layout monta GlobalOperationalTasksHost", layoutSource.includes("<GlobalOperationalTasksHost"));
assert("Layout monta GlobalSellerCompanyModalProvider", layoutSource.includes("<GlobalSellerCompanyModalProvider"));
assert("Host global sem allowlist por rota", !hostSource.includes("shouldShowOperationalTasks"));
assert("Host sempre visible=true", hostSource.includes("<DashboardOperationalTasks visible={true}"));
assert("Modal host reutiliza SellerCompanyModal", modalHostSource.includes("SellerCompanyModal"));
assert(
  "Dashboard abre modal global antes de navegar",
  dashboardSource.includes("openSellerCompanyModal") &&
    dashboardSource.includes('company: "principal"') &&
    dashboardSource.includes('navigate("/perfil/dados-empresa?editar=principal")'),
);
assert("Dashboard importa hook global", dashboardSource.includes("useGlobalSellerCompanyModal"));
assert("Painel título pós-onboarding Central de pendências", panelSource.includes('"Central de pendências"'));
assert("Painel subtítulo pendências", panelSource.includes("s7-operational-tasks-panel__title-subtitle"));
assert("Painel SSOT ícone reutilizado collapsed", panelSource.includes('<OperationalTasksPanelIcon variant="collapsed"'));
assert("Painel SSOT ícone reutilizado expanded", panelSource.includes('<OperationalTasksPanelIcon variant="expanded"'));
assert(
  "Painel ícone expanded só no cabeçalho operacional",
  panelSource.includes("!showOnboardingExpandedHeader ? <OperationalTasksPanelIcon variant=\"expanded\" />"),
);
assert("SSOT ícone componente dedicado", iconSource.includes("onboarding-operacao-comercial.png"));
assert("SSOT ícone variant expanded class", iconSource.includes("s7-operational-tasks-panel__header-illustration"));
assert("CSS header centraliza verticalmente", panelCssSource.includes("align-items: center"));
assert("CSS header illustration sizing", panelCssSource.includes(".s7-operational-tasks-panel__header-illustration"));
assert("CSS collapsed illustration intacto", panelCssSource.includes(".s7-operational-tasks-panel__collapsed-illustration"));
assert("Painel remove h3 Pendências operacionais", !panelSource.includes("Pendências operacionais"));
assert("Onboarding title preserved", panelSource.includes('"Sua operação começa aqui"'));
assert("collapse before action centralized", panelSource.includes("recolherPainelAntesAcao"));
assert("panel wires mlInitialSyncPhase", panelSource.includes("mlInitialSyncPhase"));
assert("dashboard passes mlInitialSyncPhase", dashboardSource.includes("mlInitialSyncPhase"));

assert("rotas públicas login ausente", shouldShowOperationalTasks("/login") === false);
assert("rotas públicas signup ausente", shouldShowOperationalTasks("/signup") === false);
assert("rotas públicas planos ausente", shouldShowOperationalTasks("/planos") === false);
assert("perfil alterar senha coberta", shouldShowOperationalTasks("/perfil/alterar-senha") === true);
assert("perfil dados empresa coberta", shouldShowOperationalTasks("/perfil/dados-empresa") === true);
assert("clientes coberta", shouldShowOperationalTasks("/clientes") === true);
assert("relatorios coberta", shouldShowOperationalTasks("/relatorios") === true);
assert("vendas coberta", shouldShowOperationalTasks("/vendas") === true);
assert("dashboard coberta", shouldShowOperationalTasks("/") === true);

assert("contador singular", buildCollapsedOperationalTasksLabel(1) === "1 pendência");
assert("contador plural", buildCollapsedOperationalTasksLabel(3) === "3 pendências");

const dashboardMountCount = (layoutSource.match(/DashboardOperationalTasks/g) ?? []).length;
const hostMountCount = (layoutSource.match(/<GlobalOperationalTasksHost/g) ?? []).length;
assert("sem DashboardOperationalTasks duplicado no Layout", dashboardMountCount === 0);
assert("uma instância GlobalOperationalTasksHost", hostMountCount === 1);

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ pass: true, test: "operational_tasks_global_shell_unit", cases: 30 }, null, 2));
