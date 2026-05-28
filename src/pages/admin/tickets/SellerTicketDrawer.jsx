import { S7Button } from "../../../components/ui";
import {
  TICKET_ASSIGNEES,
  TICKET_CATEGORIES,
  TICKET_MARKETPLACES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  ticketLabel,
} from "./sellerTicketsConstants";
import { formatTicketWhen, priorityClass, statusClass } from "./sellerTicketsUtils";
import SellerTicketTimeline from "./SellerTicketTimeline";
import SellerTicketInternalNotes, { SellerTicketMessages } from "./SellerTicketInternalNotes";

/**
 * @param {{
 *   ticket: import('./sellerTicketsTypes').SellerTicket | null;
 *   onClose: () => void;
 * }} props
 */
export default function SellerTicketDrawer({ ticket, onClose }) {
  if (!ticket) return null;

  return (
    <div className="dc-drawer-backdrop dc-tickets-drawer-backdrop" onClick={onClose}>
      <aside className="dc-drawer dc-tickets-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="dc-tickets-drawer__head">
          <div>
            <p className="dc-tickets-drawer__id">{ticket.id}</p>
            <h3>{ticket.subject}</h3>
            <p className="dc-tickets-drawer__seller">
              {ticket.sellerName} · {ticket.sellerEmail}
            </p>
          </div>
          <S7Button type="button" variant="ghost" size="sm" className="dc-btn-ghost" onClick={onClose}>
            Fechar
          </S7Button>
        </header>

        <div className="dc-tickets-drawer__meta">
          <span className={priorityClass(ticket.priority)}>{ticketLabel(ticket.priority, TICKET_PRIORITIES)}</span>
          <span className={statusClass(ticket.status)}>{ticketLabel(ticket.status, TICKET_STATUSES)}</span>
          <span className="dc-ticket-pill dc-ticket-pill--neutral">{ticketLabel(ticket.category, TICKET_CATEGORIES)}</span>
          <span className="dc-ticket-pill dc-ticket-pill--neutral">
            {ticketLabel(ticket.marketplace, TICKET_MARKETPLACES)}
          </span>
          <span className="dc-tickets-drawer__sla">SLA: {ticket.slaLabel}</span>
        </div>

        <div className="dc-tickets-drawer__kv">
          <div>
            <span>Responsável</span>
            <strong>{ticketLabel(ticket.assignee, TICKET_ASSIGNEES)}</strong>
          </div>
          <div>
            <span>Aberto em</span>
            <strong>{formatTicketWhen(ticket.createdAt)}</strong>
          </div>
          <div>
            <span>Última atualização</span>
            <strong>{formatTicketWhen(ticket.updatedAt)}</strong>
          </div>
        </div>

        <div className="dc-tickets-drawer__actions">
          <S7Button type="button" variant="secondary" size="sm" disabled title="Disponível em fase futura">
            Atribuir
          </S7Button>
          <S7Button type="button" variant="secondary" size="sm" disabled title="Disponível em fase futura">
            Alterar status
          </S7Button>
          <S7Button type="button" variant="primary" size="sm" disabled title="Disponível em fase futura">
            Responder seller
          </S7Button>
        </div>

        <div className="dc-tickets-drawer__scroll">
          <SellerTicketMessages messages={ticket.messages} />
          <SellerTicketInternalNotes notes={ticket.internalNotes} />
          <SellerTicketTimeline events={ticket.timeline} />
        </div>
      </aside>
    </div>
  );
}
