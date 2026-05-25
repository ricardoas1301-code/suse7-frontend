import { useEffect, useMemo, useState } from "react";
import { S7Button } from "../../components/ui";
import {
  OpsStatsGrid,
  OpsFiltersBar,
  OpsDrawerShell,
  OpsTimeline,
  OpsGlobalOperationalContext,
  OpsEmptyState,
} from "../../components/devCenter/ops";
import { devCenterGetCustomersGlobal, devCenterGetCustomerGlobalDetail } from "../../services/devCenterApi";
import { CUSTOMERS_DOMAIN_ADMIN_GLOBAL } from "../../constants/customersDomainBoundary.js";
import {
  formatPtDate,
  formatPtDateShort,
  formatDetailFreshnessLabel,
} from "../../components/devCenter/ops/opsPresentation";
import {
  getDevCenterGlobalDetailCache,
  setDevCenterGlobalDetailCache,
  resolveDevCenterDetailFetch,
} from "./devCenterGlobalDetailCache.js";
import "../../components/devCenter/ops/ops.css";

const DASH = "—";

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="ops-skeleton-row">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j}>
              <div className="ops-skeleton-line" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** @param {unknown} sellers */
function RelatedSellersList({ sellers }) {
  const rows = Array.isArray(sellers) ? sellers : [];
  if (!rows.length) {
    return <OpsEmptyState compact title="Sem sellers" message="Nenhum seller relacionado neste registro global." />;
  }
  return (
    <ul className="ops-related-sellers">
      {rows.map((entry, idx) => {
        if (!entry || typeof entry !== "object") return null;
        const e = /** @type {Record<string, unknown>} */ (entry);
        return (
          <li key={`${e.user_id}-${e.external_customer_id}-${idx}`} className="ops-related-sellers__item">
            <strong>{String(e.marketplace ?? "marketplace")}</strong>
            <span>Conta: {e.marketplace_account_id ? String(e.marketplace_account_id).slice(0, 8) : DASH}…</span>
            <span>Buyer: {e.external_customer_id ?? DASH}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function DevCenterCustomersGlobal() {
  const [rows, setRows] = useState([]);
  const [globalOpsSummary, setGlobalOpsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [q, setQ] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  /** Contrato S_4.7.1 — blocos overview/activity/quality/ingestion/metadata para evolução futura do drawer. */
  const [detailContract, setDetailContract] = useState(null);
  const [detailFetchedAt, setDetailFetchedAt] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRevalidating, setDetailRevalidating] = useState(false);
  const [detailFetchError, setDetailFetchError] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      const res = await devCenterGetCustomersGlobal({ q });
      setLoading(false);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível carregar clientes globais.");
        setRows([]);
        setGlobalOpsSummary(null);
        return;
      }
      setRows(Array.isArray(res.data?.customers) ? res.data.customers : []);
      setGlobalOpsSummary(res.data?.summary ?? null);
      setLastUpdated(new Date().toISOString());
    }, 320);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!selectedId) {
      setDetailLoading(false);
      setDetailRevalidating(false);
      setDetailFetchError(false);
      return;
    }

    const cached = getDevCenterGlobalDetailCache(selectedId);
    const decision = resolveDevCenterDetailFetch(selectedId, cached);

    const applyContract = (/** @type {Record<string, unknown>} */ payload, /** @type {number} */ fetchedAt) => {
      setDetail(/** @type {Record<string, unknown> | null} */ (payload.customer ?? null));
      setDetailContract(payload);
      setDetailFetchedAt(fetchedAt);
    };

    if (cached?.contract) {
      applyContract(cached.contract, cached.fetchedAt);
    }

    if (!decision.fetch) {
      setDetailLoading(false);
      setDetailRevalidating(false);
      setDetailFetchError(false);
      return;
    }

    const hasCachedUi = Boolean(cached?.contract);
    if (!hasCachedUi) {
      setDetailLoading(true);
      setDetail(null);
      setDetailContract(null);
    } else {
      setDetailRevalidating(true);
    }
    setDetailFetchError(false);

    let cancelled = false;
    devCenterGetCustomerGlobalDetail(selectedId).then((res) => {
      if (cancelled) return;
      setDetailLoading(false);
      setDetailRevalidating(false);

      if (res.ok && res.data) {
        const payload = /** @type {Record<string, unknown>} */ (res.data);
        const fetchedAt = Date.now();
        setDevCenterGlobalDetailCache(selectedId, payload);
        applyContract(payload, fetchedAt);
        setDetailFetchError(false);
        return;
      }

      if (cached?.contract) {
        applyContract(cached.contract, cached.fetchedAt);
        setDetailFetchError(true);
        return;
      }

      setDetail(null);
      setDetailContract(null);
      setDetailFetchedAt(null);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const detailFreshnessLabel = useMemo(
    () =>
      formatDetailFreshnessLabel(detailFetchedAt, detailContract, {
        revalidating: detailRevalidating,
      }),
    [detailFetchedAt, detailContract, detailRevalidating],
  );

  const timelineItems = useMemo(() => {
    const source = detailContract?.overview ?? detail;
    if (!source) return [];
    return [
      { id: "first", label: "Primeira compra global", at: source.first_purchase_global, tone: "default" },
      { id: "last", label: "Última compra global", at: source.last_purchase_global, tone: "accent" },
      {
        id: "updated",
        label: "Última atualização registro",
        at: detailContract?.metadata?.record_updated_at ?? detail?.updated_at,
        tone: "muted",
      },
    ].filter((i) => i.at);
  }, [detail, detailContract]);

  return (
    <section className="dc-module dc-customers360">
      <header className="dc-customers360__head">
        <h2>Clientes Globais 360 S7</h2>
        <p>
          Visão admin cross-seller (LGPD). Resumo superior: métricas plataforma. Drawer: contexto agregado
          do registro global (sem nota operacional por cliente).
        </p>
        <p className="dc-customers360__scope-note">{CUSTOMERS_DOMAIN_ADMIN_GLOBAL.scopeNote}</p>
        {lastUpdated ? (
          <p className="dc-customers360__updated">Última atualização: {formatPtDate(lastUpdated)}</p>
        ) : null}
      </header>

      <OpsStatsGrid summary={globalOpsSummary} loading={loading} />

      <OpsFiltersBar scope="global" q={q} onQChange={setQ} />

      {error ? <p className="dc-module__error">{error}</p> : null}

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Pedidos</th>
              <th>Última compra</th>
              <th>Sellers</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <OpsEmptyState title="Nenhum cliente global" message="Ajuste a busca ou aguarde sincronização." />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name || DASH}</td>
                  <td>{row.document || DASH}</td>
                  <td>{row.email || DASH}</td>
                  <td>{row.phone || DASH}</td>
                  <td>{row.total_orders_global ?? 0}</td>
                  <td>{formatPtDateShort(row.last_purchase_global)}</td>
                  <td>{row.total_sellers_related ?? 0}</td>
                  <td className="ops-table__actions">
                    <S7Button type="button" variant="secondary" size="sm" onClick={() => setSelectedId(String(row.id))}>
                      Abrir
                    </S7Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <OpsDrawerShell
        open={Boolean(selectedId)}
        title={detail?.name ?? "Cliente global"}
        subtitle={detail?.id ? `ID ${String(detail.id).slice(0, 8)}…` : null}
        freshnessLabel={
          detailFetchError && detail
            ? "Pode estar desatualizado — falha ao atualizar"
            : detailFreshnessLabel
        }
        revalidating={detailRevalidating}
        onClose={() => setSelectedId(null)}
        loading={detailLoading}
      >
        {!detailLoading && !detailRevalidating && !detail && selectedId ? (
          <OpsEmptyState title="Detalhe indisponível" message="Não foi possível carregar o cliente global." />
        ) : null}

        {!detailLoading && detail ? (
          <>
            <section className="ops-drawer-block">
              <h3>Resumo</h3>
              <dl className="ops-kv">
                <div>
                  <dt>Documento</dt>
                  <dd>{detail.document_masked ?? DASH}</dd>
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd>{detail.email_masked ?? DASH}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd>{detail.phone_masked ?? DASH}</dd>
                </div>
                <div>
                  <dt>Pedidos global</dt>
                  <dd>{detail.total_orders_global ?? 0}</dd>
                </div>
                <div>
                  <dt>Total gasto</dt>
                  <dd>{detail.total_spent_global ?? DASH}</dd>
                </div>
                <div>
                  <dt>Sellers relacionados</dt>
                  <dd>{detail.total_sellers_related ?? 0}</dd>
                </div>
              </dl>
            </section>

            <section className="ops-drawer-block">
              <h3>Timeline</h3>
              <OpsTimeline items={timelineItems} />
            </section>

            <section className="ops-drawer-block">
              <h3>Saúde operacional (Global)</h3>
              <OpsGlobalOperationalContext contract={detailContract} />
            </section>

            <section className="ops-drawer-block">
              <h3>Sellers relacionados</h3>
              <RelatedSellersList sellers={detailContract?.activity?.related_sellers ?? detail?.related_sellers} />
            </section>
          </>
        ) : null}
      </OpsDrawerShell>
    </section>
  );
}
