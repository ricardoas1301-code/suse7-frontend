// ======================================================================
// COMPONENTE: Dashboard — Suse7 Premium
// ======================================================================

import MarketplaceCard from "./MarketplaceCard";
import "../styles/Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-wrapper">

      {/* ---------------------------------------------------
           GRID PRINCIPAL
      ---------------------------------------------------- */}
      <div className="dash-grid-1">
        <MarketplaceCard
          name="Mercado Livre"
          count={0}
          buttonText="Conectar"
          color="#ffe600"
          icon="🛒"
          onClick={() => {
            console.log("Conectando Mercado Livre...");
          }}
        />
      </div>

    </div>
  );
}
