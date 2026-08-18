// ======================================================================
// Canal E-mail do Relatório de Vendas — motor central (imagem + Excel).
// Reutiliza buildVendasReportShareAssets (mesma fonte do WhatsApp).
// ======================================================================

import { postVendasReportManualNotification } from "../../../../services/vendasReportManualNotifyApi.js";
import { buildVendasReportKey } from "./buildVendasReportNotifyInput.js";
import { buildVendasReportShareAssets } from "./buildVendasReportShareAssets.js";

/**
 * @typedef {{ recipientId?: string | null; recipientEmail: string; label?: string }} EmailTarget
 */

/**
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @param {{ targets?: EmailTarget[] }} [options]
 */
export async function shareVendasReportEmail(payload, options = {}) {
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
    channel: "email",
    recipientTargets: targets.map((t) => ({
      recipientId: t.recipientId ?? null,
      recipientEmail: t.recipientEmail,
      recipientName: t.label ?? null,
    })),
    templatePayload: assets.templatePayload,
    shareImageBase64: assets.imageBase64,
    shareImageFilename: assets.imageFilename,
    shareDocumentBase64: assets.documentBase64,
    shareDocumentFilename: assets.documentFilename,
    shareDocumentMimeType: assets.documentMimeType,
    deliveryFormat: "image",
  });
}
