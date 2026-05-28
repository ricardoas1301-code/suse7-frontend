import BillingProtectedRoute from "./components/BillingProtectedRoute";
import { getPremiumModuleCopy } from "./premiumModules";

/**
 * @param {import("react").ReactNode} element
 * @param {string} moduleKey
 */
export function protectPremiumRoute(element, moduleKey) {
  const copy = getPremiumModuleCopy(moduleKey);
  return (
    <BillingProtectedRoute
      title={copy.title}
      description={copy.description}
      preview={copy.preview}
      showUsageNotice={copy.showUsageNotice !== false}
    >
      {element}
    </BillingProtectedRoute>
  );
}
