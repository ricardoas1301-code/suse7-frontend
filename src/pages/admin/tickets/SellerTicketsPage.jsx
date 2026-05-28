import { useMemo, useState } from "react";
import { MOCK_SELLER_TICKETS } from "./sellerTicketsMockData";
import { computeTicketStats, filterTickets } from "./sellerTicketsUtils";
import SellerTicketStats from "./SellerTicketStats";
import SellerTicketFilters from "./SellerTicketFilters";
import SellerTicketsQueue from "./SellerTicketsQueue";
import SellerTicketDrawer from "./SellerTicketDrawer";
import "./SellerTickets.css";

const DEFAULT_FILTERS = {
  q: "",
  status: "",
  priority: "",
  category: "",
  marketplace: "",
  assignee: "",
};

export default function SellerTicketsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(/** @type {import('./sellerTicketsTypes').SellerTicket | null} */ (null));

  const filtered = useMemo(() => filterTickets(MOCK_SELLER_TICKETS, filters), [filters]);
  const stats = useMemo(() => computeTicketStats(MOCK_SELLER_TICKETS), []);

  const patchFilters = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <section className="dc-module dc-tickets-page">
      <header className="dc-module__head">
        <h2>Tickets do Seller</h2>
        <p className="dc-module__desc">
          Central operacional de atendimento aos sellers — fila, detalhe e histórico (dados mock Fase C).
        </p>
      </header>

      <SellerTicketStats stats={stats} />

      <SellerTicketFilters filters={filters} onChange={patchFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />

      <SellerTicketsQueue tickets={filtered} onOpen={setSelected} />

      <SellerTicketDrawer ticket={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
