// =============================================================================
// Adapter — WhatsApp (imagem + legenda curta via motor central)
// =============================================================================

import { postSaleRayxManualNotification } from "../../../services/saleRayxManualNotifyApi.js";
import {
  blobToBase64DataUri,
  generateSaleRayxShareImage,
  type SaleRayXShareInput,
} from "./SaleRayXShareRenderer.js";

export type WhatsappShareTarget = {
  recipientId?: string | null;
  recipientPhone: string;
};

export type SendSaleRayxWhatsAppShareInput = SaleRayXShareInput & {
  recipientTargets: WhatsappShareTarget[];
  useSmokeDestination?: boolean;
};

export type SendSaleRayxWhatsAppShareResult = {
  ok: boolean;
  cacheKey: string;
  cacheHit: boolean;
  caption: string;
  apiResponse: Awaited<ReturnType<typeof postSaleRayxManualNotification>>;
};

/**
 * Gera imagem (cache) e envia via POST manual sale-rayx com share_image_base64.
 */
export async function sendSaleRayxWhatsAppShare(
  input: SendSaleRayxWhatsAppShareInput,
): Promise<SendSaleRayxWhatsAppShareResult> {
  const { recipientTargets, useSmokeDestination, ...shareInput } = input;

  const generated = await generateSaleRayxShareImage(shareInput, "whatsapp");
  const dataUri = await blobToBase64DataUri(generated.blob);
  const base64Payload = dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;

  const apiResponse = await postSaleRayxManualNotification({
    saleId: String(input.saleId),
    channel: "whatsapp",
    recipientTargets,
    useSmokeDestination,
    shareImageBase64: base64Payload,
    shareCaption: generated.caption,
    deliveryFormat: "image",
    shareCacheKey: generated.cacheKey,
  });

  return {
    ok: apiResponse.ok === true,
    cacheKey: generated.cacheKey,
    cacheHit: generated.cacheHit,
    caption: generated.caption,
    apiResponse,
  };
}
