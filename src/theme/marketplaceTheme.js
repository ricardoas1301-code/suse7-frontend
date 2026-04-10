// ======================================================================
// Theme visual por marketplace — Raio-x e superfícies futuras multi-canal.
// Uma única fonte de verdade por chave; componentes consomem via getMarketplaceTheme().
// ======================================================================

/** Lockup horizontal oficial (ícone + “mercado/livre” empilhado) — Modal Raio-x ML. */
import mercadoLivreLockupUrl from "../assets/marketplaces/mercadolivre-lockup.png";

// ---------------------------------------------------------------------
// Mercado Livre — amarelo de marca (Suse7)
// ---------------------------------------------------------------------
// Tom validado contra o lockup em src/assets/marketplaces/mercadolivre-lockup.png.
// Para qualquer UI do canal ML, usar estes tokens (ou theme.brandPrimary / getMarketplaceTheme)
// em vez de hex soltos (#ffe600, etc.).
// ---------------------------------------------------------------------
/** Amarelo principal ML — bordas, molduras, ícones, gráficos. */
export const MERCADO_LIVRE_BRAND_YELLOW_HEX = "#ffe82b";

/** Amarelo principal ML — componentes RGB (0–255). Manter alinhado a MERCADO_LIVRE_BRAND_YELLOW_HEX. */
export const MERCADO_LIVRE_BRAND_YELLOW_RGB = /** @type {const} */ ({
  r: 255,
  g: 232,
  b: 43,
});

/**
 * Overlay / fundo suave ML (alpha 55%). Para outros alphas: `rgba(255, 232, 43, α)`.
 * @see MERCADO_LIVRE_BRAND_YELLOW_RGB
 */
export const MERCADO_LIVRE_BRAND_YELLOW_SOFT = "rgba(255, 232, 43, 0.55)";

/**
 * @typedef {object} MarketplaceTheme
 * @property {string} key — chave canônica (ex.: mercado_livre)
 * @property {string} displayName — rótulo amigável
 * @property {string | null} logoSrc — URL para <img> (Vite / public)
 * @property {string} logoAlt — texto alternativo da marca
 * @property {string} brandPrimary — cor principal (hex)
 * @property {string} brandAccent — cor de apoio / links / detalhes
 * @property {string} brandSoft — overlay suave (rgba ou hex com alpha)
 * @property {string | null} shellModifierClass — modificador BEM opcional no shell Raio-x
 */

/** Fallback seguro Suse7 quando chave ausente ou canal sem theme completo. */
const FALLBACK_THEME = /** @type {const} */ ({
  key: "default",
  displayName: "Marketplace",
  logoSrc: null,
  logoAlt: "",
  brandPrimary: "#2563eb",
  brandAccent: "#3b82f6",
  brandSoft: "rgba(37, 99, 235, 0.08)",
  shellModifierClass: null,
});

/** @type {Record<string, MarketplaceTheme>} */
const THEME_BY_KEY = {
  mercado_livre: {
    key: "mercado_livre",
    displayName: "Mercado Livre",
    logoSrc: mercadoLivreLockupUrl,
    logoAlt: "Mercado Livre",
    brandPrimary: MERCADO_LIVRE_BRAND_YELLOW_HEX,
    brandAccent: "#2d3277",
    brandSoft: MERCADO_LIVRE_BRAND_YELLOW_SOFT,
    shellModifierClass: "anuncios-raiox-shell--mercado_livre",
  },
  shopee: {
    key: "shopee",
    displayName: "Shopee",
    logoSrc: null,
    logoAlt: "Shopee",
    brandPrimary: "#ee4d2d",
    brandAccent: "#ff7337",
    brandSoft: "rgba(238, 77, 45, 0.12)",
    shellModifierClass: null,
  },
  amazon: {
    key: "amazon",
    displayName: "Amazon",
    logoSrc: null,
    logoAlt: "Amazon",
    brandPrimary: "#ff9900",
    brandAccent: "#232f3e",
    brandSoft: "rgba(255, 153, 0, 0.12)",
    shellModifierClass: null,
  },
  magalu: {
    key: "magalu",
    displayName: "Magalu",
    logoSrc: null,
    logoAlt: "Magazine Luiza",
    brandPrimary: "#007bff",
    brandAccent: "#0056c7",
    brandSoft: "rgba(0, 123, 255, 0.1)",
    shellModifierClass: null,
  },
  shein: {
    key: "shein",
    displayName: "Shein",
    logoSrc: null,
    logoAlt: "Shein",
    brandPrimary: "#000000",
    brandAccent: "#333333",
    brandSoft: "rgba(0, 0, 0, 0.06)",
    shellModifierClass: null,
  },
};

/**
 * Normaliza slug da grid / API para chave canônica do theme.
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function normalizeMarketplaceThemeKey(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (s === "mercadolivre" || s === "ml" || s === "mercado_livre") return "mercado_livre";
  if (s === "magazineluiza" || s === "magazine_luiza") return "magalu";
  if (THEME_BY_KEY[s]) return s;
  return "default";
}

/**
 * Resolve theme para o modal Raio-x e demais UI por canal.
 * @param {string | null | undefined} marketplaceSlug — ex.: row.marketplaceRaw, marketplaceSlug
 * @returns {MarketplaceTheme & { resolvedKey: string }}
 */
export function getMarketplaceTheme(marketplaceSlug) {
  const resolvedKey = normalizeMarketplaceThemeKey(marketplaceSlug);
  const base = THEME_BY_KEY[resolvedKey];
  if (!base) {
    return { ...FALLBACK_THEME, resolvedKey: "default" };
  }
  return { ...base, resolvedKey };
}

/**
 * Mapa pronto para style={{ ... }} no shell Raio-x (CSS variables do design system).
 * @param {MarketplaceTheme} theme
 * @returns {Record<string, string>}
 */
export function getMarketplaceThemeCssVars(theme) {
  return {
    "--marketplace-primary": theme.brandPrimary,
    "--marketplace-accent": theme.brandAccent,
    "--marketplace-soft": theme.brandSoft,
  };
}
