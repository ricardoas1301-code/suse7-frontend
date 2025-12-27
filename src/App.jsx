// ======================================================================
// src/App.jsx — ROTAS PRINCIPAIS DO SUSE7
// ======================================================================

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useState, useEffect } from "react";
import "./App.css";
import "./global.css";

// ----------------------------------------------------------------------
// Supabase
// ----------------------------------------------------------------------
import { supabase } from "./supabaseClient";

// ----------------------------------------------------------------------
// Layout e páginas principais
// ----------------------------------------------------------------------
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";

// ----------------------------------------------------------------------
// Páginas públicas
// ----------------------------------------------------------------------
import Terms from "./pages/Terms";
import Privacidade from "./pages/Privacidade";
import PasswordForgot from "./pages/PasswordForgot";
import PasswordReset from "./pages/PasswordReset";

// ----------------------------------------------------------------------
// Mercado Livre
// ----------------------------------------------------------------------
import MLConnect from "./ml/MLConnect.jsx";
import MLCallback from "./ml/MLCallback.jsx";

// ----------------------------------------------------------------------
// Perfil (sidebar + subrotas)
// ----------------------------------------------------------------------
import Profile from "./components/Profile/Profile";
import DadosEmpresa from "./components/Profile/DadosEmpresa";
import AlterarSenha from "./components/Profile/AlterarSenha";
import MercadoLivre from "./components/Profile/MercadoLivre";
import FormasPagamento from "./components/Profile/FormasPagamento";
import ExtratoConta from "./components/Profile/ExtratoConta";
import Preferencias from "./components/Profile/Preferencias";
import Notificacoes from "./components/Profile/Notificacoes";

// ----------------------------------------------------------------------
// Páginas temporárias
// ----------------------------------------------------------------------
const AnunciosTable = () => <h1>Anúncios</h1>;
const Produtos = () => <h1>Produtos</h1>;
const Clientes = () => <h1>Clientes</h1>;
const Faturas = () => <h1>Faturas</h1>;
const Relatorios = () => <h1>Relatórios</h1>;
const Monitoramento = () => <h1>Monitoramento</h1>;
const Registros = () => <h1>Registros</h1>;
const Configuracoes = () => <h1>Configurações</h1>;
const Precificacoes = () => <h1>Precificações</h1>;

// ======================================================================
// AUTH WRAPPER — PROTEGE ROTAS
// ======================================================================
const AuthWrapper = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const criarProfileSeNaoExistir = async (user) => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        primeiro_login: true,
        created_at: new Date(),
        last_login: new Date(),
      });
    }
  };

  useEffect(() => {
    const carregar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        await criarProfileSeNaoExistir(session.user);
      }

      setLoading(false);
    };

    carregar();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return session ? children : <Navigate to="/login" replace />;
};

// ======================================================================
// REDIRECT ML (?ml=connected)
// ======================================================================
function MLRedirectHandler({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("ml") === "connected") {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  return children;
}

// ======================================================================
// APP
// ======================================================================
export default function App() {
  return (
    <Router>
      <MLRedirectHandler>
        <Routes>
          {/* -------------------------------------------------- */}
          {/* ROTAS PÚBLICAS */}
          {/* -------------------------------------------------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/forgot-password" element={<PasswordForgot />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          {/* -------------------------------------------------- */}
          {/* MERCADO LIVRE */}
          {/* -------------------------------------------------- */}
          <Route path="/ml/connect" element={<MLConnect />} />
          <Route path="/ml/callback" element={<MLCallback />} />

          {/* -------------------------------------------------- */}
          {/* ROTAS PROTEGIDAS */}
          {/* -------------------------------------------------- */}
          <Route
            path="/"
            element={
              <AuthWrapper>
                <Layout />
              </AuthWrapper>
            }
          >
            <Route index element={<Dashboard />} />

            {/* PERFIL */}
            <Route path="perfil" element={<Profile />}>
              <Route index element={<DadosEmpresa />} />
              <Route path="dados-empresa" element={<DadosEmpresa />} />
              <Route path="alterar-senha" element={<AlterarSenha />} />
              <Route path="integracoes/mercado-livre" element={<MercadoLivre />} />
              <Route path="pagamentos/formas" element={<FormasPagamento />} />
              <Route path="pagamentos/extrato" element={<ExtratoConta />} />

              {/* PREFERÊNCIAS */}
              <Route path="preferencias" element={<Preferencias />}>
                <Route index element={<Notificacoes />} />
                <Route path="notificacoes" element={<Notificacoes />} />
              </Route>
            </Route>

            {/* OUTRAS */}
            <Route path="anuncios" element={<AnunciosTable />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="faturas" element={<Faturas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="monitoramento" element={<Monitoramento />} />
            <Route path="registros" element={<Registros />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="precificacoes" element={<Precificacoes />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MLRedirectHandler>
    </Router>
  );
}
