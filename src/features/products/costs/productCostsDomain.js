// ======================================================================
// Custos de produto — domínio frontend (espelha productCatalogCompleteness.js)
// SINCRONIZAÇÃO: suse7-backend/src/domain/productCatalogCompleteness.js
//
// Semântica (S1.10):
// - cost_price = Custo do Produto (obrigatório > 0)
// - packaging_cost = Embalagem (opcional)
// - operational_cost = Insumo / expedição (opcional) — NÃO é custo operacional (%) da empresa
// ======================================================================

import Decimal from "decimal.js";
import { apiMoneyValueToDigits } from "../../../utils/currencyDigits.js";
import { isCostPositive } from "../../../utils/productReadiness.js";

/**
 * @param {unknown} costPrice
 * @param {unknown} [_packagingCost]
 * @param {unknown} [_operationalCostInsumo]
 */
export function hasRequiredProductCosts(costPrice, _packagingCost, _operationalCostInsumo) {
  const parse = (v) => {
    if (v == null || v === "") return NaN;
    try {
      const d = new Decimal(String(v).trim().replace(",", "."));
      return d.isFinite() ? d.toNumber() : NaN;
    } catch {
      return NaN;
    }
  };
  const cp = parse(costPrice);
  return Number.isFinite(cp) && cp > 0;
}

/**
 * @param {unknown} costPrice
 * @param {unknown} packagingCost
 * @param {unknown} operationalCost
 */
export function isProductCostsIncomplete(costPrice, packagingCost, operationalCost) {
  return !hasRequiredProductCosts(costPrice, packagingCost, operationalCost);
}

export function formatBrlTypingWithSymbol(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";
  return `R$ ${(cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatBrlFromApiValue(raw) {
  if (raw == null || raw === "") return "";
  const digits = apiMoneyValueToDigits(raw);
  if (!digits) return "";
  return formatBrlTypingWithSymbol(digits);
}

/** @returns {string} decimal normalizado "1234.56" ou "" */
export function normalizeDecimalInput(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2);
}

/**
 * @param {{ cost_price?: string; packaging_cost?: string; operational_cost?: string }} draft
 */
const CUSTO_OBRIGATORIO_MENSAGEM = "Informe o custo do produto.";

export function validateProductCostsDraft(draft) {
  const costNorm = normalizeDecimalInput(draft?.cost_price);
  const packagingNorm = normalizeDecimalInput(draft?.packaging_cost);
  const operationalNorm = normalizeDecimalInput(draft?.operational_cost);

  const fieldErrors = {
    cost_price: costNorm && isCostPositive(costNorm) ? "" : CUSTO_OBRIGATORIO_MENSAGEM,
    packaging_cost: "",
    operational_cost: "",
  };

  if (fieldErrors.cost_price) {
    return { ok: false, fieldErrors };
  }

  if (!hasRequiredProductCosts(costNorm, packagingNorm, operationalNorm)) {
    return {
      ok: false,
      fieldErrors: {
        cost_price: CUSTO_OBRIGATORIO_MENSAGEM,
        packaging_cost: "",
        operational_cost: "",
      },
    };
  }

  return {
    ok: true,
    costs: {
      cost_price: costNorm,
      packaging_cost: packagingNorm !== "" ? packagingNorm : "0.00",
      operational_cost: operationalNorm !== "" ? operationalNorm : "0.00",
    },
    fieldErrors,
  };
}

/**
 * @param {string} q
 */
export function normalizeProductCostsSearchQuery(q) {
  return String(q ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * @param {{ product_name?: string; sku?: string }} row
 * @param {string} normalizedQuery
 */
export function matchesProductCostsSearch(row, normalizedQuery) {
  if (!normalizedQuery) return true;
  const name = String(row?.product_name ?? "").toLowerCase();
  const sku = String(row?.sku ?? "").toLowerCase();
  return name.includes(normalizedQuery) || sku.includes(normalizedQuery);
}
