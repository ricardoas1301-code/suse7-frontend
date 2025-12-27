// ======================================================================
// SIDEBAR DO PERFIL
// ======================================================================

import { NavLink } from "react-router-dom";
import "./SidebarProfile.css";

export default function SidebarProfile() {
  return (
    <aside className="sidebar-profile">
      <h3 className="sidebar-title">Minha Conta</h3>

      <NavLink
          to="/perfil/dados-empresa"
          className={({ isActive }) =>
          isActive ? "sidebar-link active" : "sidebar-link"
        }
        >
        Dados da Empresa
      </NavLink>

      <NavLink to="/perfil/alterar-senha">Alterar Senha</NavLink>

      <h3 className="sidebar-title">Integrações</h3>
      <NavLink to="/perfil/integracoes/mercado-livre">
        Mercado Livre
      </NavLink>

      <h3 className="sidebar-title">Pagamentos</h3>
      <NavLink to="/perfil/pagamentos/formas">
        Formas de Pagamento
      </NavLink>
      <NavLink to="/perfil/pagamentos/extrato">
        Extrato da Conta
      </NavLink>

      <h3 className="sidebar-title">Preferências</h3>
      <NavLink to="/perfil/preferencias/notificacoes">
        Notificações
      </NavLink>
    </aside>
  );
}

<aside className="sidebar-profile" aria-label="Menu do perfil"></aside>