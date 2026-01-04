// ======================================================================
// PÁGINA: Mercado Livre — Integração
// Objetivo: Gerenciar conexão com o Mercado Livre (OAuth)
// UX:
// - NÃO conectado → tela de autenticação (estilo img2)
// - CONECTADO → status + dados (img369)
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./MercadoLivre.css";

import suse7Logo from "../../assets/suse7-logo-redonda.png";
import mercadoLivreLogo from "../../assets/mercado-livre.png";

export default function MercadoLivre() {
  // ------------------------------------------------------------------
  // STATES
  // ------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);

  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // EFFECT: CARREGAR STATUS DA CONEXÃO ML
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadMLStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/ml/status?user_id=${user.id}`
        );

        const data = await response.json();

        if (data.connected) {
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
  // HANDLER
  // ------------------------------------------------------------------
  const handleConnectML = () => {
    navigate("/ml/connect");
  };

  // ------------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="ml-container">
        <div className="ml-card">
          <p>Carregando integração...</p>
        </div>
      </div>
    );
  }

  // ==================================================================
  // RENDER
  // ==================================================================
  return (
    <div className="ml-container">
      <div className="ml-card">

        {/* ==========================================================
           HEADER COM LOGOS
        ========================================================== */}
        <div className="ml-header">
          <div className="ml-header-logos">
            <img src={suse7Logo} alt="Suse7" className="ml-logo suse7" />
            <span className="ml-header-arrow">↔</span>
            <img src={mercadoLivreLogo} alt="Mercado Livre" className="ml-logo ml" />
          </div>

          <h2 className="ml-title">Mercado Livre</h2>
        </div>

        {/* ==========================================================
           ESTADO: NÃO CONECTADO (UX img2)
        ========================================================== */}
        {!isConnected && (
  <>
    {/* STATUS */}
    <div className="ml-status disconnected">
      <span className="ml-status-dot" />
      Conta ainda não conectada
    </div>

    {/* TÍTULO PRINCIPAL */}
    <h3 className="ml-connect-title">
      Conectar com Mercado Livre
    </h3>

    {/* TEXTO CENTRALIZADO */}
    <p className="ml-connect-description">
      Faça a autenticação da sua conta de vendedor no Mercado Livre
      para autorizar a integração com o <strong>Suse7 Precifica</strong>.
    </p>

    {/* CTA */}
    <button
      className="ml-button"
      onClick={handleConnectML}
    >
      Iniciar autenticação
    </button>

    {/* MICROCOPY */}
    <p className="ml-security-hint">
      🔒 Conexão segura via OAuth oficial do Mercado Livre.
      O Suse7 Precifica não armazena sua senha.
    </p>
  </>
)}


        {/* ==========================================================
           ESTADO: CONECTADO (img369)
        ========================================================== */}
        {isConnected && (
          <>
            <div className="ml-status connected">
              <span className="ml-status-dot" />
              Conta conectada com sucesso
            </div>

            {expiresAt && (
              <p className="ml-token-info">
                Token válido até: {new Date(expiresAt).toLocaleString()}
              </p>
            )}

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

            <button className="ml-button connected" disabled>
              Conta conectada ✔
            </button>

            <p className="ml-security-hint">
              🔒 Conexão segura via OAuth oficial do Mercado Livre.
              O Suse7 não armazena sua senha.
            </p>
          </>
        )}

      </div>
    </div>
  );
}
