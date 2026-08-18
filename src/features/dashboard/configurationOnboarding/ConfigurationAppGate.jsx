import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthBootstrap } from "../../../contexts/AuthBootstrapContext.jsx";
import { useLoginIntroGate } from "../../../auth/useLoginIntroGate.js";
import { useConfigurationSnapshot } from "./useConfigurationSnapshot.js";
import {
  configuracaoAppGateAtivo,
  resolverRedirectConfiguracaoIncompleta,
} from "./configurationAppGate.js";
import { milestoneM6Elegivel } from "./configurationMilestoneEligibility.js";
import "./ConfigurationAppGate.css";

/** @type {React.Context<{ locked: boolean; m6Eligible: boolean } | null>} */
const ConfigurationAppGateContext = createContext(null);

export function useConfigurationAppGate() {
  return useContext(ConfigurationAppGateContext) ?? { locked: false, m6Eligible: false };
}

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function ConfigurationAppGateProvider({ children }) {
  const { ready: authReady, user } = useAuthBootstrap();
  const { introActive } = useLoginIntroGate(authReady, user);
  const configuration = useConfigurationSnapshot({ enabled: authReady && !introActive });
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const locked = configuracaoAppGateAtivo({
    snapshot: configuration.snapshot,
    initialLoading: configuration.initialLoading,
    refreshing: configuration.refreshing,
    error: configuration.error,
    hasResolvedOnce: configuration.hasResolvedOnce,
    introActive,
  });

  const milestones = configuration.snapshot?.milestones ?? [];
  const m6Eligible = useMemo(() => milestoneM6Elegivel(milestones), [milestones]);

  useEffect(() => {
    if (!authReady || introActive) return;
    const redirect = resolverRedirectConfiguracaoIncompleta(pathname, locked, milestones);
    if (redirect && redirect !== pathname) {
      navigate(redirect, { replace: true });
    }
  }, [authReady, introActive, locked, milestones, navigate, pathname]);

  const contextValue = useMemo(
    () => ({ locked, m6Eligible }),
    [locked, m6Eligible],
  );

  return (
    <ConfigurationAppGateContext.Provider value={contextValue}>
      {children}
    </ConfigurationAppGateContext.Provider>
  );
}
