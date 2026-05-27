import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SellerDrawerBody from "./drawer/SellerDrawerBody";

import SellerDrawerEmptyState from "./drawer/SellerDrawerEmptyState";

import SellerDrawerErrorState from "./drawer/SellerDrawerErrorState";

import SellerDrawerFooter from "./drawer/SellerDrawerFooter";

import SellerDrawerHeader from "./drawer/SellerDrawerHeader";

import SellerDrawerLoadingState from "./drawer/SellerDrawerLoadingState";

import {

  isSellerDrawerToolsEnabled,

  resolveSellerDrawerState,

} from "./drawer/SellerDrawerStateResolver";

import SellerToolboxDrawer from "./drawer/toolbox/SellerToolboxDrawer";

import { logSellerDrawer } from "./sellerOpsDrawerDevLog";

import { logSellerToolbox } from "./sellerToolboxDevLog";
import {
  recordSellerToolboxOperation,
  SELLER_TOOLBOX_OPERATION_CATEGORIES,
} from "./drawer/toolbox/sellerToolboxOperationalLog";

import "./drawer/SellerDrawerStates.css";



/**

 * @param {{

 *   sellerId: string | null;

 *   listPreview?: import("./sellerOpsTypes").SellerListRow | null;

 *   detail: import("./sellerOpsTypes").SellerDetailPayload | null;

 *   loading: boolean;

 *   error: string | null;

 *   onClose: () => void;

 *   onRetry: () => void;

 * }} props

 */

export default function SellerOpsDrawer({

  sellerId,

  listPreview = null,

  detail,

  loading,

  error,

  onClose,

  onRetry,

}) {

  const lastLoggedStateRef = useRef(/** @type {import("./drawer/SellerDrawerStateResolver").SellerDrawerState | null} */ (null));

  const [toolboxOpen, setToolboxOpen] = useState(false);



  const drawerState = useMemo(

    () => resolveSellerDrawerState({ loading, error, detail }),

    [loading, error, detail],

  );



  const hasPreview = Boolean(listPreview);

  const toolsEnabled = isSellerDrawerToolsEnabled(drawerState);



  useEffect(() => {

    if (lastLoggedStateRef.current === drawerState) return;

    lastLoggedStateRef.current = drawerState;



    if (drawerState === "loading") logSellerDrawer("state_loading", { sellerId });

    if (drawerState === "empty") logSellerDrawer("state_empty", { sellerId });

    if (drawerState === "error") logSellerDrawer("state_error", { sellerId });

  }, [drawerState, sellerId]);



  useEffect(() => {

    setToolboxOpen(false);

  }, [sellerId]);



  useEffect(() => {

    if (drawerState !== "loaded") {

      setToolboxOpen(false);

    }

  }, [drawerState]);



  const handleOpenTools = useCallback(() => {

    if (!toolsEnabled) return;

    setToolboxOpen(true);

    logSellerToolbox("toolbox_open", { sellerId });
    recordSellerToolboxOperation({
      sellerId,
      event: "toolbox_open",
      category: SELLER_TOOLBOX_OPERATION_CATEGORIES.NAVIGATION,
    });

  }, [toolsEnabled, sellerId]);



  const handleCloseToolbox = useCallback(() => {

    setToolboxOpen(false);

    logSellerToolbox("toolbox_close", { sellerId });

  }, [sellerId]);



  if (!sellerId) return null;



  const mainContent = (() => {

    switch (drawerState) {

      case "loading":

        return <SellerDrawerLoadingState key="loading" />;

      case "empty":

        return <SellerDrawerEmptyState key="empty" onClose={onClose} />;

      case "error":

        return <SellerDrawerErrorState key="error" onRetry={onRetry} onClose={onClose} />;

      case "loaded":

        return (

          <SellerDrawerBody

            key="loaded"

            listPreview={listPreview}

            detail={detail}

          />

        );

      default:

        return null;

    }

  })();



  const stackClassName = [

    "dc-sellers-drawer-stack",

    toolboxOpen ? "dc-sellers-drawer-stack--toolbox-open" : "",

  ]

    .filter(Boolean)

    .join(" ");



  return (

    <div className="dc-drawer-backdrop dc-sellers-drawer-backdrop" onClick={onClose}>

      <div className={stackClassName} onClick={(event) => event.stopPropagation()}>

        <aside

          className="dc-drawer dc-sellers-drawer"

          role="dialog"

          aria-modal="true"

          aria-labelledby="dc-seller-drawer-title"

          aria-hidden={toolboxOpen ? "true" : undefined}

        >

          <SellerDrawerHeader

            sellerId={sellerId}

            listPreview={listPreview}

            detail={detail}

            loading={drawerState === "loading"}

            error={drawerState === "error" ? error : null}

          />



          <div className="dc-sellers-drawer__main seller-drawer-main">

            <div className="seller-drawer-main__panel" data-drawer-state={drawerState}>

              {mainContent}

            </div>

          </div>



          <SellerDrawerFooter

            sellerId={sellerId}

            drawerState={drawerState}

            hasPreview={hasPreview}

            toolsEnabled={toolsEnabled}

            onClose={onClose}

            onOpenTools={handleOpenTools}

          />

        </aside>



        {toolboxOpen ? (

          <SellerToolboxDrawer

            sellerId={sellerId}

            listPreview={listPreview}

            detail={detail}

            drawerState={drawerState}

            onClose={handleCloseToolbox}

          />

        ) : null}

      </div>

    </div>

  );

}

