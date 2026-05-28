import S7Icon from "../../components/ui/S7Icon";
import "./BillingFinanceEmptyState.css";

/**
 * @param {{
 *   iconName?: string;
 *   title: string;
 *   description: string;
 *   className?: string;
 * }} props
 */
export default function BillingFinanceEmptyState({
  iconName = "empty",
  title,
  description,
  className = "",
}) {
  return (
    <div className={`s7-billing-finance-empty ${className}`.trim()} role="status">
      <div className="s7-billing-finance-empty__icon" aria-hidden="true">
        <S7Icon name={iconName} size={28} strokeWidth={1.75} />
      </div>
      <p className="s7-billing-finance-empty__title">{title}</p>
      <p className="s7-billing-finance-empty__description">{description}</p>
    </div>
  );
}
