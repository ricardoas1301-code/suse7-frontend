// =============================================================================
// Adapter — Copiar (clipboard imagem + legenda texto)
// =============================================================================

import { buildSaleRayxSummary } from "../../../components/sales/saleRayxSummary.js";
import {
  generateSaleRayxShareImage,
  type SaleRayXShareInput,
} from "./SaleRayXShareRenderer.js";

export type CopyShareResult = "image" | "text";

export async function copySaleRayxShare(input: SaleRayXShareInput): Promise<CopyShareResult> {
  const summaryText = buildSaleRayxSummary({
    general: input.general,
    product: input.product,
    financial: input.financial,
    profitMargin: input.profitMargin,
    listingTitle: input.listingTitle,
    saleContextMetrics: input.saleContextMetrics,
  });

  const { blob } = await generateSaleRayxShareImage(input, "copy");

  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    await navigator.clipboard.writeText(summaryText);
    return "text";
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
        "text/plain": new Blob([summaryText], { type: "text/plain" }),
      }),
    ]);
    return "image";
  } catch {
    await navigator.clipboard.writeText(summaryText);
    return "text";
  }
}
