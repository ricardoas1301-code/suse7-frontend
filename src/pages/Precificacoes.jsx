// --------------------------------------------------------
//  PÁGINA DE PRECIFICAÇÕES PREMIUM — SUSE7
//  Layout moderno estilo Notion / Stripe
// --------------------------------------------------------

import "../styles/Precificacoes.css";
import WidgetCard from "../components/WidgetCard";

export default function Precificacoes() {
  return (
    <div className="prec-page">

      {/* -----------------------------------------
          CABEÇALHO PREMIUM
      ------------------------------------------ */}
      <div className="prec-header">
        <div>
          <h1 className="prec-title">Precificações</h1>
          <p className="prec-subtitle">
            Gerencie suas precificações por marketplace de forma inteligente
          </p>
        </div>

        <button className="prec-btn-primary">
          ➕ Nova Precificação
        </button>
      </div>

      {/* -----------------------------------------
          MÉTRICAS PRINCIPAIS
      ------------------------------------------ */}
      <div className="prec-cards-grid">
        <WidgetCard 
          title="Total de Precificações"
          value="0"
          icon="📊"
        />

        <WidgetCard 
          title="Hoje"
          value="0"
          icon="🗓️"
        />

        <WidgetCard 
          title="Este Mês"
          value="0"
          icon="📆"
        />

        <WidgetCard 
          title="Por Marketplace"
          value="0"
          icon="🛒"
        />
      </div>

      {/* -----------------------------------------
          FILTROS (placeholder premium)
      ------------------------------------------ */}
      <div className="prec-filter-box">
        <select className="prec-select">
          <option>Todos os Marketplaces</option>
          <option>Mercado Livre</option>
          <option>Shopee</option>
          <option>Amazon</option>
          <option>Magalu</option>
          <option>Shein</option>
        </select>

        <input
          type="text"
          className="prec-search"
          placeholder="Buscar por nome do produto..."
        />
      </div>

      {/* -----------------------------------------
          TABELA / LISTA (placeholder)
      ------------------------------------------ */}
      <div className="prec-table-placeholder">
        <p>📦 O histórico de precificações aparecerá aqui.</p>
        <span>Crie sua primeira precificação clicando no botão acima.</span>
      </div>

    </div>
  );
}
