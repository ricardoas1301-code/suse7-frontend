// ======================================================================
// Central de Notificações — taxonomia e navegação canônica (S1.PERFIL-NOTIFICACOES.1)
// Fonte única: menu do Perfil, rotas, composição das páginas por domínio.
// ======================================================================

import {
  NOTIFICATION_CATEGORY_VIEWS,
  POPUP_ALERTS_CATALOG_BY_VIEW,
} from "./notificationPreferences.js";
import { sectionUsesVisualPopupPlaceholders } from "./notificationCenterVisualPopupPlaceholders.js";

export { sectionUsesVisualPopupPlaceholders } from "./notificationCenterVisualPopupPlaceholders.js";

/** @typedef {'recipients' | 'category' | 'history'} NotificationCenterSectionKind */

/**
 * @typedef {Object} NotificationCenterSection
 * @property {string} key
 * @property {string} slug
 * @property {string} label
 * @property {string} description
 * @property {NotificationCenterSectionKind} kind
 * @property {number} order
 * @property {boolean} [visible]
 * @property {string} [popupCategory] — chave POPUP_ALERTS_CATEGORY_VIEWS
 * @property {readonly string[]} [notificationGroups] — category_code do motor central
 * @property {boolean} [groupedLayout] — cards de seção + grade 4 colunas (S1.PERFIL-NOTIFICACOES.10+)
 */

/** Eventos internos — permanecem no motor, ocultos da UI configurável do seller. */
export const NOTIFICATION_CENTER_INTERNAL_EVENT_KEYS = Object.freeze([
  "FALE_CONOSCO_TEAM",
  "FALE_CONOSCO_CONFIRMATION",
]);

/**
 * Onde os eventos internos continuam sendo utilizados:
 * - FALE_CONOSCO_TEAM: motor central faleConosco/triggerFaleConoscoContact.js (equipe SUSE7)
 * - FALE_CONOSCO_CONFIRMATION: confirmação transacional automática ao seller após envio do formulário
 * Persistência, dispatcher e templates permanecem inalterados nesta missão.
 */

/** @type {readonly NotificationCenterSection[]} */
export const NOTIFICATION_CENTER_SECTIONS = Object.freeze([
  {
    key: "recipients",
    slug: "destinatarios",
    label: "Destinatários",
    description: "Cadastre pessoas com e-mail e/ou WhatsApp e vincule por evento nas categorias abaixo.",
    kind: "recipients",
    order: 1,
    visible: true,
  },
  {
    key: "sales_profit",
    slug: "vendas",
    label: "Vendas",
    description: "Alertas de vendas, margem, compartilhamentos e resumo diário.",
    kind: "category",
    order: 2,
    visible: true,
    popupCategory: NOTIFICATION_CATEGORY_VIEWS.sales,
    notificationGroups: ["SALES", "PROFIT"],
    groupedLayout: true,
  },
  {
    key: "products_stock",
    slug: "produtos",
    label: "Produtos",
    description: "Estoque baixo, ruptura e lembretes operacionais de inventário.",
    kind: "category",
    order: 3,
    visible: true,
    popupCategory: NOTIFICATION_CATEGORY_VIEWS.products,
    notificationGroups: ["INVENTORY", "PRODUCTS"],
    groupedLayout: true,
  },
  {
    key: "marketplace",
    slug: "anuncios",
    label: "Anúncios",
    description: "Alterações de preço, tarifa e integrações de anúncios.",
    kind: "category",
    order: 4,
    visible: true,
    popupCategory: NOTIFICATION_CATEGORY_VIEWS.marketplace,
    notificationGroups: ["MARKETPLACE"],
    groupedLayout: true,
  },
  {
    key: "account_health",
    slug: "saude-operacao",
    label: "Saúde da operação",
    description: "Conexões, sincronizações e alertas operacionais da sua conta.",
    kind: "category",
    order: 5,
    visible: true,
    popupCategory: NOTIFICATION_CATEGORY_VIEWS.health,
    notificationGroups: ["ACCOUNT_HEALTH", "SYNC", "SYSTEM"],
    groupedLayout: true,
  },
  {
    key: "competition",
    slug: "concorrencia",
    label: "Concorrência",
    description: "Perda de competitividade e relatórios de concorrência.",
    kind: "category",
    order: 6,
    visible: true,
    notificationGroups: ["COMPETITION"],
    groupedLayout: true,
  },
  {
    key: "billing",
    slug: "assinatura-pagamentos",
    label: "Assinatura e pagamentos",
    description: "Assinatura, cobranças, pagamentos e renovações.",
    kind: "category",
    order: 7,
    visible: true,
    notificationGroups: ["BILLING"],
    groupedLayout: true,
  },
  {
    key: "history",
    slug: "historico",
    label: "Histórico",
    description: "Registros de entrega, tentativas e canais.",
    kind: "history",
    order: 8,
    visible: true,
  },
]);

/** @type {Map<string, NotificationCenterSection>} */
const SECTION_BY_SLUG = new Map(
  NOTIFICATION_CENTER_SECTIONS.map((section) => [section.slug, section])
);

/** @type {Map<string, NotificationCenterSection>} */
const SECTION_BY_KEY = new Map(
  NOTIFICATION_CENTER_SECTIONS.map((section) => [section.key, section])
);

/** Slugs legados → slug canônico (compatibilidade de bookmarks e deep links). */
export const NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES = Object.freeze({
  "vendas-lucro": "vendas",
  "produtos-estoque": "produtos",
  "anuncios-marketplace": "anuncios",
});

/** @param {NotificationCenterSection} section */
export function notificationCenterCanonicalSlug(section) {
  return String(section?.slug ?? "").trim().toLowerCase();
}

/** @param {string | null | undefined} slug */
export function resolveNotificationCenterSectionBySlug(slug) {
  const key = String(slug ?? "").trim().toLowerCase();
  const canonical = NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES[key] ?? key;
  return SECTION_BY_SLUG.get(canonical) ?? null;
}

/** @param {string | null | undefined} slug */
export function isNotificationCenterLegacySlug(slug) {
  const key = String(slug ?? "").trim().toLowerCase();
  return key in NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES;
}

/** @param {string | null | undefined} slug */
export function resolveNotificationCenterLegacyRedirectSlug(slug) {
  const key = String(slug ?? "").trim().toLowerCase();
  return NOTIFICATION_CENTER_LEGACY_SLUG_ALIASES[key] ?? null;
}

/** @param {string | null | undefined} key */
export function resolveNotificationCenterSectionByKey(key) {
  return SECTION_BY_KEY.get(String(key ?? "").trim()) ?? null;
}

/** @param {NotificationCenterSection} section */
export function notificationCenterSectionRoute(section) {
  return `/perfil/preferencias/notificacoes/${section.slug}`;
}

/** Itens visíveis do menu (sem título duplicado da seção). */
export function listNotificationCenterNavSections() {
  return NOTIFICATION_CENTER_SECTIONS.filter(
    (section) => section.visible !== false && section.kind !== "history"
  ).sort((a, b) => a.order - b.order);
}

/** @param {string | null | undefined} popupCategory */
export function sectionHasRealPopupAlerts(popupCategory) {
  const key = String(popupCategory ?? "").trim();
  if (!key) return false;
  const group = POPUP_ALERTS_CATALOG_BY_VIEW[key];
  return (group?.items?.length ?? 0) > 0;
}

/**
 * Card Alertas pop-up — somente com pop-ups reais (placeholders exclusivos de Vendas).
 * @param {NotificationCenterSection | null | undefined} section
 */
export function shouldShowNotificationCenterPopupSection(section) {
  if (!section) return false;
  if (sectionUsesVisualPopupPlaceholders(section.key)) return true;
  if (section.groupedLayout) {
    return sectionHasRealPopupAlerts(section.popupCategory);
  }
  return Boolean(section.popupCategory);
}

/** @param {string | null | undefined} focus — atalho legado ?focus= */
export function resolveLegacyNotificationFocusSlug(focus) {
  /** @type {Record<string, string>} */
  const map = {
    sales: "vendas",
    products: "produtos",
    marketplace: "anuncios",
    health: "saude-operacao",
    billing: "assinatura-pagamentos",
    competition: "concorrencia",
    concorrencia: "concorrencia",
  };
  return map[String(focus ?? "").trim().toLowerCase()] ?? null;
}

/** @param {string | null | undefined} popupCategory — rota legada alertas-pop-up/:category */
export function resolveLegacyPopupCategorySlug(popupCategory) {
  return resolveLegacyNotificationFocusSlug(popupCategory);
}

/** @param {string | null | undefined} legacyCategory — rota legada /notificacoes/:category */
export function resolveLegacyNotificationCategorySlug(legacyCategory) {
  return resolveLegacyNotificationFocusSlug(legacyCategory);
}

/**
 * Filtra tipos visíveis ao seller (oculta eventos internos do Fale Conosco).
 * @param {Array<{ type_key?: string }>} types
 */
export function filterSellerFacingNotificationTypes(types) {
  const hidden = new Set(NOTIFICATION_CENTER_INTERNAL_EVENT_KEYS);
  return (types ?? []).filter((type) => !hidden.has(String(type?.type_key ?? "").trim()));
}

/**
 * @param {Array<{ code?: string, types?: Array<{ type_key?: string }> }>} categories
 * @param {readonly string[]} groupCodes
 */
export function pickNotificationCategoriesForSection(categories, groupCodes) {
  const allowed = new Set((groupCodes ?? []).map(String));
  return (categories ?? [])
    .filter((cat) => allowed.has(String(cat.code)))
    .map((cat) => ({
      ...cat,
      types: filterSellerFacingNotificationTypes(cat.types),
    }))
    .filter((cat) => (cat.types?.length ?? 0) > 0);
}

/** @param {number} count */
export function formatNotificationTypeCount(count) {
  const n = Number(count) || 0;
  if (n === 0) return "0 tipos";
  if (n === 1) return "1 tipo";
  return `${n} tipos`;
}
