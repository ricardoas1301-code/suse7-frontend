// ======================================================================
// PERFIL — LAYOUT PRINCIPAL (conteúdo ampliado)
// ======================================================================

import { Outlet } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  return (
    <div className="profile-layout profile-layout--full">
      <div className="profile-content">
        <Outlet />
      </div>
    </div>
  );
}
