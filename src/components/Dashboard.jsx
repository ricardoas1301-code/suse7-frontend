// ======================================================================
//  DASHBOARD — SUSE7 (FIX DEPLOY PATH)
// ======================================================================

import "./Dashboard.css";
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

        
// --------------------------------------------------------
// Garantir que o profile existe (especialmente login social)
// --------------------------------------------------------
let { data: profile } = await supabase
  .from("profiles")
  .select("id, primeiro_login")
  .eq("id", user.id)
  .maybeSingle();
   

// Se não existir profile, criar (caso login social)
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

// Se for primeiro login → abre modal (garantido)
if (profile?.primeiro_login === true) {
  setPerfilIncompleto(true);
}

setProfileLoaded(true);



       // const apiUrl = `${import.meta.env.VITE_API_URL}/api/ml/status?user_id=${user.id}`;
       // const res = await fetch(apiUrl);
       // if (res.ok) {
       //   const data = await res.json();
       //   if (data.connected) setIsConnected(true);
       // }

      } catch (err) {
        console.error("Erro no Dashboard:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleConnectML = () => navigate("/ml/connect");
  console.log("perfilIncompleto:", perfilIncompleto);


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
          color="#ffe600"
          icon="🛒"
          onClick={(!loading && !isConnected) ? handleConnectML : null}
        />
      </div>
    </div>
  );
}