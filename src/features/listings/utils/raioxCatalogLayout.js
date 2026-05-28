/** Largura fixa do modal Raio-x (referência visual: estado sem produto vinculado). */
const ADS_RAIOX_POPOVER_WIDTH_PX = 300;
/** Piso de largura mínima do shell Raio-x ML comparativo (ex.: estado vazio / fallback). */
const ADS_RAIOX_POPOVER_WIDTH_ML_COMPARE_FLOOR_PX = 640;
/** Escala do bloco de cenários/cálculo no Raio-x comparativo (1 = tamanho base). Alinhado a `--raiox-ml-calc-scale` no CSS. */
const ADS_RAIOX_ML_COMPARE_BLOCK_SCALE = 0.87;
/** Largura fixa dos cards de cenário no Raio-x (alinhada ao CSS `--s7-ml-card-fixed`). */
const ADS_RAIOX_ML_CARD_FIXED_W_PX = Math.round(280 * ADS_RAIOX_ML_COMPARE_BLOCK_SCALE);
/** Gap entre cards no Raio-x (alinhado ao CSS `--s7-ml-card-gap` em `.anuncios-raiox-compare--spacious`). */
const ADS_RAIOX_ML_CARD_GAP_PX = Math.round(20 * ADS_RAIOX_ML_COMPARE_BLOCK_SCALE);
/**
 * Soma horizontal: margens do painel + padding + borda até a faixa do grid (≈60px em escala 1).
 * Extra fixo: barra de rolagem vertical + subpixels do calc() CSS — evita quebra dos cards para baixo.
 */
const ADS_RAIOX_ML_COMPARE_LAYOUT_H_SCROLLBAR_PAD_PX = 18;
const ADS_RAIOX_ML_COMPARE_LAYOUT_H_CHROME_PX =
  Math.round(60 * ADS_RAIOX_ML_COMPARE_BLOCK_SCALE) + ADS_RAIOX_ML_COMPARE_LAYOUT_H_SCROLLBAR_PAD_PX;
/** Teto de largura do shell em fração da viewport (96vw). */
const ADS_RAIOX_ML_COMPARE_MAX_SHELL_W_VW = 0.96;
/**
 * Respiro extra abaixo do modal Raio-x ML comparativo (além do safe-area / edge).
 * Valores menores = modal mais alto na tela.
 */
const ADS_RAIOX_ML_COMPARE_VIEWPORT_BOTTOM_GUTTER_PX = 0;
/**
 * Pixels extras na altura máxima do shell comparativo ML (fórmula vh − top − bottom).
 * Modal centralizado: parte do ganho sobe em direção à navbar — manter moderado.
 */
const ADS_RAIOX_ML_COMPARE_VIEWPORT_HEIGHT_BOOST_PX = 48;
/** Margem do modal comparativo ML em relação à viewport (quase full-screen; menor = mais largura útil). */
const ADS_RAIOX_ML_COMPARE_VIEWPORT_MARGIN_PX = 14;

/** Máximo de cards por linha no comparativo Raio-x (base + promoções contam juntos). */
const ADS_RAIOX_ML_COMPARE_MAX_CARDS_PER_ROW = 4;

/**
 * Só baseline (“Preço de venda”): leve bump na largura ideal do shell (faixa 5–10% pedida pela UX).
 * Não afeta fileiras com 2+ cards.
 */
const ADS_RAIOX_ML_SINGLE_CARD_SHELL_WIDTH_FACTOR = 1.08;

/** Modal Raio-x (venda): copy única até os cenários ML aparecerem (evita texto duplicado com o bloco de loading). */
const RAIOX_VENDA_ML_CENARIOS_COPY =
  "Carregando os cenários de precificação disponíveis para este anúncio";

/**
 * Largura ideal do shell (px): no máximo 4 colunas por linha (largura fixa por card + gaps).
 * @param {number} cardCount
 */
function computeIdealRaioxMlCompareShellWidthPx(cardCount) {
  const n = Math.max(0, Math.floor(cardCount));
  if (n <= 0) return ADS_RAIOX_POPOVER_WIDTH_ML_COMPARE_FLOOR_PX;
  const colsOnRow = Math.min(ADS_RAIOX_ML_COMPARE_MAX_CARDS_PER_ROW, n);
  const track =
    colsOnRow * ADS_RAIOX_ML_CARD_FIXED_W_PX + Math.max(0, colsOnRow - 1) * ADS_RAIOX_ML_CARD_GAP_PX;
  const base = ADS_RAIOX_ML_COMPARE_LAYOUT_H_CHROME_PX + track;
  if (n === 1) {
    return Math.ceil(base * ADS_RAIOX_ML_SINGLE_CARD_SHELL_WIDTH_FACTOR);
  }
  return base;
}

/** Mini-modal gráfico “Comparativo S7”: mesma escala que `Anuncios.css` no card `.s7-ml-scenario-chart` do Raio-x. */
const S7_RAIOX_CHART_MINI_MODAL_SCALE = 1.19;
/** Largura útil de cada coluna (48px × escala). */
const S7_RAIOX_CHART_MINI_COL_PX = 48 * S7_RAIOX_CHART_MINI_MODAL_SCALE;
/** Gap entre colunas (24px × escala). */
const S7_RAIOX_CHART_MINI_GAP_PX = 24 * S7_RAIOX_CHART_MINI_MODAL_SCALE;
/** Padding horizontal do `.anuncios-raiox-chart-mini__dialog` (18px + 18px). */
const S7_RAIOX_CHART_MINI_DIALOG_PAD_H_PX = 36;
/** Padding horizontal do card cinza (`14px` × escala, ambos os lados). */
const S7_RAIOX_CHART_MINI_CARD_PAD_H_PX = 14 * S7_RAIOX_CHART_MINI_MODAL_SCALE * 2;
/** Respiro para título + fechar + bordas além do núcleo do gráfico. */
const S7_RAIOX_CHART_MINI_DIALOG_CHROME_H_PX = 56;
/** Largura base do diálogo com **1 barra** (refino UX: mais compacto que 420px). */
const S7_RAIOX_CHART_MINI_BASE_DIALOG_W_PX = 340;
/** Incremento por barra extra (ligeiramente menor que col+gap real — modal mais enxuto sem mudar colunas). */
const S7_RAIOX_CHART_MINI_WIDTH_PER_EXTRA_BAR_PX = 80;
/** Teto de largura do diálogo (muitos cenários). */
const S7_RAIOX_CHART_MINI_DIALOG_WIDTH_MAX_PX = 980;

/**
 * Largura do mini-modal: base para 1 barra + incremento por barra adicional (sem piso genérico alto).
 * @param {number} scenarioCount
 * @param {number} viewportInnerWidth
 */
function computeRaioxChartMiniDialogWidthPx(scenarioCount, viewportInnerWidth) {
  const n = Math.max(0, Math.floor(scenarioCount));
  const vwCap = Math.max(280, Math.floor(viewportInnerWidth) - 32);
  if (n < 1) {
    return Math.min(S7_RAIOX_CHART_MINI_DIALOG_WIDTH_MAX_PX, vwCap, S7_RAIOX_CHART_MINI_BASE_DIALOG_W_PX);
  }
  const raw = S7_RAIOX_CHART_MINI_BASE_DIALOG_W_PX + Math.max(0, n - 1) * S7_RAIOX_CHART_MINI_WIDTH_PER_EXTRA_BAR_PX;
  return Math.min(vwCap, S7_RAIOX_CHART_MINI_DIALOG_WIDTH_MAX_PX, Math.round(raw));
}

/** Altura máxima do shell Raio-x (card + moldura; conteúdo longo como “Status da oferta” precisa caber antes do clamp). */
const ADS_RAIOX_POPOVER_MAX_H_PX = 800;
/** Margem extra acima do fim da viewport no clamp — mantém a base das 3 camadas visível. */
const ADS_RAIOX_POPOVER_VIEWPORT_BOTTOM_GUTTER_PX = 104;
/** Mini card do status (largura confortável para título + subtítulo + mensagem). */
const ADS_RAIOX_STATUS_EXPLAIN_W_PX = 280;
/** Acima do painel Raio-x portal (z-index 200100). */
const ADS_RAIOX_STATUS_EXPLAIN_Z = 200150;
/** Faixa invisível entre o ícone e o mini card — evita fechar o hover ao atravessar o gap. */
const ADS_RAIOX_STATUS_EXPLAIN_Z_BRIDGE = 200149;

export {
  ADS_RAIOX_POPOVER_WIDTH_PX,
  ADS_RAIOX_POPOVER_WIDTH_ML_COMPARE_FLOOR_PX,
  ADS_RAIOX_ML_COMPARE_BLOCK_SCALE,
  ADS_RAIOX_ML_CARD_FIXED_W_PX,
  ADS_RAIOX_ML_CARD_GAP_PX,
  ADS_RAIOX_ML_COMPARE_LAYOUT_H_SCROLLBAR_PAD_PX,
  ADS_RAIOX_ML_COMPARE_LAYOUT_H_CHROME_PX,
  ADS_RAIOX_ML_COMPARE_MAX_SHELL_W_VW,
  ADS_RAIOX_ML_COMPARE_VIEWPORT_BOTTOM_GUTTER_PX,
  ADS_RAIOX_ML_COMPARE_VIEWPORT_HEIGHT_BOOST_PX,
  ADS_RAIOX_ML_COMPARE_VIEWPORT_MARGIN_PX,
  ADS_RAIOX_ML_COMPARE_MAX_CARDS_PER_ROW,
  ADS_RAIOX_ML_SINGLE_CARD_SHELL_WIDTH_FACTOR,
  RAIOX_VENDA_ML_CENARIOS_COPY,
  computeIdealRaioxMlCompareShellWidthPx,
  S7_RAIOX_CHART_MINI_MODAL_SCALE,
  S7_RAIOX_CHART_MINI_COL_PX,
  S7_RAIOX_CHART_MINI_GAP_PX,
  S7_RAIOX_CHART_MINI_DIALOG_PAD_H_PX,
  S7_RAIOX_CHART_MINI_CARD_PAD_H_PX,
  S7_RAIOX_CHART_MINI_DIALOG_CHROME_H_PX,
  S7_RAIOX_CHART_MINI_BASE_DIALOG_W_PX,
  S7_RAIOX_CHART_MINI_WIDTH_PER_EXTRA_BAR_PX,
  S7_RAIOX_CHART_MINI_DIALOG_WIDTH_MAX_PX,
  computeRaioxChartMiniDialogWidthPx,
  ADS_RAIOX_POPOVER_MAX_H_PX,
  ADS_RAIOX_POPOVER_VIEWPORT_BOTTOM_GUTTER_PX,
  ADS_RAIOX_STATUS_EXPLAIN_W_PX,
  ADS_RAIOX_STATUS_EXPLAIN_Z,
  ADS_RAIOX_STATUS_EXPLAIN_Z_BRIDGE,
};

export {
  RAIOX_PORTAL_SHELL_CLASS,
  RAIOX_PORTAL_SHELL_HEIGHT_CSS_VAR,
  RAIOX_PORTAL_SHELL_LAYOUT_STANDARD_VERSION,
  RAIOX_PORTAL_SHELL_EDGE_RESPIRE_NOMINAL_PX,
  RAIOX_PORTAL_SHELL_VIEWPORT_MARGIN_TRIM_RATIO,
  RAIOX_PORTAL_SHELL_CENTER_OFFSET_RATIO,
  RAIOX_PORTAL_SHELL_MIN_HEIGHT_PX,
  buildRayxPortalShellPlacementStyle,
  getRaioxPortalShellEdgeRespirePx,
  getRaioxPopoverViewportInsets,
  measureRayxPortalShellMetrics,
  resolveRaioxPortalShellCenterYOffsetPx,
  resolveRaioxPortalShellHeightPx,
  resolveRaioxPortalShellLayoutPx,
} from "../../../components/rayx/rayxPortalLayout.js";
