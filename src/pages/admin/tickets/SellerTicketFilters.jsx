import S7Input from "../../../components/ui/S7Input";
import { S7Button } from "../../../components/ui";
import {
  TICKET_ASSIGNEES,
  TICKET_CATEGORIES,
  TICKET_MARKETPLACES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "./sellerTicketsConstants";

const EMPTY = "";

/**
 * @param {{
 *   filters: import('./sellerTicketsTypes').TicketFilters;
 *   onChange: (patch: Partial<import('./sellerTicketsTypes').TicketFilters>) => void;
 *   onReset: () => void;
 * }} props
 */
export default function SellerTicketFilters({ filters, onChange, onReset }) {
  return (
    <div className="dc-tickets-filters">
      <div className="dc-tickets-filters__search">
        <S7Input
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Buscar ticket, seller ou assunto"
        />
      </div>
      <div className="dc-tickets-filters__grid">
        <label className="dc-tickets-filters__field">
          <span>Status</span>
          <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {TICKET_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-tickets-filters__field">
          <span>Prioridade</span>
          <select value={filters.priority} onChange={(e) => onChange({ priority: e.target.value })}>
            <option value={EMPTY}>Todas</option>
            {TICKET_PRIORITIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-tickets-filters__field">
          <span>Categoria</span>
          <select value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
            <option value={EMPTY}>Todas</option>
            {TICKET_CATEGORIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-tickets-filters__field">
          <span>Marketplace</span>
          <select value={filters.marketplace} onChange={(e) => onChange({ marketplace: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {TICKET_MARKETPLACES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dc-tickets-filters__field">
          <span>Responsável</span>
          <select value={filters.assignee} onChange={(e) => onChange({ assignee: e.target.value })}>
            <option value={EMPTY}>Todos</option>
            {TICKET_ASSIGNEES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="dc-tickets-filters__actions">
        <S7Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Limpar filtros
        </S7Button>
      </div>
    </div>
  );
}
