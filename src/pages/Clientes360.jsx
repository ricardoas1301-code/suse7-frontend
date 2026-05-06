import { useEffect, useMemo, useState } from "react";
import { buildApiUrl, apiFetch } from "../config/api";
import "./Clientes360.css";

const DASH = "—";
const STATUS_OPTIONS = ["", "ativo", "recorrente", "novo", "inativo", "dados incompletos"];
const CHIP_OPTIONS = [
  { id: "", label: "Todos" },
  { id: "recorrente", label: "Recorrentes" },
  { id: "ativo", label: "Ativos" },
  { id: "inativo", label: "Inativos" },
  { id: "dados incompletos", label: "Dados incompletos" },
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
      const base = buildApiUrl("/api/customers");
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
      const base = buildApiUrl(`/api/customers/${selectedCustomerId}`);
      if (!base) return;
      const res = await apiFetch(base, { method: "GET" });
      if (!res.ok) return;
      setSelectedCustomer(res.data ?? null);
    };
    void load();
  }, [selectedCustomerId]);

  const cards = useMemo(
    () => [
      { label: "TICKET MEDIO", value: brl(summary?.averageTicketBrl ?? 0), tone: "blue" },
      { label: "RECEITA", value: brl(summary?.totalSpentBrl ?? 0), tone: "orange" },
      {
        label: "ATIVOS",
        value:
          summary?.activeCustomers != null
            ? summary.activeCustomers
            : Math.max(0, Number(summary?.totalCustomers ?? 0) - Number(summary?.inactiveCustomers ?? 0)),
        tone: "green",
      },
      { label: "DADOS INCOMPLETOS", value: summary?.incompleteCustomers ?? 0, tone: "red" },
    ],
    [summary]
  );

  async function runIngestion() {
    // -------------------------------------------------------------------------
    // Endpoint manual temporário para popular customer base com vendas já syncadas.
    // -------------------------------------------------------------------------
    const base = buildApiUrl("/api/customers/ingest-from-sales");
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

  return (
    <div className="clientes360-page">
      <header className="clientes360-head">
        <div>
          <h1>Clientes 360 S7</h1>
          <p>Gerencie compradores, histórico de vendas, dados fiscais e oportunidades de relacionamento.</p>
        </div>
        <div className="clientes360-head-actions">
          <button type="button" onClick={runIngestion} disabled={ingesting}>
            {ingesting ? "Atualizando..." : "Atualizar base"}
          </button>
          <button type="button" disabled>
            Exportar clientes
          </button>
          <button type="button" disabled>
            Criar campanha
          </button>
        </div>
      </header>
      {ingestMsg ? <p className="clientes360-inline-msg">{ingestMsg}</p> : null}

      <section className="clientes360-kpis">
        <div className="clientes360-kpis-left">
          <article className="clientes360-kpi-large clientes360-kpi-large--orange">
            <header>CLIENTES</header>
            <strong>{summary?.totalCustomers ?? 0}</strong>
            <p>Base consolidada de compradores importados das vendas.</p>
          </article>
          <article className="clientes360-kpi-large clientes360-kpi-large--blue">
            <header>RELACIONAMENTO</header>
            <strong>{summary?.recurringCustomers ?? 0}</strong>
            <p>Compradores com mais de um pedido identificado.</p>
          </article>
        </div>
        <div className="clientes360-kpis-right">
          {cards.map((c) => (
            <article key={c.label} className={`clientes360-kpi-mini clientes360-kpi-mini--${c.tone}`}>
              <header>{c.label}</header>
              <strong>{String(c.value)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="clientes360-filters s7-sticky-filters">
        <div className="clientes360-filters-top">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ, e-mail, telefone ou cidade" />
        </div>
        <div className="clientes360-filters-main">
          <div className="clientes360-filter-chips">
            {CHIP_OPTIONS.map((chip) => (
              <button
                key={chip.id || "all"}
                type="button"
                className={statusFilter === chip.id ? "active" : ""}
                onClick={() => setStatusFilter(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
            <option value="">Marketplace</option>
            <option value="mercado_livre">Mercado Livre</option>
            <option value="shopee">Shopee</option>
          </select>
          <input value={marketplaceAccountId} onChange={(e) => setMarketplaceAccountId(e.target.value)} placeholder="Conta marketplace (id)" />
          <input value={sellerCompanyId} onChange={(e) => setSellerCompanyId(e.target.value)} placeholder="Empresa/CNPJ seller (id)" />
          <input value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} placeholder="Estado" />
          <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Cidade" />
          <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
            <option value="">Última compra</option>
            <option value="30d">Até 30 dias</option>
            <option value="60d">Até 60 dias</option>
            <option value="90d">Até 90 dias</option>
            <option value="180d">Até 180 dias</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? s[0].toUpperCase() + s.slice(1) : "Status do cliente"}
              </option>
            ))}
          </select>
        </div>
      </section>

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

