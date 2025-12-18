// ======================================================================
//  DASHBOARD — SUSE7 (FIX DEPLOY PATH)
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; 
import MarketplaceCard from "./MarketplaceCard";
import CompleteProfileModal from "./CompleteProfileModal";
// CORREÇÃO AQUI: Mudamos de "../components/" para "./" 
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

{perfilIncompleto && userId && (
  <CompleteProfileModal
    userId={userId}
    onSuccess={() => setPerfilIncompleto(false)}
  />
)}

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("primeiro_login")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile?.primeiro_login) {
          setPerfilIncompleto(true);
        }

        const apiUrl = `${import.meta.env.VITE_API_URL}/api/ml/status?user_id=${user.id}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.connected) setIsConnected(true);
        }

      } catch (err) {
        console.error("Erro no Dashboard:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleConnectML = () => navigate("/ml/connect");

  return (
    <div className="dashboard-wrapper">
      {/* O modal só abre se o perfil estiver incompleto */}
      {perfilIncompleto && userId && (
        <CompleteProfileModal 
          userId={userId} 
          onSuccess={() => setPerfilIncompleto(false)} 
        />
      )}

      <div className="dash-grid-1">
        <MarketplaceCard
          name="Mercado Livre"
          count={0}
          buttonText={loading ? "Carregando..." : isConnected ? "Conectado ✔" : "Conectar"}
          color="#ffe600"
          icon="🛒"
          onClick={(!loading && !isConnected) ? handleConnectML : null}
        />
      </div>
    </div>
  );
}