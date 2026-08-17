import { useConfigurationAppGate } from "./ConfigurationAppGate.jsx";
import "./ConfigurationAppGate.css";

/**
 * Bloqueia interação do conteúdo operacional enquanto configuração < 100%.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function ConfigurationAppGateShell({ children }) {
  const { locked } = useConfigurationAppGate();

  return (
    <div
      className={["s7-config-app-gate", locked ? "s7-config-app-gate--locked" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="s7-config-app-gate__content" {...(locked ? { inert: "" } : {})}>
        {children}
      </div>
      {locked ? <div className="s7-config-app-gate__veil" aria-hidden="true" tabIndex={-1} /> : null}
    </div>
  );
}
