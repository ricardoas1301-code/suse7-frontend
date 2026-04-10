// ======================================================================
// Identificador de anúncio por marketplace — exibição e busca (frontend).
// O valor canônico (ex.: external_listing_id com MLB…) vem da API/DB; aqui só
// formatamos e normalizamos para UX. Não alterar persistência.
// ======================================================================

/**
 * Marketplaces que seguem regra ML (prefixo MLB no id público).
 * @param {string | null | undefined} marketplace
 * @returns {boolean}
 */
export function isMercadoLivreMarketplace(marketplace) {
  const m = String(marketplace || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  return m === "mercado_livre" || m === "mercadolivre";
}

/**
 * Texto exibido na UI para o ID externo do anúncio (ex.: coluna Nº).
 * Mercado Livre: remove apenas o prefixo inicial MLB (case-insensitive).
 * Demais marketplaces: retorna o valor técnico sem mudança.
 *
 * @param {string | null | undefined} marketplace — ex.: mercado_livre
 * @param {string | null | undefined} externalListingId
 * @returns {string}
 */
export function formatMarketplaceListingDisplayId(marketplace, externalListingId) {
  const raw = String(externalListingId ?? "").trim();
  if (!raw) return "";

  if (isMercadoLivreMarketplace(marketplace)) {
    if (/^MLB\d+$/i.test(raw)) return raw.replace(/^MLB/i, "");
    return raw;
  }

  return raw;
}

/**
 * Normaliza o termo digitado na busca para variantes úteis (ex.: ML com/sem MLB).
 * Escalável: outros marketplaces podem acrescentar regras sem alterar chamadas existentes.
 *
 * @param {string | null | undefined} marketplace
 * @param {string | null | undefined} input
 * @returns {{ primary: string; variants: string[] }}
 */
export function normalizeMarketplaceListingSearchTerm(marketplace, input) {
  const trimmed = String(input ?? "").trim();
  const lower = trimmed.toLowerCase();
  /** @type {Set<string>} */
  const variants = new Set();
  if (lower) variants.add(lower);

  if (isMercadoLivreMarketplace(marketplace) && lower) {
    const stripped = lower.replace(/^mlb/i, "");
    if (/^\d+$/.test(stripped) && stripped.length > 0) {
      variants.add(stripped);
      variants.add(`mlb${stripped}`);
    }
  }

  const list = [...variants].filter(Boolean);
  return { primary: lower, variants: list.length > 0 ? list : [lower].filter(Boolean) };
}

/**
 * Indica se o termo de busca casa com o ID externo (inclui regras ML).
 * Usa includes tanto no canônico quanto na forma “display” para cobrir todos os formatos.
 *
 * @param {string | null | undefined} marketplace
 * @param {string | null | undefined} externalListingId
 * @param {string} queryAlreadyLowerTrim
 */
export function listingExternalIdMatchesCatalogSearch(marketplace, externalListingId, queryAlreadyLowerTrim) {
  const qBase = String(queryAlreadyLowerTrim || "").trim().toLowerCase();
  if (!qBase) return true;

  const ext = String(externalListingId || "").trim().toLowerCase();
  if (!ext) return false;

  if (ext.includes(qBase)) return true;

  const { variants } = normalizeMarketplaceListingSearchTerm(marketplace, qBase);
  const display = formatMarketplaceListingDisplayId(marketplace, externalListingId).toLowerCase();

  for (const v of variants) {
    if (!v) continue;
    if (ext.includes(v)) return true;
    if (display && display.includes(v)) return true;
  }

  return false;
}
