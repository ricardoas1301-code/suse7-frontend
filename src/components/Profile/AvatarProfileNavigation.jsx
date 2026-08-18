import { useLocation } from "react-router-dom";

import {
  PROFILE_NAVIGATION_GROUPS,
  isProfileNavItemActive,
} from "./profileNavigationConfig.js";

/**
 * @param {{
 *   onNavigate: (route: string) => void;
 * }} props
 */
export default function AvatarProfileNavigation({ onNavigate }) {
  const location = useLocation();

  return (
    <nav className="avatar-menu-nav" aria-label="Navegação do perfil">
      {PROFILE_NAVIGATION_GROUPS.map((group) => (
        <section key={group.id} className="avatar-menu-nav-group" aria-labelledby={`avatar-nav-${group.id}`}>
          <h3 id={`avatar-nav-${group.id}`} className="avatar-menu-nav-group__title avatar-menu-section-title">
            {group.label}
          </h3>
          <ul className="avatar-menu-nav-group__items avatar-menu-nav-list">
            {group.items.map((item) => {
              const active = isProfileNavItemActive(location, item);

              return (
                <li key={item.id} className="avatar-menu-nav-group__item">
                  <button
                    type="button"
                    className={[
                      "avatar-menu-item",
                      "avatar-menu-nav-item",
                      item.nested ? "avatar-menu-nav-item--nested" : "",
                      active ? "avatar-menu-nav-item--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onNavigate(item.route)}
                    onFocus={(event) => {
                      event.currentTarget.scrollIntoView({ block: "nearest" });
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
