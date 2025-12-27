// ======================================================================
// SIDEBAR DO PERFIL — SUSE7
// ======================================================================

import { NavLink } from "react-router-dom";
import "./SidebarProfile.css";

export default function SidebarProfile() {
  return (
    <aside className="sidebar-profile">

      <div className="sidebar-group">
        <h3 className="sidebar-title">Minha Conta</h3>

        <NavLink
          to="/perfil/dados-empresa"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          Dados da Empresa
        </NavLink>

        <NavLink
          to="/perfil/alterar-senha"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          Alterar Senha
        </NavLink>
      </div>

      <div className="sidebar-group">
        <h3 className="sidebar-title">Integrações</h3>

        <NavLink
          to="/perfil/integracoes/mercado-livre"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          Mercado Livre
        </NavLink>
      </div>

      <div className="sidebar-group">
        <h3 className="sidebar-title">Pagamentos</h3>

        <NavLink
          to="/perfil/pagamentos/formas"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          Formas de Pagamento
        </NavLink>

        <NavLink
          to="/perfil/pagamentos/extrato"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          Extrato da Conta
        </NavLink>
      </div>

      <div className="sidebar-group">
        <h3 className="sidebar-title">Preferências</h3>

        <NavLink
          to="/perfil/preferencias/notificacoes"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          Notificações
        </NavLink>
      </div>

    </aside>
  );
}
