import { memo } from "react";

import SellerDrawerFooterActions from "./SellerDrawerFooterActions";

import SellerDrawerFooterContext from "./SellerDrawerFooterContext";

import SellerDrawerToolsButton from "./SellerDrawerToolsButton";

import "./SellerDrawerFooter.css";



/**

 * @param {{

 *   sellerId?: string | null;

 *   drawerState: import("./SellerDrawerStateResolver").SellerDrawerState;

 *   hasPreview?: boolean;

 *   toolsEnabled?: boolean;

 *   onClose: () => void;

 *   onOpenTools?: () => void;

 * }} props

 */

function SellerDrawerFooter({

  sellerId = null,

  drawerState,

  hasPreview = false,

  toolsEnabled = false,

  onClose,

  onOpenTools,

}) {

  return (

    <footer className="seller-drawer-footer dc-sellers-drawer__foot">

      <SellerDrawerFooterContext drawerState={drawerState} hasPreview={hasPreview} />

      <SellerDrawerToolsButton

        disabled={!toolsEnabled}

        sellerId={sellerId}

        onOpenTools={onOpenTools}

      />

      <SellerDrawerFooterActions onClose={onClose} />

    </footer>

  );

}



export default memo(SellerDrawerFooter);

