// ======================================================================
//  DASHBOARD — SUSE7 (FIX DEPLOY PATH)
// ======================================================================

import "./Dashboard.css";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; 
import MarketplaceCard from "./MarketplaceCard";
import CompleteProfileModal from "./CompleteProfileModal";
// CORREÇÃO AQUI: Mudamos de "../components/" para "./" 
import { useNavigate } from "react-router-dom";
import { MERCADO_LIVRE_BRAND_YELLOW_HEX } from "../theme/marketplaceTheme";


export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  

// ======================================================================
//  EFFECT PRINCIPAL DO DASHBOARD
//  - Busca usuário autenticado
//  - Garante existência do profile (login social)
//  - Decide se deve abrir o modal de completar cadastro
// ======================================================================
useEffect(() => {

  // ------------------------------------------------------
  // Função principal de carregamento do Dashboard
  // ------------------------------------------------------
  const loadDashboardData = async () => {
    try {

      // --------------------------------------------------
      // 1) Obter usuário autenticado via Supabase Auth
      // --------------------------------------------------
      const { data: { user } } = await supabase.auth.getUser();

      // Se não houver usuário autenticado, encerra o fluxo
      if (!user) {
        setLoading(false);
        return;
      }

      // Salva dados básicos do usuário em estado
      setUserId(user.id);

      // --------------------------------------------------
      // 2) Buscar profile do usuário na tabela profiles
      //    (importante para login social)
      // --------------------------------------------------
      let { data: profile } = await supabase
        .from("profiles")
        .select("id, primeiro_login")
        .eq("id", user.id)
        .maybeSingle();

      // --------------------------------------------------
      // 3) Se profile NÃO existir (ex.: login social sem profile ainda),
      //    cria profile inicial com primeiro_login = true (modal completar cadastro)
      // --------------------------------------------------
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

        // Se houver erro ao criar profile, dispara exceção
        if (error) throw error;

        // Atualiza variável local com o novo profile criado
        profile = newProfile;
      }

      // --------------------------------------------------
      // 4) Regra de negócio:
      //    Se for primeiro login, abrir modal de cadastro
      // --------------------------------------------------
      if (profile.primeiro_login === true) {
        setPerfilIncompleto(true);
      }

    } catch (err) {

      // --------------------------------------------------
      // Tratamento de erro geral do Dashboard
      // --------------------------------------------------
      console.error("Erro ao carregar Dashboard:", err.message);

    } finally {

      // --------------------------------------------------
      // Finaliza estado de loading independentemente do fluxo
      // --------------------------------------------------
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // Executa o carregamento inicial do Dashboard
  // ------------------------------------------------------
  loadDashboardData();

}, []);


  const handleConnectML = () => navigate("/ml/connect");


  return (
    <div className="dashboard-wrapper">
      {/* O modal só abre se o perfil estiver incompleto */}
{perfilIncompleto && (
  <CompleteProfileModal
    show={true}
    profileId={userId}
    onClose={() => setPerfilIncompleto(false)}
  />
)}

      <div className="dash-grid-1">
        <MarketplaceCard
          name="Mercado Livre"
          count={0}
          buttonText={loading ? "Carregando..." : isConnected ? "Conectado ✔" : "Conectar"}
          color={MERCADO_LIVRE_BRAND_YELLOW_HEX}
          icon="🛒"
          onClick={(!loading && !isConnected) ? handleConnectML : null}
        />
      </div>
    </div>
  );
}