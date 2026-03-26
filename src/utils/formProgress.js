// ======================================================================
// UTIL: formProgress
// Objetivo:
// - Progresso = (inputs preenchidos / inputs visíveis no cadastro) × 100
// - Imagens: 1 unidade no simples (≥1 imagem); 1 unidade por variação (≥1 imagem na variação)
// - Campo Formato (product.format) não entra no total nem como preenchido
// - Numerador só incrementa com filled === true (sem “auto-preenchido” por opcional)
// ======================================================================

import { apiMoneyValueToDigits } from "./currencyDigits.js";

/** Limite de slots na UI da aba Imagens (referência; progresso não conta slot a slot) */
export const MAX_IMAGE_SLOTS = 7;

function strFilled(v) {
  return String(v ?? "").trim().length > 0;
}

/**
 * Valor “tipo número” no formulário: preenchido se não é null/undefined; 0 conta como válido.
 * String vazia ou só espaços = vazio.
 */
function numberLikeFilled(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "number") return !Number.isNaN(v);
  return String(v).trim().length > 0;
}

/**
 * Estoque real (variação/simples em número): preenchido se não é null/undefined/vazio; 0 é válido.
 * Alinha com validação (apenas estoque real obrigatório).
 */
function stockRealProgressFilled(v) {
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "number") return !Number.isNaN(v);
  return String(v).trim() !== "";
}

/** Estoque mínimo (simples/variação): não vazio; 0 numérico ou "0" válidos; espaços = vazio. */
function stockMinProgressFilled(v) {
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "number") return !Number.isNaN(v);
  return String(v).trim() !== "";
}

/**
 * Classifica IDs de campo como opcionais (UX/validação futura).
 * Não entra no cálculo de percentual em calcVisibleFormProgress.
 */
export function isFieldOptional(fieldId) {
  const id = String(fieldId ?? "");
  return (
    id.includes("gtin") ||
    id.includes("ean") ||
    id.includes("ncm") ||
    id.includes("brand") ||
    id.includes("model") ||
    id.includes("seo") ||
    id.includes("desc") ||
    id.includes("description")
  );
}

/**
 * ID único por linha no cálculo de progresso — mesmo valor em SKU, custo, estoque, imagem e snapshot.
 */
export function variantProgressRowId(row, index) {
  return row?.id ?? `row_${index}`;
}

function digitsNonEmpty(digitsStr) {
  return String(digitsStr ?? "").replace(/\D/g, "").length > 0;
}

function costDigitsPositive(digitsStr) {
  const digits = String(digitsStr ?? "").replace(/\D/g, "");
  return Number(digits || "0") > 0;
}

/** Alinhado a ProductFormImagesTab.sanitizeStoragePath — reconhece storage válido após normalização */
function sanitizeStoragePathForProgress(p) {
  if (p == null || typeof p !== "string") return null;
  let raw = String(p).trim();
  if (!raw || raw === "undefined" || raw === "null") return null;
  if (raw.includes(",")) raw = raw.split(",")[0].trim();
  if (!raw || raw.includes(" ") || raw.includes("undefined") || raw.includes("null")) return null;
  return raw;
}

function linkHasStorage(link) {
  if (!link) return false;
  const p = link.storage_path ?? link.storagePath;
  const s = sanitizeStoragePathForProgress(p);
  return s != null && s.length > 0;
}

/** Dígitos do custo: mapa por rowId OU fallback em row.cost_price (hidratação / divergência de id). */
function getVariantCostDigitsMerged(rowId, variantCostDigitsById, row) {
  const mapRaw = variantCostDigitsById?.[rowId] ?? variantCostDigitsById?.[String(rowId)];
  const fromMap = String(mapRaw ?? "").replace(/\D/g, "");
  if (fromMap.length > 0) return fromMap;
  return apiMoneyValueToDigits(row?.cost_price);
}

/** Pelo menos uma imagem com storage válido no escopo */
export function hasAnyStoredImage(links) {
  return Array.isArray(links) && links.some(linkHasStorage);
}

/**
 * Snapshot para progresso (sem contar slots individuais).
 * variantHasImageByKey usa apenas chaves String(rowId) — alinhado a variantProgressRowId / getVisibleInputs.
 *
 * @param {{ format: string; variantRows?: object[]; productLinks?: unknown[]; variantLinksByRowId?: Record<string, unknown[]> }} args
 * @returns {{ productHasImage: boolean; variantHasImageByKey: Record<string, boolean> }}
 */
export function buildImageProgressSnapshot({
  format,
  variantRows = [],
  productLinks = [],
  variantLinksByRowId = {},
  buildVariantKey,
}) {
  const productHasImage = hasAnyStoredImage(productLinks);
  const variantHasImageByKey = {};
  if (format === "variants" && Array.isArray(variantRows) && variantRows.length > 0) {
    variantRows.forEach((r, index) => {
      const rowId = String(variantProgressRowId(r, index));
      const links = variantLinksByRowId[rowId];
      const list = Array.isArray(links) ? links : [];
      const has = hasAnyStoredImage(list);
      variantHasImageByKey[rowId] = has;
      if (typeof buildVariantKey === "function") {
        const vk = buildVariantKey(r.attributes);
        if (vk) variantHasImageByKey[vk] = has;
      }
    });
  }
  return { productHasImage, variantHasImageByKey };
}

/**
 * Aceita snapshot novo ou legado (arrays de slots por slot).
 * @param {unknown} raw
 * @returns {{ productHasImage: boolean; variantHasImageByKey: Record<string, boolean> }}
 */
export function normalizeImageProgress(raw) {
  if (!raw || typeof raw !== "object") {
    return { productHasImage: false, variantHasImageByKey: {} };
  }
  if (typeof raw.productHasImage === "boolean") {
    return {
      productHasImage: raw.productHasImage,
      variantHasImageByKey:
        raw.variantHasImageByKey && typeof raw.variantHasImageByKey === "object"
          ? raw.variantHasImageByKey
          : {},
    };
  }
  // Legado: { product: boolean[], byVariantKey: Record<string, boolean[]> }
  const productHasImage = Array.isArray(raw.product) ? raw.product.some(Boolean) : false;
  const variantHasImageByKey = {};
  if (raw.byVariantKey && typeof raw.byVariantKey === "object") {
    Object.entries(raw.byVariantKey).forEach(([k, v]) => {
      variantHasImageByKey[k] = Array.isArray(v) ? v.some(Boolean) : Boolean(v);
    });
  }
  return { productHasImage, variantHasImageByKey };
}

/**
 * @typedef {Object} FormProgressContext
 * @property {object} product
 * @property {Array<object>} [variantRows]
 * @property {Array<object>} [variationAttributes]
 * @property {string} [simpleCostDigits]
 * @property {Record<string, string>} [variantCostDigitsById]
 * @property {string} [packagingDigits]
 * @property {string} [operationalDigits]
 * @property {string[]} [skuBaseChips] espelho UI da raiz do SKU (variants); estado canônico em `product.sku_base`
 * @property {{ productHasImage?: boolean; variantHasImageByKey?: Record<string, boolean> }} [imageProgress]
 * @property {(attrs: object) => string} [buildVariantKey] só para leitura de imagem por variação (fallback vk)
 */

/**
 * Lista inputs visíveis no cadastro (metadados + preenchido).
 * @param {FormProgressContext} ctx
 * @returns {Array<{ id: string; filled: boolean; isVisible?: boolean }>}
 */
export function getVisibleInputs(ctx) {
  const {
    product,
    variantRows = [],
    variationAttributes = [],
    simpleCostDigits = "",
    variantCostDigitsById = {},
    packagingDigits = "",
    operationalDigits = "",
    imageProgress: rawImageProgress,
  } = ctx;

  const img = normalizeImageProgress(rawImageProgress);

  const format = product?.format === "variants" ? "variants" : "simple";
  const rows = Array.isArray(variantRows) ? variantRows : [];
  const inputs = [];
  /** @param {boolean} [isVisible] false = não entra no total (campo invisível / condicional na UI) */
  const add = (id, filled, isVisible = true) => inputs.push({ id, filled, isVisible });

  // --- Dados (aba Dados) — sem "Formato" no progresso ---
  add("data:product_name", strFilled(product?.product_name));
  if (format === "simple") {
    add("data:sku", strFilled(product?.sku));
    // EAN/GTIN do produto só existe na UI no formato simples; em variações o código é por linha (var:row:*:gtin).
    add("data:gtin", strFilled(product?.gtin));
  }
  add("data:ncm", strFilled(product?.ncm));
  add("data:brand", strFilled(product?.brand));
  add("data:model", strFilled(product?.model));
  add("data:seo_keywords", strFilled(product?.seo_keywords));

  // --- Variações: configuração (só formato com variações) ---
  if (format === "variants") {
    // Só atributos já cadastrados (nome + ≥1 opção válida). O rascunho “Nome do atributo / Opções”
    // do builder fica em draftAttrChips/draftOptions e NÃO entra em variationAttributes — mas linhas
    // incompletas ou opções vazias no array não devem gerar slots que travam o progresso.
    const persistedVariationAttrs = (variationAttributes || []).filter(
      (a) =>
        strFilled(a?.name) &&
        Array.isArray(a?.options) &&
        a.options.some((o) => strFilled(o))
    );
    persistedVariationAttrs.forEach((attr, ai) => {
      add(`var:attr:${ai}:name`, strFilled(attr?.name));
      (attr.options || []).forEach((opt, oi) => {
        if (!strFilled(opt)) return;
        add(`var:attr:${ai}:opt:${oi}`, true);
      });
    });

    rows.forEach((row, ri) => {
      const rowId = variantProgressRowId(row, ri);
      add(`var:row:${rowId}:sku`, strFilled(row?.sku));
      add(`var:row:${rowId}:gtin`, strFilled(row?.gtin));
    });
  }

  // --- Custos & precificação ---
  if (format === "simple") {
    add("price:simple_cost", costDigitsPositive(simpleCostDigits));
  } else {
    rows.forEach((row, ri) => {
      const rowId = variantProgressRowId(row, ri);
      const costDigits = getVariantCostDigitsMerged(rowId, variantCostDigitsById, row);
      add(`price:variant:${rowId}:cost`, costDigitsPositive(costDigits));
    });
  }
  add("price:packaging", digitsNonEmpty(packagingDigits));
  add("price:operational", digitsNonEmpty(operationalDigits));

  // --- Estoque ---
  // Checkbox “estoque virtual” não entra no progresso: default não deve contar como preenchido.
  if (format === "simple") {
    add("stock:simple:real", stockRealProgressFilled(product?.stock_quantity));
    add("stock:simple:min", stockMinProgressFilled(product?.stock_minimum));
    if (product?.use_virtual_stock) {
      const sv = product?.virtual_stock_quantity;
      const num =
        sv === "" || sv === null || sv === undefined
          ? ""
          : String(sv).replace(/\D/g, "");
      add("stock:simple:virtual_qty", num.length > 0);
    }
  } else {
    rows.forEach((row, ri) => {
      const rowId = variantProgressRowId(row, ri);
      add(`stock:var:${rowId}:real`, stockRealProgressFilled(row?.stock_real));
      add(`stock:var:${rowId}:min`, stockMinProgressFilled(row?.stock_min));
      if (row?.use_virtual_stock) {
        const raw = row?.stock_virtual;
        const num =
          raw === "" || raw === null || raw === undefined
            ? ""
            : String(raw).replace(/\D/g, "");
        add(`stock:var:${rowId}:virtual_qty`, num.length > 0);
      }
    });
  }

  // --- Descrição ---
  add("desc:main", strFilled(product?.description));

  // --- Títulos do anúncio: 1 unidade no progresso (≥1 card com texto).
  // Não contar card a card: o default é 1 linha vazia + o usuário pode abrir vários cards “para depois”,
  // o que gerava ~1 slot morto e travava em ~97% mesmo com o resto preenchido.
  const titles = Array.isArray(product?.ad_titles) ? product.ad_titles : [];
  const hasAnyAdTitle = titles.some((t) => strFilled(t?.value ?? t?.title));
  add("ad_titles:any", hasAnyAdTitle);

  // --- Pesos & medidas (8 campos) ---
  const measureKeys = [
    "width",
    "height",
    "length",
    "weight",
    "assembled_width",
    "assembled_height",
    "assembled_length",
    "assembled_weight",
  ];
  measureKeys.forEach((k) => {
    add(`measure:${k}`, strFilled(product?.[k]));
  });

  // --- Imagens: 1 unidade (simples) ou 1 por variação ---
  if (format === "simple") {
    add("img:product:any", !!img.productHasImage);
  } else if (rows.length > 0) {
    rows.forEach((row, ri) => {
      const rowId = variantProgressRowId(row, ri);
      const vk =
        typeof ctx.buildVariantKey === "function" ? ctx.buildVariantKey(row.attributes) : "";
      const filled = !!(
        img.variantHasImageByKey[String(rowId)] ||
        (vk && img.variantHasImageByKey[vk])
      );
      add(`img:var:${rowId}:any`, filled);
    });
  }

  return inputs;
}

/**
 * @param {FormProgressContext} ctx
 * @returns {{ percent: number; totalInputs: number; filledInputs: number; inputs: Array<{ id: string; filled: boolean }> }}
 */
export function calcVisibleFormProgress(ctx) {
  const rawInputs = getVisibleInputs(ctx);
  const inputs = rawInputs.filter((input) => input.isVisible !== false);
  const totalInputs = inputs.length;
  if (totalInputs === 0) {
    return { percent: 0, totalInputs: 0, filledInputs: 0, inputs };
  }
  const filledInputs = inputs.reduce((acc, x) => acc + (x.filled ? 1 : 0), 0);
  const missingFields = inputs.filter((x) => !x.filled).map((x) => x.id);

  let percent =
    totalInputs > 0 ? Math.round((filledInputs / totalInputs) * 100) : 0;
  if (filledInputs === totalInputs && totalInputs > 0) {
    percent = 100;
  }
  percent = Math.max(0, Math.min(100, percent));

  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    // Debug temporário: campos que travam o progresso (ex.: variações ~97%)
    console.log("[formProgress]", { totalInputs, filledInputs, missingFields });
  }

  return {
    percent,
    totalInputs,
    filledInputs,
    inputs,
  };
}

// --- Compatibilidade com código legado / hooks antigos ---
export const FIELD_WEIGHTS = { required: 3, important: 2, optional: 1 };

export function calcWeightedFormProgress(params) {
  return calcVisibleFormProgress({
    product: params?.product,
    variantRows: params?.variantRows,
    variationAttributes: params?.variationAttributes,
    simpleCostDigits: params?.simpleCostDigits,
    variantCostDigitsById: params?.variantCostDigitsById,
    packagingDigits: params?.packagingDigits,
    operationalDigits: params?.operationalDigits,
    skuBaseChips: params?.skuBaseChips,
    imageProgress: params?.imageProgress,
    buildVariantKey: params?.buildVariantKey,
  });
}

export function calcRequiredFormProgress(params) {
  return calcWeightedFormProgress(params);
}
