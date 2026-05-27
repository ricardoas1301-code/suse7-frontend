/**
 * @param {import("./SellerDrawerStateResolver").SellerDrawerState} drawerState
 * @param {boolean} hasPreview
 */
export function buildFooterContextMessage(drawerState, hasPreview = false) {
  switch (drawerState) {
    case "loading":
      return "Carregando seller…";
    case "error":
      return "Falha ao carregar os dados";
    case "empty":
      return "Nenhum dado disponível";
    case "loaded":
      return "Dados carregados";
    default:
      return hasPreview ? "Seller selecionado" : "Aguardando dados";
  }
}
