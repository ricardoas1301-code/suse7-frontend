import { useEffect, useMemo, useState } from "react";

import { S7Button } from "../../components/ui";

import {

  OpsStatsGrid,

  OpsFiltersBar,

  OpsDrawerShell,

  OpsGlobalDrawerBody,

  OpsEmptyState,

} from "../../components/devCenter/ops";

import { OPS_DRAWER_EMPTY } from "../../components/devCenter/ops/opsDrawerEmptyCopy";

import { devCenterGetCustomersGlobal, devCenterGetCustomerGlobalDetail } from "../../services/devCenterApi";

import { CUSTOMERS_DOMAIN_ADMIN_GLOBAL } from "../../constants/customersDomainBoundary.js";
import { devCenterSafeErrorMessage, formatGlobalListMaskedField } from "../../components/devCenter/ops/opsGlobalLgpdPresentation";

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

        setError(devCenterSafeErrorMessage(res.error, "Não foi possível carregar clientes globais."));

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

      setDetail(null);

      setDetailContract(null);

      setDetailFetchedAt(null);

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



  const drawerCustomer = useMemo(() => {

    if (detail && typeof detail === "object") return detail;

    if (detailContract?.customer && typeof detailContract.customer === "object") {

      return /** @type {Record<string, unknown>} */ (detailContract.customer);

    }

    return null;

  }, [detail, detailContract]);



  const hasDrawerBody = Boolean(drawerCustomer || detailContract);



  const detailFreshnessLabel = useMemo(

    () =>

      formatDetailFreshnessLabel(detailFetchedAt, detailContract, {

        revalidating: detailRevalidating,

      }),

    [detailFetchedAt, detailContract, detailRevalidating],

  );



  const timelineItems = useMemo(() => {

    const overview =

      detailContract?.overview && typeof detailContract.overview === "object"

        ? /** @type {Record<string, unknown>} */ (detailContract.overview)

        : null;

    const source = overview ?? drawerCustomer;

    if (!source || typeof source !== "object") return [];



    return [

      { id: "first", label: "Primeira compra global", at: source.first_purchase_global, tone: "default" },

      { id: "last", label: "Última compra global", at: source.last_purchase_global, tone: "accent" },

      {

        id: "updated",

        label: "Última atualização registro",

        at:

          detailContract?.metadata && typeof detailContract.metadata === "object"

            ? detailContract.metadata.record_updated_at

            : drawerCustomer?.updated_at,

        tone: "muted",

      },

    ].filter((i) => i.at);

  }, [drawerCustomer, detailContract]);



  const drawerTitle = String(drawerCustomer?.name ?? "").trim() || "Cliente global";

  const drawerSubtitle = (() => {

    const id = drawerCustomer?.id ?? selectedId;

    return id ? `ID ${String(id).slice(0, 8)}…` : null;

  })();



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

                  <td>{formatGlobalListMaskedField(row.document)}</td>

                  <td>{formatGlobalListMaskedField(row.email)}</td>

                  <td>{formatGlobalListMaskedField(row.phone)}</td>

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

        title={drawerTitle}

        subtitle={drawerSubtitle}

        freshnessLabel={

          detailFetchError && hasDrawerBody

            ? "Pode estar desatualizado — falha ao atualizar"

            : detailFreshnessLabel

        }

        revalidating={detailRevalidating}

        onClose={() => setSelectedId(null)}

        loading={detailLoading}

      >

        {!detailLoading && !detailRevalidating && !hasDrawerBody && selectedId ? (

          <OpsEmptyState {...OPS_DRAWER_EMPTY.DETAIL_UNAVAILABLE} />

        ) : null}



        {hasDrawerBody && !detailLoading ? (

          <OpsGlobalDrawerBody

            contract={detailContract}

            customer={drawerCustomer}

            timelineItems={timelineItems}

          />

        ) : null}

      </OpsDrawerShell>

    </section>

  );

}

