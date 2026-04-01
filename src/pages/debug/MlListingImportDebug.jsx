// ======================================================================
// TEMPORÁRIO — Diagnóstico de importação Mercado Livre (1 anúncio).
// Consome GET /api/debug/marketplaces/mercado-livre/listings/field-map?ref=
// ======================================================================

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, buildApiUrl } from "../../config/api";
import S7Button from "../../components/ui/S7Button";
import S7Input from "../../components/ui/S7Input";
import "./MlListingImportDebug.css";

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "ok") return "ml-import-debug__badge ml-import-debug__badge--ok";
  if (s === "empty") return "ml-import-debug__badge ml-import-debug__badge--empty";
  if (s === "missing") return "ml-import-debug__badge ml-import-debug__badge--missing";
  if (s === "calculated") return "ml-import-debug__badge ml-import-debug__badge--calculated";
  if (s === "unavailable") return "ml-import-debug__badge ml-import-debug__badge--unavailable";
  if (s === "not_mapped") return "ml-import-debug__badge ml-import-debug__badge--not_mapped";
  return "ml-import-debug__badge ml-import-debug__badge--empty";
}

function natureBadgeClass(nature) {
  const n = String(nature || "").toLowerCase();
  if (n === "imported") return "ml-import-debug__badge ml-import-debug__badge--nature-imported";
  if (n === "derived") return "ml-import-debug__badge ml-import-debug__badge--nature-derived";
  if (n === "calculated") return "ml-import-debug__badge ml-import-debug__badge--nature-calculated";
  if (n === "api_only") return "ml-import-debug__badge ml-import-debug__badge--nature-api_only";
  if (n === "manual") return "ml-import-debug__badge ml-import-debug__badge--nature-manual";
  return "ml-import-debug__badge ml-import-debug__badge--empty";
}

function safeJsonStringify(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default function MlListingImportDebug() {
  const [refInput, setRefInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const flatFields = useMemo(() => {
    if (!data?.groups) return [];
    return data.groups.flatMap((g) => g.fields.map((f) => ({ ...f, group: g.group })));
  }, [data]);

  const load = useCallback(async () => {
    const ref = refInput.trim();
    if (!ref) {
      setError("Informe o UUID interno ou o ID MLB do anúncio.");
      return;
    }
    const path = `/api/debug/marketplaces/mercado-livre/listings/field-map?ref=${encodeURIComponent(ref)}`;
    const url = buildApiUrl(path);
    if (!url) {
      setError("Defina VITE_API_BASE_URL apontando para o backend.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    const res = await apiFetch(url);
    setLoading(false);
    if (!res.ok) {
      const baseMsg = res.data?.error || res.error || "Falha ao carregar diagnóstico.";
      const pathHint =
        res.status === 404 && res.data?.path != null
          ? ` Caminho visto pelo servidor: ${res.data.path}. Confira deploy do backend e VITE_API_BASE_URL.`
          : "";
      setError(`${baseMsg}${pathHint}`);
      return;
    }
    if (!res.data?.listing && !res.data?.groups) {
      setError("Resposta inesperada do servidor.");
      return;
    }
    setData(res.data);
  }, [refInput]);

  return (
    <div className="ml-import-debug">
      <div className="ml-import-debug__banner">
        Ferramenta temporária de diagnóstico — não faz parte do fluxo operacional. Pode ser removida ou
        evoluir para inspector multi-marketplace.
      </div>

      <h1 className="ml-import-debug__title">Diagnóstico de importação — Mercado Livre</h1>
      <p className="ml-import-debug__sub">
        Inspeciona 1 anúncio: valores no banco Suse7 vs APIs do ML (items, listing_prices, sale_price,
        visitas, performance).{" "}
        <Link to="/anuncios" style={{ color: "#2563eb" }}>
          Voltar para Anúncios
        </Link>
      </p>

      <div className="ml-import-debug__form">
        <div className="ml-import-debug__ref-input">
          <S7Input
            label="Listing (UUID interno ou MLB…)"
            name="ml-debug-ref"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="Ex.: uuid da tabela marketplace_listings ou MLB1234567890"
            autoComplete="off"
          />
        </div>
        <S7Button
          type="button"
          variant="primary"
          onClick={() => void load()}
          loading={loading}
          loadingLabel="Carregando…"
        >
          Carregar diagnóstico
        </S7Button>
      </div>

      {error ? <div className="ml-import-debug__err">{error}</div> : null}

      {data?.listing ? (
        <section className="ml-import-debug__header-card" aria-label="Resumo do anúncio">
          <dl className="ml-import-debug__header-grid">
            <div>
              <dt>ID interno</dt>
              <dd>{String(data.listing.internal_id ?? "—")}</dd>
            </div>
            <div>
              <dt>ID ML</dt>
              <dd>{String(data.listing.external_listing_id ?? "—")}</dd>
            </div>
            <div>
              <dt>Marketplace</dt>
              <dd>{String(data.marketplace ?? "—")}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{String(data.listing.status ?? "—")}</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd>{data.listing.sku != null ? String(data.listing.sku) : "—"}</dd>
            </div>
            <div>
              <dt>Produto Suse7</dt>
              <dd>{data.listing.product_id != null ? String(data.listing.product_id) : "—"}</dd>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <dt>Título</dt>
              <dd>{String(data.listing.title ?? "—")}</dd>
            </div>
            <div>
              <dt>Última importação (api_last_seen)</dt>
              <dd>{data.listing.last_imported_at != null ? String(data.listing.last_imported_at) : "—"}</dd>
            </div>
            <div>
              <dt>Token ML</dt>
              <dd>{data.summary?.token_available ? "Disponível na sessão" : "Indisponível / erro"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {data?.summary?.status_counts ? (
        <p className="ml-import-debug__sub" style={{ marginTop: -8 }}>
          Por status:{" "}
          {Object.entries(data.summary.status_counts)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")}
        </p>
      ) : null}

      {data?.summary ? (
        <section className="ml-import-debug__summary" aria-label="Contadores">
          <div className="ml-import-debug__summary-card">
            <span>Total de campos</span>
            <strong>{data.summary.total_fields}</strong>
          </div>
          <div className="ml-import-debug__summary-card">
            <span>Preenchidos (DB ou API)</span>
            <strong>{data.summary.filled_db_or_api}</strong>
          </div>
          <div className="ml-import-debug__summary-card">
            <span>Vazios (ambos)</span>
            <strong>{data.summary.empty_both}</strong>
          </div>
          <div className="ml-import-debug__summary-card">
            <span>Defs. somente API</span>
            <strong>{data.summary.api_only_defs}</strong>
          </div>
          <div className="ml-import-debug__summary-card">
            <span>Defs. calculados</span>
            <strong>{data.summary.calculated_defs}</strong>
          </div>
          <div className="ml-import-debug__summary-card">
            <span>Não mapeados</span>
            <strong>{data.summary.unmapped}</strong>
          </div>
        </section>
      ) : null}

      {data?.api_errors && Object.keys(data.api_errors).length > 0 ? (
        <div className="ml-import-debug__err" style={{ background: "rgba(251, 191, 36, 0.2)", color: "#92400e" }}>
          <strong style={{ display: "block", marginBottom: 6 }}>Avisos de API</strong>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
            {safeJsonStringify(data.api_errors)}
          </pre>
        </div>
      ) : null}

      {flatFields.length > 0 ? (
        <div className="ml-import-debug__table-wrap">
          <table className="ml-import-debug__table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Rótulo</th>
                <th>Suse7</th>
                <th>Tabela</th>
                <th>Campo ML</th>
                <th>Endpoint</th>
                <th>Valor DB</th>
                <th>Valor API</th>
                <th>Tipo</th>
                <th>Editável</th>
                <th>Só API</th>
                <th>Natureza</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {flatFields.map((row) => (
                <tr key={row.id}>
                  <td>{row.group}</td>
                  <td>
                    {row.label}
                    {row.notes ? (
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{row.notes}</div>
                    ) : null}
                  </td>
                  <td className="ml-import-debug__mono">{row.suse7_field}</td>
                  <td className="ml-import-debug__mono">{row.db_source_table}</td>
                  <td className="ml-import-debug__mono">{row.marketplace_field}</td>
                  <td className="ml-import-debug__mono" style={{ maxWidth: 160 }}>
                    {row.endpoint}
                  </td>
                  <td className="ml-import-debug__mono">{row.db_value ?? "—"}</td>
                  <td className="ml-import-debug__mono">{row.api_value ?? "—"}</td>
                  <td>{row.value_type}</td>
                  <td>{row.editable_manual ? "Sim" : "Não"}</td>
                  <td>{row.api_only ? "Sim" : "Não"}</td>
                  <td>
                    <span className={natureBadgeClass(row.nature)}>{row.nature}</span>
                  </td>
                  <td>
                    <span className={statusBadgeClass(row.status)}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data?.raw_payloads ? (
        <section aria-label="Payloads brutos">
          {Object.entries(data.raw_payloads).map(([key, val]) => (
            <details key={key} className="ml-import-debug__raw" open={key === "item"}>
              <summary>{key}</summary>
              <pre>{safeJsonStringify(val)}</pre>
            </details>
          ))}
        </section>
      ) : null}
    </div>
  );
}
