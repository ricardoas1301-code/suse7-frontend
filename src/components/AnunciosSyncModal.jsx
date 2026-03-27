// ======================================================================
// Modal bloqueante — sincronização completa Anúncios (ML)
// Spinner + mensagens amigáveis; texto da etapa atual (anúncios / vendas / tela).
// Visual alinhado ao S7FormSavingOverlay (borda laranja suave, card branco).
// ======================================================================

import { createPortal } from "react-dom";

/** @param {{ open: boolean; phase: "idle" | "listings" | "sales" | "reload" }} props */
export default function AnunciosSyncModal({ open, phase }) {
  if (!open || typeof document === "undefined") return null;

  const stepLabel =
    phase === "sales"
      ? "Sincronizando vendas…"
      : phase === "reload"
        ? "Atualizando dados da tela…"
        : "Sincronizando anúncios…";

  const node = (
    <div
      className="anuncios-sync-modal"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="anuncios-sync-modal-title"
    >
      <div className="anuncios-sync-modal__backdrop" aria-hidden />
      <div className="anuncios-sync-modal__card">
        <h2 id="anuncios-sync-modal-title" className="anuncios-sync-modal__title">
          Sincronizando dados
        </h2>
        <div className="anuncios-sync-modal__spinner" aria-hidden />
        <p className="anuncios-sync-modal__lead">Aguarde, este processo pode demorar um pouco.</p>
        <p className="anuncios-sync-modal__secondary">
          Estamos atualizando anúncios, vendas e métricas da sua conta.
        </p>
        <p className="anuncios-sync-modal__step" role="status">
          {stepLabel}
        </p>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
