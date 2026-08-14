// ======================================================================
// src/App.jsx — ROTAS PRINCIPAIS DO SUSE7
// ======================================================================

import { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./App.css";
import "./global.css";
import "./styles/Suse7-Design-System.css";
import "./styles/S7CoreKpis.css";
import "./styles/s7-sticky-filters.css";
import "./styles/s7-catalog-page-rhythm.css";
import "./styles/s7-list-sticky-chrome.css";
import "./styles/s7-list-select-column.css";

import { useAuthBootstrap } from "./contexts/AuthBootstrapContext";
import AuthCallbackGate from "./components/AuthCallbackGate.jsx";

// Layout e páginas principais
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";

// Páginas públicas
import Terms from "./pages/Terms";
import Privacidade from "./pages/Privacidade";
import PasswordForgot from "./pages/PasswordForgot";
import PasswordReset from "./pages/PasswordReset";

// Mercado Livre
import MLConnect from "./ml/MLConnect.jsx";
import MLCallback from "./ml/MLCallback.jsx";

// Perfil
import Profile from "./components/Profile/Profile";
import DadosEmpresa from "./components/Profile/DadosEmpresa";
import AlterarSenha from "./components/Profile/AlterarSenha";
import MercadoLivre from "./components/Profile/MercadoLivre";
import FormasPagamento from "./components/Profile/FormasPagamento";
import ExtratoConta from "./components/Profile/ExtratoConta";
import PaymentHistory from "./components/Profile/PaymentHistory";
import PlansPage from "./billing/pages/PlansPage";
import NotificacoesInboxPage from "./pages/NotificacoesInboxPage";
import SubscriptionPage from "./billing/pages/SubscriptionPage";
import CheckoutRedirectPage from "./billing/pages/CheckoutRedirectPage";
import { BillingAccessProvider } from "./billing/hooks/useBillingAccess.jsx";
import { protectPremiumRoute } from "./billing/protectPremiumRoute.jsx";
import Preferencias from "./components/Profile/Preferencias";
import CentralNotificacoesHub from "./components/Profile/CentralNotificacoesHub";
import LegacyNotificacoesRedirect from "./components/Profile/LegacyNotificacoesRedirect";
import NotificationHistorico from "./components/Profile/NotificationHistorico";
import DestinatariosNotificacoes from "./components/Profile/DestinatariosNotificacoes";
import AlertasPopup from "./components/Profile/AlertasPopup";

// Produtos (REAL)
import Products from "./components/Products";
import AnunciosPage from "./pages/AnunciosPage";
import PrecificacoesPage from "./pages/PrecificacoesPage";
import VendasPage from "./pages/VendasPage";
import PricingIntelligencePage from "./pages/PricingIntelligencePage";
import AnunciosTeste from "./pages/AnunciosTeste";
import MlListingImportDebug from "./pages/debug/MlListingImportDebug.jsx";
import ProductCreate from "./pages/ProductCreate";
import ProductEdit from "./pages/ProductEdit";
import SellerTicketsPage from "./pages/admin/tickets/SellerTicketsPage";
import DevCenterRoute from "./pages/admin/DevCenterRoute";
import DevCenterShell from "./pages/admin/DevCenterShell";
import DevCenterDashboard from "./pages/admin/DevCenterDashboard";
import DevCenterSellers from "./pages/admin/DevCenterSellers";
import DevCenterSubscriptions from "./pages/admin/DevCenterSubscriptions";
import DevCenterFinance from "./pages/admin/DevCenterFinance";
import DevCenterCustomersGlobal from "./pages/admin/DevCenterCustomersGlobal";
import DevCenterFeatureFlags from "./pages/admin/DevCenterFeatureFlags";
import DevCenterToolbox from "./pages/admin/DevCenterToolbox";
import ConcorrenciaPage from "./pages/ConcorrenciaPage";
import Clientes360 from "./pages/Clientes360";
import RelatoriosPage from "./pages/RelatoriosPage";

// Status de save (ampulheta global)
import { SaveStatusProvider } from "./contexts/SaveStatusContext";
import SaveStatusIndicator from "./components/SaveStatusIndicator";

// Temporários
const Faturas = () => <h1>Faturas</h1>;
const Registros = () => <h1>Registros</h1>;
const Configuracoes = () => <h1>Configurações</h1>;
// ======================================================================
// AUTH WRAPPER
// ======================================================================
function AuthOutlet() {
  const { loading, session, callbackError } = useAuthBootstrap();

  if (!loading && !session && !callbackError) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthCallbackGate>
      <Outlet />
    </AuthCallbackGate>
  );
}

// ======================================================================
// REDIRECT ML (?ml=connected) — legado para rotas que não tratam o retorno OAuth
// A página /perfil/integracoes/mercado-livre trata toast + limpeza da URL localmente.
// ======================================================================
function MLRedirectHandler({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("ml") !== "connected") return;
    if (location.pathname.includes("/integracoes/mercado-livre")) return;
    navigate("/", { replace: true });
  }, [location.pathname, location.search, navigate]);

  return children;
}

// ======================================================================
// ROUTER (createBrowserRouter — compatível com useBlocker se necessário)
// ======================================================================
const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/termos", element: <Terms /> },
  { path: "/privacidade", element: <Privacidade /> },
  { path: "/forgot-password", element: <PasswordForgot /> },
  { path: "/reset-password", element: <PasswordReset /> },
  { path: "/ml/connect", element: <MLConnect /> },
  { path: "/ml/callback", element: <MLCallback /> },
  {
    path: "/",
    element: (
      <MLRedirectHandler>
        <AuthOutlet />
      </MLRedirectHandler>
    ),
    children: [
      {
        element: (
          <BillingAccessProvider>
            <SaveStatusProvider>
              <>
                <Layout />
                <SaveStatusIndicator />
              </>
            </SaveStatusProvider>
          </BillingAccessProvider>
        ),
        children: [
      { index: true, element: <Dashboard /> },
      {
        path: "perfil",
        element: <Profile />,
        children: [
          { index: true, element: <DadosEmpresa /> },
          { path: "dados-empresa", element: <DadosEmpresa /> },
          { path: "alterar-senha", element: <AlterarSenha /> },
          { path: "integracoes/mercado-livre", element: <MercadoLivre /> },
          { path: "assinatura", element: <Navigate to="/perfil/assinatura/minha-assinatura" replace /> },
          { path: "assinatura/minha-assinatura", element: <SubscriptionPage /> },
          { path: "assinatura/planos", element: <PlansPage /> },
          { path: "assinatura/checkout", element: <CheckoutRedirectPage /> },
          { path: "assinatura/formas-de-pagamento", element: <FormasPagamento /> },
          { path: "assinatura/formas-pagamento", element: <Navigate to="/perfil/assinatura/formas-de-pagamento" replace /> },
          { path: "assinatura/historico", element: <PaymentHistory /> },
          { path: "pagamentos/formas", element: <Navigate to="/perfil/assinatura/formas-de-pagamento" replace /> },
          { path: "pagamentos/extrato", element: <Navigate to="/perfil/assinatura/historico" replace /> },
          {
            path: "preferencias",
            element: <Preferencias />,
            children: [
              { index: true, element: <Navigate to="notificacoes" replace /> },
              { path: "notificacoes", element: <CentralNotificacoesHub /> },
              { path: "notificacoes/destinatarios", element: <Navigate to="/perfil/preferencias/notificacoes?tab=recipients" replace /> },
              { path: "notificacoes/historico", element: <NotificationHistorico /> },
              { path: "notificacoes/:category", element: <LegacyNotificacoesRedirect /> },
              { path: "alertas-pop-up", element: <Navigate to="alertas-pop-up/sales" replace /> },
              { path: "alertas-pop-up/:category", element: <AlertasPopup /> },
            ],
          },
        ],
      },
      { path: "anuncios", element: protectPremiumRoute(<AnunciosPage />, "anuncios") },
      { path: "anuncios-2", element: protectPremiumRoute(<AnunciosTeste />, "anuncios") },
      { path: "anuncios/debug-importacao", element: protectPremiumRoute(<MlListingImportDebug />, "anuncios") },
      { path: "produtos", element: protectPremiumRoute(<Products />, "produtos") },
      { path: "clientes", element: <Clientes360 /> },
      { path: "faturas", element: <Faturas /> },
      { path: "relatorios", element: protectPremiumRoute(<RelatoriosPage />, "relatorios") },
      { path: "concorrencia", element: protectPremiumRoute(<ConcorrenciaPage />, "concorrencia") },
      { path: "monitoramento", element: <Navigate to="/concorrencia" replace /> },
      { path: "registros", element: <Registros /> },
      { path: "configuracoes", element: <Navigate to="/perfil" replace /> },
      { path: "notificacoes", element: <NotificacoesInboxPage /> },
      { path: "vendas", element: protectPremiumRoute(<VendasPage />, "vendas") },
      { path: "precificacoes", element: protectPremiumRoute(<PrecificacoesPage />, "precificacoes") },
      { path: "precificacoes/inteligente/:listingId", element: protectPremiumRoute(<PricingIntelligencePage />, "precificacoes") },
      { path: "produtos/novo", element: protectPremiumRoute(<ProductCreate />, "produtos") },
      { path: "produtos/:id/editar", element: protectPremiumRoute(<ProductEdit />, "produtos") },
      { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
      {
        path: "admin/dev-center",
        element: (
          <DevCenterRoute>
            <DevCenterShell />
          </DevCenterRoute>
        ),
        children: [
          { index: true, element: <DevCenterDashboard /> },
          { path: "sellers", element: <DevCenterSellers /> },
          { path: "subscriptions", element: <DevCenterSubscriptions /> },
          { path: "finance", element: <DevCenterFinance /> },
          { path: "customers-global", element: <DevCenterCustomersGlobal /> },
          { path: "feature-flags", element: <DevCenterFeatureFlags /> },
          { path: "tickets", element: <SellerTicketsPage /> },
          { path: "toolbox", element: <DevCenterToolbox /> },
          { path: "missions", element: <Navigate to="/admin/dev-center/tickets" replace /> },
          { path: "*", element: <Navigate to="/admin/dev-center" replace /> },
        ],
      },
    ],
  },
]);

// ======================================================================
// APP
// ======================================================================
export default function App() {
  return <RouterProvider router={router} />;
}
