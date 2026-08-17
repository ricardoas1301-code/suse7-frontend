// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Iniciar o OAuth do Mercado Livre via BACKEND (navegação browser)
// ======================================================================

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { buildApiUrl } from "../config/api";
import { montarUrlBackendMlConnect } from "../features/dashboard/configurationOnboarding/configurationOnboardingMlConnectApi.js";

const ML_OAUTH_CONFIG_ERR_KEY = "ml_oauth_config_errors";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function MLConnect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let mounted = true;

    const iniciarOAuthML = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data?.user) {
        console.warn("Usuário não autenticado para integração ML");
        window.location.href = "/login";
        return;
      }

      const userId = data.user.id;

      const rawCo = searchParams.get("seller_company_id") || searchParams.get("sellerCompanyId") || "";
      const sellerCompanyId = rawCo.trim() && UUID_REGEX.test(rawCo.trim()) ? rawCo.trim() : "";

      if (!sellerCompanyId) {
        console.warn("[MLConnect] missing_seller_company_id — selecione uma empresa em Integrações.");
        navigate("/perfil/integracoes/mercado-livre?ml_error=seller_company_id_required_for_ml_connect");
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
            navigate("/perfil/integracoes/mercado-livre");
            return;
          }
        } catch {
          /* segue para o connect */
        }
      }

      const intent = searchParams.get("intent") || "";
      const connectUrl = montarUrlBackendMlConnect({
        userId,
        sellerCompanyId,
        intent: intent || undefined,
      });

      if (!connectUrl) {
        console.error(
          "[ML] Defina VITE_API_BASE_URL (dev local: http://localhost:3001; produção: URL do backend deployado)",
        );
        navigate("/perfil/integracoes/mercado-livre");
        return;
      }

      window.location.href = connectUrl;
    };

    iniciarOAuthML();

    return () => {
      mounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <h2 style={{ padding: 20, textAlign: "center" }}>
      Redirecionando para o Mercado Livre...
    </h2>
  );
}
