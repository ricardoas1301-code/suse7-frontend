// ======================================================================
// PÁGINA: Mercado Livre — Integração
// Objetivo: Centralizar a lógica de conexão com o Mercado Livre
// Versão: BASE (lógica pura, sem layout final)
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function MercadoLivre() {
  // ------------------------------------------------------------------
  // STATES
  // ------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // EFFECT: CARREGAR STATUS DA CONEXÃO ML
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadMLStatus = async () => {
      try {
        // ------------------------------------------------------------
        // 1. Obter usuário autenticado
        // ------------------------------------------------------------
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.warn("Usuário não autenticado");
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // ------------------------------------------------------------
        // 2. Consultar status da conexão ML no backend
        // ------------------------------------------------------------
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/ml/status?user_id=${user.id}`
        );

        const data = await response.json();

        if (data.connected === true) {
          setIsConnected(true);
          setExpiresAt(data.expires_at || null);
        } else {
          setIsConnected(false);
        }

      } catch (err) {
        console.error("Erro ao carregar status do ML:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMLStatus();
  }, []);

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------

  // Iniciar conexão com Mercado Livre (OAuth)
  const handleConnectML = () => {
    navigate("/ml/connect");
  };

  // ------------------------------------------------------------------
  // RENDER (TEMPORÁRIO — TEXTO PURO)
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Mercado Livre</h2>
        <p>Carregando status da integração...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Mercado Livre</h2>

      {/* STATUS */}
      {isConnected ? (
        <p style={{ color: "green", fontWeight: 600 }}>
          🟢 Conta conectada com sucesso
        </p>
      ) : (
        <p style={{ color: "#6b7280" }}>
          🔴 Conta ainda não conectada
        </p>
      )}

      {/* INFO EXTRA (opcional, útil para debug/admin) */}
      {isConnected && expiresAt && (
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          Token válido até: {new Date(expiresAt).toLocaleString()}
        </p>
      )}

      {/* BOTÃO PRINCIPAL */}
      <button
        onClick={handleConnectML}
        disabled={isConnected}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          fontSize: 15,
          fontWeight: 600,
          cursor: isConnected ? "default" : "pointer",
        }}
      >
        {isConnected ? "Conta conectada ✔" : "Conectar Mercado Livre"}
      </button>
    </div>
  );
}
