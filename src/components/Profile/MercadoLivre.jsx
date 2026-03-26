// ======================================================================
// PÁGINA: Mercado Livre — Integração
// Objetivo: Gerenciar conexão com o Mercado Livre (OAuth)
// UX:
// - NÃO conectado → tela de autenticação (padrão SaaS Suse7)
// - CONECTADO → status + dados
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api";
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
  const [mlUsername, setMlUsername] = useState("—");
  const [showReadonlyIcon, setShowReadonlyIcon] = useState(false);
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 });
  const [activeReadonlyField, setActiveReadonlyField] = useState(null); // "username" | "status" | null
  const [user, setUser] = useState(null);
  const [bannerError, setBannerError] = useState(null);

  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // EFFECT: CARREGAR STATUS DA CONEXÃO ML
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadMLStatus = async () => {
      try {
        const errParam = new URLSearchParams(window.location.search).get("ml_error");
        if (errParam === "token") {
          setBannerError(
            "Não foi possível trocar o código pelo token no Mercado Livre. Verifique ML_REDIRECT_URI e as credenciais da app DEV."
          );
        } else if (errParam === "save") {
          setBannerError(
            "A autorização funcionou, mas não foi possível salvar os tokens. Tente conectar novamente ou verifique o Supabase."
          );
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (!user) {
          setLoading(false);
          return;
        }

        const statusUrl = buildApiUrl(
          `/api/ml/status?user_id=${encodeURIComponent(user.id)}`
        );
        if (!statusUrl) {
          console.error("[ML] Defina VITE_API_BASE_URL");
          setLoading(false);
          return;
        }

        const response = await fetch(statusUrl);
        const data = await response.json();

        if (data.connected) {
          setIsConnected(true);
          setMlUsername(data.username || "—");
          setExpiresAt(data.expires_at || null);
        } else {
          setIsConnected(false);
        }

        const sp = new URLSearchParams(window.location.search);
        let cleaned = false;
        if (sp.get("ml") === "connected") {
          sp.delete("ml");
          cleaned = true;
        }
        if (sp.has("ml_error")) {
          sp.delete("ml_error");
          cleaned = true;
        }
        if (cleaned) {
          const q = sp.toString();
          navigate(`${window.location.pathname}${q ? `?${q}` : ""}`, { replace: true });
        }
      } catch (err) {
        console.error("Erro ao carregar status ML:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMLStatus();
  }, [navigate]);

  // ------------------------------------------------------------------
  // HANDLER
  // ------------------------------------------------------------------
  const handleConnectML = () => {
    if (!user) return;
    const connectUrl = buildApiUrl(
      `/api/ml/connect?user_id=${encodeURIComponent(user.id)}`
    );
    if (!connectUrl) {
      console.error("[ML] Defina VITE_API_BASE_URL");
      return;
    }
    window.location.href = connectUrl;
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
        {bannerError && (
          <div
            className="ml-banner-error"
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(220, 53, 69, 0.12)",
              color: "#842029",
              fontSize: 14,
            }}
            role="alert"
          >
            {bannerError}
          </div>
        )}
        {/* ==========================================================
           HEADER COM LOGOS (ÍCONES +100%)
        ========================================================== */}
        <div className="ml-header">
          <div className="ml-header-logos">
            <img
              src={suse7Logo}
              alt="Suse7"
              className="ml-logo suse7"
            />
            <span className="ml-header-arrow">↔</span>
            <img
              src={mercadoLivreLogo}
              alt="Mercado Livre"
              className="ml-logo ml"
            />
          </div>
        </div>

        {/* ==========================================================
           ESTADO: NÃO CONECTADO
        ========================================================== */}
        {!isConnected && (
          <>
            <h3 className="ml-connect-title">
              Conectar com Mercado Livre
            </h3>

            <p className="ml-connect-description">
              Faça a autenticação da sua conta de vendedor no Mercado Livre
              para autorizar a integração com o <strong>Suse7 Precifica </strong> 
              e começe a usar as ferramentas inteligentes de precificação avançada.
            </p>

            <button
              className="ml-button"
              onClick={handleConnectML}
            >
              Iniciar autenticação
            </button>

            {/* BLOCO DE CONTEXTO — O QUE ACONTECE APÓS CONECTAR */}
<div className="ml-after-connect">
  <p className="ml-after-title">
    O que acontece após conectar?
  </p>

  <ul className="ml-after-list">
    <li>✔ Sincronização Automática: Seus anúncios são importados e atualizados instantaneamente.</li>
    <li>✔ Precisão Financeira: Cálculo exato de taxas, comissões de marketplace e seu lucro real.</li>
    <li>✔ Inteligência de Mercado: Monitoramento de preços e performance em tempo real.</li>
    <li>✔ Gestão Centralizada: Altere preços e estoque e muito mais sem sair do Suse7.</li>
    <li>✔ Visão 360º: Tenha painéis de controle atualizados com cada venda realizada.</li>
    <li>✔ Sync de Anúncios: Importação total de todos os dados como títulos, fotos e descrições...</li>
  </ul>
</div>

            <p className="ml-security-hint">
              🔒 Conexão segura: utilizamos o protocolo oficial OAuth do Mercado Livre.
              Seus dados são protegidos por criptografia de ponta a ponta via API oficial.
            </p>
          </>
        )}

        {/* ==========================================================
           ESTADO: CONECTADO
        ========================================================== */}
        {isConnected && (
          <>
             <div className="ml-connected-header">

      <p className="ml-connected-subtitle">
        Sua conta do <strong>Mercado Livre</strong> já está integrada ao <strong>Suse7 Precifica</strong> e pronta
        para utilizar as ferramentas inteligentes de precificação avançada.
      </p>
    </div>

        {/* ======================================================
        AÇÕES
    ====================================================== */}
<div className="ml-actions single">
  <button className="ml-button primary">
    Conta conectada ✔
  </button>
</div>

{/* ======================================================
   NOME DE USUÁRIO (READ-ONLY)
====================================================== */}
<div className="ml-field field-lg">
  <label>Nome de usuário</label>

<div className="readonly-field">
  <input
    value={mlUsername || ""}
    disabled
  />
  <span className="readonly-icon"></span>
</div>
</div>

{/* ======================================================
   STATUS DA INTEGRAÇÃO (READ-ONLY)
====================================================== */}
<div className="ml-field field-lg">
  <label>Status da integração</label>

  <div className="readonly-field">
    <input value="Ativa" disabled />
    <span className="readonly-icon"></span>
  </div>
</div>


     {/* ======================================================
       PRÓXIMOS PASSOS (EM BREVE)
    ====================================================== */}
    <div className="ml-next-steps">
      <p className="ml-next-title">Agora você tem todos os recursos da integração:</p>

    <br />
      <ul></ul>
      <ul>
    <li>✔ Sincronização Automática: Seus anúncios são importados e atualizados instantaneamente.</li>
    <li>✔ Precisão Financeira: Cálculo exato de taxas, comissões de marketplace e seu lucro real.</li>
    <li>✔ Inteligência de Mercado: Monitoramento de preços e performance em tempo real.</li>
    <li>✔ Gestão Centralizada: Altere preços e estoque e muito mais sem sair do Suse7.</li>
    <li>✔ Visão 360º: Tenha painéis de controle atualizados com cada venda realizada.</li>
    <li>✔ Sync de Anúncios: Importação total de todos os dados como títulos, fotos e descrições...</li>
    <br />
      </ul>
    </div>

    <p className="ml-security-hint">
🔒 Conexão segura: utilizamos o protocolo oficial OAuth do Mercado Livre.
   Seus dados são protegidos por criptografia de ponta a ponta via API oficial.
    </p>
  </>
)}
      </div>
    </div>
  );
}
