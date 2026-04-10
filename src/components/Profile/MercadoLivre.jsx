// ======================================================================
// PÁGINA: Mercado Livre — Integração
// Objetivo: Gerenciar conexão com o Mercado Livre (OAuth)
// UX:
// - NÃO conectado → tela de autenticação (padrão SaaS Suse7)
// - CONECTADO → status + dados (fonte de verdade: /api/ml/status)
// - Retorno OAuth (?ml=connected) → toast Suse7 + limpeza da URL (sem reload)
// ======================================================================

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api";
import { useNotifications } from "../../contexts/NotificationContext";
import { NOTIFICATION_SEVERITY } from "../../services/notificationTypes";
import "./MercadoLivre.css";

import suse7Logo from "../../assets/suse7-logo-redonda.png";
import mercadoLivreLogo from "../../assets/mercado-livre.png";

// ----------------------------------------------------------------------
// Anti-duplicata do toast em DEV (React Strict Mode dispara efeitos 2x em sequência)
// ----------------------------------------------------------------------
const ML_OAUTH_SUCCESS_TOAST_GAP_MS = 3500;
let _mlOAuthSuccessToastLastAt = 0;

const ML_OAUTH_CONFIG_ERR_KEY = "ml_oauth_config_errors";

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
  const location = useLocation();
  const { addNotification } = useNotifications();

  // ------------------------------------------------------------------
  // EFFECT: status real da integração + banner de erro OAuth + toast de sucesso + URL limpa
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadMLStatus = async () => {
      try {
        const sp = new URLSearchParams(location.search);
        const errParam = sp.get("ml_error");
        if (errParam === "token") {
          setBannerError(
            "Não foi possível trocar o código pelo token no Mercado Livre. Verifique ML_REDIRECT_URI e as credenciais da app DEV."
          );
        } else if (errParam === "save") {
          setBannerError(
            "A autorização funcionou, mas não foi possível salvar os tokens. Tente conectar novamente ou verifique o Supabase."
          );
        }

        try {
          const rawStored = sessionStorage.getItem(ML_OAUTH_CONFIG_ERR_KEY);
          if (rawStored) {
            const arr = JSON.parse(rawStored);
            if (Array.isArray(arr) && arr.length) {
              setBannerError(arr.filter(Boolean).join(" "));
            }
            sessionStorage.removeItem(ML_OAUTH_CONFIG_ERR_KEY);
          }
        } catch {
          /* ignore */
        }

        const probeUrl = buildApiUrl("/api/ml/oauth-config");
        if (probeUrl) {
          try {
            const pr = await fetch(probeUrl);
            const probe = await pr.json().catch(() => ({}));
            if (probe && probe.ok === false && Array.isArray(probe.errors) && probe.errors.length) {
              setBannerError(
                (prev) =>
                  prev ||
                  [
                    "Configuração OAuth no backend (DEV):",
                    ...probe.errors,
                    `redirectUri lido: ${probe.redirectUri || "—"}`,
                    `Confira o terminal do backend (npm run dev) — deve mostrar ML_CLIENT_ID length > 0 e ML_REDIRECT_URI com localhost:3001.`,
                  ].join(" ")
              );
            }
          } catch {
            /* ignore */
          }
        }

        const mlConnectedFromOAuth = sp.get("ml") === "connected";

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
        const rawText = await response.text();
        let data = {};
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          console.error("[ML] /api/ml/status resposta não é JSON", rawText?.slice?.(0, 200));
          setBannerError(
            (prev) =>
              prev ||
              `O backend retornou status ${response.status} com corpo inválido. Confira se npm run dev está rodando na pasta suse7-backend (porta 3001).`
          );
          setIsConnected(false);
        }

        if (data.error && typeof data.error === "string") {
          setBannerError((prev) => prev || data.error);
        }

        if (data.connected) {
          setIsConnected(true);
          setMlUsername(data.username || "—");
          setExpiresAt(data.expires_at || null);
        } else {
          setIsConnected(false);
        }

        // ------------------------------
        // Toast de sucesso (só gatilho visual; estado conectado veio do fetch acima)
        // ------------------------------
        if (mlConnectedFromOAuth) {
          const now = Date.now();
          if (now - _mlOAuthSuccessToastLastAt >= ML_OAUTH_SUCCESS_TOAST_GAP_MS) {
            _mlOAuthSuccessToastLastAt = now;
            addNotification({
              event_type: "ML_INTEGRATION_OAUTH_SUCCESS",
              entity_type: "marketplace_integration",
              entity_id: null,
              title: "Integração concluída",
              message: "Conta Mercado Livre conectada com sucesso.",
              severity: NOTIFICATION_SEVERITY.INFO,
              dedupeKey: "ml-oauth-return-success",
            });
          }
        }

        // ------------------------------
        // Remover ml=connected / ml_error da barra de endereço (replace, sem reload)
        // ------------------------------
        const nextSp = new URLSearchParams(location.search);
        let urlNeedsClean = false;
        if (nextSp.has("ml")) {
          nextSp.delete("ml");
          urlNeedsClean = true;
        }
        if (nextSp.has("ml_error")) {
          nextSp.delete("ml_error");
          urlNeedsClean = true;
        }
        if (urlNeedsClean) {
          const q = nextSp.toString();
          navigate(`${location.pathname}${q ? `?${q}` : ""}`, { replace: true });
        }
      } catch (err) {
        console.error("Erro ao carregar status ML:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMLStatus();
    // addNotification é estável o suficiente; incluir no array dispara fetch extra quando o
    // NotificationProvider resolve userId (recria o callback).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop / refetch desnecessário
  }, [location.pathname, location.search, navigate]);

  // ------------------------------------------------------------------
  // HANDLER
  // ------------------------------------------------------------------
  const handleConnectML = async () => {
    if (!user) return;
    const connectUrl = buildApiUrl(
      `/api/ml/connect?user_id=${encodeURIComponent(user.id)}`
    );
    if (!connectUrl) {
      console.error("[ML] Defina VITE_API_BASE_URL");
      return;
    }
    const probeUrl = buildApiUrl("/api/ml/oauth-config");
    if (probeUrl) {
      try {
        const pr = await fetch(probeUrl);
        const probe = await pr.json().catch(() => ({}));
        if (probe && probe.ok === false && Array.isArray(probe.errors) && probe.errors.length) {
          try {
            sessionStorage.setItem(ML_OAUTH_CONFIG_ERR_KEY, JSON.stringify(probe.errors));
          } catch {
            /* ignore */
          }
          setBannerError(probe.errors.filter(Boolean).join(" "));
          return;
        }
      } catch {
        /* segue */
      }
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
