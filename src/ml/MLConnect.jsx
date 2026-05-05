// ======================================================================
// COMPONENTE: MLConnect
// Objetivo: Iniciar o OAuth do Mercado Livre via BACKEND
// ======================================================================

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { buildApiUrl } from "../config/api";

const ML_OAUTH_CONFIG_ERR_KEY = "ml_oauth_config_errors";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function MLConnect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let mounted = true;

    const iniciarOAuthML = async () => {
      // --------------------------------------------------------
      // 1. Buscar usuário autenticado no Supabase ok
      // --------------------------------------------------------
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      // --------------------------------------------------------
      // 2. Validação de sessão
      // --------------------------------------------------------
      if (error || !data?.user) {
        console.warn("Usuário não autenticado para integração ML");
        window.location.href = "/login";
        return;
      }

      const userId = data.user.id;

      const rawCo = searchParams.get("seller_company_id") || searchParams.get("sellerCompanyId") || "";
      const sellerCompanyId = rawCo.trim() && UUID_REGEX.test(rawCo.trim()) ? rawCo.trim() : "";

      // --------------------------------------------------------
      // 3. Redirecionar para o backend (OAuth ML) — path /api/ml/connect
      // --------------------------------------------------------
      let connectPath = `/api/ml/connect?user_id=${encodeURIComponent(userId)}`;
      if (sellerCompanyId) {
        connectPath += `&seller_company_id=${encodeURIComponent(sellerCompanyId)}`;
      }
      const connectUrl = buildApiUrl(connectPath);
      if (!connectUrl) {
        console.error(
          "[ML] Defina VITE_API_BASE_URL (dev local: http://localhost:3001; produção: URL do backend deployado)"
        );
        navigate("/perfil/integracoes/mercado-livre");
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

      window.location.href = connectUrl;
    };

    iniciarOAuthML();

    return () => {
      mounted = false;
    };
  }, [navigate, searchParams]);

  // --------------------------------------------------------------
  // Tela de transição
  // --------------------------------------------------------------
  return (
    <h2 style={{ padding: 20, textAlign: "center" }}>
      Redirecionando para o Mercado Livre...
    </h2>
  );
}
