// ======================================================================
// Helpers de active state — navegação do Perfil
// ======================================================================

/**
 * @typedef {Object} ProfileNavLocation
 * @property {string} pathname
 * @property {string} search
 */

/**
 * @typedef {Object} ProfileNavItem
 * @property {string} id
 * @property {string} label
 * @property {string} route
 * @property {(location: ProfileNavLocation) => boolean} isActive
 * @property {boolean} [nested]
 */

/**
 * @typedef {Object} ProfileNavGroup
 * @property {string} id
 * @property {string} label
 * @property {ProfileNavItem[]} items
 */

/**
 * @param {ProfileNavLocation} location
 * @param {ProfileNavItem[]} items
 * @returns {string | null}
 */
export function resolveActiveProfileNavItemIdFromItems(location, items) {
  const pathname = String(location.pathname || "");
  const search = String(location.search || "");

  for (const item of items) {
    if (item.isActive({ pathname, search })) {
      return item.id;
    }
  }

  return null;
}

/**
 * @param {ProfileNavLocation} location
 * @param {ProfileNavItem[]} items
 * @param {ProfileNavItem} item
 * @returns {boolean}
 */
export function isProfileNavItemActiveFromItems(location, items, item) {
  return resolveActiveProfileNavItemIdFromItems(location, items) === item.id;
}
