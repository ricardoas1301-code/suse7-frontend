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

/**
 * @param {{
 *   tickets: import('./sellerTicketsTypes').SellerTicket[];
 *   onOpen: (ticket: import('./sellerTicketsTypes').SellerTicket) => void;
 * }} props
 */
export default function SellerTicketsQueue({ tickets, onOpen }) {
  return (
    <div className="dc-table-wrap dc-tickets-queue">
      <table className="dc-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Seller</th>
            <th>Assunto</th>
            <th>Categoria</th>
            <th>Prioridade</th>
            <th>Status</th>
            <th>Marketplace</th>
            <th>Responsável</th>
            <th>Atualização</th>
            <th>SLA</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={11}>Nenhum ticket encontrado com os filtros atuais.</td>
            </tr>
          ) : (
            tickets.map((t) => (
              <tr key={t.id}>
                <td className="dc-tickets-queue__id">{t.id}</td>
                <td>
                  <div className="dc-tickets-queue__seller">
                    <strong>{t.sellerName}</strong>
                    <span>{t.sellerEmail}</span>
                  </div>
                </td>
                <td className="dc-tickets-queue__subject">{t.subject}</td>
                <td>{ticketLabel(t.category, TICKET_CATEGORIES)}</td>
                <td>
                  <span className={priorityClass(t.priority)}>{ticketLabel(t.priority, TICKET_PRIORITIES)}</span>
                </td>
                <td>
                  <span className={statusClass(t.status)}>{ticketLabel(t.status, TICKET_STATUSES)}</span>
                </td>
                <td>{ticketLabel(t.marketplace, TICKET_MARKETPLACES)}</td>
                <td>{ticketLabel(t.assignee, TICKET_ASSIGNEES)}</td>
                <td className="dc-tickets-queue__when">{formatTicketWhen(t.updatedAt)}</td>
                <td>
                  <span className="dc-tickets-queue__sla">{t.slaLabel}</span>
                </td>
                <td className="dc-table__actions">
                  <S7Button type="button" variant="secondary" size="sm" onClick={() => onOpen(t)}>
                    Abrir
                  </S7Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
