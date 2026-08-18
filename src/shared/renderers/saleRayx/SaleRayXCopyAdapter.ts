// =============================================================================
// Adapter — Copiar (somente imagem)
// =============================================================================

import {
  generateSaleRayxShareImage,
  type SaleRayXShareInput,
} from "./SaleRayXShareRenderer.js";

export type CopyShareResult = "image";

export async function copySaleRayxShare(input: SaleRayXShareInput): Promise<CopyShareResult> {
  const { blob } = await generateSaleRayxShareImage(input, "copy");

  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Clipboard de imagem indisponível");
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": blob,
    }),
  ]);
  return "image";
}
