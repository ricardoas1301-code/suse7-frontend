// ======================================================================
// Página /concorrencia — Monitoramento de Concorrência S7
// UI espelha padrões de Produtos (KPIs) + Raio-X (cards ML / sell-popover).
// Motor e persistência permanecem no backend; esta página só consome a API.
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../services/notificationTypes";
import S7Button from "../components/ui/S7Button";
import S7CompetitionPriceChart from "../components/concorrencia/S7CompetitionPriceChart";
import ConcorrenciaSelectModal from "../components/concorrencia/ConcorrenciaSelectModal";
import ConcorrenciaListingSearch from "../components/concorrencia/ConcorrenciaListingSearch";
import { ConcorrenciaSellerRaioxCard, ConcorrenciaCompetitorRaioxCard } from "../components/concorrencia/ConcorrenciaRaioxCompare";
import MarketplaceIcon from "../components/MarketplaceIcon";
import { marketplaceChipLabel } from "../utils/productCatalogRow";
import {
  competitionListListings,
  competitionGetOverview,
  competitionDiscover,
  competitionSelect,
  competitionInsights,
} from "../services/competitionApi";
import { buildApiUrl, apiFetch } from "../config/api";
import "../components/Products.css";
import "../components/Anuncios.css";
import "./ConcorrenciaPage.css";

function formatBrl(n) {
  if (n == null || n === "") return "—";
  const x = Number(String(n).replace(",", "."));
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ConcorrenciaPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [listings, setListings] = useState([]);
  const [listingId, setListingId] = useState("");
  const [overview, setOverview] = useState(null);
  const [loadListErr, setLoadListErr] = useState(null);
  const [overviewErr, setOverviewErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [discoverBusy, setDiscoverBusy] = useState(false);
  const [pickModalOpen, setPickModalOpen] = useState(false);
  const [pickModalCandidates, setPickModalCandidates] = useState([]);
  const [applyBusy, setApplyBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const loadListings = useCallback(async () => {
    setLoadListErr(null);
    const r = await competitionListListings();
    if (!r.ok) {
      setLoadListErr(r.error ?? "Erro");
      setListings([]);
      return;
    }
    setListings(r.listings ?? []);
  }, []);

  const loadOverview = useCallback(async () => {
    if (!listingId) {
      setOverview(null);
      return;
    }
    setOverviewErr(null);
    setBusy(true);
    const r = await competitionGetOverview(listingId);
    setBusy(false);
    if (!r.ok) {
      setOverviewErr(r.error ?? "Erro ao carregar visão");
      setOverview(null);
      return;
    }
    setOverview(r.data);
  }, [listingId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadListings();
    }, 0);
    return () => clearTimeout(t);
  }, [loadListings]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadOverview();
    }, 0);
    return () => clearTimeout(t);
  }, [loadOverview]);

  const selectedCompetitors = useMemo(
    () => (overview?.competitors ?? []).filter((c) => c.is_selected === true).slice(0, 4),
    [overview],
  );

  const myPrice = useMemo(() => {
    const p = overview?.listing?.price;
    if (p == null || String(p).trim() === "") return null;
    const n = Number(String(p).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }, [overview?.listing?.price]);

  const chartBars = useMemo(() => {
    const listing = overview?.listing;
    const my = listing?.price != null ? Number(listing.price) : null;
    const rows = [
      { key: "self", label: "Você", price: my, tone: "self" },
      ...selectedCompetitors.map((c, i) => ({
        key: String(c.competitor_listing_id ?? i),
        label: `Concorrente ${i + 1}`,
        price: c.competitor_price != null ? Number(c.competitor_price) : null,
        tone: "competitor",
      })),
    ];
    while (rows.length < 2) {
      rows.push({ key: `pad-${rows.length}`, label: "—", price: null, tone: "competitor" });
    }
    return rows;
  }, [overview, selectedCompetitors]);

  const openPickModalFromOverview = useCallback(() => {
    if (!listingId) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "listing",
        entity_id: null,
        title: "Concorrência",
        message: "Selecione um anúncio monitorado primeiro.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
      return;
    }
    setPickModalCandidates((overview?.competitors ?? []).slice(0, 20));
    setPickModalOpen(true);
  }, [listingId, overview?.competitors, addNotification]);

  const handleDiscover = async () => {
    if (!listingId) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "listing",
        entity_id: null,
        title: "Concorrência",
        message: "Selecione um anúncio antes de buscar concorrentes.",
        severity: NOTIFICATION_SEVERITY.WARNING,
      });
      return;
    }
    setDiscoverBusy(true);
    setActionMsg("Buscando concorrentes...");
    const r = await competitionDiscover(listingId);
    setDiscoverBusy(false);
    setActionMsg(null);
    if (!r.ok) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "listing",
        entity_id: listingId,
        title: "Concorrência",
        message: r.error ?? "Não foi possível buscar concorrentes agora. Tente novamente.",
        severity: NOTIFICATION_SEVERITY.CRITICAL,
      });
      return;
    }
    await loadOverview();
    const cands = Array.isArray(r.data?.candidates) ? r.data.candidates : [];
    if (cands.length === 0) {
      addNotification({
        event_type: "GENERIC",
        entity_type: "listing",
        entity_id: listingId,
        title: "Concorrência",
        message: "Nenhum concorrente relevante encontrado para este anúncio.",
        severity: NOTIFICATION_SEVERITY.INFO,
      });
      return;
    }
    setPickModalCandidates(cands);
    setPickModalOpen(true);
  };

  const handleSaveSelection = async (ids) => {
    if (!listingId) return false;
    setBusy(true);
    const r = await competitionSelect(listingId, ids);
    setBusy(false);
    if (!r.ok) {
      setActionMsg(r.error ?? "Falha ao salvar");
      return false;
    }
    await loadOverview();
    await competitionInsights(listingId, 7);
    await loadOverview();
    return true;
  };

  const handleSimulatePricing = () => {
    if (!listingId) return;
    navigate(`/precificacoes/inteligente/${listingId}`);
  };

  const handleApplyPrice = async () => {
    if (!listingId) return;
    const p = overview?.insight?.suggested_price;
    if (p == null || String(p).trim() === "") {
      setActionMsg("Sem preço sugerido seguro pela engine (ver status RISCO / MANTER).");
      return;
    }
    const url = buildApiUrl("/api/pricing/apply");
    if (!url) {
      setActionMsg("API não configurada.");
      return;
    }
    setApplyBusy(true);
    setActionMsg(null);
    const res = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        marketplace: overview?.listing?.marketplace ?? "mercado_livre",
        listing_id: listingId,
        new_sale_price: String(p).replace(",", "."),
      },
    });
    setApplyBusy(false);
    if (!res.ok) {
      setActionMsg(res.error ?? "Falha ao aplicar preço");
      return;
    }
    setActionMsg("Preço aplicado no Mercado Livre.");
    await loadOverview();
  };

  const kpis = overview?.kpis ?? {};
  const mkp = overview?.listing?.marketplace != null ? String(overview.listing.marketplace) : "";
  const mkpLabel = mkp ? marketplaceChipLabel(mkp) : "";

  const marketplaceBadgeForCards =
    overview?.listing?.marketplace != null && String(overview.listing.marketplace).trim() !== ""
      ? marketplaceChipLabel(String(overview.listing.marketplace).trim())
      : null;

  /** Indicador derivado só para exibição: anúncio atual sem linha de concorrentes persistida. */
  const semConcorrentesFlag = listingId && (overview?.competitors ?? []).length === 0 ? 1 : 0;

  /** Enquanto a visão do anúncio recarrega, não misturar KPIs antigos com seleção nova. */
  const kpiPlaceholder = Boolean(listingId) && busy;

  const largeValue = (v) => (kpiPlaceholder ? "…" : v);
  const miniValue = (v) => (kpiPlaceholder ? "…" : String(v ?? 0));

  return (
    <div className="page-content concorrencia-page">
      <h1 className="products-catalog__sr-title">Monitoramento de Concorrência S7</h1>

      <div className="concorrencia-page__shell">
        <header className="concorrencia-page__head">
          <div className="concorrencia-page__head-text">
            <h2 className="concorrencia-page__title">Monitoramento de Concorrência S7</h2>
            <p className="concorrencia-page__subtitle">
              Decisão e simulações no servidor; esta tela apenas reflete o que foi persistido para o seu time.
            </p>
            {mkp ? (
              <p className="concorrencia-page__mkp">
                <MarketplaceIcon marketplace={mkp} size={20} />
                <span>{mkpLabel}</span>
              </p>
            ) : null}
          </div>
        </header>

        {loadListErr ? <p className="concorrencia-page__err">{loadListErr}</p> : null}
        {overviewErr ? <p className="concorrencia-page__err">{overviewErr}</p> : null}
        {actionMsg ? <p className="concorrencia-page__info">{actionMsg}</p> : null}

        {/* KPIs: mesmo grid e tokens da página Produtos (Anuncios.css). */}
        <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Indicadores de concorrência">
          <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
            <header className="anuncios-catalog__kpi-head">
              <h2 className="anuncios-catalog__kpi-title">Top 10 — monitorados</h2>
            </header>
            <div className="anuncios-catalog__kpi-body">
              <p className="anuncios-catalog__kpi-value">{largeValue(String(kpis.products_monitored ?? 0))}</p>
              <p className="anuncios-catalog__kpi-hint">Quantidade de anúncios com monitoramento de concorrência ativo na conta (servidor).</p>
            </div>
          </article>

          <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
            <header className="anuncios-catalog__kpi-head">
              <h2 className="anuncios-catalog__kpi-title">Top 10 — oportunidades</h2>
            </header>
            <div className="anuncios-catalog__kpi-body">
              <p className="anuncios-catalog__kpi-value">{listingId && !kpiPlaceholder ? "—" : "…"}</p>
              <p className="anuncios-catalog__kpi-hint">
                Ranking consolidado multi-anúncio entra na próxima etapa do produto; por ora o motor trabalha no contexto do anúncio
                selecionado.
              </p>
            </div>
          </article>

          <div className="anuncios-catalog__kpi-minis" aria-label="Sinais do anúncio selecionado">
            <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--decline">
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">Perdendo no preço</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body">
                <p className="anuncios-catalog__kpi-mini-value">{miniValue(kpis.losing_on_price)}</p>
              </div>
            </article>
            <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--warn">
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">Margem em risco</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body">
                <p className="anuncios-catalog__kpi-mini-value">{miniValue(kpis.margin_at_risk)}</p>
              </div>
            </article>
            <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--profit">
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">Dominando mercado</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body">
                <p className="anuncios-catalog__kpi-mini-value">{miniValue(kpis.dominating)}</p>
              </div>
            </article>
            <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--sales">
              <div className="anuncios-catalog__kpi-mini-head">
                <h3 className="anuncios-catalog__kpi-mini-title">Sem concorrentes</h3>
              </div>
              <div className="anuncios-catalog__kpi-mini-body">
                <p className="anuncios-catalog__kpi-mini-value">
                  {listingId ? (kpiPlaceholder ? "…" : miniValue(semConcorrentesFlag)) : "…"}
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Barra de filtros / ações — família visual Products (controls + S7Button). */}
        <div className="concorrencia-page__controls products-catalog__controls s7-sticky-filters">
          <div className="products-catalog__controls-top">
            <div className="concorrencia-page__listing-search-wrap">
              <span className="concorrencia-page__field-label">Anúncio monitorado</span>
              <ConcorrenciaListingSearch
                listings={listings}
                listingId={listingId}
                onListingIdChange={setListingId}
                disabled={busy}
              />
            </div>
            <div className="products-catalog__controls-actions concorrencia-page__toolbar-actions">
              <S7Button type="button" variant="secondary" onClick={() => void loadOverview()} disabled={!listingId || busy} loading={busy}>
                Atualizar
              </S7Button>
              <S7Button
                type="button"
                variant="secondary"
                onClick={() => void handleDiscover()}
                disabled={!listingId || busy || discoverBusy}
                loading={discoverBusy}
                loadingLabel="Buscando concorrentes..."
              >
                Buscar concorrentes
              </S7Button>
              <S7Button type="button" variant="primary" onClick={openPickModalFromOverview} disabled={!listingId || busy || discoverBusy}>
                Selecionar concorrentes
              </S7Button>
              <S7Button type="button" variant="primary" onClick={handleSimulatePricing} disabled={!listingId}>
                Simular no Precificador
              </S7Button>
              <S7Button type="button" variant="secondary" onClick={() => void handleApplyPrice()} disabled={!listingId} loading={applyBusy}>
                Aplicar preço
              </S7Button>
            </div>
          </div>
        </div>

        {overview?.insight ? (
          <div className="concorrencia-page__insight" role="status">
            <strong>Status:</strong> {overview.insight.status}
            {overview.insight.suggested_price ? (
              <>
                {" "}
                · <strong>Sugerido:</strong> {formatBrl(overview.insight.suggested_price)}
              </>
            ) : null}
            {overview.insight.estimated_margin ? (
              <>
                {" "}
                · <strong>Margem est.:</strong> {overview.insight.estimated_margin}%
              </>
            ) : null}
          </div>
        ) : null}

        <section className="concorrencia-page__compare-region" aria-labelledby="concorrencia-compare-heading">
          <h2 id="concorrencia-compare-heading" className="concorrencia-page__section-title">
            Comparativo Raio-X
          </h2>
          <div className="s7-ml-scenario-compare-shell s7-ml-scenario-compare-shell--chart-right concorrencia-page__compare-shell">
            <div className="s7-ml-scenario-compare-shell__cards concorrencia-page__compare-cards-scroll">
              <div className="anuncios-raiox-compare--spacious">
                <div className="s7-ml-scenario-compare">
                  <div
                    className="s7-ml-scenario-compare__grid s7-ml-scenario-compare__grid--comfortable"
                    style={
                      /** @type {import("react").CSSProperties} */
                      ({ "--raiox-ml-compare-cols": 5 })
                    }
                  >
                    <ConcorrenciaSellerRaioxCard listing={overview?.listing} insight={overview?.insight} />
                    {[0, 1, 2, 3].map((slot) => (
                      <ConcorrenciaCompetitorRaioxCard
                        key={slot}
                        slotIndex={slot}
                        competitor={selectedCompetitors[slot] ?? null}
                        myPrice={myPrice}
                        insight={overview?.insight}
                        onSelectClick={openPickModalFromOverview}
                        selectBusy={busy}
                        marketplaceBadge={marketplaceBadgeForCards}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="s7-ml-scenario-compare-shell__chart">
              <h3 className="concorrencia-page__chart-title">Gráfico de preços</h3>
              <div className="concorrencia-page__chart-wrap">
                <S7CompetitionPriceChart bars={chartBars} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConcorrenciaSelectModal
        open={pickModalOpen}
        onClose={() => setPickModalOpen(false)}
        candidates={pickModalCandidates}
        selectedIds={selectedCompetitors.map((c) => String(c.competitor_listing_id))}
        onSave={handleSaveSelection}
        busy={busy}
      />
    </div>
  );
}
