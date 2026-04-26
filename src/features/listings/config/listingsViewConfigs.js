/**
 * Compat: importações existentes usam `listingsViewConfigs`.
 * Fonte única e documentada: `listingsPageModes.js`.
 */
import {
  ADS_PAGE_MODE,
  PRICING_PAGE_MODE,
  listingsPageModes,
  isListingsWorkspaceMode,
} from "./listingsPageModes.js";

export { ADS_PAGE_MODE, PRICING_PAGE_MODE, listingsPageModes, isListingsWorkspaceMode };

/** @type {typeof listingsPageModes} */
export const listingsViewConfigs = listingsPageModes;
