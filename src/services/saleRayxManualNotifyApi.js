// =============================================================================

// API — acionamento manual Raio-X (WhatsApp / E-mail via motor central)

// =============================================================================



import { buildApiUrl, apiFetch } from "../config/api";



/**

 * @param {{

 *   saleId: string;

 *   channel: "whatsapp" | "email";

 *   recipientPhone?: string;

 *   recipientEmail?: string;

 *   recipientId?: string;

 *   recipientName?: string;

 *   recipientTargets?: Array<{ recipientId?: string | null; recipientPhone: string }>;

 *   useSmokeDestination?: boolean;

 *   shareImageBase64?: string;

 *   shareCaption?: string;

 *   deliveryFormat?: "image" | "text";

 *   shareCacheKey?: string;
 *   shareTextFallback?: string;
 * }} input

 */

export async function postSaleRayxManualNotification(input) {

  const url = buildApiUrl("/api/notifications/manual/sale-rayx");

  if (!url) {

    return { ok: false, error: "API não configurada" };

  }



  if (import.meta.env.DEV) {

    console.info("[S7 Raio-X manual] POST", url, {

      delivery_format: input.deliveryFormat ?? "text",

      share_cache_key: input.shareCacheKey ?? null,

      has_image: Boolean(input.shareImageBase64),

    });

  }



  return apiFetch(url, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({

      sale_id: input.saleId,

      channel: input.channel,

      recipient_phone: input.recipientPhone,

      recipient_email: input.recipientEmail,

      recipient_id: input.recipientId,

      recipient_name: input.recipientName,

      recipient_targets:

        Array.isArray(input.recipientTargets) && input.recipientTargets.length > 0

          ? input.recipientTargets.map((t) => ({

              recipient_id: t.recipientId ?? null,

              recipient_phone: t.recipientPhone,

            }))

          : undefined,

      use_smoke_destination: input.useSmokeDestination === true ? true : undefined,

      share_image_base64: input.shareImageBase64,

      share_caption: input.shareCaption,

      delivery_format: input.deliveryFormat,

      share_cache_key: input.shareCacheKey,
      share_text_fallback: input.shareTextFallback,

    }),

  });

}

