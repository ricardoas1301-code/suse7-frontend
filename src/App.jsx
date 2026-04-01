// ======================================================================
// src/App.jsx — ROTAS PRINCIPAIS DO SUSE7
// ======================================================================

import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useState, useEffect } from "react";
import "./App.css";
import "./global.css";
import "./styles/Suse7-Design-System.css";

// Supabase
import { supabase } from "./supabaseClient";

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
import Preferencias from "./components/Profile/Preferencias";
import Notificacoes from "./components/Profile/Notificacoes";

// Produtos (REAL)
import Products from "./components/Products";
import Anuncios from "./components/Anuncios";
import MlListingImportDebug from "./pages/debug/MlListingImportDebug.jsx";
import ProductCreate from "./pages/ProductCreate";
import ProductEdit from "./pages/ProductEdit";

// Notificações (in-app toast)
import { NotificationProvider } from "./contexts/NotificationContext";
// Status de save (ampulheta global)
import { SaveStatusProvider } from "./contexts/SaveStatusContext";
import SaveStatusIndicator from "./components/SaveStatusIndicator";

// Temporários
const Clientes = () => <h1>Clientes</h1>;
const Faturas = () => <h1>Faturas</h1>;
const Relatorios = () => <h1>Relatórios</h1>;
const Monitoramento = () => <h1>Monitoramento</h1>;
const Registros = () => <h1>Registros</h1>;
const Configuracoes = () => <h1>Configurações</h1>;
const Precificacoes = () => <h1>Precificações</h1>;

// ======================================================================
// AUTH WRAPPER
// ======================================================================
const AuthWrapper = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div>Carregando...</div>;
  return session ? children : <Navigate to="/login" replace />;
};

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
        <AuthWrapper>
          <NotificationProvider>
            <SaveStatusProvider>
              <Layout />
              <SaveStatusIndicator />
            </SaveStatusProvider>
          </NotificationProvider>
        </AuthWrapper>
      </MLRedirectHandler>
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
          { path: "pagamentos/formas", element: <FormasPagamento /> },
          { path: "pagamentos/extrato", element: <ExtratoConta /> },
          {
            path: "preferencias",
            element: <Preferencias />,
            children: [
              { index: true, element: <Notificacoes /> },
              { path: "notificacoes", element: <Notificacoes /> },
            ],
          },
        ],
      },
      { path: "anuncios", element: <Anuncios /> },
      { path: "anuncios/debug-importacao", element: <MlListingImportDebug /> },
      { path: "produtos", element: <Products /> },
      { path: "clientes", element: <Clientes /> },
      { path: "faturas", element: <Faturas /> },
      { path: "relatorios", element: <Relatorios /> },
      { path: "monitoramento", element: <Monitoramento /> },
      { path: "registros", element: <Registros /> },
      { path: "configuracoes", element: <Navigate to="/perfil" replace /> },
      { path: "precificacoes", element: <Precificacoes /> },
      { path: "produtos/novo", element: <ProductCreate /> },
      { path: "produtos/:id/editar", element: <ProductEdit /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

// ======================================================================
// APP
// ======================================================================
export default function App() {
  return <RouterProvider router={router} />;
}
