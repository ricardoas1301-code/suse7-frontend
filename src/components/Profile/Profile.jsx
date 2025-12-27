// ======================================================================
// PERFIL — LAYOUT PRINCIPAL (SIDEBAR + CONTEÚDO) ok
// ======================================================================

import { Outlet } from "react-router-dom";
import SidebarProfile from "./SidebarProfile";
import "./Profile.css";

export default function Profile() {
  return (
    <div className="profile-layout">
      {/* Sidebar fixa */}
      <SidebarProfile />

      {/* Conteúdo dinâmico */}
      <div className="profile-content">
        <Outlet />
      </div>
    </div>
  );
}
