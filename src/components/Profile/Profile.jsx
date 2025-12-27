// ======================================================================
// PERFIL — CONTAINER PRINCIPAL
// ======================================================================

import { Outlet } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  return (
    <div className="profile-container">
      <Outlet />
    </div>
  );
}
