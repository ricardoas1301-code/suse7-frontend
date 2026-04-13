// ======================================================================
// Readiness / completude essencial do produto (cadastro + espelho da API).
//
// ⚠️ SINCRONIZAÇÃO OBRIGATÓRIA com o backend:
//   suse7-backend/src/domain/productReadiness.js
// Funções `toDec`, `isCostPositive`, `isNonEmptyTrimmed` e a composição do
// score (40/30/30 → 100) devem permanecer semanticamente idênticas.
// Qualquer mudança na regra oficial do trio mínimo: alterar BACK + FRONT juntos.
//
// Observação (formato "variants" no formulário): o backend avalia apenas a
// linha `products` (nome, sku, cost_price). No cadastro com variações, o custo
// é por linha em `product_variants`; aqui exigimos custo > 0 em TODAS as
// linhas visíveis para considerar o bloco de custo “pronto” no score.
// ======================================================================

import Decimal from "decimal.js";
import { apiMoneyValueToDigits } from "./currencyDigits.js";

/** @public Mensagens oficiais do fluxo (ProductForm + validações). */
export const PRODUCT_FORM_MSG = /** @type {const} */ ({
  PRODUCT_NAME_REQUIRED: "Nome do produto é obrigatório",
  SKU_REQUIRED: "SKU é obrigatório",
  COST_MUST_BE_POSITIVE: "Custo do produto deve ser maior que zero",
});

/**
 * Espelha `toDec` do backend (productReadiness.js).
 * @param {unknown} v
 * @returns {Decimal | null}
 */
export function toDec(v) {
  if (v == null || v === "") return null;
  try {
    const d = new Decimal(String(v));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/**
 * Espelha `isCostPositive` do backend.
 * @param {unknown} v
 * @returns {boolean}
 */
export function isCostPositive(v) {
  const d = toDec(v);
  return d != null && d.gt(0);
}

/**
 * Espelha `isNonEmptyTrimmed` do backend.
 * @param {unknown} v
 * @returns {boolean}
 */
export function isNonEmptyTrimmed(v) {
  return v != null && String(v).trim() !== "";
}

/**
 * Máscara BRL por dígitos (só números, centavos como inteiros: "1234" → R$ 12,34).
 * Não usar truthy/falsy: "0", "", "000" → inválido.
 *
 * @param {unknown} digitsRaw
 * @returns {boolean}
 */
export function isCostPositiveFromBrlDigits(digitsRaw) {
  const digits = String(digitsRaw ?? "").replace(/\D/g, "");
  if (digits.length === 0) return false;
  try {
    const reais = new Decimal(digits).div(100);
    return reais.isFinite() && reais.gt(0);
  } catch {
    return false;
  }
}

/**
 * Custo de linha de variação: prioriza dígitos da máscara; se vazio, fallback
 * para `cost_price` já hidratado (API / estado), com a mesma regra do backend.
 *
 * @param {unknown} digitsFromMask
 * @param {unknown} costPriceField — ex.: row.cost_price
 */
export function isVariantLineCostPositive(digitsFromMask, costPriceField) {
  const dMask = String(digitsFromMask ?? "").replace(/\D/g, "");
  if (dMask.length > 0) {
    return isCostPositiveFromBrlDigits(dMask);
  }
  if (costPriceField != null && String(costPriceField).trim() !== "") {
    return isCostPositive(costPriceField);
  }
  const fromApiDigits = apiMoneyValueToDigits(costPriceField);
  if (fromApiDigits.length > 0) {
    return isCostPositiveFromBrlDigits(fromApiDigits);
  }
  return false;
}

/**
 * @param {{
 *   product: Record<string, unknown>;
 *   variantRows?: Array<{ id?: string; cost_price?: unknown }>;
 *   simpleCostDigits?: string;
 *   variantCostDigitsById?: Record<string, string>;
 * }} p
 * @returns {number} 0–100 (mesmo peso do backend: 40 + 30 + 30)
 */
export function computeProductCompletenessScore(p) {
  const product = p?.product && typeof p.product === "object" ? p.product : {};
  const variantRows = Array.isArray(p?.variantRows) ? p.variantRows : [];
  const simpleCostDigits = p?.simpleCostDigits ?? "";
  const variantCostDigitsById =
    p?.variantCostDigitsById && typeof p.variantCostDigitsById === "object" ? p.variantCostDigitsById : {};

  const nameOk = isNonEmptyTrimmed(product.product_name);
  const format = String(product.format || "simple").toLowerCase() === "variants" ? "variants" : "simple";

  let skuOk = false;
  let costOk = false;

  if (format === "simple") {
    skuOk = isNonEmptyTrimmed(product.sku);
    costOk = isCostPositiveFromBrlDigits(simpleCostDigits);
    if (!costOk && product.cost_price != null && String(product.cost_price).trim() !== "") {
      costOk = isCostPositive(product.cost_price);
    }
  } else {
    skuOk = isNonEmptyTrimmed(product.sku) || isNonEmptyTrimmed(product.sku_base);
    if (variantRows.length === 0) {
      costOk = false;
    } else {
      costOk = variantRows.every((r) => {
        const id = r?.id != null ? String(r.id) : "";
        const digits = id ? variantCostDigitsById[id] ?? variantCostDigitsById[String(r.id)] : "";
        return isVariantLineCostPositive(digits, r?.cost_price);
      });
    }
  }

  let product_completeness_score = 0;
  if (nameOk) product_completeness_score += 40;
  if (skuOk) product_completeness_score += 30;
  if (costOk) product_completeness_score += 30;
  if (nameOk && skuOk && costOk) product_completeness_score = 100;

  return Math.max(0, Math.min(100, product_completeness_score));
}

/**
 * Readiness para a listagem de produtos (catálogo): espelha o trio oficial (nome, SKU, custo > 0).
 *
 * Diferença local vs backend oficial: a página Produtos lê o Supabase direto (sem API Node), então
 * esta função recalcula a regra aqui, documentada para manter paridade com o domínio em
 * `suse7-backend/src/domain/productReadiness.js`. Persistência/validação via API continua sendo a
 * fonte de verdade da regra oficial.
 *
 * Variações: SKU raiz = `sku` ou `sku_base`. Custo válido quando todas as linhas em
 * `product_variants` carregadas têm `cost_price` > 0, **ou** quando `products.cost_price` (pai) > 0
 * cobre o conjunto (mesmo fallback do formulário). Não usa `catalog_completeness` legado; embalagem,
 * custo operacional, imagens e descrição não entram neste cálculo.
 *
 * @param {Record<string, unknown> | null | undefined} product — row com optional product_variants[].cost_price
 * @returns {{ is_product_ready: boolean; missing_fields: string[]; product_completeness_score: number }}
 */
export function computeCatalogProductReadiness(product) {
  const p = product && typeof product === "object" && !Array.isArray(product) ? product : {};
  const nameOk = isNonEmptyTrimmed(p.product_name);
  const fmt = String(p.format || "simple").toLowerCase() === "variants" ? "variants" : "simple";

  let skuOk = false;
  let costOk = false;

  if (fmt === "simple") {
    skuOk = isNonEmptyTrimmed(p.sku);
    costOk = isCostPositive(p.cost_price);
  } else {
    skuOk = isNonEmptyTrimmed(p.sku) || isNonEmptyTrimmed(p.sku_base);
    const rows = Array.isArray(p.product_variants) ? p.product_variants : [];
    if (rows.length === 0) {
      costOk = isCostPositive(p.cost_price);
    } else {
      costOk = rows.every((r) => isCostPositive(r?.cost_price));
      if (!costOk && isCostPositive(p.cost_price)) costOk = true;
    }
  }

  /** @type {string[]} */
  const missing_fields = [];
  if (!nameOk) missing_fields.push("name");
  if (!skuOk) missing_fields.push("sku");
  if (!costOk) missing_fields.push("cost_price");

  const is_product_ready = missing_fields.length === 0;

  let product_completeness_score = 0;
  if (nameOk) product_completeness_score += 40;
  if (skuOk) product_completeness_score += 30;
  if (costOk) product_completeness_score += 30;
  if (is_product_ready) product_completeness_score = 100;

  return {
    is_product_ready,
    missing_fields,
    product_completeness_score: Math.max(0, Math.min(100, product_completeness_score)),
  };
}
