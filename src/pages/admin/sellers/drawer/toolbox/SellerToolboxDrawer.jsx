import { memo } from "react";
import SellerToolboxDrawerShell from "./SellerToolboxDrawerShell";
import SellerToolboxProvider from "./SellerToolboxContext";

/**
 * @param {{
 *   sellerId: string;
 *   listPreview?: import("../../sellerOpsTypes").SellerListRow | null;
 *   detail?: import("../../sellerOpsTypes").SellerDetailPayload | null;
 *   drawerState: import("../SellerDrawerStateResolver").SellerDrawerState;
 *   onClose: () => void;
 * }} props
 */
function SellerToolboxDrawer({
  sellerId,
  listPreview = null,
  detail = null,
  drawerState,
  onClose,
}) {
  if (drawerState !== "loaded") return null;

  return (
    <SellerToolboxProvider
      sellerId={sellerId}
      listPreview={listPreview}
      detail={detail}
      drawerState={drawerState}
    >
      <SellerToolboxDrawerShell onClose={onClose} />
    </SellerToolboxProvider>
  );
}

export default memo(SellerToolboxDrawer);
