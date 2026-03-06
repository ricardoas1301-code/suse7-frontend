// ======================================================================
// UTIL: formProgress
// Objetivo:
// - Calcular progresso global do ProductForm (todas as abas)
// - Funciona em "simple" e "variants"
// - Conta TODOS os inputs editáveis (não só obrigatórios)
// ======================================================================

/**
 * Regra de preenchimento ("filled"):
 * - string: trim() > 0
 * - number: válido se não for null/undefined/"" (0 conta como preenchido)
 * - boolean: geralmente NÃO conta (ex.: toggles não deveriam afetar progresso)
 * - array: length > 0
 * - object: não conta por padrão (para evitar inflar com objetos internos)
 */
export function isFilled(value) {
  if (value === null || value === undefined) return false;

  if (typeof value === "string") return value.trim().length > 0;

  // Números: 0 inicial costuma ser neutro, então não conta
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return false;
    return value !== 0;
  }

  if (typeof value === "boolean") return false;

  if (Array.isArray(value)) return value.length > 0;

  if (typeof value === "object") return false;

  return false;
}

/**
 * Monta a lista de campos "contáveis" para progresso.
 * Cada item é um FieldDescriptor:
 * { key: string, value: any }
 */
export function buildProgressFields({ product, variationAttributes, variantRows }) {
  const fields = [];

  const PRODUCT_EXCLUDE = new Set(["active", "product_images", "format"]);

  Object.entries(product || {}).forEach(([k, v]) => {
    if (PRODUCT_EXCLUDE.has(k)) return;
    if (k === "ad_titles") return;
    // virtual_stock_quantity só conta quando o toggle estiver ligado
    if (k === "virtual_stock_quantity" && product?.use_virtual_stock !== true) {
      return;
    }
    fields.push({ key: `product:${k}`, value: v });
  });

  const titles = product?.ad_titles || [];
  titles.forEach((t, idx) => {
    fields.push({
      key: `product:ad_titles:${t?.id || idx}`,
      value: t?.value ?? "",
    });
  });

  if (product?.format === "variants") {
    (variationAttributes || []).forEach((attr, aIdx) => {
      fields.push({
        key: `variationAttributes:${attr?.id || aIdx}:name`,
        value: attr?.name ?? "",
      });

      (attr?.options || []).forEach((opt, oIdx) => {
        fields.push({
          key: `variationAttributes:${attr?.id || aIdx}:options:${oIdx}`,
          value: opt ?? "",
        });
      });
    });

    const VARIANT_EXCLUDE = new Set(["id", "active", "attributes"]);

    (variantRows || []).forEach((row, rIdx) => {
      Object.entries(row || {}).forEach(([k, v]) => {
        if (VARIANT_EXCLUDE.has(k)) return;
        fields.push({
          key: `variant:${row?.id || rIdx}:${k}`,
          value: v,
        });
      });
    });
  }

  return fields;
}

/**
 * Calcula o progresso (filled/total/percent).
 */
export function calcProgress({ product, variationAttributes, variantRows }) {
  const fields = buildProgressFields({ product, variationAttributes, variantRows });

  const total = Math.max(fields.length, 1);

  const filled = fields.reduce((acc, f) => acc + (isFilled(f.value) ? 1 : 0), 0);

  const percent = Math.round((filled / total) * 100);

  return { total, filled, percent };
}

