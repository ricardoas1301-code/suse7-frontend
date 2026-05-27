import { memo, useMemo } from "react";

import SellerDrawerHeaderIdentity from "./SellerDrawerHeaderIdentity";

import SellerDrawerHeaderStatus from "./SellerDrawerHeaderStatus";

import { buildSellerDrawerHeaderModel } from "./sellerDrawerHeaderModel";

import "./SellerDrawerHeader.css";



/**

 * @param {{

 *   sellerId: string;

 *   listPreview?: import("../sellerOpsTypes").SellerListRow | null;

 *   detail?: import("../sellerOpsTypes").SellerDetailPayload | null;

 *   loading?: boolean;

 *   error?: string | null;

 * }} props

 */

function SellerDrawerHeader({

  sellerId,

  listPreview = null,

  detail = null,

  loading = false,

  error = null,

}) {

  const model = useMemo(

    () => buildSellerDrawerHeaderModel({ sellerId, listPreview, detail }),

    [sellerId, listPreview, detail],

  );



  const identityLoading = loading && !listPreview && !detail;

  const statusLoading = loading && !detail && !listPreview;



  return (

    <header className="seller-drawer-header dc-sellers-drawer__head">

      <div className="seller-drawer-header__grid">

        <SellerDrawerHeaderIdentity

          nome={model.nome}

          email={model.email}

          secondaryId={model.secondaryId}

          photoUrl={model.photoUrl}

          initial={model.initial}

          loading={identityLoading}

        />

        <SellerDrawerHeaderStatus badges={model.badges} loading={statusLoading} error={error} />

      </div>

    </header>

  );

}



export default memo(SellerDrawerHeader);


