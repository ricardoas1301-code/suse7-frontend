// Domínio seller — contrato oficial em clientes360CustomersScope.js (S_4.6.2).
// Proibido nesta página: GET /api/dev-center/customers-global*
import { useEffect, useMemo, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import { CLIENTES360_CUSTOMERS_SCOPE } from "./clientes360CustomersScope";
import "../components/Products.css";
import "../components/Anuncios.css";
import "./Clientes360.css";
import S7Input from "../components/ui/S7Input";
import S7Icon from "../components/ui/S7Icon";
import S7Button from "../components/ui/S7Button";

const DASH = "—";

/** Guardrail S_4.6.2 — rotas seller oficiais (evita reintrodução acidental de contrato admin). */
const SELLER_CUSTOMERS_LIST_API = CLIENTES360_CUSTOMERS_SCOPE.officialApis.list;
const SELLER_CUSTOMERS_INGEST_API = CLIENTES360_CUSTOMERS_SCOPE.officialApis.ingest;
const STATUS_FILTER_CHIPS = [
  { id: "", label: "Todos", icon: "catalog_filter_all", iconTone: "neutral" },
  { id: "recorrente", label: "Recorrentes", icon: "catalog_filter_with_sales", iconTone: "success" },
  { id: "ativo", label: "Ativos", icon: "catalog_filter_with_ads", iconTone: "success" },
  { id: "novo", label: "Novos", icon: "catalog_filter_new", iconTone: "slate" },
  { id: "inativo", label: "Inativos", icon: "catalog_filter_no_ads", iconTone: "danger" },
  { id: "dados incompletos", label: "Dados incompletos", icon: "catalog_filter_attention", iconTone: "warning" },
];

function brl(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DASH;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return DASH;
  const t = Date.parse(String(value));
  if (!Number.isFinite(t)) return DASH;
  return new Date(t).toLocaleDateString("pt-BR");
}

/** wa.me exige apenas dígitos (sem +). */
function waMeDigitsFromE164(e164) {
  const d = String(e164 || "").replace(/\D/g, "");
  return d || null;
}

function waMeHref(e164) {
  const d = waMeDigitsFromE164(e164);
  return d ? `https://wa.me/${d}` : null;
}

/** Mascaramento leve na grade (LGPD); drawer mantém valor completo vindo da API. */
function maskEmailTable(email, emailIsMasked) {
  if (!email) return null;
  if (emailIsMasked || /\*+/.test(email)) return email;
  const [local, dom] = email.split("@");
  if (!dom) return email;
  const head = local.slice(0, 2);
  return `${head}***@${dom}`;
}

function maskPhoneTable(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `(**) *****-${digits.slice(-4)}`;
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "novo") return "status-blue";
  if (s === "recorrente" || s === "ativo") return "status-green";
  if (s === "inativo") return "status-red";
  if (s === "dados incompletos") return "status-orange";
  return "status-muted";
}

export default function Clientes360() {
  // ---------------------------------------------------------------------------
  // Estado da página (grid, filtros, drawer e ingestão manual)
  // ---------------------------------------------------------------------------
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [marketplaceAccountId, setMarketplaceAccountId] = useState("");
  const [sellerCompanyId, setSellerCompanyId] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTab, setSelectedTab] = useState("geral");
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    // -------------------------------------------------------------------------
    // Carrega lista/sumário reais de clientes com debounce para busca textual.
    // -------------------------------------------------------------------------
    const t = setTimeout(async () => {
      const base = buildApiUrl(SELLER_CUSTOMERS_LIST_API);
      if (!base) {
        setError("Configure VITE_API_BASE_URL para carregar Clientes 360.");
        setRows([]);
        setSummary(null);
        setLoading(false);
        return;
      }
      const qs = new URLSearchParams();
      if (query.trim()) qs.set("q", query.trim());
      if (marketplace) qs.set("marketplace", marketplace);
      if (marketplaceAccountId) qs.set("marketplace_account_id", marketplaceAccountId);
      if (sellerCompanyId) qs.set("seller_company_id", sellerCompanyId);
      if (stateFilter.trim()) qs.set("state", stateFilter.trim());
      if (cityFilter.trim()) qs.set("city", cityFilter.trim());
      if (statusFilter) qs.set("customer_status", statusFilter);
      if (periodFilter) qs.set("last_purchase_period", periodFilter);

      setLoading(true);
      setError(null);
      const res = await apiFetch(`${base}?${qs.toString()}`, { method: "GET" });
      setLoading(false);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível carregar os clientes.");
        console.error("[clientes360] fetch_failed", { status: res.status, message: res.error ?? "unknown" });
        setRows([]);
        setSummary(null);
        return;
      }
      setRows(Array.isArray(res.data?.customers) ? res.data.customers : []);
      setSummary(res.data?.summary ?? null);
    }, 350);
    return () => clearTimeout(t);
  }, [query, marketplace, marketplaceAccountId, sellerCompanyId, stateFilter, cityFilter, statusFilter, periodFilter, reloadTick]);

  useEffect(() => {
    // -------------------------------------------------------------------------
    // Carrega detalhe 360 do cliente somente quando drawer é aberto.
    // -------------------------------------------------------------------------
    if (!selectedCustomerId) return;
    const load = async () => {
      const base = buildApiUrl(`${SELLER_CUSTOMERS_LIST_API}/${selectedCustomerId}`);
      if (!base) return;
      const res = await apiFetch(base, { method: "GET" });
      if (!res.ok) return;
      setSelectedCustomer(res.data ?? null);
    };
    void load();
  }, [selectedCustomerId]);

  async function runIngestion() {
    // -------------------------------------------------------------------------
    // Endpoint manual temporário para popular customer base com vendas já syncadas.
    // -------------------------------------------------------------------------
    const base = buildApiUrl(SELLER_CUSTOMERS_INGEST_API);
    if (!base) return;
    setIngesting(true);
    setIngestMsg("");
    const res = await apiFetch(base, { method: "POST" });
    setIngesting(false);
    if (!res.ok) {
      setIngestMsg("Nao foi possivel atualizar os clientes agora.");
      return;
    }
    setIngestMsg(
      `Ingestao concluida: ${res.data?.processedOrders ?? 0} vendas processadas, ${res.data?.createdCustomers ?? 0} clientes criados.`
    );
    setReloadTick((v) => v + 1);
  }

  const hasActiveClientFilters = useMemo(() => {
    return (
      query.trim().length > 0 ||
      Boolean(marketplace) ||
      Boolean(marketplaceAccountId.trim()) ||
      Boolean(sellerCompanyId.trim()) ||
      Boolean(stateFilter.trim()) ||
      Boolean(cityFilter.trim()) ||
      Boolean(periodFilter) ||
      Boolean(statusFilter)
    );
  }, [query, marketplace, marketplaceAccountId, sellerCompanyId, stateFilter, cityFilter, periodFilter, statusFilter]);

  const clearAllClientFilters = () => {
    setQuery("");
    setMarketplace("");
    setMarketplaceAccountId("");
    setSellerCompanyId("");
    setStateFilter("");
    setCityFilter("");
    setPeriodFilter("");
    setStatusFilter("");
  };

  return (
    <div className="clientes360-page">
      <h1 className="products-catalog__sr-title">Clientes 360</h1>
      {ingestMsg ? <p className="clientes360-inline-msg">{ingestMsg}</p> : null}

      <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Indicadores de clientes">
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Top 10 — clientes</h2>
          </header>
          <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
        </article>

        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Top 10 — relacionamento</h2>
          </header>
          <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
        </article>

        <div className="anuncios-catalog__kpi-minis" aria-label="Sinais dos clientes">
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--profit">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Ativos</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--warn">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Receita</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--decline">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Dados incompletos</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--sales">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Ticket medio</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
        </div>
      </section>

      <div className="products-catalog__controls s7-sticky-filters s7-catalog-filter-card">
        <div className="products-catalog__controls-top">
          <div className="products-catalog__search-wrap">
            <div className="products-catalog__search-field">
              <span className="products-catalog__search-icon" aria-hidden>
                <S7Icon name="search" size={18} strokeWidth={1.85} />
              </span>
              <S7Input
                label=""
                name="clientes360-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ, e-mail, telefone ou cidade"
                className="products-catalog__search-s7"
                inputClassName="products-catalog__search-input-field"
                autoComplete="off"
                aria-label="Buscar clientes por nome, CPF/CNPJ, e-mail, telefone ou cidade"
                rightElement={
                  query.trim() ? (
                    <button
                      type="button"
                      className="products-catalog__search-clear"
                      onClick={(e) => {
                        e.preventDefault();
                        setQuery("");
                      }}
                      aria-label="Limpar busca"
                    >
                      <S7Icon name="close" size={16} strokeWidth={2} />
                    </button>
                  ) : null
                }
              />
            </div>
          </div>
        </div>
        <div className="products-catalog__controls-main">
          <div className="products-catalog__filter-row products-catalog__filter-row--spread" role="toolbar" aria-label="Filtros rápidos de clientes">
            <div className="products-catalog__filter-row-chips">
              {STATUS_FILTER_CHIPS.map((chip) => {
                const isActive = statusFilter === chip.id;
                return (
                  <button
                    key={chip.id || "all"}
                    type="button"
                    className={`products-catalog__filter-chip${isActive ? " products-catalog__filter-chip--active" : ""}`}
                    aria-pressed={isActive}
                    title={chip.label}
                    onClick={() => setStatusFilter(chip.id)}
                  >
                    <span className={`products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${chip.iconTone}`} aria-hidden>
                      <S7Icon name={chip.icon} size={15} strokeWidth={1.65} />
                    </span>
                    <span className="products-catalog__filter-chip-label">{chip.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="products-catalog__filter-clear"
                disabled={!hasActiveClientFilters}
                title="Limpar busca e filtros avançados"
                onClick={clearAllClientFilters}
              >
                <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="products-catalog__filter-clear-icon" />
                <span>Limpar filtros</span>
              </button>
            </div>
            <div className="products-catalog__filter-row-end">
              <S7Button type="button" variant="secondary" size="sm" onClick={() => setReloadTick((v) => v + 1)} disabled={loading}>
                Atualizar lista
              </S7Button>
            </div>
          </div>
          <div className="clientes360-filter-advanced" aria-label="Filtros avançados">
            <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} aria-label="Marketplace">
              <option value="">Marketplace</option>
              <option value="mercado_livre">Mercado Livre</option>
              <option value="shopee">Shopee</option>
            </select>
            <input
              value={marketplaceAccountId}
              onChange={(e) => setMarketplaceAccountId(e.target.value)}
              placeholder="Conta marketplace (id)"
              aria-label="ID da conta marketplace"
            />
            <input
              value={sellerCompanyId}
              onChange={(e) => setSellerCompanyId(e.target.value)}
              placeholder="Empresa/CNPJ seller (id)"
              aria-label="ID da empresa seller"
            />
            <input value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} placeholder="Estado" aria-label="Estado" />
            <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Cidade" aria-label="Cidade" />
            <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} aria-label="Última compra">
              <option value="">Última compra</option>
              <option value="30d">Até 30 dias</option>
              <option value="60d">Até 60 dias</option>
              <option value="90d">Até 90 dias</option>
              <option value="180d">Até 180 dias</option>
            </select>
          </div>
        </div>
      </div>

      {error ? <p className="clientes360-error">{error}</p> : null}

      <div className="clientes360-table-wrap clientes360-table-wrap--orange">
        <table className="clientes360-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>E-mail</th>
              <th>WhatsApp/Telefone</th>
              <th>Cidade/Estado</th>
              <th>Total de pedidos</th>
              <th>Total comprado</th>
              <th>Última compra</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10}>Carregando...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10}>Nenhum cliente encontrado para os filtros atuais.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name || "Cliente não identificado"}</td>
                  <td>{row.document || DASH}</td>
                  <td>{maskEmailTable(row.email, row.email_is_masked) || DASH}</td>
                  <td>
                    <div className="clientes360-contact-cell">
                      <span>{maskPhoneTable(row.whatsapp || row.phone) || DASH}</span>
                      {waMeHref(row.whatsapp_e164) ? (
                        <a
                          className="clientes360-wa-btn"
                          href={waMeHref(row.whatsapp_e164)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td>{[row.city, row.state].filter(Boolean).join("/") || DASH}</td>
                  <td>{row.total_orders ?? 0}</td>
                  <td>{brl(row.total_spent_brl)}</td>
                  <td>{formatDate(row.last_purchase_at)}</td>
                  <td>
                    <span className={`clientes360-status ${statusClass(row.customer_status)}`}>{row.customer_status || DASH}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="clientes360-linkbtn"
                      onClick={() => {
                        setSelectedCustomerId(row.id);
                        setSelectedTab("geral");
                      }}
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomerId ? (
        <div className="clientes360-drawer-backdrop" onClick={() => setSelectedCustomerId(null)}>
          <aside className="clientes360-drawer" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>{selectedCustomer?.customer?.name || "Cliente 360"}</h2>
              <button type="button" onClick={() => setSelectedCustomerId(null)}>
                Fechar
              </button>
            </header>
            <nav>
              {[
                ["geral", "Visão geral"],
                ["dados", "Dados do comprador"],
                ["faturamento", "Faturamento"],
                ["enderecos", "Endereços"],
                ["historico", "Histórico de vendas"],
                ["insights", "Insights"],
              ].map(([id, label]) => (
                <button key={id} type="button" className={selectedTab === id ? "active" : ""} onClick={() => setSelectedTab(id)}>
                  {label}
                </button>
              ))}
            </nav>
            <section className="clientes360-drawer-body">
              {selectedTab === "geral" ? (
                <dl className="clientes360-detail-grid">
                  <div><dt>Nome</dt><dd>{selectedCustomer?.customer?.name || DASH}</dd></div>
                  <div><dt>Status</dt><dd>{selectedCustomer?.metrics?.customer_status || DASH}</dd></div>
                  <div><dt>Score</dt><dd>{selectedCustomer?.metrics?.customer_score ?? DASH}</dd></div>
                  <div><dt>Total comprado</dt><dd>{brl(selectedCustomer?.metrics?.total_spent_brl ?? 0)}</dd></div>
                  <div><dt>Total de pedidos</dt><dd>{selectedCustomer?.metrics?.total_orders ?? 0}</dd></div>
                  <div><dt>Ticket médio</dt><dd>{brl(selectedCustomer?.metrics?.average_ticket_brl ?? 0)}</dd></div>
                  <div><dt>Primeira compra</dt><dd>{formatDate(selectedCustomer?.metrics?.first_purchase_at)}</dd></div>
                  <div><dt>Última compra</dt><dd>{formatDate(selectedCustomer?.metrics?.last_purchase_at)}</dd></div>
                </dl>
              ) : null}
              {selectedTab === "dados" ? (
                <dl className="clientes360-detail-grid">
                  <div><dt>Nome</dt><dd>{selectedCustomer?.customer?.name || DASH}</dd></div>
                  <div><dt>CPF/CNPJ</dt><dd>{selectedCustomer?.customer?.document_number || selectedCustomer?.customer?.cpf || selectedCustomer?.customer?.cnpj || DASH}</dd></div>
                  <div><dt>E-mail</dt><dd>{selectedCustomer?.customer?.email || DASH}</dd></div>
                  <div><dt>Telefone</dt><dd>{selectedCustomer?.customer?.phone || DASH}</dd></div>
                  <div><dt>WhatsApp</dt><dd>{selectedCustomer?.customer?.whatsapp || DASH}</dd></div>
                  <div>
                    <dt>WhatsApp (internacional)</dt>
                    <dd>
                      {selectedCustomer?.customer?.whatsapp_e164 ? (
                        <>
                          {selectedCustomer.customer.whatsapp_e164}{" "}
                          {waMeHref(selectedCustomer.customer.whatsapp_e164) ? (
                            <a
                              className="clientes360-wa-btn clientes360-wa-btn--inline"
                              href={waMeHref(selectedCustomer.customer.whatsapp_e164)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Abrir WhatsApp
                            </a>
                          ) : null}
                        </>
                      ) : (
                        DASH
                      )}
                    </dd>
                  </div>
                  <div><dt>Tipo pessoa/negócio</dt><dd>{selectedCustomer?.customer?.is_business == null ? DASH : selectedCustomer.customer.is_business ? "Negócio/empresa" : "Pessoa física"}</dd></div>
                </dl>
              ) : null}
              {selectedTab === "faturamento" ? (
                <dl className="clientes360-detail-grid">
                  <div><dt>NF-e em anexo</dt><dd>{selectedCustomer?.customer?.billing?.nfe_em_anexo || DASH}</dd></div>
                  <div><dt>Dados pessoais ou empresa</dt><dd>{selectedCustomer?.customer?.billing?.dados_pessoais_ou_empresa || DASH}</dd></div>
                  <div><dt>Tipo documento</dt><dd>{selectedCustomer?.customer?.billing?.tipo_numero_documento || DASH}</dd></div>
                  <div><dt>Número documento</dt><dd>{selectedCustomer?.customer?.billing?.document_number || DASH}</dd></div>
                  <div><dt>Endereço faturamento</dt><dd>{selectedCustomer?.customer?.billing?.faturamento_endereco || DASH}</dd></div>
                  <div><dt>Tipo contribuinte</dt><dd>{selectedCustomer?.customer?.billing?.tipo_contribuinte || DASH}</dd></div>
                  <div><dt>Inscrição estadual</dt><dd>{selectedCustomer?.customer?.billing?.inscricao_estadual || DASH}</dd></div>
                </dl>
              ) : null}
              {selectedTab === "enderecos" ? (
                <dl className="clientes360-detail-grid">
                  <div><dt>Endereço principal</dt><dd>{selectedCustomer?.customer?.address?.address_raw || DASH}</dd></div>
                  <div><dt>Rua</dt><dd>{selectedCustomer?.customer?.address?.street || DASH}</dd></div>
                  <div><dt>Número</dt><dd>{selectedCustomer?.customer?.address?.number || DASH}</dd></div>
                  <div><dt>Complemento</dt><dd>{selectedCustomer?.customer?.address?.complement || DASH}</dd></div>
                  <div><dt>Bairro</dt><dd>{selectedCustomer?.customer?.address?.neighborhood || DASH}</dd></div>
                  <div><dt>Cidade</dt><dd>{selectedCustomer?.customer?.address?.city || DASH}</dd></div>
                  <div><dt>Estado</dt><dd>{selectedCustomer?.customer?.address?.state || DASH}</dd></div>
                  <div><dt>CEP</dt><dd>{selectedCustomer?.customer?.address?.zip_code || DASH}</dd></div>
                  <div><dt>Pais</dt><dd>{selectedCustomer?.customer?.address?.country || DASH}</dd></div>
                </dl>
              ) : null}
              {selectedTab === "historico" ? (
                <div className="clientes360-orders-list">
                  {(selectedCustomer?.orders ?? []).map((o) => (
                    <article key={o.id} className="clientes360-order-card">
                      <span>Pedido: {o.external_order_id || DASH}</span>
                      <span>Pack: {o.external_pack_id || DASH}</span>
                      <span>Data: {formatDate(o.order_date)}</span>
                      <span>Status: {o.order_status || DASH}</span>
                      <span>Bruto: {brl(o.gross_amount_brl)}</span>
                      <span>Pago: {brl(o.paid_amount_brl)}</span>
                    </article>
                  ))}
                  {(selectedCustomer?.orders ?? []).length === 0 ? <p>Nenhum pedido vinculado ainda.</p> : null}
                </div>
              ) : null}
              {selectedTab === "insights" ? (
                <ul>
                  <li>{(selectedCustomer?.metrics?.total_orders ?? 0) >= 2 ? "Cliente recorrente identificado." : "Cliente com primeira compra registrada."}</li>
                  <li>
                    {!selectedCustomer?.customer?.email &&
                    !selectedCustomer?.customer?.phone &&
                    !selectedCustomer?.customer?.whatsapp &&
                    !selectedCustomer?.customer?.whatsapp_e164
                      ? "Cliente sem contato completo."
                      : "Cliente com pelo menos um contato disponível."}
                  </li>
                  <li>{(selectedCustomer?.metrics?.days_since_last_purchase ?? 0) > 90 ? `Cliente inativo ha ${selectedCustomer.metrics.days_since_last_purchase} dias.` : "Cliente com atividade recente."}</li>
                  <li>{Number(selectedCustomer?.metrics?.average_ticket_brl ?? 0) >= 200 ? "Ticket medio relevante para campanhas premium." : "Ticket medio em faixa padrão."}</li>
                </ul>
              ) : null}
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

