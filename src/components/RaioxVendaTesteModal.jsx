// ======================================================
// Raio-x teste — lista espelhada da grid ML: GET /seller-promotions/items (via backend).
// Campos: nome, status (ATIVA/PROGRAMADA/DISPONÍVEL), vigência. Sem preço/cenário financeiro.
// ======================================================

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { buildApiUrl, apiFetch } from "../config/api";

/**
 * @typedef {{
 *   promotion_id: string;
 *   promotion_name: string;
 *   status: string;
 *   starts_at: string | null;
 *   ends_at: string | null;
 *   vigencia_text: string;
 * }} SellerPromoGridRow
 */

/**
 * @param {unknown[]} rows
 * @returns {SellerPromoGridRow[]}
 */
function asGridRows(rows) {
  if (!Array.isArray(rows)) return [];
  /** @type {SellerPromoGridRow[]} */
  const out = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = /** @type {Record<string, unknown>} */ (r);
    out.push({
      promotion_id: o.promotion_id != null ? String(o.promotion_id) : "",
      promotion_name: o.promotion_name != null ? String(o.promotion_name) : "",
      status: o.status != null ? String(o.status) : "",
      starts_at: o.starts_at != null ? String(o.starts_at) : null,
      ends_at: o.ends_at != null ? String(o.ends_at) : null,
      vigencia_text: o.vigencia_text != null ? String(o.vigencia_text) : "",
    });
  }
  return out;
}

/**
 * @param {{ open: boolean; onClose: () => void; listingExternalId: string | null | undefined; marketplaceRaw: string | null | undefined; productTitle?: string | null }} props
 */
export function RaioxVendaTesteModal({ open, onClose, listingExternalId, marketplaceRaw, productTitle }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [source, setSource] = useState(/** @type {string | null} */ (null));
  const [itemId, setItemId] = useState(/** @type {string | null} */ (null));
  const [rows, setRows] = useState(/** @type {SellerPromoGridRow[]} */ ([]));

  useEffect(() => {
    if (!open) {
      setError(null);
      setRows([]);
      setSource(null);
      setItemId(null);
      setLoading(false);
      return;
    }
    if (marketplaceRaw !== "mercado_livre" || !listingExternalId || String(listingExternalId).trim() === "") {
      setError("Anúncio sem ID do Mercado Livre.");
      setRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setRows([]);
      setSource(null);
      setItemId(null);
      try {
        const url = buildApiUrl("/api/ml/listings/seller-promotions-grid");
        if (!url) {
          if (!cancelled) setError("API não configurada (VITE_API_BASE_URL).");
          return;
        }
        const result = await apiFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingExternalId: String(listingExternalId).trim() }),
        });
        const data = /** @type {Record<string, unknown> | undefined} */ (result.data);
        if (!result.ok) {
          if (!cancelled) {
            setError(result.error != null ? String(result.error) : "Falha ao carregar promoções da grid.");
          }
          return;
        }
        if (!data || data.ok !== true) {
          if (!cancelled) {
            setError(data?.error != null ? String(data.error) : "Resposta inválida da API.");
          }
          return;
        }
        if (import.meta.env.DEV) {
          console.info("[RaioxVendaTesteModal] seller_promotions_grid_response", data);
        }
        if (!cancelled) {
          setSource(data.source != null ? String(data.source) : null);
          setItemId(data.item_id != null ? String(data.item_id) : null);
          setRows(asGridRows(Array.isArray(data.rows) ? data.rows : []));
        }
      } catch {
        if (!cancelled) setError("Erro de rede ao carregar promoções.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, listingExternalId, marketplaceRaw]);

  const title = productTitle != null && String(productTitle).trim() !== "" ? String(productTitle).trim() : "Raio-x teste";

  const content = useMemo(() => {
    if (loading) {
      return <p className="anuncios-raiox-teste__muted">Carregando…</p>;
    }
    if (error) {
      return (
        <p className="anuncios-raiox-teste__warn" role="alert">
          {error}
        </p>
      );
    }
    if (rows.length === 0) {
      return (
        <p className="anuncios-raiox-teste__muted" role="status">
          Nenhuma linha retornada por <strong>seller-promotions/items</strong> para este anúncio (mesma fonte da grid
          ML).
        </p>
      );
    }
    return (
      <div className="anuncios-raiox-teste__table-wrap">
        <table className="anuncios-raiox-teste__table">
          <thead>
            <tr>
              <th>Promoção</th>
              <th>Status</th>
              <th>Vigência</th>
              <th className="anuncios-raiox-teste__col-id">promotion_id</th>
              <th className="anuncios-raiox-teste__col-dates">starts_at</th>
              <th className="anuncios-raiox-teste__col-dates">ends_at</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.promotion_id}:${idx}`}>
                <td className="anuncios-raiox-teste__td-name">{r.promotion_name || "—"}</td>
                <td>
                  <span className="anuncios-raiox-teste__status">{r.status || "—"}</span>
                </td>
                <td className="anuncios-raiox-teste__td-vig">{r.vigencia_text || "—"}</td>
                <td className="anuncios-raiox-teste__col-id">{r.promotion_id || "—"}</td>
                <td className="anuncios-raiox-teste__col-dates">{r.starts_at ?? "—"}</td>
                <td className="anuncios-raiox-teste__col-dates">{r.ends_at ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [loading, error, rows]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="anuncios-raiox-teste__backdrop" aria-hidden onClick={onClose} />
      <div className="anuncios-raiox-teste__modal" role="dialog" aria-modal="true" aria-labelledby="raiox-teste-title">
        <div className="anuncios-raiox-teste__head">
          <h2 id="raiox-teste-title" className="anuncios-raiox-teste__title">
            Raio-x teste
          </h2>
          <button type="button" className="anuncios-raiox-teste__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <p className="anuncios-raiox-teste__subtitle">{title}</p>
        <p className="anuncios-raiox-teste__hint">
          Fonte: <strong>GET /seller-promotions/items</strong> (app_version=v2). O array bruto inclui ofertas só
          disponíveis (status <em>candidate</em>); aqui mostramos só linhas em
          que você <strong>participa</strong> (como na grid ao gerir o anúncio), com <code>promotion_id</code>{" "}
          P-MLB…
        </p>
        {source || itemId ? (
          <p className="anuncios-raiox-teste__meta">
            {itemId ? (
              <>
                item_id: <code>{itemId}</code>
              </>
            ) : null}
            {source && itemId ? " · " : null}
            {source ? <span>{source}</span> : null}
          </p>
        ) : null}
        <div className="anuncios-raiox-teste__body">{content}</div>
      </div>
    </>,
    document.body,
  );
}
