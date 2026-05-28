import { converterRiscoToolboxParaOperacional } from "./devCenterOperationalRiskModel";

/** @typedef {import("./devCenterOperationalRiskModel").DevCenterNivelRiscoOperacional} DevCenterNivelRiscoOperacional */

/**
 * @typedef {{
 *   id: string;
 *   titulo: string;
 *   descricao: string;
 *   nivelRisco: DevCenterNivelRiscoOperacional;
 *   rotuloConfirmar?: string;
 *   rotuloCancelar?: string;
 *   metadados?: Record<string, unknown>;
 * }} DevCenterAcaoConfirmacaoPendente
 */

export const DEV_CENTER_CONFIRMACAO_ROTULOS_PADRAO = Object.freeze({
  confirmar: "Confirmar",
  cancelar: "Cancelar",
});

/**
 * @param {Partial<DevCenterAcaoConfirmacaoPendente> | null | undefined} input
 * @returns {DevCenterAcaoConfirmacaoPendente | null}
 */
export function normalizarAcaoConfirmacaoOperacional(input) {
  if (!input || typeof input !== "object") return null;

  const id = String(input.id ?? "").trim();
  const titulo = String(input.titulo ?? input.title ?? "").trim();
  const descricao = String(input.descricao ?? input.description ?? "").trim();
  const nivelBruto = input.nivelRisco ?? input.riskLevel ?? "alerta";
  const nivelRisco =
    typeof nivelBruto === "string" && ["info", "sucesso", "alerta", "critico", "destrutivo"].includes(nivelBruto)
      ? /** @type {DevCenterNivelRiscoOperacional} */ (nivelBruto)
      : converterRiscoToolboxParaOperacional(String(nivelBruto));

  if (!id || !titulo || !descricao) return null;

  return {
    id,
    titulo,
    descricao,
    nivelRisco,
    rotuloConfirmar: String(
      input.rotuloConfirmar ?? input.confirmLabel ?? DEV_CENTER_CONFIRMACAO_ROTULOS_PADRAO.confirmar,
    ).trim(),
    rotuloCancelar: String(
      input.rotuloCancelar ?? input.cancelLabel ?? DEV_CENTER_CONFIRMACAO_ROTULOS_PADRAO.cancelar,
    ).trim(),
    metadados:
      input.metadados && typeof input.metadados === "object"
        ? input.metadados
        : input.metadata && typeof input.metadata === "object"
          ? input.metadata
          : undefined,
  };
}
