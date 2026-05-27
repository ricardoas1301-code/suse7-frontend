import { memo, useMemo } from "react";

import SellerDrawerCompaniesCard from "./SellerDrawerCompaniesCard";

import SellerDrawerIdentityCard from "./SellerDrawerIdentityCard";

import SellerDrawerMarketplaceCard from "./SellerDrawerMarketplaceCard";

import SellerDrawerQuickMetricsCard from "./SellerDrawerQuickMetricsCard";

import SellerDrawerSubscriptionCard from "./SellerDrawerSubscriptionCard";

import "./SellerDrawerSection.css";



/**

 * @param {{

 *   listPreview?: import("../sellerOpsTypes").SellerListRow | null;

 *   detail?: import("../sellerOpsTypes").SellerDetailPayload | null;

 * }} props

 */

function SellerDrawerBody({ listPreview = null, detail = null }) {

  const seller = detail?.seller ?? null;

  const identity = detail?.identity ?? null;

  const subscription = detail?.subscription ?? null;

  const companies = useMemo(

    () => (Array.isArray(detail?.companies) ? detail.companies : []),

    [detail?.companies],

  );

  const marketplaces = useMemo(

    () => (Array.isArray(detail?.marketplaces) ? detail.marketplaces : []),

    [detail?.marketplaces],

  );

  const metrics = detail?.metrics ?? null;



  return (

    <div className="seller-drawer-body dc-sellers-drawer__scroll">

      <SellerDrawerIdentityCard

        seller={seller}

        identity={identity}

        listPreview={listPreview}

        state="loaded"

      />

      <SellerDrawerSubscriptionCard subscription={subscription} metrics={metrics} state="loaded" />

      <SellerDrawerCompaniesCard companies={companies} state="loaded" />

      <SellerDrawerMarketplaceCard marketplaces={marketplaces} state="loaded" />

      <SellerDrawerQuickMetricsCard metrics={metrics} marketplaces={marketplaces} state="loaded" />

    </div>

  );

}



export default memo(SellerDrawerBody);

