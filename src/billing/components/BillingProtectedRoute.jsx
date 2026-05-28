import BillingStatusGate from "./BillingStatusGate";
import PremiumFeatureLock from "./PremiumFeatureLock";
import BillingUsageNotice from "./BillingUsageNotice";
import "../billing.css";

export default function BillingProtectedRoute({
  children,
  title = "Recurso premium",
  description = "Ative um plano para usar este módulo com segurança e escala.",
  preview = false,
  showUsageNotice = true,
}) {
  return (
    <div className="s7-billing-protected-route">
      <BillingStatusGate />
      {showUsageNotice ? <BillingUsageNotice /> : null}
      <PremiumFeatureLock title={title} description={description} preview={preview}>
        {children}
      </PremiumFeatureLock>
    </div>
  );
}
