// ======================================================================

// Navegação canônica do Perfil — Fonte Única da Verdade

// ======================================================================



import { STATIC_PROFILE_NAVIGATION_GROUPS } from "./profileNavigationStatic.js";

import { buildProfileNotificationCenterNavItems } from "./profileNavigationNotificationCenterItems.js";

import {

  resolveActiveProfileNavItemIdFromItems,

  isProfileNavItemActiveFromItems,

} from "./profileNavigationActive.js";



/** @typedef {import("./profileNavigationActive.js").ProfileNavGroup} ProfileNavGroup */

/** @typedef {import("./profileNavigationActive.js").ProfileNavItem} ProfileNavItem */

/** @typedef {import("./profileNavigationActive.js").ProfileNavLocation} ProfileNavLocation */



/** @type {ProfileNavGroup[]} */

export const PROFILE_NAVIGATION_GROUPS = [

  ...STATIC_PROFILE_NAVIGATION_GROUPS,

  {

    id: "notification-center",

    label: "CENTRAL DE NOTIFICAÇÕES",

    items: buildProfileNotificationCenterNavItems(),

  },

];



/** @type {ProfileNavItem[]} */

export const PROFILE_NAVIGATION_ITEMS = PROFILE_NAVIGATION_GROUPS.flatMap((group) => group.items);



/**

 * @param {ProfileNavLocation} location

 * @returns {string | null}

 */

export function resolveActiveProfileNavItemId(location) {

  return resolveActiveProfileNavItemIdFromItems(location, PROFILE_NAVIGATION_ITEMS);

}



/**

 * @param {ProfileNavLocation} location

 * @param {ProfileNavItem} item

 * @returns {boolean}

 */

export function isProfileNavItemActive(location, item) {

  return isProfileNavItemActiveFromItems(location, PROFILE_NAVIGATION_ITEMS, item);

}



export { STATIC_PROFILE_NAVIGATION_GROUPS } from "./profileNavigationStatic.js";

export { buildProfileNotificationCenterNavItems } from "./profileNavigationNotificationCenterItems.js";


