import { NavLink, Outlet } from "react-router-dom";
import "./DevCenterRoot.css";
import "./DevCenterModules.css";

const ITEMS = [
  { to: "/admin/dev-center", end: true, label: "Dashboard" },
  { to: "/admin/dev-center/sellers", label: "Sellers" },
  { to: "/admin/dev-center/subscriptions", label: "Assinaturas" },
  { to: "/admin/dev-center/finance", label: "Financeiro" },
  { to: "/admin/dev-center/customers-global", label: "Clientes 360 S7 FULL" },
  { to: "/admin/dev-center/feature-flags", label: "Feature Flags" },
  { to: "/admin/dev-center/missions", label: "Missões" },
];

export default function DevCenterRoot() {
  return (
    <div className="dc-root">
      <aside className="dc-root__sidebar">
        <h1>Dev Center</h1>
        <p>Painel administrativo raiz do Suse7.</p>
        <nav>
          {ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="dc-root__content">
        <Outlet />
      </main>
    </div>
  );
}

