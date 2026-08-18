// ======================================================================
// Canal WhatsApp do Relatório de Concorrência — motor central (imagem + Excel).
// Mesma filosofia homologada do Relatório de Vendas — sem texto detalhado.
// ======================================================================

import { postConcorrenciaReportManualNotification } from "../../../../services/competitionReportManualNotifyApi.js";
import { buildConcorrenciaReportShareAssets } from "./buildConcorrenciaReportShareAssets.js";

/**
 * @typedef {{ recipientId?: string | null; recipientPhone?: string; label?: string }} WhatsAppTarget
 */

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @param {{ targets?: WhatsAppTarget[] }} [options]
 */
export async function shareConcorrenciaReportWhatsApp(payload, options = {}) {
  if (!payload) {
    return { ok: false, error: "PAYLOAD_MISSING" };
  }

  const assets = await buildConcorrenciaReportShareAssets(payload);
  if (!assets) {
    return { ok: false, error: "ASSETS_BUILD_FAILED" };
  }

  const targets = Array.isArray(options.targets) ? options.targets : [];

  return postConcorrenciaReportManualNotification({
    reportKey: assets.reportKey,
    channel: "whatsapp",
    recipientTargets: targets.map((t) => ({
      recipientId: t.recipientId ?? null,
      recipientPhone: t.recipientPhone,
    })),
    templatePayload: assets.templatePayload,
    shareImageBase64: assets.imageBase64,
    shareDocumentBase64: assets.documentBase64,
    shareDocumentFilename: assets.documentFilename,
    shareDocumentMimeType: assets.documentMimeType,
    deliveryFormat: "image",
  });
}
