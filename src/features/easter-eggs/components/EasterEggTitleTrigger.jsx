import { useEasterEggs } from "../EasterEggContext.js";
import { useTripleClick } from "../useTripleClick.js";

/**
 * Gatilho invisível — triplo clique no título sem alterar layout.
 * @param {{
 *   eggId: string;
 *   className?: string;
 *   children: import("react").ReactNode;
 * }} props
 */
export default function EasterEggTitleTrigger({ eggId, className = "", children }) {
  const { abrirModalCodigo } = useEasterEggs();
  const handleTripleClick = useTripleClick(() => abrirModalCodigo(eggId));

  return (
    <h2 className={className} onClick={handleTripleClick}>
      {children}
    </h2>
  );
}
