import { useCallback, useEffect, useMemo, useState } from "react";
import { devCenterGetFinance, devCenterGetFinanceDetail } from "../../../services/devCenterApi";
import FinanceOpsStats from "./FinanceOpsStats";
import FinanceOpsObservability from "./FinanceOpsObservability";
import FinanceOpsFilters from "./FinanceOpsFilters";
import FinanceOpsQueue, { FinanceOpsQueueSkeleton } from "./FinanceOpsQueue";
import FinanceOpsDrawer from "./FinanceOpsDrawer";
import { filterFinanceRows, normalizeFinanceSummary } from "./financeOpsUtils";
import "./FinanceOps.css";

const DEFAULT_FILTERS = {
  q: "",
  payment_status: "",
  plan: "",
  billing_flag: "",
  health: "",
  renewal: "",
  payment_method: "",
};

export default function FinanceOpsPage() {
  const [rows, setRows] = useState(/** @type {import('./financeOpsTypes').FinanceListRow[]} */ ([]));
  const [summary, setSummary] = useState(/** @type {import('./financeOpsTypes').FinanceSummary | null} */ (null));
  const [observability, setObservability] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [listPhase, setListPhase] = useState(/** @type {"loading" | "ok" | "error"} */ ("loading"));
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(/** @type {import('./financeOpsTypes').FinanceListRow | null} */ (null));
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [detailPhase, setDetailPhase] = useState(/** @type {"idle" | "loading" | "ok" | "error"} */ ("idle"));
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    setListPhase("loading");
    devCenterGetFinance().then((r) => {
      if (r.ok) {
        setRows(Array.isArray(r.data?.rows) ? r.data.rows : []);
        setSummary(normalizeFinanceSummary(r.data?.summary));
        setObservability(r.data?.observability ?? null);
        setListPhase("ok");
      } else {
        setRows([]);
        setSummary(normalizeFinanceSummary(null));
        setObservability(null);
        setListPhase("error");
      }
    });
  }, []);

  const filtered = useMemo(() => filterFinanceRows(rows, filters), [rows, filters]);

  const planOptions = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      if (r.plan && r.plan !== "—") set.add(r.plan);
    }
    return [...set].sort();
  }, [rows]);

  const patchFilters = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const openFinance = useCallback((row) => {
    setSelected(row);
    setDetail(null);
    setDetailError("");
    setDetailPhase("loading");

    devCenterGetFinanceDetail(row.id).then((r) => {
      if (r.ok && r.data) {
        setDetail(r.data);
        setDetailPhase("ok");
      } else {
        setDetail(null);
        setDetailPhase("error");
        setDetailError(r.error || "Não foi possível carregar o detalhe financeiro.");
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
    <section className="dc-module dc-fin-page">
      <header className="dc-module__head">
        <h2>Financeiro</h2>
        <p className="dc-module__desc">
          Central financeira operacional — MRR, receita, inadimplência, pagamentos e observabilidade da plataforma.
        </p>
      </header>

      {listPhase === "ok" && summary ? <FinanceOpsStats summary={summary} /> : null}
      {listPhase === "ok" ? <FinanceOpsObservability observability={observability} /> : null}

      {listPhase === "error" ? (
        <p className="dc-module__error">Erro ao carregar financeiro. Tente novamente em instantes.</p>
      ) : null}

      {listPhase === "ok" ? (
        <FinanceOpsFilters
          filters={filters}
          planOptions={planOptions}
          onChange={patchFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      ) : null}

      {listPhase === "loading" ? <FinanceOpsQueueSkeleton /> : null}

      {listPhase === "ok" && filtered.length === 0 ? (
        <div className="dc-fin-empty">
          <strong>Nenhum registro financeiro encontrado</strong>
          <p>Ajuste os filtros ou aguarde novos pagamentos na plataforma.</p>
        </div>
      ) : null}

      {listPhase === "ok" && filtered.length > 0 ? <FinanceOpsQueue rows={filtered} onOpen={openFinance} /> : null}

      <FinanceOpsDrawer
        subscriptionId={selected?.id ?? null}
        detail={detail}
        loading={detailPhase === "loading"}
        error={detailPhase === "error" ? detailError : null}
        onClose={closeDrawer}
      />
    </section>
  );
}
