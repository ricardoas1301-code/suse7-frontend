// =============================================================================
// API — acionamento manual Relatório de Concorrência (WhatsApp via motor central)
// Espelha vendasReportManualNotifyApi.js
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
 *   templatePayload: Record<string, string>;
 *   shareCaption?: string;
 *   shareTextFallback?: string;
 *   shareImageBase64?: string;
 *   shareDocumentBase64?: string;
 *   shareDocumentFilename?: string;
 *   shareDocumentMimeType?: string;
 *   deliveryFormat?: "text" | "image";
 * }} input
 */
export async function postConcorrenciaReportManualNotification(input) {
  const url = buildApiUrl("/api/notifications/manual/competition-report");
  if (!url) {
    return { ok: false, error: "API não configurada" };
  }

  if (import.meta.env.DEV) {
    console.info("[S7 Relatório Concorrência manual] POST", url, {
      report_key: input.reportKey,
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
      share_text_fallback: input.shareTextFallback,
      share_image_base64: input.shareImageBase64,
      share_document_base64: input.shareDocumentBase64,
      share_document_filename: input.shareDocumentFilename,
      share_document_mime_type: input.shareDocumentMimeType,
      delivery_format: input.deliveryFormat ?? "text",
    }),
  });
}
