import { formatTicketWhen } from "./sellerTicketsUtils";

/**
 * @param {{ notes: import('./sellerTicketsTypes').SellerTicketNote[] }} props
 */
export default function SellerTicketInternalNotes({ notes }) {
  return (
    <section className="dc-ticket-panel dc-ticket-panel--internal">
      <h4 className="dc-ticket-panel__title">Notas internas (equipe S7)</h4>
      <p className="dc-ticket-panel__hint">Visível apenas para administradores — não é enviado ao seller.</p>
      <ul className="dc-ticket-notes">
        {notes.length === 0 ? (
          <li className="dc-ticket-notes__empty">Nenhuma nota interna.</li>
        ) : (
          notes.map((n) => (
            <li key={n.id} className="dc-ticket-notes__item">
              <div className="dc-ticket-notes__meta">
                <strong>{n.author}</strong>
                <time>{formatTicketWhen(n.at)}</time>
              </div>
              <p>{n.body}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

/**
 * @param {{ messages: import('./sellerTicketsTypes').SellerTicketMessage[] }} props
 */
export function SellerTicketMessages({ messages }) {
  const sorted = [...messages].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <section className="dc-ticket-panel">
      <h4 className="dc-ticket-panel__title">Mensagens com o seller</h4>
      <ul className="dc-ticket-messages">
        {sorted.length === 0 ? (
          <li className="dc-ticket-messages__empty">Nenhuma mensagem.</li>
        ) : (
          sorted.map((m) => (
            <li key={m.id} className={`dc-ticket-messages__item dc-ticket-messages__item--${m.type}`}>
              <div className="dc-ticket-messages__meta">
                <strong>{m.author}</strong>
                <time>{formatTicketWhen(m.at)}</time>
              </div>
              <p>{m.body}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
