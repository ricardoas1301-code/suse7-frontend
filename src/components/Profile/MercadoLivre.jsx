// ======================================================================
// PÁGINA: Mercado Livre — Integração
// Objetivo: Gerenciar conexão com o Mercado Livre (OAuth)
// Layout: Inspirado na img369 (visual + clean)
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./MercadoLivre.css";

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
        // 1. Usuário autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // 2. Status via backend
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
        console.error("Erro ao carregar status ML:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMLStatus();
  }, []);

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------
  const handleConnectML = () => {
    navigate("/ml/connect");
  };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="ml-container">
        <div className="ml-card">
          <h2>Mercado Livre</h2>
          <p>Carregando status da integração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-container">
      <div className="ml-card">

        {/* HEADER */}
        <h2 className="ml-title">Mercado Livre</h2>

        {/* STATUS */}
        <div className={`ml-status ${isConnected ? "connected" : "disconnected"}`}>
          <span className="ml-status-dot" />
          {isConnected
            ? "Conta conectada com sucesso"
            : "Conta ainda não conectada"}
        </div>

        {/* INFO TOKEN */}
        {isConnected && expiresAt && (
          <p className="ml-token-info">
            Token válido até: {new Date(expiresAt).toLocaleString()}
          </p>
        )}

        {/* BLOCO DE INFORMAÇÕES */}
        <div className="ml-info-grid">

          <div className="ml-field">
            <label>Nome do canal de venda</label>
            <input value="MERCADO LIVRE" disabled />
          </div>

          <div className="ml-field">
            <label>Login Mercado Livre</label>
            <input value="—" disabled />
          </div>

        </div>

        {/* BOTÃO PRINCIPAL */}
        <button
          className={`ml-button ${isConnected ? "connected" : ""}`}
          onClick={handleConnectML}
          disabled={isConnected}
        >
          {isConnected ? "Conta conectada ✔" : "Conectar Mercado Livre"}
        </button>

        {/* MICROCOPY */}
        <p className="ml-security-hint">
          🔒 Conexão segura via OAuth oficial do Mercado Livre.
          O Suse7 não armazena sua senha.
        </p>

      </div>
    </div>
  );
}
