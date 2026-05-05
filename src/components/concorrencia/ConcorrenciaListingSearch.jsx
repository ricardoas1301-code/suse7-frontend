// ======================================================
// Busca de anúncio monitorado — Concorrência S7
// Campo tipo catálogo (S7Input + ícone); sugestões só após digitação.
// Sem dropdown inicial com todos os itens.
// ======================================================

import { useEffect, useMemo, useRef, useState } from "react";
import S7Input from "../ui/S7Input";
import S7Icon from "../ui/S7Icon";

const PLACEHOLDER = "Buscar anúncio por título, SKU ou MLB...";
const MAX_SUGGESTIONS = 12;

/**
 * @param {Record<string, unknown>} row
 * @param {string} q
 */
function rowMatches(row, q) {
  const t = String(q || "").trim().toLowerCase();
  if (!t) return false;
  const title = String(row.title || "").toLowerCase();
  const ext = String(row.external_listing_id || "").toLowerCase();
  const id = String(row.id || "").toLowerCase();
  const sku = String(row.sku || "").toLowerCase();
  return title.includes(t) || ext.includes(t) || id.includes(t) || (sku && sku.includes(t));
}

/**
 * @param {{
 *   listings: Record<string, unknown>[];
 *   listingId: string;
 *   onListingIdChange: (id: string) => void;
 *   disabled?: boolean;
 * }} props
 */
export default function ConcorrenciaListingSearch({ listings, listingId, onListingIdChange, disabled = false }) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = useMemo(() => {
    if (!listingId) return null;
    return listings.find((l) => String(l.id) === String(listingId)) ?? null;
  }, [listings, listingId]);

  const displayValue = selected ? String(selected.title || "").trim() || String(selected.id) : draft;

  const suggestions = useMemo(() => {
    if (listingId) return [];
    const q = draft.trim();
    if (!q) return [];
    return listings.filter((row) => rowMatches(row, q)).slice(0, MAX_SUGGESTIONS);
  }, [listings, draft, listingId]);

  const panelVisible = Boolean(open && !listingId && draft.trim() !== "");

  useEffect(() => {
    const onDoc = (e) => {
      const el = rootRef.current;
      if (!el || !(e.target instanceof Node) || el.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (id) => {
    onListingIdChange(String(id));
    setDraft("");
    setOpen(false);
  };

  const clear = () => {
    onListingIdChange("");
    setDraft("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="concorrencia-listing-search">
      <div className="products-catalog__search-field concorrencia-listing-search__field">
        <span className="products-catalog__search-icon" aria-hidden>
          <S7Icon name="search" size={18} strokeWidth={1.85} />
        </span>
        <S7Input
          label=""
          name="concorrencia-listing-search"
          value={displayValue}
          onChange={(e) => {
            if (listingId) return;
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!listingId && draft.trim() !== "") setOpen(true);
          }}
          placeholder={PLACEHOLDER}
          disabled={disabled}
          readOnly={Boolean(listingId)}
          className="products-catalog__search-s7 concorrencia-listing-search__input-wrap"
          inputClassName="products-catalog__search-input-field concorrencia-listing-search__input"
          autoComplete="off"
          aria-label={PLACEHOLDER}
          aria-expanded={panelVisible}
          aria-controls="concorrencia-listing-search-panel"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          rightElement={
            listingId ? (
              <button
                type="button"
                className="products-catalog__search-clear"
                onClick={(ev) => {
                  ev.preventDefault();
                  clear();
                }}
                aria-label="Limpar anúncio selecionado"
              >
                <S7Icon name="close" size={16} strokeWidth={2} />
              </button>
            ) : null
          }
        />
      </div>

      {panelVisible ? (
        <div id="concorrencia-listing-search-panel" className="concorrencia-listing-search__panel" role="listbox">
          {listings.length === 0 ? (
            <div className="concorrencia-listing-search__empty" role="status">
              Nenhum anúncio ML disponível para este usuário ainda.
            </div>
          ) : suggestions.length === 0 ? (
            <div className="concorrencia-listing-search__empty" role="option">
              Nenhum anúncio encontrado para &quot;{draft.trim()}&quot;.
            </div>
          ) : (
            suggestions.map((row) => {
              const id = String(row.id ?? "");
              const title = String(row.title || "").trim() || id;
              const ext = row.external_listing_id != null ? String(row.external_listing_id) : "";
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  className="concorrencia-listing-search__option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(id)}
                >
                  <span className="concorrencia-listing-search__option-title">{title}</span>
                  {ext ? <span className="concorrencia-listing-search__option-meta">{ext}</span> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}

      {listingId ? (
        <p className="concorrencia-listing-search__hint">Anúncio ativo para monitoramento. Limpe para buscar outro.</p>
      ) : null}
    </div>
  );
}
