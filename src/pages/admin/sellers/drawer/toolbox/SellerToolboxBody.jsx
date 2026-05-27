import { memo } from "react";
import { ArrowLeft } from "lucide-react";
import { S7Button } from "../../../../../components/ui";
import ToolboxCategoryCard from "./ToolboxCategoryCard";
import SellerToolboxCategoryPanel from "./SellerToolboxCategoryPanel";
import SellerToolboxConfirmDevTrigger from "./SellerToolboxConfirmDevTrigger";
import SellerToolboxFeedbackDevTrigger from "./SellerToolboxFeedbackDevTrigger";
import { SellerToolboxContextFallback } from "./SellerToolboxContext";
import { useSellerToolboxNavigation } from "./SellerToolboxNavigation";
import { SELLER_TOOLBOX_CATEGORIES } from "./sellerToolboxCategoriesModel";

function SellerToolboxBody() {
  const { selectedCategory, clearCategory } = useSellerToolboxNavigation();

  return (
    <SellerToolboxContextFallback>
      <div
        className={[
          "seller-toolbox-body",
          "dc-sellers-drawer__scroll",
          selectedCategory ? "seller-toolbox-body--panel" : "seller-toolbox-body--list",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {selectedCategory ? (
          <div className="seller-toolbox-body__view seller-toolbox-body__view--panel">
            <S7Button
              type="button"
              variant="secondary"
              size="sm"
              className="seller-toolbox-nav-back"
              onClick={clearCategory}
            >
              <ArrowLeft className="seller-toolbox-nav-back__icon" strokeWidth={2} aria-hidden />
              Voltar para categorias
            </S7Button>
            <SellerToolboxCategoryPanel category={selectedCategory} />
          </div>
        ) : (
          <div className="seller-toolbox-body__view seller-toolbox-body__view--list">
            <p className="seller-toolbox-body__intro">
              Categorias operacionais disponíveis para este seller. As ações serão habilitadas nas
              próximas fases.
            </p>
            <div className="seller-toolbox-body__grid">
              {SELLER_TOOLBOX_CATEGORIES.map((category) => (
                <ToolboxCategoryCard key={category.id} {...category} />
              ))}
            </div>
            <SellerToolboxConfirmDevTrigger />
            <SellerToolboxFeedbackDevTrigger />
          </div>
        )}
      </div>
    </SellerToolboxContextFallback>
  );
}

export default memo(SellerToolboxBody);
