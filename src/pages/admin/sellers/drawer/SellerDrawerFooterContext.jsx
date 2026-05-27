import { memo, useMemo } from "react";

import { buildFooterContextMessage } from "./sellerDrawerFooterModel";



/**

 * @param {{

 *   drawerState: import("./SellerDrawerStateResolver").SellerDrawerState;

 *   hasPreview?: boolean;

 * }} props

 */

function SellerDrawerFooterContext({ drawerState, hasPreview = false }) {

  const message = useMemo(

    () => buildFooterContextMessage(drawerState, hasPreview),

    [drawerState, hasPreview],

  );



  return (

    <div className="seller-drawer-footer__context" role="status" aria-live="polite">

      <span className="seller-drawer-footer__context-dot" aria-hidden />

      <span className="seller-drawer-footer__context-text">{message}</span>

    </div>

  );

}



export default memo(SellerDrawerFooterContext);

