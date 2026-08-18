import { createContext, useContext } from "react";

export const EasterEggContext = createContext(/** @type {null | {
 *   abrirModalCodigo: (eggId: string) => void;
 * }} */ (null));

export function useEasterEggs() {
  const ctx = useContext(EasterEggContext);
  if (!ctx) {
    throw new Error("useEasterEggs deve ser usado dentro de EasterEggProvider.");
  }
  return ctx;
}
