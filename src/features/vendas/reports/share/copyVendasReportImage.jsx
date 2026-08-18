// ======================================================================
// Cópia VISUAL do Relatório de Vendas (P_2.8.12F.C — botão Copiar).
//
// Renderiza o componente visual único (VendasExecutiveShareCard) num nó
// oculto, captura como imagem (html-to-image) e copia para a área de
// transferência via ClipboardItem. O mesmo render será reutilizado por
// WhatsApp / Imprimir-PDF / compartilhamento por imagem — sem render por canal.
// ======================================================================

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { toBlob } from "html-to-image";
import VendasExecutiveShareCard from "./renderVendasExecutiveShareImage.jsx";

/**
 * Indica se o navegador suporta copiar imagem para o clipboard.
 * @returns {boolean}
 */
export function isImageClipboardSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.ClipboardItem !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.clipboard != null &&
    typeof navigator.clipboard.write === "function"
  );
}

/**
 * Renderiza o card visual num host oculto e devolve a imagem como Blob PNG.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<Blob | null>}
 */
export async function buildVendasReportImageBlob(payload) {
  if (!payload || typeof document === "undefined") return null;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.width = "auto";
  host.style.pointerEvents = "none";
  host.style.background = "#ffffff";
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(<VendasExecutiveShareCard payload={payload} />);
    });

    // Pequeno respiro para o layout/imagem (logo) estabilizarem antes da captura.
    await new Promise((resolve) => setTimeout(resolve, 80));

    const target = host.firstElementChild ?? host;
    const blob = await toBlob(target, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    return blob;
  } finally {
    root.unmount();
    host.remove();
  }
}

/**
 * Copia a imagem visual do relatório para o clipboard.
 *
 * @param {import("./buildVendasSharePayload.js").VendasSharePayload | null | undefined} payload
 * @returns {Promise<boolean>} true quando a imagem foi copiada com sucesso.
 */
export async function copyVendasReportImageToClipboard(payload) {
  if (!isImageClipboardSupported()) return false;

  const blob = await buildVendasReportImageBlob(payload);
  if (!blob) return false;

  const type = blob.type || "image/png";
  await navigator.clipboard.write([new window.ClipboardItem({ [type]: blob })]);
  return true;
}
