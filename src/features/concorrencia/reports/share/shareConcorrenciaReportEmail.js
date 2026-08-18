// ======================================================================
// Canal E-mail do Relatório de Concorrência — motor central (imagem + Excel).
// Mesma filosofia homologada no WhatsApp — sem texto detalhado.
// ======================================================================

import { postConcorrenciaReportManualNotification } from "../../../../services/competitionReportManualNotifyApi.js";
import { buildConcorrenciaReportShareAssets } from "./buildConcorrenciaReportShareAssets.js";

/**
 * @typedef {{ recipientId?: string | null; recipientEmail: string; label?: string }} EmailTarget
 */

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @param {{ targets?: EmailTarget[] }} [options]
 */
export async function shareConcorrenciaReportEmail(payload, options = {}) {
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
    channel: "email",
    recipientTargets: targets.map((t) => ({
      recipientId: t.recipientId ?? null,
      recipientEmail: t.recipientEmail,
      recipientName: t.label ?? null,
    })),
    templatePayload: assets.templatePayload,
    shareImageBase64: assets.imageBase64,
    shareDocumentBase64: assets.documentBase64,
    shareDocumentFilename: assets.documentFilename,
    shareDocumentMimeType: assets.documentMimeType,
    deliveryFormat: "image",
  });
}
