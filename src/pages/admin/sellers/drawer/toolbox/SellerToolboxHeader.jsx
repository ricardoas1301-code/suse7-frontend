import { memo, useMemo } from "react";
import { Wrench } from "lucide-react";
import { buildSellerDrawerHeaderModel } from "../sellerDrawerHeaderModel";
import { useSellerToolbox } from "./SellerToolboxContext";

function SellerToolboxHeader() {
  const { sellerId, listPreview, detail, isReady } = useSellerToolbox();

  const model = useMemo(() => {
    if (!sellerId) {
      return { nome: "Seller" };
    }
    return buildSellerDrawerHeaderModel({ sellerId, listPreview, detail });
  }, [sellerId, listPreview, detail]);

  return (
    <header
      className="seller-toolbox-header dc-sellers-drawer__head"
      data-context-ready={isReady || undefined}
    >
      <div className="seller-toolbox-header__lead">
        <div className="seller-toolbox-header__icon-wrap" aria-hidden>
          <Wrench className="seller-toolbox-header__icon" strokeWidth={2} />
        </div>
        <div className="seller-toolbox-header__copy">
          <h3 id="seller-toolbox-title" className="seller-toolbox-header__title">
            Ferramentas
          </h3>
          <p className="seller-toolbox-header__seller">{model.nome}</p>
          <p className="seller-toolbox-header__subtitle">Selecione uma ferramenta</p>
        </div>
      </div>
    </header>
  );
}

export default memo(SellerToolboxHeader);
