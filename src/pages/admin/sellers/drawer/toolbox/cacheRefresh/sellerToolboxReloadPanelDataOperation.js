import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { SELLER_TOOLBOX_RELOAD_PANEL_DATA_PANEL_KEYS } from "./sellerToolboxCacheRefreshModel";

export const SELLER_TOOLBOX_RELOAD_PANEL_DATA_ACTION_ID = "reload_panel_data";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   sellerName?: string;
 *   previousReloadedAt?: string | null;
 * }} SellerToolboxReloadPanelDataOperationContext
 */

/**
 * @param {SellerToolboxReloadPanelDataOperationContext} context
 */
export async function executeFakeReloadPanelData(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    reloadedAt: new Date().toISOString(),
    reloadedPanels: [...SELLER_TOOLBOX_RELOAD_PANEL_DATA_PANEL_KEYS],
  };
}
