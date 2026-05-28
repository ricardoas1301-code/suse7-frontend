/**
 * Tipos JSDoc — Tickets do Seller (Fase C)
 * Backend futuro: seller_tickets, seller_ticket_messages, seller_ticket_notes, seller_ticket_events
 */

/**
 * @typedef {'seller'|'team'} TicketMessageType
 * @typedef {'system'|'status'|'message'|'note'} TicketTimelineKind
 */

/**
 * @typedef {Object} SellerTicketMessage
 * @property {string} id
 * @property {TicketMessageType} type
 * @property {string} author
 * @property {string} body
 * @property {string} at
 */

/**
 * @typedef {Object} SellerTicketNote
 * @property {string} id
 * @property {string} author
 * @property {string} body
 * @property {string} at
 */

/**
 * @typedef {Object} SellerTicketTimelineEvent
 * @property {string} id
 * @property {TicketTimelineKind} kind
 * @property {string} label
 * @property {string} at
 */

/**
 * @typedef {Object} SellerTicket
 * @property {string} id
 * @property {string} sellerName
 * @property {string} sellerEmail
 * @property {string} subject
 * @property {string} category
 * @property {string} priority
 * @property {string} status
 * @property {string} marketplace
 * @property {string} assignee
 * @property {string} slaLabel
 * @property {string} updatedAt
 * @property {string} createdAt
 * @property {SellerTicketMessage[]} messages
 * @property {SellerTicketNote[]} internalNotes
 * @property {SellerTicketTimelineEvent[]} timeline
 */

/**
 * @typedef {Object} TicketFilters
 * @property {string} q
 * @property {string} status
 * @property {string} priority
 * @property {string} category
 * @property {string} marketplace
 * @property {string} assignee
 */

export {};
