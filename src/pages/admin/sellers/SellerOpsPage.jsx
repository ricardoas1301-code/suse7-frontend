import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { devCenterGetSellerDetail, devCenterGetSellers } from "../../../services/devCenterApi";
import SellerOpsStats from "./SellerOpsStats";
import SellerOpsFilters from "./SellerOpsFilters";
import SellerOpsQueue, { SellerOpsQueueSkeleton } from "./SellerOpsQueue";
import SellerOpsDrawer from "./SellerOpsDrawer";
import { logSellerDrawer } from "./sellerOpsDrawerDevLog";
import { computeSellerStats, filterSellers } from "./sellerOpsUtils";
import "./SellerOps.css";

const DEFAULT_FILTERS = {
  q: "",
  status: "",
  plan: "",
  integration: "",
  billing: "",
  health: "",
};

export default function SellerOpsPage() {
  const [rows, setRows] = useState(/** @type {import('./sellerOpsTypes').SellerListRow[]} */ ([]));
  const [listPhase, setListPhase] = useState(/** @type {"loading" | "ok" | "error"} */ ("loading"));
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(/** @type {import('./sellerOpsTypes').SellerListRow | null} */ (null));
  const [detail, setDetail] = useState(/** @type {import('./sellerOpsTypes').SellerDetailPayload | null} */ (null));
  const [detailPhase, setDetailPhase] = useState(/** @type {"idle" | "loading" | "ok" | "error"} */ ("idle"));
  const [detailError, setDetailError] = useState("");
  const isOpeningRef = useRef(false);
  const selectedRef = useRef(/** @type {import('./sellerOpsTypes').SellerListRow | null} */ (null));
  const detailPhaseRef = useRef(/** @type {"idle" | "loading" | "ok" | "error"} */ ("idle"));

  selectedRef.current = selected;
  detailPhaseRef.current = detailPhase;

  useEffect(() => {
    setListPhase("loading");
    devCenterGetSellers().then((r) => {
      if (r.ok) {
        setRows(Array.isArray(r.data?.sellers) ? r.data.sellers : []);
        setListPhase("ok");
      } else {
        setRows([]);
        setListPhase("error");
      }
    });
  }, []);

  const filtered = useMemo(() => filterSellers(rows, filters), [rows, filters]);
  const stats = useMemo(() => computeSellerStats(rows), [rows]);

  const planOptions = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      const p = r.plano && r.plano !== "—" ? r.plano : null;
      if (p) set.add(p);
    }
    return [...set].sort();
  }, [rows]);

  const patchFilters = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const openSeller = useCallback((seller, source = "row") => {
    const logEvent = source === "button" ? "button_fallback" : "row_click_open";

    if (isOpeningRef.current) {
      logSellerDrawer("open_blocked", { sellerId: seller.id, source, reason: "is_opening" });
      return;
    }

    const currentSelected = selectedRef.current;
    const currentPhase = detailPhaseRef.current;
    if (currentSelected?.id === seller.id && (currentPhase === "loading" || currentPhase === "ok")) {
      logSellerDrawer("open_blocked", { sellerId: seller.id, source, reason: "already_open" });
      return;
    }

    isOpeningRef.current = true;
    logSellerDrawer(logEvent, { sellerId: seller.id, source });

    setSelected(seller);
    setDetail(null);
    setDetailError("");
    setDetailPhase("loading");

    devCenterGetSellerDetail(seller.id)
      .then((r) => {
        if (r.ok && r.data) {
          setDetail(r.data);
          setDetailPhase("ok");
        } else {
          setDetail(null);
          setDetailPhase("error");
          setDetailError(r.error || "Não foi possível carregar o detalhe do seller.");
        }
      })
      .finally(() => {
        isOpeningRef.current = false;
      });
  }, []);

  const closeDrawer = useCallback(() => {
    isOpeningRef.current = false;
    setSelected(null);
    setDetail(null);
    setDetailPhase("idle");
    setDetailError("");
  }, []);

  const retryDetail = useCallback(() => {
    const seller = selectedRef.current;
    if (!seller) return;

    setDetail(null);
    setDetailError("");
    setDetailPhase("loading");

    devCenterGetSellerDetail(seller.id).then((r) => {
      if (r.ok && r.data) {
        setDetail(r.data);
        setDetailPhase("ok");
      } else {
        setDetail(null);
        setDetailPhase("error");
        setDetailError(r.error || "Não foi possível carregar o detalhe do seller.");
      }
    });
  }, []);

  return (
    <section className="dc-module dc-sellers-page">
      <header className="dc-module__head">
        <h2>Sellers</h2>
        <p className="dc-module__desc">
          Central operacional de sellers — identidade, integrações, assinatura e health do ecossistema Suse7.
        </p>
      </header>

      {listPhase === "ok" ? <SellerOpsStats stats={stats} /> : null}

      {listPhase === "error" ? (
        <p className="dc-module__error">Erro ao carregar sellers. Tente novamente em instantes.</p>
      ) : null}

      {listPhase === "ok" ? (
        <SellerOpsFilters
          filters={filters}
          planOptions={planOptions}
          onChange={patchFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      ) : null}

      {listPhase === "loading" ? <SellerOpsQueueSkeleton /> : null}

      {listPhase === "ok" && filtered.length === 0 ? (
        <div className="dc-sellers-empty">
          <strong>Nenhum seller encontrado</strong>
          <p>Ajuste os filtros ou aguarde novos cadastros na plataforma.</p>
        </div>
      ) : null}

      {listPhase === "ok" && filtered.length > 0 ? (
        <SellerOpsQueue
          sellers={filtered}
          selectedId={selected?.id ?? null}
          drawerPhase={detailPhase}
          onOpen={openSeller}
        />
      ) : null}

      <SellerOpsDrawer
        sellerId={selected?.id ?? null}
        listPreview={selected}
        detail={detail}
        loading={detailPhase === "loading"}
        error={detailPhase === "error" ? detailError : null}
        onClose={closeDrawer}
        onRetry={retryDetail}
      />
    </section>
  );
}
