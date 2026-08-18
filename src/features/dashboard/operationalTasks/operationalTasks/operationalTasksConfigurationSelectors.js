import { CONFIGURATION_STATUS } from "./operationalTasksConfigurationTypes.js";

/**
 * @param {{ configuration?: Record<string, unknown>; milestones?: readonly Record<string, unknown>[] } | null | undefined} snapshot
 */
export function configuracaoEstaCompleta(snapshot) {
  const configuration = snapshot?.configuration;
  if (!configuration || typeof configuration !== "object") return false;
  if (configuration.status === CONFIGURATION_STATUS.COMPLETED) return true;
  return Number(configuration.percent) >= 100;
}
