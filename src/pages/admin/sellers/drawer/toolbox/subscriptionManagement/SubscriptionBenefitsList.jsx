import { memo } from "react";
import {
  resolveBenefitCategory,
  resolveBenefitLabel,
} from "./subscriptionManagementModel";
import "./SubscriptionBenefitsList.css";

/**
 * @param {{ benefits: string[] }} props
 */
function SubscriptionBenefitsList({ benefits }) {
  if (!benefits?.length) {
    return (
      <p className="subscription-benefits-list__empty" role="status">
        Nenhum benefício ativo no momento.
      </p>
    );
  }

  return (
    <ul className="subscription-benefits-list" aria-label="Benefícios ativos">
      {benefits.map((benefitKey) => {
        const category = resolveBenefitCategory(benefitKey);

        return (
          <li key={benefitKey} className="subscription-benefits-list__item">
            <span className="subscription-benefits-list__badge">{resolveBenefitLabel(benefitKey)}</span>
            {category ? (
              <span className="subscription-benefits-list__category">{category}</span>
            ) : null}
            <span className="subscription-benefits-list__status">Ativo</span>
          </li>
        );
      })}
    </ul>
  );
}

export default memo(SubscriptionBenefitsList);
