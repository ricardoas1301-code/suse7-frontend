// ======================================================================
// Padrão global do portal Raio-x (precificação, venda e futuros canais).
// Altura, posição vertical e variáveis CSS do shell são únicas aqui.
// Tema (logo, cor da moldura) vem de getMarketplaceTheme() no shell.
// ======================================================================

/** Versão do contrato de tamanho/posição do shell portal Raio-x. */
export const RAIOX_PORTAL_SHELL_LAYOUT_STANDARD_VERSION = 1;

/** Classe base do shell portal — ancorar CSS compartilhado de altura/posição. */
export const RAIOX_PORTAL_SHELL_CLASS = "rayx-portal-shell";

/** Variável CSS com a altura útil do shell (px). */
export const RAIOX_PORTAL_SHELL_HEIGHT_CSS_VAR = "--raiox-portal-shell-height";

/** Respiro vertical nominal por borda (antes do ajuste de margens da viewport). */
export const RAIOX_PORTAL_SHELL_EDGE_RESPIRE_NOMINAL_PX = 12;

/** Redução das margens superior e inferior do shell Raio-x portal vs nominal. */
export const RAIOX_PORTAL_SHELL_VIEWPORT_MARGIN_TRIM_RATIO = 0.6;

/** Piso útil do shell Raio-x portal em viewports curtas. */
export const RAIOX_PORTAL_SHELL_MIN_HEIGHT_PX = 360;

/** Fração da correção visual entre centro geométrico e centro útil (sem alterar altura). */
export const RAIOX_PORTAL_SHELL_CENTER_OFFSET_RATIO = 0.09;

/** Insets do popover Raio-x: viewport útil (navbar Suse7 + safe-area). */
export function getRaioxPopoverViewportInsets() {
  const edge = 12;
  const gapBelowNav = 8;
  let top = edge;
  let bottom = edge;
  if (typeof document === "undefined") return { top, bottom };
  const nav = document.querySelector(".navbar-premium");
  if (nav) {
    const nb = nav.getBoundingClientRect().bottom;
    if (Number.isFinite(nb) && nb > 0) top = Math.max(top, nb + gapBelowNav);
  } else {
    top = Math.max(top, 72);
  }
  try {
    const tEnv = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-top)") || "0",
    );
    const bEnv = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-bottom)") || "0",
    );
    if (Number.isFinite(tEnv) && tEnv > 0) top = Math.max(top, tEnv + edge);
    if (Number.isFinite(bEnv) && bEnv > 0) bottom = Math.max(bottom, bEnv + edge);
  } catch {
    /* ignore */
  }
  return { top, bottom };
}

/** Respiro efetivo entre o shell Raio-x portal e a borda útil da viewport. */
export function getRaioxPortalShellEdgeRespirePx() {
  return Math.max(
    4,
    Math.round(
      RAIOX_PORTAL_SHELL_EDGE_RESPIRE_NOMINAL_PX * (1 - RAIOX_PORTAL_SHELL_VIEWPORT_MARGIN_TRIM_RATIO),
    ),
  );
}

/**
 * Altura do shell Raio-x portal com margem externa uniforme (topo/base da janela).
 * @param {number} viewportInnerHeight
 */
export function resolveRaioxPortalShellLayoutPx(viewportInnerHeight) {
  const vh = Math.max(0, Math.floor(viewportInnerHeight));
  const edge = getRaioxPortalShellEdgeRespirePx();
  const height = Math.max(RAIOX_PORTAL_SHELL_MIN_HEIGHT_PX, vh - edge * 2);
  return { height, edge };
}

/** @param {number} viewportInnerHeight */
export function resolveRaioxPortalShellHeightPx(viewportInnerHeight) {
  return resolveRaioxPortalShellLayoutPx(viewportInnerHeight).height;
}

/**
 * Deslocamento vertical leve do shell Raio-x portal.
 * @param {number} [topInset]
 * @param {number} [bottomInset]
 */
export function resolveRaioxPortalShellCenterYOffsetPx(topInset = 0, bottomInset = 0) {
  const top = Math.max(0, Math.floor(topInset));
  const bottom = Math.max(0, Math.floor(bottomInset));
  return Math.round(Math.max(0, (top - bottom) * RAIOX_PORTAL_SHELL_CENTER_OFFSET_RATIO));
}

/**
 * Métricas padrão do shell portal Raio-x para a viewport atual.
 * @param {number} viewportInnerHeight
 */
export function measureRayxPortalShellMetrics(viewportInnerHeight) {
  const insets = getRaioxPopoverViewportInsets();
  const layout = resolveRaioxPortalShellLayoutPx(viewportInnerHeight);
  const centerYOffset = resolveRaioxPortalShellCenterYOffsetPx(insets.top, insets.bottom);
  return {
    insets,
    layout,
    centerYOffset,
    height: layout.height,
  };
}

/**
 * Estilo inline padrão de posicionamento do shell portal Raio-x.
 * @param {{
 *   width?: number;
 *   height: number;
 *   centerYOffset?: number;
 *   fitScale?: number;
 *   fixedHeight?: boolean;
 * }} options
 */
export function buildRayxPortalShellPlacementStyle({
  width,
  height,
  centerYOffset = 0,
  fitScale = 1,
  fixedHeight = true,
}) {
  const scale = fitScale < 1 ? ` scale(${fitScale})` : "";
  /** @type {Record<string, string | number>} */
  const style = {
    left: "50%",
    top: "50%",
    transform: `translate(-50%, calc(-50% + ${centerYOffset}px))${scale}`,
    transformOrigin: "center center",
    [RAIOX_PORTAL_SHELL_HEIGHT_CSS_VAR]: `${height}px`,
  };
  if (width != null) {
    style.width = width;
    style.maxWidth = width;
  }
  if (fixedHeight) {
    style.height = height;
    style.maxHeight = height;
  } else {
    style.maxHeight = height;
  }
  return style;
}
