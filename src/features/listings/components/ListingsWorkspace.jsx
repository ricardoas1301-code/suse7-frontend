/**
 * Orquestração superficial por modo: delega estado e dados ao container de domínio `Anuncios`,
 * que já integra o backend. Evita duplicar fetch, modais e modais Raio-x nesta fase.
 */
import Anuncios from "../../../components/Anuncios";
import { useListingsWorkspace } from "../hooks/useListingsWorkspace";
import "./ListingsWorkspace.css";

/**
 * @param {{
 *   mode: import("../config/listingsPageModes.js").ListingsWorkspaceMode;
 *   filtersSectionRef?: import("react").RefObject<HTMLElement | null>;
 *   sectionJumpUpTargetRef?: import("react").RefObject<Element | null>;
 *   sectionJumpUpAriaLabel?: string;
 * }} props
 */
export default function ListingsWorkspace({
  mode,
  filtersSectionRef = null,
  sectionJumpUpTargetRef = null,
  sectionJumpUpAriaLabel,
}) {
  const { mode: safeMode, config } = useListingsWorkspace(mode);

  return (
    <div className={`listings-workspace listings-workspace--${safeMode}`}>
      <Anuncios
        listingsWorkspaceMode={safeMode}
        listingsViewConfig={config}
        filtersSectionRef={filtersSectionRef}
        sectionJumpUpTargetRef={sectionJumpUpTargetRef}
        sectionJumpUpAriaLabel={sectionJumpUpAriaLabel}
      />
    </div>
  );
}
