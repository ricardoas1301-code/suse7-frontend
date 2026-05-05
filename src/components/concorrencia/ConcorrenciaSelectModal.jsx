// ======================================================
// Modal — seleção de até 4 concorrentes (descoberta ML + persistência)
// Lista premium: miniatura, título, preço, seller, reputação, frete, link ML.
// ======================================================

import { useState } from "react";
import S7Button from "../ui/S7Button";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";

const MAX = 4;

/**
 * @param {unknown} p
 */
function formatBrlFromCandidate(p) {
  if (p == null || p === "") return "—";
  const x = Number(String(p).replace(",", "."));
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @param {{
 *   onClose: () => void;
 *   candidates: Record<string, unknown>[];
 *   selectedIds: string[];
 *   onSave: (ids: string[]) => Promise<boolean>;
 *   busy?: boolean;
 * }} props
 */
function ConcorrenciaSelectModalBody({ onClose, candidates, selectedIds, onSave, busy }) {
  const { addNotification } = useNotifications();
  const [local, setLocal] = useState(() => [...selectedIds]);

  const toggle = (id) => {
    const sid = String(id);
    setLocal((prev) => {
      if (prev.includes(sid)) return prev.filter((x) => x !== sid);
      if (prev.length >= MAX) {
        addNotification({
          event_type: "GENERIC",
          entity_type: "listing",
          entity_id: null,
          title: "Concorrência",
          message: "Você pode selecionar até 4 concorrentes.",
          severity: NOTIFICATION_SEVERITY.WARNING,
        });
        return prev;
      }
      return [...prev, sid];
    });
  };

  return (
    <div className="s7-concorrencia-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="s7-concorrencia-modal s7-concorrencia-modal--pick"
        role="dialog"
        aria-modal="true"
        aria-label="Selecionar concorrentes"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="s7-concorrencia-modal__head">
          <h2>Selecionar concorrentes</h2>
          <button type="button" className="s7-concorrencia-modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <p className="s7-concorrencia-modal__hint">
          Escolha até 4 anúncios para monitorar contra o seu produto. Os dados são persistidos no Suse7 após confirmar.
        </p>
        {candidates.length === 0 ? (
          <p className="s7-concorrencia-modal__empty">Nenhum concorrente relevante encontrado para este anúncio.</p>
        ) : (
          <ul className="s7-concorrencia-modal__pick-list">
            {candidates.map((c) => {
              const id = String(c.competitor_listing_id ?? "");
              const checked = local.includes(id);
              const disabledCheckbox = !checked && local.length >= MAX;
              const thumb = c.competitor_thumbnail != null ? String(c.competitor_thumbnail) : "";
              const seller =
                c.competitor_seller_nickname != null && String(c.competitor_seller_nickname).trim() !== ""
                  ? String(c.competitor_seller_nickname).trim()
                  : c.competitor_seller_id != null
                    ? `ID ${String(c.competitor_seller_id)}`
                    : "—";
              const rep = c.competitor_reputation != null ? String(c.competitor_reputation) : "—";
              const free = c.free_shipping === true;
              const shipMode = c.shipping_mode != null ? String(c.shipping_mode) : "";
              const shipLabel = free ? "Frete grátis" : shipMode ? shipMode : "—";
              const link = c.competitor_permalink != null ? String(c.competitor_permalink) : "";

              return (
                <li key={id} className="s7-concorrencia-modal__pick-item">
                  <label className="s7-concorrencia-modal__pick-row">
                    <input
                      type="checkbox"
                      className="s7-concorrencia-modal__pick-check"
                      checked={checked}
                      onChange={() => toggle(id)}
                      disabled={busy || disabledCheckbox}
                    />
                    <span className="s7-concorrencia-modal__pick-thumb-wrap">
                      {thumb ? (
                        <img src={thumb} alt="" className="s7-concorrencia-modal__pick-thumb" loading="lazy" />
                      ) : (
                        <span className="s7-concorrencia-modal__pick-thumb s7-concorrencia-modal__pick-thumb--ph" aria-hidden />
                      )}
                    </span>
                    <span className="s7-concorrencia-modal__pick-main">
                      <span className="s7-concorrencia-modal__pick-title">{c.competitor_title || id}</span>
                      <span className="s7-concorrencia-modal__pick-meta">
                        <strong>{formatBrlFromCandidate(c.competitor_price)}</strong>
                        <span className="s7-concorrencia-modal__pick-dot" aria-hidden>
                          ·
                        </span>
                        <span>{seller}</span>
                        <span className="s7-concorrencia-modal__pick-dot" aria-hidden>
                          ·
                        </span>
                        <span>Rep.: {rep}</span>
                        <span className="s7-concorrencia-modal__pick-dot" aria-hidden>
                          ·
                        </span>
                        <span>{shipLabel}</span>
                      </span>
                      {link ? (
                        <a className="s7-concorrencia-modal__pick-link" href={link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          Abrir no Mercado Livre
                        </a>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <footer className="s7-concorrencia-modal__foot">
          <S7Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </S7Button>
          <S7Button
            type="button"
            variant="primary"
            loading={busy}
            disabled={candidates.length === 0}
            onClick={async () => {
              const ok = await onSave(local);
              if (ok) onClose();
            }}
          >
            Salvar concorrentes
          </S7Button>
        </footer>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   candidates: Record<string, unknown>[];
 *   selectedIds: string[];
 *   onSave: (ids: string[]) => Promise<boolean>;
 *   busy?: boolean;
 * }} props
 */
export default function ConcorrenciaSelectModal({ open, onClose, candidates, selectedIds, onSave, busy }) {
  if (!open) return null;
  const key = `${selectedIds.join("\0")}|${candidates.map((c) => String(c.competitor_listing_id ?? "")).join(",")}`;
  return (
    <ConcorrenciaSelectModalBody
      key={key}
      onClose={onClose}
      candidates={candidates}
      selectedIds={selectedIds}
      onSave={onSave}
      busy={busy}
    />
  );
}
