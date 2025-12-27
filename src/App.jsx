// src/App.jsx

import {BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate} from "react-router-dom";

import { useState, useEffect } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";

// Páginas de recuperação de senha
import PasswordForgot from "./pages/PasswordForgot";
import PasswordReset from "./pages/PasswordReset";

// ML
 import MLConnect from "./ml/MLConnect.jsx";
 import MLCallback from "./ml/MLCallback.jsx";


// Supabase + Páginas
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import Terms from "./pages/Terms";
import Privacidade from "./pages/Privacidade";
import Precificacoes from "./pages/Precificacoes";
import "./global.css";

// Páginas temporárias
const AnunciosTable = () => <div className="content-wrapper"><h1>Gerenciamento de Anúncios</h1></div>;
const Produtos = () => <div className="content-wrapper"><h1>Página de Produtos</h1></div>;
const Clientes = () => <div className="content-wrapper"><h1>Página de Clientes</h1></div>;
const Faturas = () => <div className="content-wrapper"><h1>Página de Faturas</h1></div>;
const Relatorios = () => <div className="content-wrapper"><h1>Página de Relatórios</h1></div>;
const Monitoramento = () => <div className="content-wrapper"><h1>Página de Monitoramento</h1></div>;
const Registros = () => <div className="content-wrapper"><h1>Página de Registros</h1></div>;
const Configuracoes = () => <div className="content-wrapper"><h1>Página de Configurações</h1></div>;


// ======================================================================
// ROTAS PROTEGIDAS
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
    let mounted = true;

    const carregar = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        await criarProfileSeNaoExistir(session.user);
      }

      setLoading(false);
    };

    carregar();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);

        if (session?.user) {
          await criarProfileSeNaoExistir(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Carregando...</div>;

  return session ? children : <Navigate to="/login" replace />;
};

// =========================================================
// TRATAMENTO DE REDIRECT DO MERCADO LIVRE (?ml=connected)
// =========================================================
function MLRedirectHandler({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mlConnected = params.get("ml");

    if (mlConnected === "connected") {
      // Limpa a URL e redireciona para o Dashboard
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  return children;
}

// =========================================================
// REDIRECT FINAL DO MERCADO LIVRE (AGUARDA SESSÃO)
// =========================================================
function MLConnectedRedirect() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        navigate("/", { replace: true });
      } else {
        // aguarda um pouco e tenta novamente
        setTimeout(checkSessionAndRedirect, 300);
      }
    };

    checkSessionAndRedirect();
  }, [navigate]);

  return <div>Finalizando conexão...</div>;
}


// =========================================================
// ROTAS DO APP — VERSÃO CORRETA
// =========================================================
function App() {
  return (
    <Router>
  <MLRedirectHandler>
    <Routes>

      {/* 🔥 ROTAS ESPECIAIS — MERCADO LIVRE */}
      <Route path="/ml/connect" element={<MLConnect />} />
      <Route path="/ml/callback" element={<MLCallback />} />   

      {/* 🔓 ROTAS PÚBLICAS */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/forgot-password" element={<PasswordForgot />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      <Route path="/ml/connected" element={<MLConnectedRedirect />} />


      {/* 🔐 ROTAS PROTEGIDAS */}
      <Route
        path="/"
        element={
          <AuthWrapper>
            <Layout />
          </AuthWrapper>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="anuncios" element={<AnunciosTable />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="faturas" element={<Faturas />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="monitoramento" element={<Monitoramento />} />
        <Route path="registros" element={<Registros />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="precificacoes" element={<Precificacoes />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  </MLRedirectHandler>
</Router>

  );
}

export default App;
