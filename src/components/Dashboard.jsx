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


export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
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

        // Busca o perfil
        let { data: profile } = await supabase
          .from("profiles")
          .select("id, primeiro_login")
          .eq("id", user.id)
          .maybeSingle();

        // Se não existir profile (Login Social), cria um novo
        if (!profile) {
          const { data: newProfile, error } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              primeiro_login: true,
              created_at: new Date(),
              last_login: new Date(),
            })
            .select()
            .single();

          if (error) throw error;
          profile = newProfile;
        }

        // LOGICA DE ABERTURA: Se for primeiro login, abre o modal
        if (profile && profile.primeiro_login === true) {
          console.log("Usuário novo detectado, abrindo modal...");
          setShowCompleteProfile(true);
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

  // Função para fechar o modal e atualizar o estado local
  const handleCloseModal = () => {
    setShowCompleteProfile(false);
  };

  return (
    <div className="dashboard-wrapper">
      {/* Removi o 'profileLoaded' e usei 'showCompleteProfile'. 
          O Modal só será renderizado se showCompleteProfile for true.
      */}
      {showCompleteProfile && (
        <CompleteProfileModal
          show={true}
          profileId={userId}
          onClose={handleCloseModal}
        />
      )}

      <div className="dash-grid-1">
        <MarketplaceCard
          name="Mercado Livre"
          count={0}
          buttonText={loading ? "Carregando..." : "Conectar"} // Simplificado para o exemplo
          color="#ffe600"
          icon="🛒"
          onClick={handleConnectML}
        />
      </div>
    </div>
  );
}