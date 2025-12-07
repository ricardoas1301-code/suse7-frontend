// src/components/Sidebar.jsx

import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col p-6">

      {/* Logo / Nome do sistema */}
      <h1 className="text-2xl font-bold mb-10 text-blue-600">
        S7
      </h1>

      {/* Links de navegação */}
      <nav className="flex flex-col gap-3">

        <Link to="/dashboard" className="hover:bg-blue-50 p-3 rounded-lg">
          📊 Painel
        </Link>

        <Link to="/produtos" className="hover:bg-blue-50 p-3 rounded-lg">
          📦 Produtos
        </Link>

        <Link to="/anuncios" className="hover:bg-blue-50 p-3 rounded-lg">
          🛍️ Anúncios
        </Link>

        <Link to="/monitoramento" className="hover:bg-blue-50 p-3 rounded-lg">
          📈 Monitoramento
        </Link>

        <Link to="/relatorios" className="hover:bg-blue-50 p-3 rounded-lg">
          📑 Relatórios
        </Link>

        <Link to="/configuracoes" className="hover:bg-blue-50 p-3 rounded-lg">
          ⚙️ Configurações
        </Link>

      </nav>

      {/* Área inferior – botão de sair (por enquanto só visual) */}
      <div className="mt-auto pt-10">
        <button className="w-full bg-red-600 text-white p-2 rounded-lg">
          Sair
        </button>
      </div>

    </aside>
  );
}
