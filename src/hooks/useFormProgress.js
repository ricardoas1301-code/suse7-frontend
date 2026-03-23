// ======================================================================
// HOOK: useFormProgress
// Objetivo:
// - Progresso = inputs visíveis preenchidos / total (cadastro produto)
// ======================================================================

import { useMemo } from "react";
import { calcVisibleFormProgress } from "../utils/formProgress";

/**
 * @param {{
 *   product: object;
 *   variantRows: Array<object>;
 *   variationAttributes: Array<object>;
 *   simpleCostDigits: string;
 *   variantCostDigitsById: Record<string, string>;
 *   packagingDigits: string;
 *   operationalDigits: string;
 *   skuBaseChips: string[];
 *   imageProgress: { productHasImage: boolean; variantHasImageByKey: Record<string, boolean> };
 *   buildVariantKey?: (attrs: object) => string;
 * }} params
 */
export function useFormProgress({
  product,
  variantRows,
  variationAttributes,
  simpleCostDigits,
  variantCostDigitsById,
  packagingDigits,
  operationalDigits,
  skuBaseChips,
  imageProgress,
  buildVariantKey,
}) {
  return useMemo(() => {
    return calcVisibleFormProgress({
      product,
      variantRows,
      variationAttributes,
      simpleCostDigits,
      variantCostDigitsById,
      packagingDigits,
      operationalDigits,
      skuBaseChips,
      imageProgress,
      buildVariantKey,
    });
  }, [
    product,
    variantRows,
    variationAttributes,
    simpleCostDigits,
    variantCostDigitsById,
    packagingDigits,
    operationalDigits,
    skuBaseChips,
    imageProgress,
    buildVariantKey,
  ]);
}
