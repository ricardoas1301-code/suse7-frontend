// =============================================================================
// Adapter — E-mail (imagem premium do renderer + motor central)
// =============================================================================

import {
  buildSaleRayxSummaryBody,
} from "../../../components/sales/saleRayxSummary.js";
import { postSaleRayxManualNotification } from "../../../services/saleRayxManualNotifyApi.js";
import {
  blobToBase64DataUri,
  generateSaleRayxShareImage,
  type SaleRayXShareInput,
} from "./SaleRayXShareRenderer.js";

export type EmailShareTarget = {
  recipientId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
};

export type SendSaleRayxEmailShareInput = SaleRayXShareInput & {
  recipientTargets: EmailShareTarget[];
};

export type SendSaleRayxEmailShareResult = {
  ok: boolean;
  cacheKey: string;
  cacheHit: boolean;
  plainTextFallback: string;
  apiResponses: Awaited<ReturnType<typeof postSaleRayxManualNotification>>[];
};

/**
 * Gera imagem premium (mesmo renderer do WhatsApp/Imprimir) e envia via motor central.
 */
export async function sendSaleRayxEmailShare(
  input: SendSaleRayxEmailShareInput,
): Promise<SendSaleRayxEmailShareResult> {
  const { recipientTargets, ...shareInput } = input;

  const generated = await generateSaleRayxShareImage(shareInput, "email");
  const dataUri = await blobToBase64DataUri(generated.blob);
  const base64Payload = dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
  const summaryText = buildSaleRayxSummaryBody(shareInput).join("\n");

  const apiResponses = await Promise.all(
    recipientTargets.map((target) =>
      postSaleRayxManualNotification({
        saleId: String(input.saleId),
        channel: "email",
        recipientEmail: target.recipientEmail,
        recipientId: target.recipientId ?? undefined,
        recipientName: target.recipientName ?? undefined,
        shareImageBase64: base64Payload,
        shareCaption: generated.caption,
        deliveryFormat: "image",
        shareCacheKey: generated.cacheKey,
        shareTextFallback: summaryText,
      }),
    ),
  );

  return {
    ok: apiResponses.every((res) => res.ok && res.data?.success === true),
    cacheKey: generated.cacheKey,
    cacheHit: generated.cacheHit,
    plainTextFallback: summaryText,
    apiResponses,
  };
}
