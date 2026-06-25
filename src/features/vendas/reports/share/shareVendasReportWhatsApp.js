// ======================================================================
// Canal WhatsApp do Relatório de Vendas — motor central (imagem + Excel).
// Sem window.open, wa.me, download ou Web Share API.
// ======================================================================

import { postVendasReportManualNotification } from "../../../../services/vendasReportManualNotifyApi.js";
import { buildVendasReportKey } from "./buildVendasReportNotifyInput.js";
import { buildVendasReportShareAssets } from "./buildVendasReportShareAssets.js";

/**
 * @typedef {{ recipientId?: string | null; recipientPhone?: string; label?: string }} WhatsAppTarget
 */

/**
 * Envia relatório visual + Excel via motor central WhatsApp.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @param {{ targets?: WhatsAppTarget[] }} [options]
 */
export async function shareVendasReportWhatsApp(payload, options = {}) {
  if (!payload) {
    return { ok: false, error: "PAYLOAD_MISSING" };
  }

  const assets = await buildVendasReportShareAssets(payload);
  if (!assets) {
    return { ok: false, error: "ASSETS_BUILD_FAILED" };
  }

  const targets = Array.isArray(options.targets) ? options.targets : [];

  return postVendasReportManualNotification({
    reportKey: buildVendasReportKey(payload),
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
