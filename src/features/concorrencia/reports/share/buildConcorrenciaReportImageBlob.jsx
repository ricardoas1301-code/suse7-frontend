// ======================================================================
// Captura visual do card executivo — Relatório de Concorrência.
//
// Renderiza ConcorrenciaExecutiveShareCard num nó oculto e devolve PNG.
// Reutilizado por Imprimir/PDF e, futuramente, Copiar imagem / WhatsApp.
// ======================================================================

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { toBlob } from "html-to-image";
import ConcorrenciaExecutiveShareCard from "./renderConcorrenciaExecutiveShareCard.jsx";

/**
 * @param {import("./buildConcorrenciaSharePayload.js").ReturnType<typeof import("./buildConcorrenciaSharePayload.js").buildConcorrenciaSharePayload> | null | undefined} payload
 * @returns {Promise<Blob | null>}
 */
export async function buildConcorrenciaReportImageBlob(payload) {
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
      root.render(<ConcorrenciaExecutiveShareCard payload={payload} />);
    });

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
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export async function concorrenciaReportBlobToDataUrl(blob) {
  if (!blob || typeof FileReader === "undefined") return "";
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(blob);
  });
}
