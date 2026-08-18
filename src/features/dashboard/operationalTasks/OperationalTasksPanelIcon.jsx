import onboardingOperacaoIllustration from "../../../assets/onboarding-operacao-comercial.png";

/**
 * SSOT visual do ícone da Central de pendências (mesmo asset PNG em todos os estados).
 *
 * @param {{ variant?: "collapsed" | "expanded" | "onboarding" }} props
 */
export default function OperationalTasksPanelIcon({ variant = "collapsed" }) {
  const className =
    variant === "onboarding"
      ? "s7-operational-tasks-panel__title-illustration"
      : variant === "expanded"
        ? "s7-operational-tasks-panel__header-illustration"
        : "s7-operational-tasks-panel__collapsed-illustration";

  return (
    <img
      src={onboardingOperacaoIllustration}
      alt=""
      className={className}
      aria-hidden
      decoding="async"
    />
  );
}
