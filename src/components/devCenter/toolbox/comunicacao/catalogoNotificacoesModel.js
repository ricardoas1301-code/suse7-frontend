// ======================================================
// CATÁLOGO DE NOTIFICAÇÕES — MODEL (S5.11)
// Esqueleto read-only — sem CRUD / cadastro.
// ======================================================

export const CATALOGO_MOTOR_STATUS = Object.freeze({
  fase: "S5.11",
  esqueleto: true,
  notificacoesCadastradas: 0,
});

export const CATALOGO_GRUPOS_DOMINIO = Object.freeze([
  { code: "financeiro", label: "Financeiro" },
  { code: "marketplace", label: "Marketplace" },
  { code: "operacional", label: "Operacional" },
  { code: "comercial", label: "Comercial" },
  { code: "sistema", label: "Sistema" },
  { code: "seguranca", label: "Segurança" },
]);

export const CATALOGO_CATEGORIAS = Object.freeze([
  "BILLING",
  "PRODUCTS",
  "INVENTORY",
  "SALES",
  "PROFIT",
  "MARKETPLACE",
  "ACCOUNT_HEALTH",
  "COMPETITION",
  "SYNC",
  "SYSTEM",
  "DEVCENTER",
]);

export const CATALOGO_PRIORIDADES = Object.freeze(["info", "warning", "high", "critical"]);

export const CATALOGO_CANAIS = Object.freeze([
  { code: "email", status: "ativo" },
  { code: "whatsapp", status: "ativo" },
  { code: "in_app", status: "ativo" },
  { code: "popup", status: "futuro" },
  { code: "banner", status: "futuro" },
]);

export const CATALOGO_OBRIGATORIEDADE = Object.freeze(["mandatory", "optional"]);

export const CATALOGO_TABELAS = Object.freeze([
  "s7_notification_categories",
  "s7_notification_event_types",
  "s7_notification_templates",
]);

export const CATALOGO_FUTURO = Object.freeze([
  "Cadastro em massa de notificações",
  "Regras de disparo por notificação",
  "CRUD administrativo Dev Center",
  "Trilha exclusiva de notificações",
]);
