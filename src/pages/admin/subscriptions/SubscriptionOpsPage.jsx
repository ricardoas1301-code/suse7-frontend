import { useCallback, useEffect, useMemo, useState } from "react";
import { devCenterGetSubscriptionDetail, devCenterGetSubscriptions } from "../../../services/devCenterApi";
import SubscriptionOpsStats from "./SubscriptionOpsStats";
import SubscriptionOpsFilters from "./SubscriptionOpsFilters";
import SubscriptionOpsQueue, { SubscriptionOpsQueueSkeleton } from "./SubscriptionOpsQueue";
import SubscriptionOpsDrawer from "./SubscriptionOpsDrawer";
import { filterSubscriptions, normalizeSummary } from "./subscriptionOpsUtils";
import "./SubscriptionOps.css";

const DEFAULT_FILTERS = {
  q: "",
  billing_status: "",
  plan: "",
  billing_flag: "",
  health: "",
  renewal: "",
};

export default function SubscriptionOpsPage() {
  const [rows, setRows] = useState(/** @type {import('./subscriptionOpsTypes').SubscriptionListRow[]} */ ([]));
  const [summary, setSummary] = useState(/** @type {import('./subscriptionOpsTypes').SubscriptionSummary | null} */ (null));
  const [listPhase, setListPhase] = useState(/** @type {"loading" | "ok" | "error"} */ ("loading"));
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(/** @type {import('./subscriptionOpsTypes').SubscriptionListRow | null} */ (null));
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [detailPhase, setDetailPhase] = useState(/** @type {"idle" | "loading" | "ok" | "error"} */ ("idle"));
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    setListPhase("loading");
    devCenterGetSubscriptions().then((r) => {
      if (r.ok) {
        setRows(Array.isArray(r.data?.subscriptions) ? r.data.subscriptions : []);
        setSummary(normalizeSummary(r.data?.summary));
        setListPhase("ok");
      } else {
        setRows([]);
        setSummary(normalizeSummary(null));
        setListPhase("error");
      }
    });
  }, []);

  const filtered = useMemo(() => filterSubscriptions(rows, filters), [rows, filters]);

  const planOptions = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      if (r.plan && r.plan !== "—") set.add(r.plan);
    }
    return [...set].sort();
  }, [rows]);

  const patchFilters = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const openSubscription = useCallback((row) => {
    setSelected(row);
    setDetail(null);
    setDetailError("");
    setDetailPhase("loading");

    devCenterGetSubscriptionDetail(row.id).then((r) => {
      if (r.ok && r.data) {
        setDetail(r.data);
        setDetailPhase("ok");
      } else {
        setDetail(null);
        setDetailPhase("error");
        setDetailError(r.error || "Não foi possível carregar o detalhe da assinatura.");
      }
    });
  }, []);

  const closeDrawer = () => {
    setSelected(null);
    setDetail(null);
    setDetailPhase("idle");
    setDetailError("");
  };

  return (
    <section className="dc-module dc-sub-page">
      <header className="dc-module__head">
        <h2>Assinaturas</h2>
        <p className="dc-module__desc">
          Cockpit billing operacional — planos, renovação, inadimplência, consumo e health financeiro.
        </p>
      </header>

      {listPhase === "ok" && summary ? <SubscriptionOpsStats summary={summary} /> : null}

      {listPhase === "error" ? (
        <p className="dc-module__error">Erro ao carregar assinaturas. Tente novamente em instantes.</p>
      ) : null}

      {listPhase === "ok" ? (
        <SubscriptionOpsFilters
          filters={filters}
          planOptions={planOptions}
          onChange={patchFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      ) : null}

      {listPhase === "loading" ? <SubscriptionOpsQueueSkeleton /> : null}

      {listPhase === "ok" && filtered.length === 0 ? (
        <div className="dc-sub-empty">
          <strong>Nenhuma assinatura encontrada</strong>
          <p>Ajuste os filtros ou aguarde novos checkouts na plataforma.</p>
        </div>
      ) : null}

      {listPhase === "ok" && filtered.length > 0 ? (
        <SubscriptionOpsQueue subscriptions={filtered} onOpen={openSubscription} />
      ) : null}

      <SubscriptionOpsDrawer
        subscriptionId={selected?.id ?? null}
        detail={detail}
        loading={detailPhase === "loading"}
        error={detailPhase === "error" ? detailError : null}
        onClose={closeDrawer}
      />
    </section>
  );
}
