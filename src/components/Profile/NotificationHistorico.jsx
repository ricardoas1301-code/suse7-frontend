// ======================================================================
//  PREFERÊNCIAS > NOTIFICAÇÕES > HISTÓRICO (Fase 3)
//  Lista paginada, filtros e detalhe com retry/cancel via API.
// ======================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_ROUTING_TYPE_CATALOG } from "../../constants/notificationRoutingCatalog";
import { fetchMarketplaceAccountsForRouting } from "../../services/notificationRoutingService";
import { fetchNotificationEvents, simulateNotificationDebug } from "../../services/notificationHistoryService";
import NotificationEventCard from "../notifications/NotificationEventCard.jsx";
import NotificationEventDetailsModal from "../notifications/NotificationEventDetailsModal.jsx";
import NotificationCenterPageShell from "./NotificationCenterPageShell";
import "./NotificationHistorico.css";

const SEVERITY_OPTIONS = ["", "critical", "important", "medium", "info"];
const STATUS_OPTIONS = ["", "pending", "processing", "delivered", "failed", "partial", "cancelled"];
const CHANNEL_FILTER = ["", "app", "whatsapp", "email"];

function buildAccountsMap(accounts) {
  /** @type {Record<string, string>} */
  const m = {};
  for (const a of accounts ?? []) {
    const id = a.id != null ? String(a.id) : "";
    if (!id) continue;
    m[id] = a.account_alias ?? a.ml_nickname ?? a.external_seller_id ?? id;
  }
  return m;
}

export default function NotificationHistorico() {
  const { addNotification } = useNotifications();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [accountsById, setAccountsById] = useState({});

  const [filterType, setFilterType] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [detailId, setDetailId] = useState(null);
  const [simBusy, setSimBusy] = useState(false);
  const [filteredPagination, setFilteredPagination] = useState(false);

  const toast = useCallback(
    (payload) => {
      addNotification({
        type: payload.type ?? "info",
        title: payload.title ?? "",
        message: payload.message ?? "",
      });
    },
    [addNotification]
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetchMarketplaceAccountsForRouting();
      if (cancel) return;
      const list = res.ok && Array.isArray(res.data?.accounts) ? res.data.accounts : [];
      setAccounts(list);
      setAccountsById(buildAccountsMap(list));
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const res = await fetchNotificationEvents({
      page,
      page_size: pageSize,
      notification_type: filterType || undefined,
      marketplace_account_id: filterAccount || undefined,
      severity: filterSeverity || undefined,
      delivery_status: filterStatus || undefined,
      notification_channel: filterChannel || undefined,
      created_from: filterFrom || undefined,
      created_to: filterTo || undefined,
    });
    setLoading(false);
    if (!res.ok) {
      toast({ type: "error", title: "Histórico", message: res.error ?? "Erro ao carregar." });
      setItems([]);
      setTotal(0);
      setFilteredPagination(false);
      return;
    }
    const rows = Array.isArray(res.items) ? res.items : [];
    setItems(rows);
    setFilteredPagination(Boolean(res.filtered_pagination));
    setTotal(res.total != null ? Number(res.total) : 0);
  }, [
    page,
    pageSize,
    filterType,
    filterAccount,
    filterSeverity,
    filterStatus,
    filterFrom,
    filterTo,
    filterChannel,
    toast,
  ]);

  useEffect(() => {
    /* Fetch ao montar / mudar filtros — setState ocorre dentro do async após I/O. */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento de lista por dependências
    void loadEvents();
  }, [loadEvents]);

  const typeOptions = useMemo(
    () => NOTIFICATION_ROUTING_TYPE_CATALOG.map((c) => ({ key: c.key, label: c.label })),
    []
  );

  const totalPages = filteredPagination ? null : Math.max(1, Math.ceil(total / pageSize));

  const handleSimulate = async () => {
    const mid =
      filterAccount ||
      (accounts[0]?.id != null ? String(accounts[0].id) : "");
    if (!mid) {
      toast({
        type: "error",
        title: "Simulação",
        message: "Selecione uma conta marketplace no filtro ou cadastre uma conta.",
      });
      return;
    }
    setSimBusy(true);
    const res = await simulateNotificationDebug({
      notification_type: "conta_desconectada",
      marketplace_account_id: mid,
      relevance_key: `ui_sim_${Date.now()}`,
      skip_dedupe: true,
    });
    setSimBusy(false);
    if (!res.ok) {
      toast({ type: "error", title: "Simulação", message: res.error ?? "Acesso negado ou erro na API." });
      return;
    }
    if (res.deduped) {
      toast({ type: "info", title: "Simulação", message: "Evento deduplicado pelo motor." });
    } else {
      toast({
        type: "success",
        title: "Simulação",
        message: `Evento criado. Deliveries: ${res.deliveries_created ?? 0}.`,
      });
    }
    setPage(1);
    void loadEvents();
  };

  return (
    <>
      <NotificationCenterPageShell
        title="Histórico de notificações"
        subtitle="Acompanhe os alertas gerados pelo Suse7 e o status de envio por canal e destinatário."
        className="s7-notification-center-hero--historico"
      >
        <div className="s7-notif-historico">
          <section className="s7-notif-historico__filters s7-card">
        <div className="s7-notif-historico__filters-grid">
          <label className="s7-notif-historico__field">
            <span>Tipo de alerta</span>
            <select value={filterType} onChange={(e) => { setPage(1); setFilterType(e.target.value); }}>
              <option value="">Todos</option>
              {typeOptions.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="s7-notif-historico__field">
            <span>Conta marketplace</span>
            <select value={filterAccount} onChange={(e) => { setPage(1); setFilterAccount(e.target.value); }}>
              <option value="">Todas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_alias ?? a.ml_nickname ?? a.id}
                </option>
              ))}
            </select>
          </label>
          <label className="s7-notif-historico__field">
            <span>Severidade</span>
            <select value={filterSeverity} onChange={(e) => { setPage(1); setFilterSeverity(e.target.value); }}>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s || "all"} value={s}>
                  {s || "Todas"}
                </option>
              ))}
            </select>
          </label>
          <label className="s7-notif-historico__field">
            <span>Status</span>
            <select value={filterStatus} onChange={(e) => { setPage(1); setFilterStatus(e.target.value); }}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s || "all"} value={s}>
                  {s || "Todos"}
                </option>
              ))}
            </select>
          </label>
          <label className="s7-notif-historico__field">
            <span>Canal</span>
            <select value={filterChannel} onChange={(e) => { setPage(1); setFilterChannel(e.target.value); }}>
              {CHANNEL_FILTER.map((c) => (
                <option key={c || "all"} value={c}>
                  {!c ? "Todos" : c}
                </option>
              ))}
            </select>
          </label>
          <label className="s7-notif-historico__field">
            <span>De</span>
            <input
              type="datetime-local"
              value={filterFrom}
              onChange={(e) => { setPage(1); setFilterFrom(e.target.value); }}
            />
          </label>
          <label className="s7-notif-historico__field">
            <span>Até</span>
            <input
              type="datetime-local"
              value={filterTo}
              onChange={(e) => { setPage(1); setFilterTo(e.target.value); }}
            />
          </label>
        </div>
        {(import.meta.env.DEV || localStorage.getItem("s7_show_notification_sim") === "1") && (
          <div className="s7-notif-historico__dev">
            <button type="button" className="s7-btn s7-btn--secondary s7-btn--sm" disabled={simBusy} onClick={handleSimulate}>
              {simBusy ? "Simulando…" : "Simular conta_desconectada (DEV)"}
            </button>
          </div>
        )}
      </section>

      <section className="s7-notif-historico__list">
        {loading ? (
          <p className="s7-notif-historico__loading">Carregando histórico…</p>
        ) : items.length === 0 ? (
          <div className="s7-card s7-notif-historico__empty">Nenhum evento encontrado para os filtros.</div>
        ) : (
          items.map((item) => (
            <NotificationEventCard
              key={item.id}
              item={item}
              marketplaceLabel={
                item.marketplace_account_id
                  ? accountsById[String(item.marketplace_account_id)] ?? null
                  : null
              }
              onOpenDetail={setDetailId}
            />
          ))
        )}
      </section>

      <footer className="s7-notif-historico__pager">
        <button type="button" className="s7-btn s7-btn--secondary s7-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Anterior
        </button>
        <span>
          {filteredPagination
            ? `Página ${page} · filtros de status/canal (total global indisponível)`
            : `Página ${page} / ${totalPages}`}
        </span>
        <button
          type="button"
          className="s7-btn s7-btn--secondary s7-btn--sm"
          disabled={filteredPagination ? items.length < pageSize : page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </button>
      </footer>
        </div>
      </NotificationCenterPageShell>

      <NotificationEventDetailsModal
        open={Boolean(detailId)}
        eventId={detailId}
        onClose={() => setDetailId(null)}
        toast={toast}
        accountsById={accountsById}
      />
    </>
  );
}
