/**
 * @typedef {import('./sellerTicketsTypes').SellerTicket} SellerTicket
 * @typedef {import('./sellerTicketsTypes').TicketFilters} TicketFilters
 */

/**
 * @param {SellerTicket[]} tickets
 */
export function computeTicketStats(tickets) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  return {
    abertos: tickets.filter((t) => t.status === "aberto").length,
    emAtendimento: tickets.filter((t) => t.status === "em_atendimento").length,
    criticos: tickets.filter((t) => t.priority === "critica" && t.status !== "fechado" && t.status !== "resolvido")
      .length,
    aguardandoSeller: tickets.filter((t) => t.status === "aguardando_seller").length,
    resolvidosHoje: tickets.filter((t) => {
      if (t.status !== "resolvido" && t.status !== "fechado") return false;
      return new Date(t.updatedAt).getTime() >= todayMs;
    }).length,
  };
}

/**
 * @param {SellerTicket[]} tickets
 * @param {TicketFilters} filters
 */
export function filterTickets(tickets, filters) {
  const q = String(filters.q || "")
    .trim()
    .toLowerCase();

  return tickets.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.marketplace && t.marketplace !== filters.marketplace) return false;
    if (filters.assignee && t.assignee !== filters.assignee) return false;
    if (!q) return true;
    const hay = [t.id, t.sellerName, t.sellerEmail, t.subject].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

/** @param {string} iso */
export function formatTicketWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** @param {SellerTicket['priority']} p */
export function priorityClass(p) {
  return `dc-ticket-pill dc-ticket-pill--priority-${p}`;
}

/** @param {SellerTicket['status']} s */
export function statusClass(s) {
  return `dc-ticket-pill dc-ticket-pill--status-${s}`;
}
