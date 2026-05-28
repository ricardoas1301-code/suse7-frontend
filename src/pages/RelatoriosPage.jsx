// ======================================================================
// Página /relatórios — shell alinhado ao card busca+filtros de Anúncios/Produtos.
// Conteúdo analítico: evoluir aqui; hoje apenas estado vazio honesto.
// ======================================================================

import { useMemo, useState } from "react";
import "../components/Products.css";
import "../components/Anuncios.css";
import "./RelatoriosPage.css";
import S7Input from "../components/ui/S7Input";
import S7Icon from "../components/ui/S7Icon";
import S7EmptyState from "../components/ui/S7EmptyState";

const REPORT_FILTER_CHIPS = [
  { id: "all", label: "Todos", icon: "catalog_filter_all", iconTone: "neutral", enabled: true },
  { id: "vendas", label: "Vendas", icon: "catalog_filter_with_sales", iconTone: "success", enabled: false },
  { id: "margem", label: "Margem", icon: "catalog_filter_low_margin", iconTone: "warning", enabled: false },
  { id: "estoque", label: "Estoque", icon: "catalog_filter_low_stock", iconTone: "slate", enabled: false },
];

export default function RelatoriosPage() {
  const [q, setQ] = useState("");
  const [filterId, setFilterId] = useState("all");

  const hasActive = useMemo(() => q.trim().length > 0 || filterId !== "all", [q, filterId]);

  const clearAll = () => {
    setQ("");
    setFilterId("all");
  };

  return (
    <div className="relatorios-page">
      <h1 className="products-catalog__sr-title">Relatórios</h1>

      <section className="s7-core-kpis anuncios-catalog__kpis" aria-label="Indicadores de relatórios">
        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-blue">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Relatórios gerenciais</h2>
          </header>
          <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
        </article>

        <article className="anuncios-catalog__kpi-card anuncios-catalog__kpi-card--large anuncios-catalog__kpi-card--accent-orange">
          <header className="anuncios-catalog__kpi-head">
            <h2 className="anuncios-catalog__kpi-title">Exportações</h2>
          </header>
          <div className="anuncios-catalog__kpi-body anuncios-catalog__kpi-body--empty" />
        </article>

        <div className="anuncios-catalog__kpi-minis" aria-label="Atalhos">
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--profit">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Vendas</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--warn">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Financeiro</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--decline">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Operação</h3>
            </div>
            <div className="anuncios-catalog__kpi-mini-body anuncios-catalog__kpi-mini-body--empty" />
          </article>
          <article className="anuncios-catalog__kpi-mini anuncios-catalog__kpi-mini--sales">
            <div className="anuncios-catalog__kpi-mini-head">
              <h3 className="anuncios-catalog__kpi-mini-title">Agendados</h3>
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
                name="relatorios-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar relatório por nome, tipo ou período"
                className="products-catalog__search-s7"
                inputClassName="products-catalog__search-input-field"
                autoComplete="off"
                aria-label="Buscar relatórios"
                rightElement={
                  q.trim() ? (
                    <button
                      type="button"
                      className="products-catalog__search-clear"
                      onClick={(e) => {
                        e.preventDefault();
                        setQ("");
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
          <div className="products-catalog__filter-row products-catalog__filter-row--spread" role="toolbar" aria-label="Filtros de relatórios">
            <div className="products-catalog__filter-row-chips">
              {REPORT_FILTER_CHIPS.map((def) => {
                const isActive = filterId === def.id;
                return (
                  <button
                    key={def.id}
                    type="button"
                    className={`products-catalog__filter-chip${isActive ? " products-catalog__filter-chip--active" : ""}${def.enabled ? "" : " products-catalog__filter-chip--disabled"}`}
                    aria-pressed={def.enabled ? isActive : undefined}
                    disabled={!def.enabled}
                    title={def.enabled ? def.label : `${def.label} — em breve`}
                    onClick={() => {
                      if (!def.enabled) return;
                      setFilterId(def.id);
                    }}
                  >
                    <span className={`products-catalog__filter-chip-icon products-catalog__filter-chip-icon--${def.iconTone}`} aria-hidden>
                      <S7Icon name={def.icon} size={15} strokeWidth={1.65} />
                    </span>
                    <span className="products-catalog__filter-chip-label">{def.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="products-catalog__filter-clear"
                disabled={!hasActive}
                title="Limpar busca e filtros"
                onClick={clearAll}
              >
                <S7Icon name="filter_clear" size={14} strokeWidth={1.75} className="products-catalog__filter-clear-icon" />
                <span>Limpar filtros</span>
              </button>
            </div>
            <div className="products-catalog__filter-row-end">
              <button type="button" className="products-catalog__filter-chip products-catalog__filter-chip--disabled" disabled title="Em breve">
                <span className="products-catalog__filter-chip-icon products-catalog__filter-chip-icon--slate" aria-hidden>
                  <S7Icon name="reports" size={15} strokeWidth={1.65} />
                </span>
                <span className="products-catalog__filter-chip-label">Gerar relatório</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="products-catalog__filter-empty-card relatorios-page__empty" role="status">
        <S7EmptyState
          title="Relatórios em construção"
          description="Os indicadores acima e esta barra seguem o mesmo padrão visual de Anúncios e Produtos. Em breve você poderá gerar e exportar relatórios a partir daqui."
        />
      </div>
    </div>
  );
}
