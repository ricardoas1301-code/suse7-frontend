// ======================================================================
// Mensagens de erro amigáveis — Precificação Inteligente (S1.8)
// Não altera contratos; apenas apresentação ao seller.
// ======================================================================

/** @param {unknown} raw */
export function normalizarErroPrecificacaoInteligente(raw) {
  const msg = raw != null ? String(raw).trim() : "";
  if (msg === "") return "Não foi possível concluir a operação. Tente novamente em instantes.";

  const lower = msg.toLowerCase();
  if (lower === "internal error" || lower === "internal server error" || lower.includes("internal error")) {
    return "O servidor encontrou um erro interno. Atualize a página ou tente novamente em alguns instantes. Se persistir, avise o suporte Suse7.";
  }
  if (lower.includes("unauthorized") || lower.includes("401")) {
    return "Sessão expirada ou inválida. Atualize a página e entre novamente.";
  }
  if (lower.includes("timeout") || lower.includes("tempo esgotado")) {
    return "A operação demorou mais que o esperado. Verifique sua conexão e tente de novo.";
  }
  return msg;
}
