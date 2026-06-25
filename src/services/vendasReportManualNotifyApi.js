// =============================================================================

// API — acionamento manual Relatório de Vendas (WhatsApp + E-mail via motor central)

// =============================================================================



import { buildApiUrl, apiFetch } from "../config/api";



/**

 * @param {{

 *   reportKey: string;

 *   channel: "whatsapp" | "email";

 *   recipientTargets?: Array<{

 *     recipientId?: string | null;

 *     recipientPhone?: string;

 *     recipientEmail?: string;

 *     recipientName?: string | null;

 *   }>;

 *   templatePayload: {

 *     periodo: string;

 *     conta: string;

 *     vendas: string;

 *     faturamento: string;

 *     lucro: string;

 *     margem: string;

 *   };

 *   shareCaption?: string;

 *   shareImageBase64?: string;

 *   shareImageFilename?: string;

 *   shareDocumentBase64?: string;

 *   shareDocumentFilename?: string;

 *   shareDocumentMimeType?: string;

 *   deliveryFormat?: "image" | "text";

 * }} input

 */

export async function postVendasReportManualNotification(input) {

  const url = buildApiUrl("/api/notifications/manual/sales-report");

  if (!url) {

    return { ok: false, error: "API não configurada" };

  }



  if (import.meta.env.DEV) {

    console.info("[S7 Relatório Vendas manual] POST", url, {

      report_key: input.reportKey,

      channel: input.channel,

      targets: input.recipientTargets?.length ?? 0,

    });

  }



  return apiFetch(url, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    timeoutMs: 120_000,

    body: JSON.stringify({

      report_key: input.reportKey,

      channel: input.channel,

      recipient_targets:

        Array.isArray(input.recipientTargets) && input.recipientTargets.length > 0

          ? input.recipientTargets.map((t) => ({

              recipient_id: t.recipientId ?? null,

              recipient_phone: t.recipientPhone,

              recipient_email: t.recipientEmail,

              recipient_name: t.recipientName ?? null,

            }))

          : undefined,

      template_payload: input.templatePayload,

      share_caption: input.shareCaption,

      share_image_base64: input.shareImageBase64,

      share_image_filename: input.shareImageFilename,

      share_document_base64: input.shareDocumentBase64,

      share_document_filename: input.shareDocumentFilename,

      share_document_mime_type: input.shareDocumentMimeType,

      delivery_format: input.deliveryFormat,

    }),

  });

}

