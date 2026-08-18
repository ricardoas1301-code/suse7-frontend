// src/components/Layout.jsx
// ======================================================================
// LAYOUT — SUSE7 (PADRÃO GLOBAL DO APP)
// Responsável apenas pela estrutura visual (Navbar + Conteúdo)
// ======================================================================

import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { logAuthBootstrap } from "../auth/authBootstrapDevLog";
import { useAuthBootstrap } from "../contexts/AuthBootstrapContext";
import { useLoginIntroGate } from "../auth/useLoginIntroGate.js";
import { fetchUserProfileSummary } from "../services/userProfileApi.js";
import { resolverUrlAvatarLojaHeader } from "../domain/seller/resolverUrlAvatarLoja.js";
import "./Layout.css";

// ---------------- Ícones do menu central ----------------
import {
  Box,
  Tag,
  Calculator,
  ShoppingBag,
  Activity,
  Users,
  BarChart3,
  FileText,
  Code2,
} from "lucide-react";

// ---------------- Assets ----------------
import suse7Logo from "../assets/suse7-logo-redonda.png";

// ---------------- Componentes ----------------
import S7NotificationCenter from "./notifications/S7NotificationCenter";
import DailySalesSummaryNotificationModalHost from "./notifications/central/DailySalesSummaryNotificationModalHost";
import AvatarMenu from "./AvatarMenu";
import S7Tooltip from "./ui/S7Tooltip";
import { devCenterBootstrap } from "../services/devCenterApi";
import RenewalOperationalGate from "../billing/components/RenewalOperationalGate";
import { mountS7ListTableHeadStickySync } from "../styles/s7ListTableHeadStickySync.js";
import S7LoginIntroSplash from "./S7LoginIntroSplash.jsx";
import GlobalOperationalTasksHost from "../features/dashboard/operationalTasks/GlobalOperationalTasksHost.jsx";
import {
  ConfigurationAppGateProvider,
  useConfigurationAppGate,
} from "../features/dashboard/configurationOnboarding/ConfigurationAppGate.jsx";
import ConfigurationAppGateShell from "../features/dashboard/configurationOnboarding/ConfigurationAppGateShell.jsx";
import { GlobalSellerCompanyModalProvider } from "../features/dashboard/operationalTasks/globalSellerCompanyModalContext.jsx";

export default function Layout() {
  const { ready: authReady, user } = useAuthBootstrap();
  const { introActive, finishIntro } = useLoginIntroGate(authReady, user);
  const [empresaNome, setEmpresaNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [showDevCenterNav, setShowDevCenterNav] = useState(false);

  const location = useLocation();

  // S1.4D — sticky do cabeçalho de listas abaixo do card de filtros (visual)
  useEffect(() => {
    return mountS7ListTableHeadStickySync();
  }, [location.pathname]);

  // -----------------------------------------------------
  // Buscar dados da empresa logada (profiles)
// -----------------------------------------------------
useEffect(() => {
  if (!authReady || !user) return;

  const loadProfile = async () => {
    try {
      const res = await fetchUserProfileSummary();
      if (res.ok) {
        setEmpresaNome(res.nome_loja || res.display_name || "");
        setLogoUrl(
          resolverUrlAvatarLojaHeader({
            logo_url: res.logo_url,
            photo_url: res.photo_url,
          }) || "",
        );
      }
    } catch {
      setEmpresaNome("");
      setLogoUrl("");
    }

    logAuthBootstrap("profile_ready", { userId: user.id });
  };

  loadProfile();

  const handleLogoUpdate = () => loadProfile();
  window.addEventListener("logoUpdated", handleLogoUpdate);

  devCenterBootstrap().then((r) => {
    setShowDevCenterNav(Boolean(r.ok && r.data?.allowed));
  });

  return () => {
    window.removeEventListener("logoUpdated", handleLogoUpdate);
  };
}, [authReady, user]);
  // -----------------------------------------------------
  // Itens do menu central
  // -----------------------------------------------------
  // Logo leva ao Dashboard (/); não duplicamos "Painel" no menu.
  const navItems = [
    { path: "/vendas", label: "Vendas", icon: ShoppingBag },
    { path: "/precificacoes", label: "Precificações", icon: Calculator },
    { path: "/anuncios", label: "Anúncios", icon: Tag },
    { path: "/produtos", label: "Produtos", icon: Box },
    { path: "/concorrencia", label: "Concorrência", icon: Activity },
    { path: "/clientes", label: "Clientes 360 S7", icon: Users },
    { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
    { path: "/registros", label: "Registros", icon: FileText },
  ];

  // -----------------------------------------------------
  // Flag: telas de cadastro/edição de produto (full-bleed)
  // -----------------------------------------------------
  const isProductForm =
    location.pathname.startsWith("/produtos/novo") ||
    /^\/produtos\/[^/]+\/editar$/.test(location.pathname) ||
    /^\/produtos\/[^/]+$/.test(location.pathname);

  const isPricingIntelligencePage = location.pathname.startsWith("/precificacoes/inteligente");

  if (introActive) {
    return <S7LoginIntroSplash onFinish={finishIntro} />;
  }

  return (
    <ConfigurationAppGateProvider>
      <LayoutShell
        authReady={authReady}
        empresaNome={empresaNome}
        logoUrl={logoUrl}
        showDevCenterNav={showDevCenterNav}
        navItems={navItems}
        location={location}
        isProductForm={isProductForm}
        isPricingIntelligencePage={isPricingIntelligencePage}
      />
    </ConfigurationAppGateProvider>
  );
}

/**
 * @param {{
 *   authReady: boolean;
 *   empresaNome: string;
 *   logoUrl: string;
 *   showDevCenterNav: boolean;
 *   navItems: { path: string; label: string; icon: import("react").ComponentType<{ className?: string }> }[];
 *   location: import("react-router-dom").Location;
 *   isProductForm: boolean;
 *   isPricingIntelligencePage: boolean;
 * }} props
 */
function LayoutShell({
  authReady,
  empresaNome,
  logoUrl,
  showDevCenterNav,
  navItems,
  location,
  isProductForm,
  isPricingIntelligencePage,
}) {
  const { locked: configGateLocked } = useConfigurationAppGate();

  return (
    <GlobalSellerCompanyModalProvider>
      <div className={`app-container ${isProductForm ? "app-container--pf-bleed" : ""}`}>
      {/* ===================== NAVBAR ===================== */}
      <nav
        className={[
          "navbar-premium",
          configGateLocked ? "s7-config-app-gate-nav--locked" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Logo Suse7 */}
        <div className="nav-left">
          <S7Tooltip content="Dashboard" placement="bottom-start" offset={6} className="nav-logo-tip">
            <Link to="/" className="nav-logo">
              <img src={suse7Logo} alt="Suse7" className="nav-logo-img" />
            </Link>
          </S7Tooltip>
        </div>

        {/* Menu central */}
        <div className="nav-center">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(event) => {
                  if (configGateLocked) event.preventDefault();
                }}
                tabIndex={configGateLocked ? -1 : undefined}
                aria-disabled={configGateLocked || undefined}
className={`nav-item ${
  item.path === "/produtos"
    ? location.pathname.startsWith("/produtos")
      ? "active"
      : ""
    : item.path === "/anuncios"
      ? location.pathname.startsWith("/anuncios")
        ? "active"
        : ""
    : item.path === "/vendas"
      ? location.pathname.startsWith("/vendas")
        ? "active"
        : ""
    : item.path === "/precificacoes"
      ? location.pathname.startsWith("/precificacoes")
        ? "active"
        : ""
    : item.path === "/concorrencia"
      ? location.pathname.startsWith("/concorrencia")
        ? "active"
        : ""
    : item.path === "/clientes"
      ? location.pathname.startsWith("/clientes")
        ? "active"
        : ""
    : location.pathname === item.path
      ? "active"
      : ""
}`}

              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {showDevCenterNav && (
            <Link
              to="/admin/dev-center"
              onClick={(event) => {
                if (configGateLocked) event.preventDefault();
              }}
              tabIndex={configGateLocked ? -1 : undefined}
              aria-disabled={configGateLocked || undefined}
              className={`nav-item ${location.pathname.startsWith("/admin/dev-center") ? "active" : ""}`}
            >
              <Code2 className="nav-icon" />
              <span>Dev Center</span>
            </Link>
          )}
        </div>

        {/* Menu da empresa (sino + logo + dropdown) */}
        <div className="nav-right">
          <S7NotificationCenter interactionLocked={configGateLocked} />
          <AvatarMenu
            empresaNome={empresaNome}
            logoUrl={logoUrl}
            interactionLocked={configGateLocked}
          />
        </div>
      </nav>

      {/* ===================== CONTEÚDO ===================== */}
      <main
        className={`page-content s7-page ${isProductForm ? "page-content--pf-bleed" : ""} ${
          isPricingIntelligencePage ? "page-content--pricing-intelligence" : ""
        }`}
      >
        <ConfigurationAppGateShell>
          <RenewalOperationalGate>
            <Outlet />
          </RenewalOperationalGate>
        </ConfigurationAppGateShell>
      </main>
      <DailySalesSummaryNotificationModalHost />
      {authReady ? <GlobalOperationalTasksHost /> : null}
    </div>
    </GlobalSellerCompanyModalProvider>
  );
}
