// ======================================================================
//  DASHBOARD — SUSE7 PREMIUM
//  Verifica status da integração do Mercado Livre
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // ✅ caminho existente no seu projeto
import MarketplaceCard from "./MarketplaceCard";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // 1) Buscar usuário logado
  // ==========================================================
  useEffect(() => {
    const loadStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("❌ Nenhum usuário logado.");
        setLoading(false);
        return;
      }

      console.log("👤 Usuário logado:", user.id);

// ==========================================================
// 2) Consultar backend → status ML
// ==========================================================
try {
    // 💡 SOLUÇÃO: Adicione o user_id como Query Parameter
    const apiUrl = `${import.meta.env.VITE_API_URL}/ml/status?user_id=${user.id}`;

    const res = await fetch(
      apiUrl, // <-- Use a URL completa
      { credentials: "include" }
    );
        const data = await res.json();
        console.log("📡 Status ML:", data);

        if (data.connected) {
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Erro ao buscar status ML:", err);
      }

      setLoading(false);
    };

    loadStatus();
  }, []);


// -----------------------------------------------------
// FUNÇÃO: Conectar Mercado Livre (HashRouter)
// -----------------------------------------------------
const handleConnectML = () => {
  console.log("Conectando Mercado Livre...");
  window.location.hash = "#/ml/connect";
};


  return (
    <div className="dashboard-wrapper">
      <div className="dash-grid-1">
       <MarketplaceCard
  name="Mercado Livre"
  count={0}
  buttonText={
    loading ? "Carregando..." : isConnected ? "Conectado ✔" : "Conectar"
  }
  color="#ffe600"
  icon="🛒"
  onClick={isConnected ? null : handleConnectML}

/>
      </div>
    </div>
  );
}
