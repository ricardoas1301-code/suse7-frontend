import {
  formatCmInput,
  formatKgInput,
  measureDecimalOnKeyDown,
  parseCmPtBR,
  parseKgPtBR,
  toCmInputValue,
  toKgInputValue,
} from "../../../utils/numberFormat.js";

/**
 * @returns {{
 *   shipping: { width_cm: string; height_cm: string; length_cm: string; weight_kg: string };
 *   product_mounted: { width_cm: string; height_cm: string; length_cm: string; weight_kg: string };
 * }}
 */
export function buildEmptyListingMeasurementsDraft() {
  return {
    shipping: {
      width_cm: "",
      height_cm: "",
      length_cm: "",
      weight_kg: "",
    },
    product_mounted: {
      width_cm: "",
      height_cm: "",
      length_cm: "",
      weight_kg: "",
    },
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function listingMeasurementsSummaryToDraft(summary) {
  const draft = buildEmptyListingMeasurementsDraft();
  if (!summary || typeof summary !== "object") return draft;

  for (const blockKey of ["shipping", "product_mounted"]) {
    const block =
      summary[blockKey] && typeof summary[blockKey] === "object"
        ? /** @type {Record<string, unknown>} */ (summary[blockKey])
        : null;
    if (!block) continue;

    draft[blockKey].width_cm = toCmInputValue(block.width_cm) || "";
    draft[blockKey].height_cm = toCmInputValue(block.height_cm) || "";
    draft[blockKey].length_cm = toCmInputValue(block.length_cm) || "";
    draft[blockKey].weight_kg = toKgInputValue(block.weight_kg) || "";
  }

  return draft;
}

/**
 * @param {{
 *   shipping: { width_cm: string; height_cm: string; length_cm: string; weight_kg: string };
 *   product_mounted: { width_cm: string; height_cm: string; length_cm: string; weight_kg: string };
 * }} draft
 */
export function listingMeasurementsDraftToSavePayload(draft) {
  return {
    shipping_width_cm: parseCmPtBR(draft.shipping.width_cm),
    shipping_height_cm: parseCmPtBR(draft.shipping.height_cm),
    shipping_length_cm: parseCmPtBR(draft.shipping.length_cm),
    shipping_weight_kg: parseKgPtBR(draft.shipping.weight_kg),
    product_width_cm: parseCmPtBR(draft.product_mounted.width_cm),
    product_height_cm: parseCmPtBR(draft.product_mounted.height_cm),
    product_length_cm: parseCmPtBR(draft.product_mounted.length_cm),
    product_weight_kg: parseKgPtBR(draft.product_mounted.weight_kg),
  };
}

export { formatCmInput, formatKgInput, measureDecimalOnKeyDown };
