// ======================================================
// Imagem PNG do resumo S7 — delegado ao SaleRayXShareRenderer.
// ======================================================

import { SALE_RAYX_SHARE_TEMPLATE_VERSION } from "../../shared/renderers/saleRayx/SaleRayXShareStyles.js";
import { exportSaleRayxShareImage } from "../../shared/renderers/saleRayx/SaleRayXImageExporter.js";

/**
 * Gera PNG do resumo (compatibilidade legada).
 * @param {{ renderModel: import("./saleRayxSummaryRender.js").SaleRayxSummaryRenderModel; brandTitle?: string; saleId?: string }} opts
 */
export async function buildSaleRayxSummaryPngBlob(opts) {
  return exportSaleRayxShareImage({
    payload: {
      saleId: opts.saleId ?? "legacy",
      snapshotVersion: "0",
      templateVersion: SALE_RAYX_SHARE_TEMPLATE_VERSION,
      variant: "sale",
      renderModel: opts.renderModel,
    },
    format: "png",
  });
}

/**
 * Copia texto + imagem PNG (WhatsApp e apps que colam imagem do clipboard).
 * @param {{
 *   summaryText: string;
 *   renderModel: import("./saleRayxSummaryRender.js").SaleRayxSummaryRenderModel;
 *   shareInput?: import("../../shared/renderers/saleRayx/SaleRayXShareRenderer.js").SaleRayXShareInput;
 * }} payload
 */
export async function copySaleRayxSummaryRich(payload) {
  const summaryText = payload.summaryText ?? "";
  if (payload.shareInput) {
    const { copySaleRayxShare } = await import("../../shared/renderers/saleRayx/SaleRayXCopyAdapter.js");
    return copySaleRayxShare(payload.shareInput);
  }

  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    await navigator.clipboard.writeText(summaryText);
    return "text";
  }

  try {
    const pngBlob = await buildSaleRayxSummaryPngBlob({ renderModel: payload.renderModel });
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": pngBlob,
        "text/plain": new Blob([summaryText], { type: "text/plain" }),
      }),
    ]);
    return "image";
  } catch {
    await navigator.clipboard.writeText(summaryText);
    return "text";
  }
}
