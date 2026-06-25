// ======================================================================
// Anexos reutilizáveis do Relatório de Vendas (WhatsApp, E-mail futuro).
// Gera imagem + Excel em memória — sem download no navegador.
// ======================================================================

import { buildVendasReportImageBlob } from "./copyVendasReportImage.jsx";
import {
  buildVendasReportXlsxBlob,
  resolveVendasReportBaseName,
} from "./buildVendasReportXlsx.js";
import { buildVendasReportTemplatePayload } from "./buildVendasReportNotifyInput.js";

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
async function blobToBase64Payload(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Monta anexos do relatório (PNG + XLSX) para canais que enviam arquivos.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 */
export async function buildVendasReportShareAssets(payload) {
  if (!payload) return null;

  let imageBlob = null;
  let xlsx = null;

  try {
    imageBlob = await buildVendasReportImageBlob(payload);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[S7 Relatório Vendas] Falha ao gerar imagem:", err);
    }
  }

  try {
    xlsx = await buildVendasReportXlsxBlob(payload);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[S7 Relatório Vendas] Falha ao gerar Excel:", err);
    }
  }

  if (!imageBlob || !xlsx?.blob) return null;

  const baseName = resolveVendasReportBaseName(payload);
  const [imageBase64, documentBase64] = await Promise.all([
    blobToBase64Payload(imageBlob),
    blobToBase64Payload(xlsx.blob),
  ]);

  return {
    imageBase64,
    imageFilename: `${baseName}.png`,
    documentBase64,
    documentFilename: xlsx.filename || `${baseName}.xlsx`,
    documentMimeType: xlsx.blob.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    templatePayload: buildVendasReportTemplatePayload(payload),
  };
}
