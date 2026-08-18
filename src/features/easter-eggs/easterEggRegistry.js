import { dashboardResumoDiarioEnzoEgg } from "./eggs/dashboardResumoDiarioEnzo.js";

/** Central de Easter Eggs S7 — cadastre novos ovos aqui. */
export const EASTER_EGG_REGISTRY = {
  [dashboardResumoDiarioEnzoEgg.id]: dashboardResumoDiarioEnzoEgg,
};

/**
 * @param {string} eggId
 * @returns {typeof dashboardResumoDiarioEnzoEgg | null}
 */
export function obterEasterEgg(eggId) {
  if (!eggId || typeof eggId !== "string") return null;
  return EASTER_EGG_REGISTRY[eggId] ?? null;
}
