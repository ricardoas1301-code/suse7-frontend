// ======================================================================
// Validação de títulos do anúncio (aba Gerador de títulos)
// ======================================================================

export const AD_TITLE_DUPLICATE_MESSAGE =
  "Título já cadastrado. Crie uma variação diferente para este anúncio.";

/**
 * @param {unknown} value
 */
export function normalizarChaveTituloAnuncio(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * @param {Array<{ id?: string; value?: string; title?: string }>} adTitles
 * @returns {Set<string>} ids de títulos duplicados (case-insensitive)
 */
export function encontrarIdsTitulosDuplicados(adTitles) {
  /** @type {Map<string, string>} */
  const seen = new Map();
  /** @type {Set<string>} */
  const duplicateIds = new Set();
  const list = Array.isArray(adTitles) ? adTitles : [];

  for (const item of list) {
    const id = item?.id != null ? String(item.id) : "";
    const raw = item?.value ?? item?.title ?? "";
    const key = normalizarChaveTituloAnuncio(raw);
    if (!key || !id) continue;
    const prevId = seen.get(key);
    if (prevId) {
      duplicateIds.add(id);
      duplicateIds.add(prevId);
    } else {
      seen.set(key, id);
    }
  }

  return duplicateIds;
}

/**
 * @param {Array<{ id?: string; value?: string; title?: string }>} adTitles
 * @returns {boolean}
 */
export function possuiTitulosDuplicados(adTitles) {
  return encontrarIdsTitulosDuplicados(adTitles).size > 0;
}

/**
 * @param {Array<{ id?: string; value?: string; title?: string }>} adTitles
 * @returns {string | null}
 */
export function validarTitulosAnuncioSemDuplicidade(adTitles) {
  return possuiTitulosDuplicados(adTitles) ? AD_TITLE_DUPLICATE_MESSAGE : null;
}

/**
 * @param {unknown} item
 */
function normalizarItemTituloAnuncio(item) {
  if (item == null) return null;
  const value = String(item?.value ?? item?.title ?? item ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!value) return null;
  const id =
    item?.id != null && String(item.id).trim() !== ""
      ? String(item.id).trim()
      : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return {
    id,
    value,
    manual: item?.manual === true,
    source: item?.source != null ? String(item.source) : undefined,
  };
}

/**
 * @param {{ manual?: boolean; source?: string }} item
 */
function tituloCriadoManualmentePeloSeller(item) {
  if (item.manual === true) return true;
  const source = item?.source != null ? String(item.source).trim().toLowerCase() : "";
  return source === "seller" || source === "manual";
}

/**
 * Remove fallback legado: 1 título idêntico ao product_name (import ML / v1).
 * @param {unknown} adTitles
 * @param {unknown} productName
 * @returns {Array<{ id: string; value: string }>}
 */
export function sanitizeAdTitlesForDisplay(adTitles, productName) {
  let arr = [];
  if (Array.isArray(adTitles)) {
    arr = adTitles;
  } else if (typeof adTitles === "string" && adTitles.trim()) {
    try {
      const parsed = JSON.parse(adTitles);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      arr = [];
    }
  }

  const titles = arr.map(normalizarItemTituloAnuncio).filter(Boolean);
  if (titles.length === 0) return [];

  if (titles.length === 1 && !tituloCriadoManualmentePeloSeller(titles[0])) {
    const nameKey = normalizarChaveTituloAnuncio(productName);
    const titleKey = normalizarChaveTituloAnuncio(titles[0].value);
    if (nameKey && titleKey && nameKey === titleKey) return [];
  }

  return titles.map(({ id, value }) => ({ id, value }));
}
